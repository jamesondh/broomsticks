// Game.js - Main game class for Broomsticks Advanced
// Ported from BroomstickApplet.java with configurable settings

import { Ball } from './Ball.js';
import { GoldBall } from './GoldBall.js';
import { Person } from './Person.js';
import { AssetManager } from './AssetManager.js';
import { PhysicsManager } from './PhysicsManager.js';
import { InputHandler } from './InputHandler.js';
import { GameRenderer } from './GameRenderer.js';
import {
    GameState,
    GameMode,
    NetworkMode,
    AIDifficulty,
    AI_DIFFICULTY_SETTINGS,
    GAME_WIDTH,
    GAME_HEIGHT,
    UPDATE_INTERVAL,
    DEFAULT_SETTINGS,
    SETTINGS_OPTIONS
} from './GameConstants.js';
import { NetworkManager } from '../multiplayer/NetworkManager.js';
import { serialize, apply } from '../multiplayer/StateSerializer.js';
import { generatePlayerName } from '../multiplayer/names.js';

// Re-export for backward compatibility
export { GameState, GameMode, AIDifficulty, NetworkMode };

export class Game {
    constructor(canvas, settings) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.ctx.textRendering = 'geometricPrecision';

        // Store settings with defaults
        this.settings = settings || { ...DEFAULT_SETTINGS };
        this.settingsOptions = SETTINGS_OPTIONS;

        // Track if settings changed that require asset reload
        this.settingsChanged = false;

        // Game mode and pre-game configuration
        this.gameMode = GameMode.SINGLE;
        this.aiDifficulty = AIDifficulty.MEDIUM;
        this.playerCount = 2;

        // Game state
        this.state = GameState.LOADING;
        this.backToggle = false;
        this.currBasket = 0;
        this.timer = 0;

        // Gold ball timer
        this.startTime = 0;
        this.goldSpawned = false;
        this.pauseTime = 0;
        this.goldSpawnTick = 0;

        // Game objects (arrays for configurable counts)
        this.balls = [];
        this.players = [];
        this.redBalls = [];  // Reference to catchable red balls

        // Grab sound debouncing (per-team state)
        this.teamBasket = [false, false];
        this.prevTeamBasket = [false, false];

        // Offscreen buffer for double buffering
        this.offCanvas = document.createElement('canvas');
        this.offCanvas.width = GAME_WIDTH;
        this.offCanvas.height = GAME_HEIGHT;

        // Create managers
        this.assets = new AssetManager(this.settings);
        this.physics = new PhysicsManager(this);
        this.input = new InputHandler(this, canvas);
        this.renderer = new GameRenderer(this, canvas, this.offCanvas);

        // Game loop state
        this.lastUpdateTime = 0;
        this.running = false;
        this.updateInterval = UPDATE_INTERVAL;
        this.destroyed = false;

        // Network multiplayer state
        this.networkManager = null;
        this.networkMode = NetworkMode.OFFLINE;
        this.localPlayerIndex = 1;  // 0 for host (player1/blue), 1 for client (player2/green)
        this.lobbyPlayers = [];
        this.roomCode = '';
        this.roomCodeInput = '';
        this.playerName = generatePlayerName();
        this.networkError = null;
        this.hostPaused = false;  // Track if game was paused by host (for client UI)

        // Simulation tick counter (for network sync)
        this.simTick = 0;

        // Render interpolation alpha (0.0 to 1.0, fraction of physics tick elapsed)
        this.renderAlpha = 0;

        // Last processed input tick (for client input acknowledgment in Phase 7)
        this.lastProcessedInputTick = 0;

        // Client: last authoritative tick applied (ignore duplicates/out-of-order)
        this.lastAuthoritativeTick = -1;

        // Deterministic random seed (for online mode sync)
        this.randomSeed = 0;

        // State history for rollback reconciliation (online client only)
        this.stateHistory = [];
        this.maxHistoryLength = 90;  // ~3 seconds at 30 ticks/sec

