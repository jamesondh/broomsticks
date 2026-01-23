// InputHandler.js - Keyboard and mouse input handling for Broomsticks

import {
    GameState,
    GameMode,
    AIDifficulty,
    OFFSET_X,
    OFFSET_Y,
    GITHUB_URL,
    BUTTONS,
    PAUSE_MODAL,
    PREGAME_SETTINGS_LAYOUT,
    SETTINGS_OPTIONS
} from './GameConstants.js';

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
            case GameState.MAIN_MENU:
                this.handleMainMenuClick(x, y);
                break;

            case GameState.HELP_MENU:
                this.handleHelpMenuClick(x, y);
                break;

            case GameState.RULES:
                this.handleRulesClick(x, y);
                break;

            case GameState.CONTROLS:
                this.handleControlsClick(x, y);
                break;

            case GameState.PRE_GAME:
                this.handlePreGameClick(x, y);
                break;

            case GameState.ONLINE_MENU:
                this.handleOnlineMenuClick(x, y);
                break;

            case GameState.MATCHMAKING:
                this.handleMatchmakingClick(x, y);
                break;

            case GameState.PRIVATE_ROOM_MENU:
                this.handlePrivateRoomMenuClick(x, y);
                break;

            case GameState.LOBBY:
                this.handleLobbyClick(x, y);
                break;

            case GameState.PLAYING:
                if (this.hitTest(BUTTONS.PLAYING.pauseIcon, x, y)) {
                    this.game.assets.playSound('pop');
                    this.game.pauseTime = Date.now();
                    this.game.state = GameState.PAUSED;
                }
                break;

            case GameState.PAUSED: {
                const pausedBtns = BUTTONS.PAUSED;
                // Pause icon click to unpause
                if (this.hitTest(pausedBtns.pauseIcon, x, y)) {
                    this.game.assets.playSound('pop');
                    this.game.startTime += Date.now() - this.game.pauseTime;
                    this.game.state = GameState.PLAYING;
                    break;
                }
                // Resume button
                if (this.hitTest(pausedBtns.resume, x, y)) {
                    this.game.assets.playSound('pop');
                    this.game.startTime += Date.now() - this.game.pauseTime;
                    this.game.state = GameState.PLAYING;
                }
                // Return to Menu button
                if (this.hitTest(pausedBtns.returnToMenu, x, y)) {
                    this.game.assets.playSound('pop');
                    this.game.state = GameState.MAIN_MENU;
                    this.game.resetGameObjects();
                }
                break;
            }

            case GameState.GAME_OVER: {
                const gameOverBtns = BUTTONS.GAME_OVER;
                if (this.hitTest(gameOverBtns.playAgain, x, y)) {
                    this.game.assets.playSound('pop');
                    this.game.state = GameState.MAIN_MENU;
                    this.game.resetGameObjects();
                }
                if (this.hitTest(gameOverBtns.website, x, y)) {
                    this.game.assets.playSound('pop');
                    window.open(GITHUB_URL, '_blank');
                }
                break;
            }
        }
    }

    handleMainMenuClick(x, y) {
        const btns = BUTTONS.MAIN_MENU;

        if (this.hitTest(btns.singlePlayer, x, y)) {
            this.game.assets.playSound('pop');
            this.game.setGameMode(GameMode.SINGLE);
            this.game.state = GameState.PRE_GAME;
        }
        if (this.hitTest(btns.localMultiplayer, x, y)) {
            this.game.assets.playSound('pop');
            this.game.setGameMode(GameMode.LOCAL);
            this.game.state = GameState.PRE_GAME;
        }
        if (this.hitTest(btns.online, x, y)) {
            this.game.assets.playSound('pop');
            this.game.setGameMode(GameMode.ONLINE);
            this.game.state = GameState.ONLINE_MENU;
        }
        if (this.hitTest(btns.helpIcon, x, y)) {
            this.game.assets.playSound('pop');
            this.game.state = GameState.HELP_MENU;
        }
        if (this.hitTest(btns.guestbook, x, y)) {
            this.game.assets.playSound('pop');
            window.location.href = '/guestbook';
        }
        if (this.hitTest(btns.github, x, y)) {
            this.game.assets.playSound('pop');
            window.open(GITHUB_URL, '_blank');
        }
    }

    handleHelpMenuClick(x, y) {
        const btns = BUTTONS.HELP_MENU;

        if (this.hitTest(btns.rules, x, y)) {
            this.game.assets.playSound('pop');
            this.game.state = GameState.RULES;
        }
        if (this.hitTest(btns.controls, x, y)) {
            this.game.assets.playSound('pop');
            this.game.state = GameState.CONTROLS;
        }
        if (this.hitTest(btns.back, x, y)) {
            this.game.assets.playSound('pop');
            this.game.state = GameState.MAIN_MENU;
        }
    }

    handleRulesClick(x, y) {
        const btns = BUTTONS.RULES;

        if (this.hitTest(btns.back, x, y)) {
            this.game.assets.playSound('pop');
            this.game.state = GameState.HELP_MENU;
        }
    }

    handleControlsClick(x, y) {
        const btns = BUTTONS.CONTROLS;

        if (this.hitTest(btns.back, x, y)) {
            this.game.assets.playSound('pop');
            this.game.state = GameState.HELP_MENU;
        }
    }

    handlePreGameClick(x, y) {
        const btns = BUTTONS.PRE_GAME;
        const { gameMode } = this.game;

        // Difficulty buttons (single player only)
        if (gameMode === GameMode.SINGLE) {
            if (this.hitTest(btns.diffEasy, x, y)) {
                this.game.assets.playSound('pop');
                this.game.setDifficulty(AIDifficulty.EASY);
            }
            if (this.hitTest(btns.diffMedium, x, y)) {
                this.game.assets.playSound('pop');
                this.game.setDifficulty(AIDifficulty.MEDIUM);
            }
            if (this.hitTest(btns.diffHard, x, y)) {
                this.game.assets.playSound('pop');
                this.game.setDifficulty(AIDifficulty.HARD);
            }
        }

        // Player count buttons (local multiplayer only)
        if (gameMode === GameMode.LOCAL) {
            if (this.hitTest(btns.players2, x, y)) {
                this.game.assets.playSound('pop');
                this.game.setPlayerCount(2);
            }
            if (this.hitTest(btns.players4, x, y)) {
                this.game.assets.playSound('pop');
                this.game.setPlayerCount(4);
            }
        }

        // Handle settings clicks
        this.handleExpandedSettingsClick(x, y);

        // Start button
        if (this.hitTest(btns.start, x, y)) {
            this.game.assets.playSound('ding');
            this.game.startFromPreGame();
        }

        // Back button
        if (this.hitTest(btns.back, x, y)) {
            this.game.assets.playSound('pop');
            this.game.state = GameState.MAIN_MENU;
        }
    }

    handleExpandedSettingsClick(x, y) {
        const { settings } = this.game;
        const settingsOptions = SETTINGS_OPTIONS;

        // Convert from main canvas to offscreen canvas coordinates
        const offX = x - OFFSET_X;
        const offY = y - OFFSET_Y;

        const { startX, startY, colWidth, lineHeight, rowHeight, grid, twoWayHitboxes } = PREGAME_SETTINGS_LAYOUT;

        // Determine which row/col was clicked
        const col = Math.floor((offX - startX) / colWidth);
        const row = Math.floor((offY - (startY - rowHeight)) / lineHeight);

        if (col < 0 || col >= 4 || row < 0 || row >= 3) return;

        const settingKey = grid[row][col];
        if (!settingKey) return;

        // X position within the cell
        const cellX = offX - startX - col * colWidth;

        // Cycle through array options
        const cycleSetting = (key) => {
            const opts = settingsOptions[key];
            const idx = opts.indexOf(settings[key]);
            settings[key] = opts[(idx + 1) % opts.length];
            this.game.assets.playSound('pop');
        };

        // Adjust numeric range
        const adjustRange = (key, dir) => {
            const opt = settingsOptions[key];
            settings[key] = Math.max(opt.min, Math.min(opt.max, settings[key] + dir * opt.step));
            this.game.assets.playSound('pop');
        };

        // Cycle through list of {value, label} objects
        const cycleList = (key, dir) => {
            const opts = settingsOptions[key];
            const idx = opts.findIndex(o => o.value === settings[key]);
            const newIdx = (idx + dir + opts.length) % opts.length;
            settings[key] = opts[newIdx].value;
            this.game.settingsChanged = true;
            this.game.assets.playSound('pop');
        };

        // Two-way settings use explicit arrow hitboxes
        const twoWaySettings = ['goldPoints', 'duration', 'winScore', 'playerImg', 'bgImg'];
        if (twoWaySettings.includes(settingKey)) {
            const hitbox = twoWayHitboxes[settingKey];

            // Check if click is on left arrow (<)
            if (cellX >= hitbox.leftStart && cellX <= hitbox.leftEnd) {
                if (settingKey === 'playerImg' || settingKey === 'bgImg') {
                    cycleList(settingKey, -1);
                } else {
                    adjustRange(settingKey, -1);
                }
                return;
            }

            // Check if click is on right arrow (>)
            if (cellX >= hitbox.rightStart && cellX <= hitbox.rightEnd) {
                if (settingKey === 'playerImg' || settingKey === 'bgImg') {
                    cycleList(settingKey, 1);
                } else {
                    adjustRange(settingKey, 1);
                }
                return;
            }

            // Click was outside arrow hitboxes - ignore
            return;
        }

        // Handle cycle settings (click anywhere in cell)
        switch (settingKey) {
            case 'dive':
            case 'accel':
            case 'maxSpeed':
            case 'sound':
            case 'redBalls':
            case 'blackBalls':
            case 'goldBalls':
                cycleSetting(settingKey);
                break;
        }
    }

    handleOnlineMenuClick(x, y) {
        const btns = BUTTONS.ONLINE_MENU;

        if (this.hitTest(btns.quickMatch, x, y)) {
            this.game.assets.playSound('pop');
            this.game.state = GameState.MATCHMAKING;
        }
        if (this.hitTest(btns.privateRoom, x, y)) {
            this.game.assets.playSound('pop');
            this.game.state = GameState.PRIVATE_ROOM_MENU;
        }
        if (this.hitTest(btns.back, x, y)) {
            this.game.assets.playSound('pop');
            this.game.state = GameState.MAIN_MENU;
        }
    }

    handleMatchmakingClick(x, y) {
        const btns = BUTTONS.MATCHMAKING;

        if (this.hitTest(btns.cancel, x, y)) {
            this.game.assets.playSound('pop');
            this.game.state = GameState.ONLINE_MENU;
        }
    }

    handlePrivateRoomMenuClick(x, y) {
        const btns = BUTTONS.PRIVATE_ROOM_MENU;

        if (this.hitTest(btns.createRoom, x, y)) {
            this.game.assets.playSound('pop');
            this.game.state = GameState.LOBBY;
        }
        if (this.hitTest(btns.joinRoom, x, y)) {
            this.game.assets.playSound('pop');
            // In Phase 3, this would show a room code input
            this.game.state = GameState.LOBBY;
        }
        if (this.hitTest(btns.back, x, y)) {
            this.game.assets.playSound('pop');
            this.game.state = GameState.ONLINE_MENU;
        }
    }

    handleLobbyClick(x, y) {
        const btns = BUTTONS.LOBBY;

        // Start button is disabled in mock UI
        // if (this.hitTest(btns.start, x, y)) { ... }

        if (this.hitTest(btns.leave, x, y)) {
            this.game.assets.playSound('pop');
            this.game.state = GameState.PRIVATE_ROOM_MENU;
        }
    }
}
