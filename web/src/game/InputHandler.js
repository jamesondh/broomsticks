// InputHandler.js - Keyboard and mouse input handling for Broomsticks

import { GameState, OFFSET_X, OFFSET_Y, GITHUB_URL, BUTTONS, PAUSE_MODAL, SETTINGS_LAYOUT } from './GameConstants.js';

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
        if (['Escape', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'ArrowDown', 'Enter', 'e', 'E', 's', 'S', 'f', 'F', 'd', 'D', '1', 'b', 'B', 'p', 'P'].includes(key) ||
            ['Escape', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'ArrowDown'].includes(code)) {
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

        // Escape key: pause/resume
        if (key === 'Escape') {
            if (this.game.state === GameState.PLAYING) {
                this.game.pauseTime = Date.now();
                this.game.state = GameState.PAUSED;
            } else if (this.game.state === GameState.PAUSED) {
                this.game.startTime += Date.now() - this.game.pauseTime;
                this.game.state = GameState.PLAYING;
            }
        }
    }

    handleKeyUp(e) {
        this.keysPressed.delete(e.code);
    }

    // Helper for hit testing against button definitions from BUTTONS
    hitTest(btn, x, y) {
        if (btn.mainCanvas) {
            // Direct main canvas coords (e.g., pause icon)
            return x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h;
        }
        if (btn.modalRelative) {
            // Modal-relative coords (pause modal buttons)
            const bx = PAUSE_MODAL.x + btn.x;
            const by = PAUSE_MODAL.y + btn.y;
            return x >= bx && x <= bx + btn.w && y >= by && y <= by + btn.h;
        }
        // Default: offscreen canvas coords, apply offset for main canvas hit test
        const bx = btn.x + OFFSET_X;
        const by = btn.y + OFFSET_Y;
        return x >= bx && x <= bx + btn.w && y >= by && y <= by + btn.h;
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
            case GameState.MODE_SELECT: {
                const btns = BUTTONS.MODE_SELECT;
                if (this.hitTest(btns.singlePlayer, x, y)) {
                    this.game.player1.isRobot = true;
                    this.game.state = GameState.SETTINGS;
                }
                if (this.hitTest(btns.twoPlayer, x, y)) {
                    this.game.player1.isRobot = false;
                    this.game.state = GameState.SETTINGS;
                }
                if (this.hitTest(btns.guestbook, x, y)) {
                    window.location.href = '/guestbook';
                }
                if (this.hitTest(btns.github, x, y)) {
                    window.open(GITHUB_URL, '_blank');
                }
                break;
            }

            case GameState.SETTINGS:
                this.handleSettingsClick(x, y);
                break;

            case GameState.RULES:
                if (this.hitTest(BUTTONS.RULES.continueBtn, x, y)) {
                    this.game.state = GameState.READY;
                }
                break;

            case GameState.READY:
                if (this.hitTest(BUTTONS.READY.startBtn, x, y)) {
                    this.game.startGame();
                }
                break;

            case GameState.PLAYING:
                if (this.hitTest(BUTTONS.PLAYING.pauseIcon, x, y)) {
                    this.game.pauseTime = Date.now();
                    this.game.state = GameState.PAUSED;
                }
                break;

            case GameState.PAUSED: {
                const pausedBtns = BUTTONS.PAUSED;
                // Pause icon click to unpause
                if (this.hitTest(pausedBtns.pauseIcon, x, y)) {
                    this.game.startTime += Date.now() - this.game.pauseTime;
                    this.game.state = GameState.PLAYING;
                    break;
                }
                // Resume button
                if (this.hitTest(pausedBtns.resume, x, y)) {
                    this.game.startTime += Date.now() - this.game.pauseTime;
                    this.game.state = GameState.PLAYING;
                }
                // Return to Menu button
                if (this.hitTest(pausedBtns.returnToMenu, x, y)) {
                    this.game.state = GameState.MODE_SELECT;
                    this.game.resetGameObjects();
                }
                break;
            }

            case GameState.GAME_OVER: {
                const gameOverBtns = BUTTONS.GAME_OVER;
                if (this.hitTest(gameOverBtns.playAgain, x, y)) {
                    this.game.state = GameState.MODE_SELECT;
                    this.game.resetGameObjects();
                }
                if (this.hitTest(gameOverBtns.website, x, y)) {
                    window.open(GITHUB_URL, '_blank');
                }
                break;
            }
        }
    }

    handleSettingsClick(x, y) {
        const { settings, settingsOptions } = this.game;

        // Convert from main canvas to offscreen canvas coordinates
        const offX = x - OFFSET_X;
        const offY = y - OFFSET_Y;

        const { left, right, startY, lineHeight, rowHeight } = SETTINGS_LAYOUT;

        // Helper: check if click is in row N (0-indexed)
        const inRow = (n) => offY >= startY + lineHeight * n - rowHeight &&
                             offY < startY + lineHeight * n;

        // Column hit detection
        const inLeft = offX >= left.hitX && offX < left.hitX + left.hitW;
        const inRight = offX >= right.hitX && offX < right.hitX + right.hitW;
        const inRightDec = offX >= right.hitX && offX < right.hitX + right.splitAt;
        const inRightInc = offX >= right.hitX + right.splitAt && offX < right.hitX + right.hitW;

        // Cycle through array options
        const cycleSetting = (key) => {
            const opts = settingsOptions[key];
            const idx = opts.indexOf(settings[key]);
            settings[key] = opts[(idx + 1) % opts.length];
        };

        // Adjust numeric range
        const adjustRange = (key, dir) => {
            const opt = settingsOptions[key];
            settings[key] = Math.max(opt.min, Math.min(opt.max, settings[key] + dir * opt.step));
        };

        // Cycle through list of {value, label} objects
        const cycleList = (key, dir) => {
            const opts = settingsOptions[key];
            const idx = opts.findIndex(o => o.value === settings[key]);
            const newIdx = (idx + dir + opts.length) % opts.length;
            settings[key] = opts[newIdx].value;
            this.game.settingsChanged = true;
        };

        // Left column: cycle on click
        if (inLeft) {
            if (inRow(0)) cycleSetting('dive');
            if (inRow(1)) cycleSetting('accel');
            if (inRow(2)) cycleSetting('maxSpeed');
            if (inRow(3)) cycleSetting('redBalls');
            if (inRow(4)) cycleSetting('blackBalls');
            if (inRow(5)) cycleSetting('goldBalls');
        }

        // Right column row 0-2: numeric range (dec/inc)
        if (inRow(0)) {
            if (inRightDec) adjustRange('goldPoints', -1);
            if (inRightInc) adjustRange('goldPoints', +1);
        }
        if (inRow(1)) {
            if (inRightDec) adjustRange('duration', -1);
            if (inRightInc) adjustRange('duration', +1);
        }
        if (inRow(2)) {
            if (inRightDec) adjustRange('winScore', -1);
            if (inRightInc) adjustRange('winScore', +1);
        }

        // Right column row 3: sound (cycle)
        if (inRight && inRow(3)) cycleSetting('sound');

        // Right column row 4-5: lists (prev/next)
        if (inRow(4)) {
            if (inRightDec) cycleList('playerImg', -1);
            if (inRightInc) cycleList('playerImg', +1);
        }
        if (inRow(5)) {
            if (inRightDec) cycleList('bgImg', -1);
            if (inRightInc) cycleList('bgImg', +1);
        }

        // Continue button (using shared BUTTONS definition)
        const continueBtn = BUTTONS.SETTINGS.continueBtn;
        if (offX >= continueBtn.x && offX <= continueBtn.x + continueBtn.w &&
            offY >= continueBtn.y && offY <= continueBtn.y + continueBtn.h) {
            this.game.transitionFromSettings();
        }
    }
}
