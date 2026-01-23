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
    AIDifficulty,
    AI_DIFFICULTY_SETTINGS,
    GAME_WIDTH,
    GAME_HEIGHT,
    UPDATE_INTERVAL,
    DEFAULT_SETTINGS,
    SETTINGS_OPTIONS
} from './GameConstants.js';

// Re-export for backward compatibility
export { GameState, GameMode, AIDifficulty };

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
        this.settingsExpanded = false;

        // Game state
        this.state = GameState.LOADING;
        this.backToggle = false;
        this.currBasket = 0;
        this.timer = 0;

        // Gold ball timer
        this.startTime = 0;
        this.goldSpawned = false;
        this.pauseTime = 0;

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
            this.balls.push(ball);
            this.redBalls.push(ball);
        }

        // Create black balls (obstacles, 1.5x speedFactor) - model 1
        for (let i = 0; i < blackBalls; i++) {
            const ball = new Ball(this, 1, midW, midH + 50 + i * 30);
            ball.speedFactor = 1.5;
            this.balls.push(ball);
        }

        // Create gold balls (special, initially hidden) - model 0
        for (let i = 0; i < goldBalls; i++) {
            const ball = new GoldBall(this, midW, 100 + i * 30);
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
            // Only update game logic when enough time has passed (30ms)
            if (elapsed >= this.updateInterval) {
                this.physics.checkCollisions();
                this.physics.checkCaught();
                this.physics.checkGoldBallTimer();
                this.moveFlyers();

                if (this.timer > 0) {
                    this.timer--;
                }

                this.lastUpdateTime = timestamp;
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

    toggleSettingsExpanded() {
        this.settingsExpanded = !this.settingsExpanded;
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

        // Apply difficulty if single player
        if (this.gameMode === GameMode.SINGLE) {
            this.applyDifficulty();
        }

        // Go directly to playing
        this.startGame();
    }

    destroy() {
        this.destroyed = true;
        this.running = false;
        this.input.detach();
    }
}