        // Bind game loop
        this.gameLoop = this.gameLoop.bind(this);
    }

    async init() {
        console.log('\n');
        console.log('---=== Broomsticks Advanced ===---');
        console.log('    Original by Paul Rajlich (c) 2000-2011\n');

        // Load assets first (before attaching input handlers)
        await this.assets.loadAssets();

        // Check if destroyed during asset loading (e.g., user navigated away)
        if (this.destroyed) return;

        this.assets.loadSounds();

        // Initialize game objects
        this.initGameObjects();

        // Set up input handlers only after assets are loaded
        // This prevents capturing clicks during LOADING state
        this.input.attach();

        // Start game loop
        this.running = true;
        this.state = GameState.MAIN_MENU;
        requestAnimationFrame(this.gameLoop);
    }

    initGameObjects() {
        const { redBalls, blackBalls, goldBalls } = this.settings;

        this.balls = [];
        this.redBalls = [];

        const midW = 325;
        const midH = 200;

        // Create red balls (catchable) - model 2
        for (let i = 0; i < redBalls; i++) {
            const ball = new Ball(this, 2, midW, midH - 50 + i * 30);
            ball.catchable = true;
            ball.entityId = i;
            this.balls.push(ball);
            this.redBalls.push(ball);
        }

        // Create black balls (obstacles, 1.5x speedFactor) - model 1
        for (let i = 0; i < blackBalls; i++) {
            const ball = new Ball(this, 1, midW, midH + 50 + i * 30);
            ball.speedFactor = 1.5;
            ball.entityId = redBalls + i;
            this.balls.push(ball);
        }

        // Create gold balls (special, initially hidden) - model 0
        for (let i = 0; i < goldBalls; i++) {
            const ball = new GoldBall(this, midW, 100 + i * 30);
            ball.entityId = redBalls + blackBalls + i;
            this.balls.push(ball);
        }

        // Create players
        // Player 1 targets the first red ball
        const targetBall = this.redBalls[0] || this.balls[0];
        this.players = [];
        this.players[0] = new Person(targetBall, this, 1, 100, midH);
        this.players[1] = new Person(targetBall, this, 4, 520, midH);
        this.players[1].side = 1;

        // Shortcuts for backward compatibility
        this.player1 = this.players[0];
        this.player2 = this.players[1];

        this.currBasket = 0;
    }

    startGame() {
        this.state = GameState.PLAYING;
        this.player1.score = 0;
        this.player2.score = 0;
        this.startTime = Date.now();
        this.goldSpawned = false;
        this.simTick = 0;  // Reset tick counter

        // Calculate gold spawn tick (for online mode)
        // duration is in seconds, UPDATE_INTERVAL is 30ms
        this.goldSpawnTick = Math.floor((this.settings.duration * 1000) / UPDATE_INTERVAL);

        // Generate deterministic random seed for online games (host only)
        // Only generate if not already set (e.g., by requestStartGame for online games)
        if (this.networkMode === NetworkMode.HOST && this.randomSeed === 0) {
            this.randomSeed = Math.floor(Math.random() * 0xFFFFFFFF);
        }
    }

    resetGameObjects() {
        const midW = 325;
        const midH = 200;

        this.player1.x = 100;
        this.player1.y = midH;
        this.player1.velocityX = 0;
        this.player1.velocityY = 0;
        this.player1.score = 0;

        this.player2.x = 520;
        this.player2.y = midH;
        this.player2.velocityX = 0;
        this.player2.velocityY = 0;
        this.player2.score = 0;

        // Reset all balls
        let redIndex = 0;
        let blackIndex = 0;
        let goldIndex = 0;

        for (const ball of this.balls) {
            ball.velocityX = 0;
            ball.velocityY = 0;

            if (ball.isGoldBall) {
                ball.x = midW;
                ball.y = 100 + goldIndex * 30;
                ball.alive = false;
                goldIndex++;
            } else if (ball.catchable) {
                ball.x = midW;
                ball.y = midH - 50 + redIndex * 30;
                redIndex++;
            } else {
                ball.x = midW;
                ball.y = midH + 50 + blackIndex * 30;
                blackIndex++;
            }
        }

        this.currBasket = 0;
        this.goldSpawned = false;

        // Reset grab sound debouncing state
        this.teamBasket = [false, false];
        this.prevTeamBasket = [false, false];
    }

    gameLoop(timestamp) {
        if (!this.running) return;

        // Initialize lastUpdateTime on first frame
        if (this.lastUpdateTime === 0) {
            this.lastUpdateTime = timestamp;
        }

        const elapsed = timestamp - this.lastUpdateTime;

        // Calculate interpolation alpha for smooth rendering (0.0 to 1.0)
        // This represents how far we are between physics ticks
        this.renderAlpha = Math.min(elapsed / this.updateInterval, 1.0);

        if (this.state === GameState.PLAYING) {
            if (elapsed >= this.updateInterval) {
                // Increment tick counter (both host and client)
                this.simTick++;

                if (this.networkMode === NetworkMode.HOST) {
                    // Host: apply remote player input before physics
                    this.applyRemoteInput();
                } else if (this.networkMode === NetworkMode.CLIENT) {
                    // Client: apply buffered host inputs for prediction
                    this.applyBufferedHostInput();
                }

                // All modes run physics (Phase 6: enables client-side prediction)
                this.physics.checkCollisions();
                this.physics.checkCaught();
                this.physics.checkGoldBallTimer();
                this.moveFlyers();

                // Save state for rollback reconciliation (client only)
                this.saveStateToHistory();

                if (this.timer > 0) {
                    this.timer--;
                }

                this.lastUpdateTime = timestamp;

                // Reset alpha after physics step (next frame starts fresh)
                this.renderAlpha = 0;
            }
        } else {
            this.lastUpdateTime = timestamp;
        }

        this.renderer.render();

        requestAnimationFrame(this.gameLoop);
    }

    moveFlyers() {
        for (const player of this.players) {
            player.move();
        }
        for (const ball of this.balls) {
            ball.move();
        }
    }

    gameOver() {
        this.state = GameState.GAME_OVER;
        this.assets.playSound('win');
        this.resetGameObjects();
    }

    setGameMode(mode) {
        this.gameMode = mode;
        if (mode === GameMode.SINGLE) {
            this.player1.isRobot = true;
            this.applyDifficulty();
        } else {
            this.player1.isRobot = false;
        }
    }

    setDifficulty(difficulty) {
        this.aiDifficulty = difficulty;
        this.applyDifficulty();
    }

    applyDifficulty() {
        const settings = AI_DIFFICULTY_SETTINGS[this.aiDifficulty];
        if (settings && this.player1) {
            this.player1.smart = settings.smart;
            this.player1.reactionDelay = settings.reactionDelay;
        }
    }

    setPlayerCount(count) {
        this.playerCount = count;
        // TODO: Phase 2 will implement 4-player mode
    }

    async startFromPreGame() {
        // Reload assets if player or background changed
        if (this.settingsChanged) {
            await this.assets.loadAssets();
            this.settingsChanged = false;
        }

        // Reload sounds based on new setting
        if (this.settings.sound && Object.keys(this.assets.sounds).length === 0) {
            this.assets.loadSounds();
        }

        // Reinitialize game objects with new ball counts
        this.initGameObjects();

        // Apply mode settings after objects are created
        if (this.gameMode === GameMode.SINGLE) {
            this.player1.isRobot = true;
            this.applyDifficulty();
        } else {
            this.player1.isRobot = false;
        }

        // Go directly to playing
        this.startGame();
    }

    destroy() {
        this.destroyed = true;
        this.running = false;
        this.input.detach();
        if (this.networkManager) {
            this.networkManager.disconnect();
        }
    }

    // ===== Network Multiplayer Methods =====

    createRoom() {
        this.roomCode = NetworkManager.generateRoomCode();
        this.networkMode = NetworkMode.HOST;
        this.localPlayerIndex = 0;  // Host is player 1 (blue)
        this.lobbyPlayers = [];
        this.networkError = null;

        this.networkManager = new NetworkManager(this);
        this.setupNetworkCallbacks();
        this.networkManager.connect(this.roomCode, this.playerName);
    }

    joinRoom(code) {
        if (!code || code.length !== 4) {
            this.networkError = 'Invalid room code';
            return;
        }

        this.roomCode = code.toUpperCase();
        this.networkMode = NetworkMode.CLIENT;
        this.localPlayerIndex = 1;  // Client is player 2 (green)
        this.lobbyPlayers = [];
        this.networkError = null;

        this.networkManager = new NetworkManager(this);
        this.setupNetworkCallbacks();
        this.networkManager.connect(this.roomCode, this.playerName);
    }

    setupNetworkCallbacks() {
        this.networkManager.onJoined = (msg) => this.onNetworkJoined(msg);
        this.networkManager.onPlayerJoined = (player) => this.onPlayerJoined(player);
        this.networkManager.onPlayerLeft = (playerId) => this.onPlayerLeft(playerId);
        this.networkManager.onGameStart = (config) => this.onGameStart(config);
        this.networkManager.onStateReceived = (state) => this.applyNetworkState(state);
        this.networkManager.onSettingsReceived = (settings) => this.onSettingsReceived(settings);
        this.networkManager.onError = (error) => this.onNetworkError(error);
    }

    onNetworkJoined(msg) {
        console.log('[Game] Joined room:', msg.roomCode, 'as', msg.isHost ? 'host' : 'client');
        this.lobbyPlayers = msg.players;
        this.state = GameState.LOBBY;
    }

    onSettingsReceived(settings) {
        // Client: apply host settings in lobby (real-time sync)
        if (this.networkMode !== NetworkMode.CLIENT) return;

        console.log('[Game] Applying host settings:', settings);
        this.settings.dive = settings.dive;
        this.settings.accel = settings.accel;
        this.settings.maxSpeed = settings.maxSpeed;
        this.settings.redBalls = settings.redBalls;
        this.settings.blackBalls = settings.blackBalls;
        this.settings.goldBalls = settings.goldBalls;
        this.settings.goldPoints = settings.goldPoints;
        this.settings.duration = settings.duration;
        this.settings.winScore = settings.winScore;
    }

    onPlayerJoined(player) {
        console.log('[Game] Player joined:', player.name);
        this.lobbyPlayers.push(player);
    }

    onPlayerLeft(playerId) {
        console.log('[Game] Player left:', playerId);
        this.lobbyPlayers = this.lobbyPlayers.filter(p => p.id !== playerId);

        // If we're in game and opponent left, return to menu
        if (this.state === GameState.PLAYING || this.state === GameState.PAUSED) {
            this.networkError = 'Opponent disconnected';
            this.state = GameState.MAIN_MENU;
            this.resetGameObjects();
            this.leaveRoom();
        }
    }

    onGameStart(config) {
        console.log('[Game] Game starting, host:', config.hostId);

        // Client: apply host settings before initializing game objects
        if (this.networkMode === NetworkMode.CLIENT && config.settings) {
            console.log('[Game] Applying host settings:', config.settings);
            // Merge simulation-affecting settings from host
            this.settings.dive = config.settings.dive;
            this.settings.accel = config.settings.accel;
            this.settings.maxSpeed = config.settings.maxSpeed;
            this.settings.redBalls = config.settings.redBalls;
            this.settings.blackBalls = config.settings.blackBalls;
            this.settings.goldBalls = config.settings.goldBalls;
            this.settings.goldPoints = config.settings.goldPoints;
            this.settings.duration = config.settings.duration;
            this.settings.winScore = config.settings.winScore;
            this.goldSpawnTick = config.settings.goldSpawnTick;
            this.randomSeed = config.settings.seed;
        }

        // Initialize game objects (now with synced settings)
        this.initGameObjects();

        // Online play: both players are human-controlled
        this.player1.isRobot = false;

        // Start the game
        this.startGame();
    }

    onNetworkError(error) {
        console.error('[Game] Network error:', error);
        this.networkError = error;

        // If in lobby/join screens, stay there to show error
        // If in game, return to menu
        if (this.state === GameState.PLAYING || this.state === GameState.PAUSED) {
            this.state = GameState.MAIN_MENU;
            this.resetGameObjects();
            this.leaveRoom();
        }
    }

    leaveRoom() {
        if (this.networkManager) {
            this.networkManager.disconnect();
            this.networkManager = null;
        }
        this.networkMode = NetworkMode.OFFLINE;
        this.lobbyPlayers = [];
        this.roomCode = '';
        this.roomCodeInput = '';
        this.hostPaused = false;
    }

    requestStartGame() {
        if (this.networkManager && this.networkMode === NetworkMode.HOST) {
            // Generate seed now so it's included in the gameStart message
            this.randomSeed = Math.floor(Math.random() * 0xFFFFFFFF);
            console.log('[Game] Generated random seed:', this.randomSeed);
            this.networkManager.requestGameStart();
        }
    }

    // Client: apply received state with rollback reconciliation
    applyNetworkState(state) {
        if (this.networkMode !== NetworkMode.CLIENT) return;

        // Host broadcasts at 20Hz; duplicates/out-of-order snapshots are possible.
        // Re-applying the same tick repeatedly causes visible jitter.
        if (typeof state.tick === 'number' && state.tick <= this.lastAuthoritativeTick) {
            return;
        }
        if (typeof state.tick === 'number') {
            this.lastAuthoritativeTick = state.tick;
        }

        // Phase 7: Apply scores/model immediately, reconcile positions
        const { gameState, tick } = apply(this, state, true);

        // Build authoritative state for reconciliation (decode fixed-point velocities)
        const authoritativeState = {
            tick: state.tick,
            players: state.players.map(p => ({
                x: p.x,
                y: p.y,
                vx: p.vx / 100,
                vy: p.vy / 100,
                score: p.score,
                model: p.model
            })),
            balls: state.balls.map(b => ({
                x: b.x,
                y: b.y,
                vx: b.vx / 100,
                vy: b.vy / 100,
                alive: b.alive
            })),
            currBasket: state.currBasket,
            timer: state.timer,
            goldSpawned: state.goldSpawned
        };

        // Reconcile with server state
        this.reconcileWithServer(authoritativeState);

        // Handle game state changes
        if (gameState === GameState.PAUSED) {
            this.hostPaused = true;
            this.state = GameState.PAUSED;
        } else if (gameState === GameState.PLAYING) {
            this.hostPaused = false;
            this.state = GameState.PLAYING;
        } else if (gameState === GameState.GAME_OVER) {
            this.hostPaused = false;
            this.state = GameState.GAME_OVER;
        }
    }

    // Host: serialize state for broadcast
    serializeState() {
        return serialize(this);
    }

    // Host: apply remote player input
    applyRemoteInput() {
        if (this.networkMode !== NetworkMode.HOST || !this.networkManager) return;

        const events = this.networkManager.consumeRemoteInputs();
        if (events.length === 0) return;

        // Tap-based controls: apply each input event once.
        for (const event of events) {
            const input = event.input;

            // Track the tick of the last processed input (for ack in state broadcast)
            if (event.tick !== undefined) {
                this.lastProcessedInputTick = Math.max(this.lastProcessedInputTick, event.tick);
            }

            if (input.left) this.player2.left();
            if (input.right) this.player2.right();
            if (input.up) this.player2.up();
            if (input.down) this.player2.down();
            if (input.switch) this.player2.switchModel();
        }
    }

    // Client: apply buffered host inputs for prediction (Phase 6)
    applyBufferedHostInput() {
        if (this.networkMode !== NetworkMode.CLIENT || !this.networkManager) return;

        const buffer = this.networkManager.hostInputBuffer;

        // Process inputs up to current tick
        while (buffer.length > 0 && buffer[0].tick <= this.simTick) {
            const event = buffer.shift();
            const input = event.input;

            // Apply to player 1 (host's player)
            if (input.left) this.player1.left();
            if (input.right) this.player1.right();
            if (input.up) this.player1.up();
            if (input.down) this.player1.down();
            if (input.switch) this.player1.switchModel();
        }
    }

    // ===== Rollback Reconciliation Methods (Phase 7) =====

    /**
     * Save current state to history for later comparison.
     * Only saves when in CLIENT mode.
     */
    saveStateToHistory() {
        if (this.networkMode !== NetworkMode.CLIENT) return;

        const snapshot = {
            tick: this.simTick,
            players: this.players.map(p => ({
                x: p.x,
                y: p.y,
                vx: p.velocityX,
                vy: p.velocityY,
                score: p.score,
                model: p.model
            })),
            balls: this.balls.map(b => ({
                x: b.x,
                y: b.y,
                vx: b.velocityX,
                vy: b.velocityY,
                alive: b.alive !== false
            })),
            currBasket: this.currBasket,
            timer: this.timer,
            goldSpawned: this.goldSpawned
        };

        this.stateHistory.push(snapshot);

        // Trim history to prevent memory growth
        if (this.stateHistory.length > this.maxHistoryLength) {
            this.stateHistory.shift();
        }
    }

    /**
     * Reconcile local prediction with authoritative server state.
     * If divergence exceeds threshold, restore and resimulate.
     */
    reconcileWithServer(authoritativeState) {
        const serverTick = authoritativeState.tick;

        // Find our predicted state at the server's tick
        const predictedIndex = this.stateHistory.findIndex(s => s.tick === serverTick);

        if (predictedIndex === -1) {
            // No matching tick in history - too far behind, hard reset
            this.hardResetToState(authoritativeState);
            return;
        }

        const predictedState = this.stateHistory[predictedIndex];
        const divergence = this.calculateDivergence(predictedState, authoritativeState);

        if (divergence < 1.0) {
            // Prediction was accurate enough, just trim old history
            this.stateHistory = this.stateHistory.slice(predictedIndex + 1);
            return;
        }

        // Divergence detected - need to rollback and resimulate

        const targetTick = this.simTick;

        // Restore to authoritative state
        this.restoreState(authoritativeState);
        this.simTick = serverTick;

        // Rebuild history from corrected baseline to avoid "No history" loops.
        this.stateHistory = [];
        this.saveStateToHistory();

        // Resimulate from serverTick+1 to targetTick
        while (this.simTick < targetTick) {
            this.simTick++;

            // Apply inputs for this tick
            this.applyInputsForTick(this.simTick);

            // Run physics
            this.physics.checkCollisions();
            this.physics.checkCaught();
            this.physics.checkGoldBallTimer();
            this.moveFlyers();

            this.saveStateToHistory();
        }
    }

    /**
     * Calculate maximum position divergence between predicted and authoritative states.
     */
    calculateDivergence(predicted, authoritative) {
        let maxDelta = 0;

        // Compare player positions
        for (let i = 0; i < predicted.players.length && i < authoritative.players.length; i++) {
            const pp = predicted.players[i];
            const ap = authoritative.players[i];
            const dx = Math.abs(pp.x - ap.x);
            const dy = Math.abs(pp.y - ap.y);
            maxDelta = Math.max(maxDelta, dx, dy);
        }

        // Compare ball positions
        for (let i = 0; i < predicted.balls.length && i < authoritative.balls.length; i++) {
            const pb = predicted.balls[i];
            const ab = authoritative.balls[i];
            const dx = Math.abs(pb.x - ab.x);
            const dy = Math.abs(pb.y - ab.y);
            maxDelta = Math.max(maxDelta, dx, dy);
        }

        return maxDelta;
    }

    /**
     * Restore game entities to a snapshot state.
     */
    restoreState(state) {
        // Restore players
        state.players.forEach((ps, index) => {
            const player = this.players[index];
            if (player) {
                player.x = ps.x;
                player.y = ps.y;
                player.velocityX = ps.vx;
                player.velocityY = ps.vy;
                player.score = ps.score;
                player.model = ps.model;
                // Set prevX/prevY to prevent interpolation artifacts after reconciliation
                player.prevX = ps.x;
                player.prevY = ps.y;
            }
        });

        // Restore balls
        state.balls.forEach((bs, index) => {
            const ball = this.balls[index];
            if (ball) {
                ball.x = bs.x;
                ball.y = bs.y;
                ball.velocityX = bs.vx;
                ball.velocityY = bs.vy;
                // Set prevX/prevY to prevent interpolation artifacts after reconciliation
                ball.prevX = bs.x;
                ball.prevY = bs.y;
                if (ball.isGoldBall) {
                    ball.alive = bs.alive;
                }
            }
        });

        // Restore game state
        this.currBasket = state.currBasket;
        this.timer = state.timer;
        this.goldSpawned = state.goldSpawned;
    }

    /**
     * Full reset to authoritative state (when too far out of sync).
     */
    hardResetToState(state) {
        this.restoreState(state);
        this.simTick = state.tick;
        // Seed history at the authoritative tick so subsequent snapshots can reconcile.
        this.stateHistory = [];
        this.saveStateToHistory();
    }

    /**
     * Apply stored inputs for a specific tick during resimulation.
     */
    applyInputsForTick(tick) {
        if (!this.networkManager) return;

        // Apply local inputs (client's own inputs)
        const localInputs = this.networkManager.localInputBuffer.filter(e => e.tick === tick);
        for (const event of localInputs) {
            const input = event.input;
            if (input.left) this.player2.left();
            if (input.right) this.player2.right();
            if (input.up) this.player2.up();
            if (input.down) this.player2.down();
            if (input.switch) this.player2.switchModel();
        }

        // Apply host inputs
        const hostInputs = this.networkManager.hostInputHistory.filter(e => e.tick === tick);
        for (const event of hostInputs) {
            const input = event.input;
            if (input.left) this.player1.left();
            if (input.right) this.player1.right();
            if (input.up) this.player1.up();
            if (input.down) this.player1.down();
            if (input.switch) this.player1.switchModel();
        }
    }
}
