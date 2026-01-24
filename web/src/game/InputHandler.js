// InputHandler.js - Keyboard and mouse input handling for Broomsticks

import {
    GameState,
    GameMode,
    NetworkMode,
    AIDifficulty,
    OFFSET_X,
    OFFSET_Y,
    GITHUB_URL,
    BUTTONS,
    PAUSE_MODAL,
    PREGAME_SETTINGS_LAYOUT,
    LOBBY_SETTINGS_LAYOUT,
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
        const { player1, player2, state, networkMode } = this.game;

        // Handle JOIN_ROOM state for room code input
        if (state === GameState.JOIN_ROOM) {
            this.handleJoinRoomKeyDown(e);
            return;
        }

        // Prevent default for game keys
        // P1: WASD + 1, P2: arrows + Enter, P3: IJKL + U, P4: Numpad 8/4/5/6 + 0
        if (['Escape', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'ArrowDown', 'Enter',
             'w', 'W', 'a', 'A', 's', 'S', 'd', 'D', '1',
             'i', 'I', 'j', 'J', 'k', 'K', 'l', 'L', 'u', 'U',
             'b', 'B', 'p', 'P'].includes(key) ||
            ['Escape', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'ArrowDown',
             'Numpad8', 'Numpad4', 'Numpad5', 'Numpad6', 'Numpad0'].includes(code)) {
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

        // Online client mode: send input to host instead of controlling local player
        if (networkMode === NetworkMode.CLIENT && state === GameState.PLAYING) {
            this.handleOnlineClientInput(key, code);
            return;
        }

        // Player 2 controls (arrow keys)
        // In online HOST mode, player 2 is controlled by remote input
        if (networkMode !== NetworkMode.HOST) {
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
        }

        // Player 1 controls (WASD - only if not AI)
        if (!player1.isRobot) {
            let hostInput = null;

            if (key === 'w' || key === 'W') { player1.up(); hostInput = { up: true }; }
            if (key === 'a' || key === 'A') { player1.left(); hostInput = { left: true }; }
            if (key === 's' || key === 'S') { player1.down(); hostInput = { down: true }; }
            if (key === 'd' || key === 'D') { player1.right(); hostInput = { right: true }; }
            if (key === '1') { player1.switchModel(); hostInput = { switch: true }; }

            // Send host input to clients (for client-side prediction)
            if (hostInput && networkMode === NetworkMode.HOST && this.game.networkManager) {
                this.game.networkManager.sendHostInput(hostInput, this.game.simTick);
            }
        }

        // Player 3 controls (IJKL - only if exists and not AI)
        const player3 = this.game.players[2];
        if (player3 && !player3.isRobot) {
            if (key === 'i' || key === 'I') player3.up();
            if (key === 'j' || key === 'J') player3.left();
            if (key === 'k' || key === 'K') player3.down();
            if (key === 'l' || key === 'L') player3.right();
            if (key === 'u' || key === 'U') player3.switchModel();
        }

        // Player 4 controls (Numpad - only if exists and not AI)
        const player4 = this.game.players[3];
        if (player4 && !player4.isRobot) {
            if (code === 'Numpad8') player4.up();
            if (code === 'Numpad4') player4.left();
            if (code === 'Numpad5') player4.down();
            if (code === 'Numpad6') player4.right();
            if (code === 'Numpad0') player4.switchModel();
        }

        // Escape key: pause/resume (offline or host only)
        if (key === 'Escape' && (networkMode === NetworkMode.OFFLINE || networkMode === NetworkMode.HOST)) {
            if (this.game.state === GameState.PLAYING) {
                this.game.pauseTime = Date.now();
                this.game.state = GameState.PAUSED;
            } else if (this.game.state === GameState.PAUSED && !this.game.hostPaused) {
                // Can only resume if not paused by host (relevant for offline mode)
                this.game.startTime += Date.now() - this.game.pauseTime;
                this.game.state = GameState.PLAYING;
            }
        }
    }

    // Handle keyboard input for JOIN_ROOM state (room code entry)
    handleJoinRoomKeyDown(e) {
        const key = e.key;

        // Valid room code characters
        const validChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

        if (key === 'Backspace') {
            e.preventDefault();
            if (this.game.roomCodeInput.length > 0) {
                this.game.roomCodeInput = this.game.roomCodeInput.slice(0, -1);
                this.game.networkError = null;
            }
        } else if (key === 'Enter') {
            e.preventDefault();
            if (this.game.roomCodeInput.length === 4) {
                this.game.joinRoom(this.game.roomCodeInput);
            }
        } else if (key === 'Escape') {
            e.preventDefault();
            this.game.roomCodeInput = '';
            this.game.networkError = null;
            this.game.state = GameState.PRIVATE_ROOM_MENU;
        } else if (key.length === 1) {
            const upperKey = key.toUpperCase();
            if (validChars.includes(upperKey) && this.game.roomCodeInput.length < 4) {
                e.preventDefault();
                this.game.roomCodeInput += upperKey;
                this.game.networkError = null;
            }
        }
    }

    // Handle input for online client mode - send to host with tick
    handleOnlineClientInput(key, code) {
        if (!this.game.networkManager) return;

        const input = {
            left: code === 'ArrowLeft',
            right: code === 'ArrowRight',
            up: code === 'ArrowUp',
            down: code === 'ArrowDown',
            switch: key === 'Enter'
        };

        // Apply locally for instant feedback (prediction)
        const player = this.game.player2;  // Client controls player 2
        if (input.left) player.left();
        if (input.right) player.right();
        if (input.up) player.up();
        if (input.down) player.down();
        if (input.switch) player.switchModel();

        // Send to host
        if (input.left || input.right || input.up || input.down || input.switch) {
            this.game.networkManager.sendInput(input, this.game.simTick);
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

            case GameState.JOIN_ROOM:
                this.handleJoinRoomClick(x, y);
                break;

            case GameState.LOBBY:
                this.handleLobbyClick(x, y);
                break;

            case GameState.PLAYING: {
                const { networkMode } = this.game;
                // Only allow pause via icon for offline or host
                if (this.hitTest(BUTTONS.PLAYING.pauseIcon, x, y) &&
                    (networkMode === NetworkMode.OFFLINE || networkMode === NetworkMode.HOST)) {
                    this.game.assets.playSound('pop');
                    this.game.pauseTime = Date.now();
                    this.game.state = GameState.PAUSED;
                }
                break;
            }

            case GameState.PAUSED: {
                const pausedBtns = BUTTONS.PAUSED;

                // If host paused, client can only exit to menu (not resume)
                if (this.game.hostPaused) {
                    if (this.hitTest(pausedBtns.returnToMenu, x, y)) {
                        this.game.assets.playSound('pop');
                        this.game.state = GameState.MAIN_MENU;
                        this.game.resetGameObjects();
                        this.game.leaveRoom();  // Disconnect from network
                    }
                    break;
                }

                // Normal pause handling (offline or host)
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
                    // If online, leave the room
                    if (this.game.networkMode !== NetworkMode.OFFLINE) {
                        this.game.leaveRoom();
                    }
                }
                break;
            }

            case GameState.GAME_OVER: {
                const gameOverBtns = BUTTONS.GAME_OVER;
                if (this.hitTest(gameOverBtns.playAgain, x, y)) {
                    this.game.assets.playSound('pop');
                    this.game.state = GameState.MAIN_MENU;
                    this.game.resetGameObjects();
                    // If online, leave the room
                    if (this.game.networkMode !== NetworkMode.OFFLINE) {
                        this.game.leaveRoom();
                    }
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
        this.handleSettingsGridClick(x, y, PREGAME_SETTINGS_LAYOUT);
    }

    // Reusable settings grid click handler
    // layout: settings layout config (PREGAME_SETTINGS_LAYOUT or LOBBY_SETTINGS_LAYOUT)
    // Returns true if a setting was changed, false otherwise
    handleSettingsGridClick(x, y, layout) {
        const { settings } = this.game;
        const settingsOptions = SETTINGS_OPTIONS;

        // Convert from main canvas to offscreen canvas coordinates
        const offX = x - OFFSET_X;
        const offY = y - OFFSET_Y;

        const { startX, startY, colWidth, lineHeight, rowHeight, grid, twoWayHitboxes } = layout;

        // Determine which row/col was clicked
        const col = Math.floor((offX - startX) / colWidth);
        const row = Math.floor((offY - (startY - rowHeight)) / lineHeight);

        if (col < 0 || col >= layout.cols || row < 0 || row >= layout.rows) return false;

        const settingKey = grid[row][col];
        if (!settingKey) return false;

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
        const twoWaySettings = Object.keys(twoWayHitboxes);
        if (twoWaySettings.includes(settingKey)) {
            const hitbox = twoWayHitboxes[settingKey];

            // Check if click is on left arrow (<)
            if (cellX >= hitbox.leftStart && cellX <= hitbox.leftEnd) {
                if (settingKey === 'playerImg' || settingKey === 'bgImg') {
                    cycleList(settingKey, -1);
                } else {
                    adjustRange(settingKey, -1);
                }
                return true;
            }

            // Check if click is on right arrow (>)
            if (cellX >= hitbox.rightStart && cellX <= hitbox.rightEnd) {
                if (settingKey === 'playerImg' || settingKey === 'bgImg') {
                    cycleList(settingKey, 1);
                } else {
                    adjustRange(settingKey, 1);
                }
                return true;
            }

            // Click was outside arrow hitboxes - ignore
            return false;
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
                return true;
        }

        return false;
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
            this.game.createRoom();
        }
        if (this.hitTest(btns.joinRoom, x, y)) {
            this.game.assets.playSound('pop');
            this.game.roomCodeInput = '';
            this.game.networkError = null;
            this.game.state = GameState.JOIN_ROOM;
        }
        if (this.hitTest(btns.back, x, y)) {
            this.game.assets.playSound('pop');
            this.game.state = GameState.ONLINE_MENU;
        }
    }

    handleJoinRoomClick(x, y) {
        const btns = BUTTONS.JOIN_ROOM;

        // Join button (only if 4 chars entered)
        if (this.hitTest(btns.join, x, y) && this.game.roomCodeInput.length === 4) {
            this.game.assets.playSound('pop');
            this.game.joinRoom(this.game.roomCodeInput);
        }

        // Back button
        if (this.hitTest(btns.back, x, y)) {
            this.game.assets.playSound('pop');
            this.game.roomCodeInput = '';
            this.game.networkError = null;
            this.game.state = GameState.PRIVATE_ROOM_MENU;
        }
    }

    handleLobbyClick(x, y) {
        const btns = BUTTONS.LOBBY;
        const { networkMode, lobbyPlayers } = this.game;

        // Settings grid (host only)
        if (networkMode === NetworkMode.HOST) {
            if (this.handleSettingsGridClick(x, y, LOBBY_SETTINGS_LAYOUT)) {
                // Setting was changed, broadcast to clients
                if (this.game.networkManager) {
                    this.game.networkManager.broadcastSettings(this.game.settings);
                }
                return;
            }
        }

        // Start button (only for host with 2 players)
        if (this.hitTest(btns.start, x, y)) {
            if (networkMode === NetworkMode.HOST && lobbyPlayers.length >= 2) {
                this.game.assets.playSound('ding');
                this.game.requestStartGame();
            }
        }

        // Leave button
        if (this.hitTest(btns.leave, x, y)) {
            this.game.assets.playSound('pop');
            this.game.leaveRoom();
            this.game.state = GameState.PRIVATE_ROOM_MENU;
        }
    }
}
