// InputHandler.js - Keyboard and mouse input handling for Broomsticks

import { GameState, OFFSET_X, OFFSET_Y, GITHUB_URL } from './GameConstants.js';

export class InputHandler {
    constructor(game, canvas) {
        this.game = game;
        this.canvas = canvas;
        this.keysPressed = new Set();

        // Bind methods
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handleClick = this.handleClick.bind(this);
    }

    attach() {
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
        this.canvas.addEventListener('click', this.handleClick);
    }

    detach() {
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        this.canvas.removeEventListener('click', this.handleClick);
    }

    handleKeyDown(e) {
        const key = e.key;
        const code = e.code;
        const { player1, player2 } = this.game;

        // Prevent default for game keys
        if (['ArrowUp', 'ArrowLeft', 'ArrowRight', 'ArrowDown', 'Enter', 'e', 'E', 's', 'S', 'f', 'F', 'd', 'D', '1', 'b', 'B', 'p', 'P'].includes(key) ||
            ['ArrowUp', 'ArrowLeft', 'ArrowRight', 'ArrowDown'].includes(code)) {
            e.preventDefault();
        }

        // Avoid key repeat
        if (this.keysPressed.has(code)) {
            return;
        }
        this.keysPressed.add(code);

        // B key: toggle background
        if (key === 'b' || key === 'B') {
            this.game.backToggle = !this.game.backToggle;
        }

        // P key: toggle single/two player
        if (key === 'p' || key === 'P') {
            player1.isRobot = !player1.isRobot;
            if (!player1.isRobot) {
                player1.velocityX = 0;
            }
        }

        // Player 2 controls (arrow keys)
        if (code === 'ArrowLeft') {
            player2.left();
        }
        if (code === 'ArrowRight') {
            player2.right();
        }
        if (code === 'ArrowUp') {
            player2.up();
        }
        if (code === 'ArrowDown') {
            player2.down();
        }
        if (key === 'Enter') {
            player2.switchModel();
        }

        // Player 1 controls (only if not AI)
        if (!player1.isRobot) {
            if (key === 'e' || key === 'E') {
                player1.up();
            }
            if (key === 's' || key === 'S') {
                player1.left();
            }
            if (key === 'f' || key === 'F') {
                player1.right();
            }
            if (key === 'd' || key === 'D') {
                player1.down();
            }
            if (key === '1') {
                player1.switchModel();
            }
        }

        // AI skill adjustment (only in single player mode)
        if (player1.isRobot) {
            if (key === 's' || key === 'S') {
                player1.dumber();
            }
            if (key === 'f' || key === 'F') {
                player1.smarter();
            }
        }
    }

