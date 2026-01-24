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

        // Last processed input tick (for client input acknowledgment in Phase 7)
        this.lastProcessedInputTick = 0;

        // Deterministic random seed (for online mode sync)
        this.randomSeed = 0;

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
        if (this.networkMode === NetworkMode.HOST) {
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

        if (this.state === GameState.PLAYING) {
            // Online client mode: skip physics, just render (state comes from host)
            if (this.networkMode === NetworkMode.CLIENT) {
                // Client only renders, state is applied via applyNetworkState
                this.lastUpdateTime = timestamp;
            } else {
                // Offline or Host mode: run physics
                if (elapsed >= this.updateInterval) {
                    // Increment tick counter
                    this.simTick++;

                    // Host: apply remote player input before physics
                    if (this.networkMode === NetworkMode.HOST) {
                        this.applyRemoteInput();
                    }

                    this.physics.checkCollisions();
                    this.physics.checkCaught();
                    this.physics.checkGoldBallTimer();
                    this.moveFlyers();

                    if (this.timer > 0) {
                        this.timer--;
                    }

                    this.lastUpdateTime = timestamp;
                }
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
            this.networkManager.requestGameStart();
        }
    }

    // Client: apply received state
    applyNetworkState(state) {
        if (this.networkMode !== NetworkMode.CLIENT) return;

        const { gameState } = apply(this, state);

        // Track if host paused the game
        if (gameState === GameState.PAUSED) {
            this.hostPaused = true;
            this.state = GameState.PAUSED;
        } else if (gameState === GameState.PLAYING) {
            // Host resumed - clear hostPaused and ensure we're playing
            this.hostPaused = false;
            this.state = GameState.PLAYING;
        } else if (gameState === GameState.GAME_OVER) {
            // Game over - sync state
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

        const input = this.networkManager.getRemoteInput();

        // Track the tick of the last processed input (for ack in state broadcast)
        if (input.tick !== undefined) {
            this.lastProcessedInputTick = input.tick;
            console.log('[Game] Processing remote input tick:', input.tick, 'lastProcessedInputTick:', this.lastProcessedInputTick);
        }

        // Apply input to player 2 (the client's player)
        if (input.left) this.player2.left();
        if (input.right) this.player2.right();
        if (input.up) this.player2.up();
        if (input.down) this.player2.down();
        if (input.switch) {
            this.player2.switchModel();
            this.networkManager.clearRemoteInputSwitch();
        }
    }
}