    handleKeyUp(e) {
        this.keysPressed.delete(e.code);
    }

    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        // Account for CSS transform scaling
        // Use 1:1 mapping if rect dimensions are invalid (e.g., transform not yet applied)
        const scaleX = rect.width > 0 ? this.canvas.width / rect.width : 1;
        const scaleY = rect.height > 0 ? this.canvas.height / rect.height : 1;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        switch (this.game.state) {
            case GameState.MODE_SELECT:
                // Single player button
                if (x > 150 && x < 270 && y > 205 && y < 255) {
                    this.game.player1.isRobot = true;
                    this.game.state = GameState.SETTINGS;
                }
                // Two player button
                if (x > 400 && x < 520 && y > 205 && y < 255) {
                    this.game.player1.isRobot = false;
                    this.game.state = GameState.SETTINGS;
                }
                // Guestbook button (centered, 200px wide)
                if (x > 225 && x < 425 && y > 290 && y < 320) {
                    window.location.href = '/guestbook';
                }
                // GitHub link (underlined text)
                if (x > 259 && x < 377 && y > 349 && y < 366) {
                    window.open(GITHUB_URL, '_blank');
                }
                break;

            case GameState.SETTINGS:
                this.handleSettingsClick(x, y);
                break;

            case GameState.RULES:
                // Continue button
                if (x > 215 && x < 445 && y > 165 && y < 185) {
                    this.game.state = GameState.READY;
                }
                break;

            case GameState.READY:
                // Start button
                if (x > 215 && x < 445 && y > 165 && y < 185) {
                    this.game.startGame();
                }
                break;

            case GameState.GAME_OVER:
                // Play again button
                if (x > 215 && x < 445 && y > 165 && y < 185) {
                    this.game.state = GameState.MODE_SELECT;
                    this.game.resetGameObjects();
                }
                // Website link button
                if (x > 236 && x < 461 && y > 381 && y < 401) {
                    window.open(GITHUB_URL, '_blank');
                }
                break;
        }
    }

    handleSettingsClick(x, y) {
        const { settings, settingsOptions } = this.game;

        // Convert from main canvas to offscreen canvas coordinates
        // Offscreen canvas is drawn at (11, 31) on main canvas
        const offX = x - OFFSET_X;
        const offY = y - OFFSET_Y;

        const leftX = 60;
        const rightX = 340;
        const startY = 165;
        const lineHeight = 18;
        const rowHeight = 16;

        // Check left column clicks (cycle options)
        // Diving
        if (offX > leftX - 10 && offX < leftX + 150 && offY > startY - rowHeight && offY < startY) {
            const idx = settingsOptions.dive.indexOf(settings.dive);
            settings.dive = settingsOptions.dive[(idx + 1) % settingsOptions.dive.length];
        }
        // Acceleration
        if (offX > leftX - 10 && offX < leftX + 150 && offY > startY + lineHeight - rowHeight && offY < startY + lineHeight) {
            const idx = settingsOptions.accel.indexOf(settings.accel);
            settings.accel = settingsOptions.accel[(idx + 1) % settingsOptions.accel.length];
        }
        // Max speed
        if (offX > leftX - 10 && offX < leftX + 150 && offY > startY + lineHeight * 2 - rowHeight && offY < startY + lineHeight * 2) {
            const idx = settingsOptions.maxSpeed.indexOf(settings.maxSpeed);
            settings.maxSpeed = settingsOptions.maxSpeed[(idx + 1) % settingsOptions.maxSpeed.length];
        }
        // Red balls
        if (offX > leftX - 10 && offX < leftX + 150 && offY > startY + lineHeight * 3 - rowHeight && offY < startY + lineHeight * 3) {
            const idx = settingsOptions.redBalls.indexOf(settings.redBalls);
            settings.redBalls = settingsOptions.redBalls[(idx + 1) % settingsOptions.redBalls.length];
        }
        // Black balls
        if (offX > leftX - 10 && offX < leftX + 150 && offY > startY + lineHeight * 4 - rowHeight && offY < startY + lineHeight * 4) {
            const idx = settingsOptions.blackBalls.indexOf(settings.blackBalls);
            settings.blackBalls = settingsOptions.blackBalls[(idx + 1) % settingsOptions.blackBalls.length];
        }
        // Gold balls
        if (offX > leftX - 10 && offX < leftX + 150 && offY > startY + lineHeight * 5 - rowHeight && offY < startY + lineHeight * 5) {
            const idx = settingsOptions.goldBalls.indexOf(settings.goldBalls);
            settings.goldBalls = settingsOptions.goldBalls[(idx + 1) % settingsOptions.goldBalls.length];
        }

        // Check right column clicks (numeric with < > or cycle)
        // Gold points (< decrement, > increment)
        if (offY > startY - rowHeight && offY < startY) {
            const opt = settingsOptions.goldPoints;
            if (offX > rightX - 10 && offX < rightX + 100) {
                // Decrement
                settings.goldPoints = Math.max(opt.min, settings.goldPoints - opt.step);
            } else if (offX > rightX + 100 && offX < rightX + 200) {
                // Increment
                settings.goldPoints = Math.min(opt.max, settings.goldPoints + opt.step);
            }
        }
        // Seconds to gold
        if (offY > startY + lineHeight - rowHeight && offY < startY + lineHeight) {
            const opt = settingsOptions.duration;
            if (offX > rightX - 10 && offX < rightX + 110) {
                settings.duration = Math.max(opt.min, settings.duration - opt.step);
            } else if (offX > rightX + 110 && offX < rightX + 220) {
                settings.duration = Math.min(opt.max, settings.duration + opt.step);
            }
        }
        // Score to win
        if (offY > startY + lineHeight * 2 - rowHeight && offY < startY + lineHeight * 2) {
            const opt = settingsOptions.winScore;
            if (offX > rightX - 10 && offX < rightX + 100) {
                settings.winScore = Math.max(opt.min, settings.winScore - opt.step);
            } else if (offX > rightX + 100 && offX < rightX + 200) {
                settings.winScore = Math.min(opt.max, settings.winScore + opt.step);
            }
        }
        // Sound
        if (offX > rightX - 10 && offX < rightX + 150 && offY > startY + lineHeight * 3 - rowHeight && offY < startY + lineHeight * 3) {
            const idx = settingsOptions.sound.indexOf(settings.sound);
            settings.sound = settingsOptions.sound[(idx + 1) % settingsOptions.sound.length];
        }
        // Player sprite
        if (offY > startY + lineHeight * 4 - rowHeight && offY < startY + lineHeight * 4) {
            const opts = settingsOptions.playerImg;
            const idx = opts.findIndex(p => p.value === settings.playerImg);
            if (offX > rightX - 10 && offX < rightX + 80) {
                // Previous
                const newIdx = (idx - 1 + opts.length) % opts.length;
                settings.playerImg = opts[newIdx].value;
                this.game.settingsChanged = true;
            } else if (offX > rightX + 80 && offX < rightX + 200) {
                // Next
                const newIdx = (idx + 1) % opts.length;
                settings.playerImg = opts[newIdx].value;
                this.game.settingsChanged = true;
            }
        }
        // Background
        if (offY > startY + lineHeight * 5 - rowHeight && offY < startY + lineHeight * 5) {
            const opts = settingsOptions.bgImg;
            const idx = opts.findIndex(b => b.value === settings.bgImg);
            if (offX > rightX - 10 && offX < rightX + 100) {
                // Previous
                const newIdx = (idx - 1 + opts.length) % opts.length;
                settings.bgImg = opts[newIdx].value;
                this.game.settingsChanged = true;
            } else if (offX > rightX + 100 && offX < rightX + 200) {
                // Next
                const newIdx = (idx + 1) % opts.length;
                settings.bgImg = opts[newIdx].value;
                this.game.settingsChanged = true;
            }
        }

        // Continue button (offscreen canvas coords: x 204-434, y 280-305)
        if (offX > 204 && offX < 434 && offY > 280 && offY < 305) {
            this.game.transitionFromSettings();
        }
    }
}
