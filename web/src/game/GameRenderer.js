// GameRenderer.js - All canvas drawing operations for Broomsticks

import {
    GameState,
    GameMode,
    NetworkMode,
    AIDifficulty,
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
    GAME_WIDTH,
    GAME_HEIGHT,
    OFFSET_X,
    OFFSET_Y,
    GROUND_Y,
    COLORS,
    GAME_FONT,
    BUTTONS,
    PAUSE_MODAL,
    PREGAME_SETTINGS_LAYOUT,
    LOBBY_SETTINGS_LAYOUT,
    LOBBY_SETTINGS,
    DEBUG_HITBOXES
} from './GameConstants.js';

export class GameRenderer {
    constructor(game, canvas, offCanvas) {
        this.game = game;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.ctx.textRendering = 'geometricPrecision';

        this.offCanvas = offCanvas;
        this.offCtx = offCanvas.getContext('2d');
        this.offCtx.textRendering = 'geometricPrecision';
    }

    render() {
        const ctx = this.ctx;

        // Clear canvas
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Draw the off-screen buffer content
        this.renderOffscreen();
        ctx.drawImage(this.offCanvas, OFFSET_X, OFFSET_Y);

        // Draw UI elements
        this.drawScores(ctx);
        this.drawBorder(ctx);
        this.drawTitle(ctx);

        if (this.game.state === GameState.PLAYING) {
            this.drawPauseIcon(ctx);
            this.drawControls(ctx);
            this.drawGoldTimer(ctx);
        }

        if (this.game.state === GameState.PAUSED) {
            this.drawPauseIcon(ctx);
            this.drawPauseScreen(ctx);
        }
    }

    renderOffscreen() {
        const ctx = this.offCtx;
        const { assets, state, backToggle } = this.game;

        // Draw background
        const showImageBackground = backToggle || (state !== GameState.PLAYING && state !== GameState.PAUSED);

        if (showImageBackground && assets.backImage) {
            ctx.drawImage(assets.backImage, 0, 0);
            if (assets.fieldImage) {
                ctx.drawImage(assets.fieldImage, 0, GROUND_Y);
            }
        } else {
            // Solid color background
            ctx.fillStyle = COLORS.sky;
            ctx.fillRect(0, 0, GAME_WIDTH, GROUND_Y);
            ctx.fillStyle = COLORS.green;
            ctx.fillRect(0, GROUND_Y, GAME_WIDTH, 25);
            ctx.strokeStyle = '#000';
            ctx.beginPath();
            ctx.moveTo(0, GROUND_Y);
            ctx.lineTo(GAME_WIDTH, GROUND_Y);
            ctx.stroke();
            // Corner lines
            ctx.beginPath();
            ctx.moveTo(30, GROUND_Y);
            ctx.lineTo(0, GAME_HEIGHT);
            ctx.moveTo(598, GROUND_Y);
            ctx.lineTo(GAME_WIDTH, GAME_HEIGHT);
            ctx.stroke();
        }

        // Draw baskets
        this.drawBaskets(ctx);

        // Draw game scene
        this.drawScene(ctx);
    }

    drawBaskets(ctx) {
        const { assets, currBasket } = this.game;

        // Left basket
        const leftBasket = currBasket === 2 ? assets.basketHImage : assets.basketImage;
        const leftPoleColor = currBasket === 2 ? COLORS.gold : COLORS.yellow;

        if (leftBasket) {
            ctx.drawImage(leftBasket, 10, 159);
        }
        ctx.strokeStyle = '#000';
        ctx.strokeRect(17.5, 198.5, 3, 160);
        ctx.fillStyle = leftPoleColor;
        ctx.fillRect(18, 198, 2, 160);

        // Right basket
        const rightBasket = currBasket === 1 ? assets.basketHImage : assets.basketImage;
        const rightPoleColor = currBasket === 1 ? COLORS.gold : COLORS.yellow;

        if (rightBasket) {
            ctx.drawImage(rightBasket, 598, 159);
        }
        ctx.strokeStyle = '#000';
        ctx.strokeRect(605.5, 198.5, 3, 160);
        ctx.fillStyle = rightPoleColor;
        ctx.fillRect(606, 198, 2, 160);
    }

    drawScene(ctx) {
        switch (this.game.state) {
            case GameState.LOADING:
                this.drawLoadingScreen(ctx);
                break;
            case GameState.MAIN_MENU:
                this.drawMainMenu(ctx);
                break;
            case GameState.HELP_MENU:
                this.drawHelpMenu(ctx);
                break;
            case GameState.RULES:
                this.drawRulesScreen(ctx);
                break;
            case GameState.CONTROLS:
                this.drawControlsScreen(ctx);
                break;
            case GameState.PRE_GAME:
                this.drawPreGame(ctx);
                break;
            case GameState.ONLINE_MENU:
                this.drawOnlineMenu(ctx);
                break;
            case GameState.MATCHMAKING:
                this.drawMatchmaking(ctx);
                break;
            case GameState.PRIVATE_ROOM_MENU:
                this.drawPrivateRoomMenu(ctx);
                break;
            case GameState.JOIN_ROOM:
                this.drawJoinRoom(ctx);
                break;
            case GameState.LOBBY:
                this.drawLobby(ctx);
                break;
            case GameState.PLAYING:
                this.drawGameplay(ctx);
                break;
            case GameState.PAUSED:
                this.drawGameplay(ctx);
                break;
            case GameState.GAME_OVER:
                this.drawGameOverScreen(ctx);
                break;
        }
    }

    drawLoadingScreen(ctx) {
        const { assets } = this.game;
        ctx.fillStyle = '#000';
        ctx.font = GAME_FONT;
        ctx.fillText('Loading images, please wait...', 239, 169);
        if (assets.introImage) {
            ctx.drawImage(assets.introImage, 139, 59);
        }
    }

    drawMainMenu(ctx) {
        const { assets } = this.game;
        const btns = BUTTONS.MAIN_MENU;

        ctx.fillStyle = '#000';
        ctx.font = GAME_FONT;

        // Intro image
        if (assets.introImage) {
            ctx.drawImage(assets.introImage, 139, 39);
        }

        // Single Player button
        this.drawButton(ctx, btns.singlePlayer, 'Single Player');

        // Local Multiplayer button
        this.drawButton(ctx, btns.localMultiplayer, 'Local Multiplayer');

        // Online button
        this.drawButton(ctx, btns.online, 'Online');

        // Help icon (top right)
        const hi = btns.helpIcon;
        ctx.fillStyle = '#888';
        ctx.fillRect(hi.x, hi.y, hi.w, hi.h);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(hi.x + 0.5, hi.y + 0.5, hi.w, hi.h);
        ctx.fillStyle = '#000';
        ctx.font = '16px MS Sans Serif Extended, Helvetica, Arial, sans-serif';
        ctx.fillText('?', hi.x + 12, hi.y + 20);
        ctx.font = GAME_FONT;

        // Attribution text
        ctx.fillText('A game by Paul Rajlich (2000-2011), port by Jameson Hodge (2026)', 149, 325);

        // Footer links
        const gb = btns.guestbook;
        ctx.fillText('Guestbook', gb.x, gb.y + 15);
        ctx.fillRect(gb.x, gb.y + 18, gb.w - 3, 1);

        const gh = btns.github;
        ctx.fillText('GitHub', gh.x, gh.y + 15);
        ctx.fillRect(gh.x, gh.y + 18, gh.w - 3, 1);

        // Debug hitboxes for footer links
        this.drawDebugHitbox(ctx, gb.x, gb.y, gb.w, gb.h);
        this.drawDebugHitbox(ctx, gh.x, gh.y, gh.w, gh.h);
    }

    drawHelpMenu(ctx) {
        const { assets } = this.game;
        const btns = BUTTONS.HELP_MENU;

        ctx.fillStyle = '#000';
        ctx.font = GAME_FONT;

        // Intro image
        if (assets.introImage) {
            ctx.drawImage(assets.introImage, 139, 39);
        }

        // Title
        ctx.fillText('HELP', 295, 160);

        // Rules button
        this.drawButton(ctx, btns.rules, 'Rules');

        // Controls button
        this.drawButton(ctx, btns.controls, 'Controls');

        // Back link
        this.drawBackButton(ctx, btns.back);
    }

    drawPreGame(ctx) {
        const { assets, gameMode, aiDifficulty, playerCount, settings, settingsOptions } = this.game;
        const btns = BUTTONS.PRE_GAME;

        ctx.fillStyle = '#000';
        ctx.font = GAME_FONT;

        // Intro image
        if (assets.introImage) {
            ctx.drawImage(assets.introImage, 139, 12);
        }

        // Title based on mode
        const title = gameMode === GameMode.SINGLE ? 'SINGLE PLAYER' : 'LOCAL MULTIPLAYER';
        ctx.fillText(title, gameMode === GameMode.SINGLE ? 270 : 255, 130);

        // Mode-specific options
        if (gameMode === GameMode.SINGLE) {
            // Difficulty selector
            ctx.fillText('Difficulty:', 160, 167);
            this.drawToggleButton(ctx, btns.diffEasy, 'Easy', aiDifficulty === AIDifficulty.EASY);
            this.drawToggleButton(ctx, btns.diffMedium, 'Medium', aiDifficulty === AIDifficulty.MEDIUM);
            this.drawToggleButton(ctx, btns.diffHard, 'Hard', aiDifficulty === AIDifficulty.HARD);
            this.drawToggleButton(ctx, btns.diffExpert, 'Expert', aiDifficulty === AIDifficulty.EXPERT);
        } else {
            // Player count selector
            ctx.fillText('Players:', 240, 167);
            this.drawToggleButton(ctx, btns.players2, '2', playerCount === 2);
            this.drawToggleButton(ctx, btns.players4, '4', playerCount === 4);
        }

        // Settings grid
        this.drawExpandedSettings(ctx);

        // START button
        this.drawButton(ctx, btns.start, 'START');

        // Back link
        this.drawBackButton(ctx, btns.back);
    }

    drawExpandedSettings(ctx) {
        this.drawSettingsGrid(ctx, PREGAME_SETTINGS_LAYOUT, false);
    }

    drawLobbySettings(ctx) {
        const isHost = this.game.networkMode === NetworkMode.HOST;
        const readOnly = !isHost;

        // "Settings:" label
        ctx.fillStyle = '#000';
        ctx.font = GAME_FONT;
        ctx.fillText('Settings:', 165, 200);
        if (readOnly) {
            ctx.fillStyle = '#666';
            ctx.fillText('(Host controls)', 210, 200);
            ctx.fillStyle = '#000';
        }

        this.drawSettingsGrid(ctx, LOBBY_SETTINGS_LAYOUT, readOnly);
    }

    // Reusable settings grid renderer
    // layout: settings layout config (PREGAME_SETTINGS_LAYOUT or LOBBY_SETTINGS_LAYOUT)
    // readOnly: if true, hide < > arrows (for client view)
    drawSettingsGrid(ctx, layout, readOnly) {
        const { settings, settingsOptions } = this.game;
        const { startX, startY, colWidth, lineHeight, rowHeight, rows, cols, grid, twoWayHitboxes } = layout;

        ctx.fillStyle = '#000';
        ctx.font = GAME_FONT;

        // Two-way settings that show < > arrows
        const twoWaySettings = Object.keys(twoWayHitboxes);

        // Render each cell in the grid
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const settingKey = grid[row][col];
                if (!settingKey) continue;

                const x = startX + col * colWidth;
                const y = startY + row * lineHeight;

                // Format the setting value
                let text = this.formatSettingText(settingKey, settings, settingsOptions, twoWaySettings.includes(settingKey), readOnly);
                ctx.fillText(text, x, y);
            }
        }

        // Debug hitboxes for settings grid (only if not read-only)
        if (DEBUG_HITBOXES && !readOnly) {
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    const settingKey = grid[row][col];
                    if (!settingKey) continue;

                    const cellX = startX + col * colWidth;
                    const cellY = startY - rowHeight + row * lineHeight;

                    if (twoWaySettings.includes(settingKey)) {
                        const hitbox = twoWayHitboxes[settingKey];
                        const leftWidth = hitbox.leftEnd - hitbox.leftStart;
                        const rightWidth = hitbox.rightEnd - hitbox.rightStart;
                        this.drawDebugHitbox(ctx, cellX + hitbox.leftStart, cellY, leftWidth, rowHeight);
                        this.drawDebugHitbox(ctx, cellX + hitbox.rightStart, cellY, rightWidth, rowHeight);
                    } else {
                        this.drawDebugHitbox(ctx, cellX, cellY, colWidth, rowHeight);
                    }
                }
            }
        }
    }

    // Format setting text with label and value
    formatSettingText(key, settings, settingsOptions, isTwoWay, readOnly) {
        const labels = {
            dive: 'Diving',
            accel: 'Acceleration',
            maxSpeed: 'Max Speed',
            sound: 'Sound',
            redBalls: 'Red',
            blackBalls: 'Black',
            goldBalls: 'Gold',
            goldPoints: 'Gold Points',
            duration: 'Time',
            winScore: 'Win',
            playerImg: 'Sprites',
            bgImg: 'BG'
        };

        const label = labels[key] || key;
        let value;

        switch (key) {
            case 'dive':
                value = settings.dive ? 'Yes' : 'No';
                break;
            case 'sound':
                value = settings.sound ? 'On' : 'Off';
                break;
            case 'playerImg': {
                const opt = settingsOptions.playerImg.find(p => p.value === settings.playerImg);
                value = opt ? opt.label : 'Default';
                break;
            }
            case 'bgImg': {
                const opt = settingsOptions.bgImg.find(b => b.value === settings.bgImg);
                value = opt ? opt.label : 'Sky 1';
                break;
            }
            default:
                value = settings[key];
        }

        // Two-way settings show < > arrows unless read-only
        if (isTwoWay) {
            if (readOnly) {
                return label ? `${label}: ${value}` : `${value}`;
            }
            return label ? `${label}: < ${value} >` : `< ${value} >`;
        }

        return label ? `${label}: ${value}` : `${value}`;
    }

    drawOnlineMenu(ctx) {
        const { assets } = this.game;
        const btns = BUTTONS.ONLINE_MENU;

        ctx.fillStyle = '#000';
        ctx.font = GAME_FONT;

        // Intro image
        if (assets.introImage) {
            ctx.drawImage(assets.introImage, 139, 39);
        }

        // Title
        ctx.fillText('ONLINE', 296, 160);

        // Quick Match button
        this.drawButton(ctx, btns.quickMatch, 'Quick Match');

        // Private Room button
        this.drawButton(ctx, btns.privateRoom, 'Private Room');

        // Back link
        this.drawBackButton(ctx, btns.back);
    }

    drawMatchmaking(ctx) {
        const { assets } = this.game;
        const btns = BUTTONS.MATCHMAKING;

        ctx.fillStyle = '#000';
        ctx.font = GAME_FONT;

        // Intro image
        if (assets.introImage) {
            ctx.drawImage(assets.introImage, 139, 39);
        }

        // Title
        ctx.fillText('QUICK MATCH', 260, 160);

        // Searching text with animated dots
        const dots = '.'.repeat(Math.floor(Date.now() / 500) % 4);
        ctx.fillText(`Searching for opponent${dots}`, 230, 195);

        // Cancel button
        this.drawButton(ctx, btns.cancel, 'Cancel');

        // Mock notice
        ctx.fillStyle = '#666';
        ctx.fillText('(Mock UI - Phase 3)', 260, 330);
    }

    drawPrivateRoomMenu(ctx) {
        const { assets } = this.game;
        const btns = BUTTONS.PRIVATE_ROOM_MENU;

        ctx.fillStyle = '#000';
        ctx.font = GAME_FONT;

        // Intro image
        if (assets.introImage) {
            ctx.drawImage(assets.introImage, 139, 39);
        }

        // Title
        ctx.fillText('PRIVATE ROOM', 275, 160);

        // Create Room button
        this.drawButton(ctx, btns.createRoom, 'Create Room');

        // Join Room button
        this.drawButton(ctx, btns.joinRoom, 'Join Room');

        // Back link
        this.drawBackButton(ctx, btns.back);
    }

    drawJoinRoom(ctx) {
        const { assets, roomCodeInput, networkError } = this.game;
        const btns = BUTTONS.JOIN_ROOM;

        ctx.fillStyle = '#000';
        ctx.font = GAME_FONT;

        // Intro image
        if (assets.introImage) {
            ctx.drawImage(assets.introImage, 139, 39);
        }

        // Title
        ctx.fillText('JOIN ROOM', 285, 160);

        // Room code input box
        const inputBox = btns.codeInput;
        ctx.fillStyle = '#fff';
        ctx.fillRect(inputBox.x, inputBox.y, inputBox.w, inputBox.h);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(inputBox.x + 0.5, inputBox.y + 0.5, inputBox.w, inputBox.h);

        // Room code text with blinking cursor
        ctx.fillStyle = '#000';
        ctx.font = '32px MS Sans Serif Extended, Helvetica, Arial, sans-serif';
        const displayCode = roomCodeInput.toUpperCase();
        const codeX = inputBox.x + inputBox.w / 2 - ctx.measureText(displayCode).width / 2;
        ctx.fillText(displayCode, codeX, inputBox.y + 26);

        // Blinking cursor
        if (roomCodeInput.length < 4 && Math.floor(Date.now() / 500) % 2 === 0) {
            const cursorX = codeX + ctx.measureText(displayCode).width + 2;
            ctx.fillRect(cursorX, inputBox.y + 8, 2, 20);
        }

        ctx.font = GAME_FONT;

        // Instructions
        ctx.fillStyle = '#666';
        ctx.fillText('Enter 4-character room code', 235, inputBox.y + inputBox.h + 20);

        // Error message
        if (networkError) {
            ctx.fillStyle = '#c00';
            ctx.fillText(networkError, 280, inputBox.y + inputBox.h + 40);
        }

        // Join button (enabled only when 4 chars entered)
        if (roomCodeInput.length === 4) {
            this.drawButton(ctx, btns.join, 'JOIN');
        } else {
            // Disabled button
            ctx.fillStyle = '#888';
            ctx.fillRect(btns.join.x, btns.join.y, btns.join.w, btns.join.h);
            ctx.strokeStyle = '#000';
            ctx.strokeRect(btns.join.x + 0.5, btns.join.y + 0.5, btns.join.w, btns.join.h);
            ctx.fillStyle = '#000';
            ctx.fillText('JOIN', btns.join.x + 38, btns.join.y + 20);
        }

        // Back link
        this.drawBackButton(ctx, btns.back);
    }

    drawLobby(ctx) {
        const { assets, roomCode, lobbyPlayers, networkMode, networkError } = this.game;
        const btns = BUTTONS.LOBBY;
        const isHost = networkMode === NetworkMode.HOST;

        ctx.fillStyle = '#000';
        ctx.font = GAME_FONT;

        // Intro image
        if (assets.introImage) {
            ctx.drawImage(assets.introImage, 139, 12);
        }

        // Title
        ctx.fillText('LOBBY', 299, 120);

        // Room code and Players side by side
        ctx.font = '32px MS Sans Serif Extended, Helvetica, Arial, sans-serif';
        ctx.fillText(`Room: ${roomCode}`, 165, 153);
        ctx.font = GAME_FONT;

        // Copy link button (right of room code)
        const copyBtn = btns.copyLink;
        const copyLabel = this.game.copiedFeedback ? 'Copied!' : 'Copy Link';
        ctx.fillStyle = this.game.copiedFeedback ? COLORS.gold : COLORS.green;
        ctx.fillRect(copyBtn.x, copyBtn.y, copyBtn.w, copyBtn.h);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(copyBtn.x + 0.5, copyBtn.y + 0.5, copyBtn.w, copyBtn.h);
        ctx.fillStyle = '#000';
        ctx.font = '16px MS Sans Serif Extended, Helvetica, Arial, sans-serif';
        ctx.fillText(copyLabel, copyBtn.x + 5, copyBtn.y + 15);
        ctx.font = GAME_FONT;

        // Players list (right side)
        ctx.fillText('Players:', 340, 145);
        let yOffset = 165;
        for (const player of lobbyPlayers) {
            const label = player.isHost ? `${player.name} (Host)` : player.name;
            ctx.fillText(`- ${label}`, 332, yOffset);
            yOffset += 18;
        }

        // Waiting for players message
        if (lobbyPlayers.length < 2) {
            ctx.fillStyle = '#666';
            ctx.fillText('Waiting for opponent...', 340, yOffset);
            ctx.fillStyle = '#000';
        }

        // Settings grid
        this.drawLobbySettings(ctx);

        // Error message
        if (networkError) {
            ctx.fillStyle = '#c00';
            ctx.fillText(networkError, 260, 345);
            ctx.fillStyle = '#000';
        }

        // Start button (only for host, enabled when 2 players)
        const start = btns.start;
        if (isHost && lobbyPlayers.length >= 2) {
            this.drawButton(ctx, start, 'Start');
        } else {
            // Disabled button
            ctx.fillStyle = '#888';
            ctx.fillRect(start.x, start.y, start.w, start.h);
            ctx.strokeStyle = '#000';
            ctx.strokeRect(start.x + 0.5, start.y + 0.5, start.w, start.h);
            ctx.fillStyle = '#000';
            const label = isHost ? 'Start' : 'Waiting...';
            ctx.fillText(label, start.x + (isHost ? 38 : 15), start.y + 20);
        }

        // Leave link
        this.drawBackButton(ctx, btns.leave, 'Leave');
    }

    drawRulesScreen(ctx) {
        const { assets, settings } = this.game;
        const btns = BUTTONS.RULES;

        ctx.fillStyle = '#000';
        ctx.font = GAME_FONT;

        // Intro image
        if (assets.introImage) {
            ctx.drawImage(assets.introImage, 139, 39);
        }

        // Title
        ctx.fillText('RULES', 290, 140);

        // Rules
        ctx.fillText('The rules of the game are:', 139, 169);
        ctx.fillText('1. When two players collide, the player that is lower is bumped.', 139, 189);
        ctx.fillText('2. When a player collides with a black ball, the player is bumped.', 139, 204);
        ctx.fillText('3. When a player gets close to the red ball, the player catches the ball.', 139, 219);
        ctx.fillText('4. When a player puts the red ball in the opponent\'s hoop, 10 points are scored.', 139, 234);
        ctx.fillText(`5. First player to score ${settings.winScore} points wins.`, 139, 249);

        if (settings.goldBalls > 0) {
            ctx.fillText(`6. Gold ball appears after ${settings.duration}s - worth ${settings.goldPoints} points!`, 139, 264);
        }

        ctx.fillText('Have fun! If you haven\'t played against a friend, you haven\'t played! :-)', 139, 294);

        // Back link
        this.drawBackButton(ctx, btns.back);
    }

    drawControlsScreen(ctx) {
        const { assets, settings, player1 } = this.game;
        const btns = BUTTONS.CONTROLS;

        ctx.fillStyle = '#000';
        ctx.font = GAME_FONT;

        // Intro image
        if (assets.introImage) {
            ctx.drawImage(assets.introImage, 139, 39);
        }

        // Title
        ctx.fillText('CONTROLS', 285, 150);

        // Instructions
        ctx.fillText('It\'s easier to just click on the keys rather than hold them down.', 139, 179);
        ctx.fillText('Click on your up key several times to start flying.', 174, 199);

        // Blue player controls
        ctx.fillText('Blue Player', 89, 219);
        ctx.fillText('use W, A, S, D keys', 89, 239);
        if (settings.dive) {
            ctx.fillText('use S to dive', 89, 254);
            ctx.fillText('use 1 to switch player', 89, 269);
        } else {
            ctx.fillText('use 1 to switch player', 89, 254);
        }

        // Green player controls
        ctx.fillText('Green Player', 389, 219);
        ctx.fillText('use arrow keys', 389, 239);
        if (settings.dive) {
            ctx.fillText('use DOWN to dive', 389, 254);
            ctx.fillText('use ENTER to switch player', 389, 269);
        } else {
            ctx.fillText('use ENTER to switch player', 389, 254);
        }

        // Back link
        this.drawBackButton(ctx, btns.back);
    }

    drawGameplay(ctx) {
        const { players, balls } = this.game;

        // Draw players with interpolation
        for (const player of players) {
            const pos = this.getInterpolatedPos(player);
            this.drawPlayerAt(ctx, player, pos.x, pos.y);
        }

        // Draw balls with interpolation
        for (const ball of balls) {
            if (!ball.alive) continue;
            const pos = this.getInterpolatedPos(ball);
            this.drawBallAt(ctx, ball, pos.x, pos.y);
        }
    }

    /**
     * Get interpolated position for smooth rendering between physics ticks.
     * Online mode interpolates for smooth 60fps; offline preserves original chunky feel.
     */
    getInterpolatedPos(obj) {
        const alpha = this.game.renderAlpha || 0;

        // Skip interpolation for offline (preserve original chunky feel)
        if (this.game.networkMode === NetworkMode.OFFLINE) {
            return { x: obj.x, y: obj.y };
        }

        // Skip if prevX/prevY not set
        if (obj.prevX === undefined || obj.prevY === undefined) {
            return { x: obj.x, y: obj.y };
        }

        // Skip interpolation for large jumps (teleports, respawns, boundary wraps)
        const dx = Math.abs(obj.x - obj.prevX);
        const dy = Math.abs(obj.y - obj.prevY);
        if (dx > 50 || dy > 50) {
            return { x: obj.x, y: obj.y };
        }

        return {
            x: obj.prevX + (obj.x - obj.prevX) * alpha,
            y: obj.prevY + (obj.y - obj.prevY) * alpha
        };
    }

    /**
     * Draw a player at a specific position (for interpolated rendering).
     * Replicates Person.draw() logic but uses passed coordinates.
     */
    drawPlayerAt(ctx, player, x, y) {
        // Subtract offset (11, 31) to convert game coords to offscreen coords
        const drawX = x - 11;
        const drawY = y - 31;

        // Determine which direction sprite to use based on velocity
        let hDir;
        if (player.velocityX > 0) {
            hDir = 0;
        } else if (player.velocityX < 0) {
            hDir = 1;
        } else {
            hDir = player.side;
        }

        // vDir: 0 = falling/neutral, 1 = rising
        const vDir = player.velocityY >= 0 ? 0 : 1;

        // Use model + 5 for green team (side 1)
        const modelIndex = player.side === 0 ? player.model : player.model + 5;

        const sprites = this.game.assets.playerImages;
        if (sprites?.[modelIndex]?.[vDir]?.[hDir]) {
            ctx.drawImage(sprites[modelIndex][vDir][hDir], drawX, drawY);
        } else {
            // Fallback: draw colored rectangle
            ctx.fillStyle = player.side === 0 ? '#0080ff' : '#00a400';
            ctx.fillRect(drawX, drawY, player.w, player.h);
            ctx.strokeStyle = '#000';
            ctx.strokeRect(drawX + 0.5, drawY + 0.5, player.w, player.h);
        }
    }

    /**
     * Draw a ball at a specific position (for interpolated rendering).
     * Replicates Ball.draw() logic but uses passed coordinates.
     */
    drawBallAt(ctx, ball, x, y) {
        // Subtract offset (11, 31) to convert game coords to offscreen coords
        const drawX = x - 11;
        const drawY = y - 31;

        if (this.game.assets.ballImages?.[ball.model]) {
            ctx.drawImage(this.game.assets.ballImages[ball.model], drawX, drawY);
        } else {
            // Fallback: draw colored circle
            ctx.beginPath();
            ctx.arc(drawX + ball.w / 2, drawY + ball.h / 2, ball.w / 2, 0, Math.PI * 2);
            let color;
            switch (ball.model) {
                case 0: color = '#ffff00'; break; // gold
                case 1: color = '#000000'; break; // black
                case 2: color = '#ff0000'; break; // red
                default: color = '#ff0000';
            }
            ctx.fillStyle = color;
            ctx.fill();
            ctx.closePath();
        }
    }

    drawGameOverScreen(ctx) {
        const { assets } = this.game;
        const btns = BUTTONS.GAME_OVER;

        // Play again button
        const pa = btns.playAgain;
        ctx.fillStyle = COLORS.green;
        ctx.fillRect(pa.x, pa.y, pa.w, pa.h);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(pa.x + 0.5, pa.y + 0.5, pa.w, pa.h);
        ctx.fillStyle = '#000';
        ctx.font = GAME_FONT;
        ctx.fillText('Game over. Click here to play again.', pa.x + 10, pa.y + 15);

        if (assets.introImage) {
            ctx.drawImage(assets.introImage, 139, 39);
        }
    }

    drawScores(ctx) {
        const { timer, currBasket, player1, player2 } = this.game;
        const scoreHighlight = timer > 0 ? (currBasket === 1 ? 1 : currBasket === 2 ? 2 : 0) : 0;

        // Player 1 score (blue)
        ctx.fillStyle = scoreHighlight === 1 ? COLORS.gold : COLORS.blue;
        ctx.fillRect(48, 8, 100, 15);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(48.5, 8.5, 100, 15);

        // Player 2 score (green)
        ctx.fillStyle = scoreHighlight === 2 ? COLORS.gold : COLORS.green;
        ctx.fillRect(498, 8, 100, 15);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(498.5, 8.5, 100, 15);

        ctx.fillStyle = '#000';
        ctx.font = GAME_FONT;
        ctx.fillText(`Score: ${player1.score}`, 50, 20);
        ctx.fillText(`Score: ${player2.score}`, 500, 20);
    }

    drawGoldTimer(ctx) {
        const { settings, goldSpawned, startTime } = this.game;

        if (settings.goldBalls === 0 || goldSpawned) return;

        const elapsed = Date.now() - startTime;
        const duration = settings.duration * 1000;
        const percent = Math.min(elapsed / duration, 1.0);

        const midW = 325;
        const barWidth = 200;
        const len = Math.floor(barWidth * percent);

        // Yellow fill showing remaining time (shrinks as time passes, matching Java)
        ctx.fillStyle = COLORS.yellow;
        ctx.fillRect(midW - 100, 30, barWidth - len, 15);

        // Border
        ctx.strokeStyle = '#000';
        ctx.strokeRect(midW - 100 + 0.5, 30.5, barWidth, 15);

        // "time:" label
        ctx.fillStyle = '#000';
        ctx.font = GAME_FONT;
        ctx.fillText('time:', midW - 20, 43);
    }

    drawBorder(ctx) {
        ctx.strokeStyle = '#000';
        ctx.strokeRect(10.5, 30.5, 629, 369);
    }

    drawTitle(ctx) {
        ctx.fillStyle = '#000';
        ctx.font = GAME_FONT;
        ctx.fillText('Broomsticks by Paul Rajlich', 255, 20);
    }

    drawControls(ctx) {
        const { player1, settings } = this.game;

        ctx.fillStyle = '#000';
        ctx.font = GAME_FONT;

        if (player1.isRobot) {
            // Single player mode - only green player controls shown
            ctx.fillText('B to change background', 50, 415);
        } else {
            // Local multiplayer - show blue player controls
            ctx.fillText('W A S D and 1', 50, 415);
            ctx.fillText('B to change background', 200, 415);
        }

        const downKey = settings.dive ? ' DOWN' : '';
        ctx.fillText(`arrow-keys${downKey} and ENTER`, 470, 415);
    }

    drawSkill(ctx) {
        const { player1 } = this.game;

        ctx.fillStyle = 'white';
        ctx.fillRect(60, 405, 34, 10);
        ctx.fillStyle = 'red';
        ctx.fillRect(60, 405, 35 - player1.smart, 10);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(60.5, 405.5, 34, 10);
    }

    drawPauseIcon(ctx) {
        const pi = BUTTONS.PLAYING.pauseIcon;
        // Draw background
        ctx.fillStyle = '#888';
        ctx.fillRect(pi.x, pi.y, pi.w, pi.h);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(pi.x + 0.5, pi.y + 0.5, pi.w, pi.h);

        // Draw two vertical bars (classic pause symbol)
        ctx.fillStyle = '#000';
        ctx.fillRect(pi.x + 12, pi.y + 3, 2, 9);
        ctx.fillRect(pi.x + 18, pi.y + 3, 2, 9);
    }

    drawPauseScreen(ctx) {
        // Semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(OFFSET_X, OFFSET_Y, GAME_WIDTH, GAME_HEIGHT);

        const modalX = PAUSE_MODAL.x;
        const modalY = PAUSE_MODAL.y;

        // Modal background
        ctx.fillStyle = '#ddd';
        ctx.fillRect(modalX, modalY, PAUSE_MODAL.width, PAUSE_MODAL.height);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(modalX + 0.5, modalY + 0.5, PAUSE_MODAL.width, PAUSE_MODAL.height);

        ctx.fillStyle = '#000';
        ctx.font = GAME_FONT;

        if (this.game.hostPaused) {
            // Host paused modal - client cannot resume
            ctx.fillText('HOST PAUSED', modalX + 50, modalY + 30);
            ctx.fillStyle = '#666';
            ctx.fillText('Waiting for host...', modalX + 45, modalY + 55);

            // Only show "Exit to Menu" button (no Resume)
            const menuBtn = BUTTONS.PAUSED.returnToMenu;
            const menuX = modalX + menuBtn.x;
            const menuY = modalY + menuBtn.y;
            ctx.fillStyle = COLORS.green;
            ctx.fillRect(menuX, menuY, menuBtn.w, menuBtn.h);
            ctx.strokeStyle = '#000';
            ctx.strokeRect(menuX + 0.5, menuY + 0.5, menuBtn.w, menuBtn.h);
            ctx.fillStyle = '#000';
            ctx.fillText('Exit to Menu', menuX + 30, menuY + 17);
        } else {
            // Normal pause modal with Resume + Return to Menu
            ctx.fillText('PAUSED', modalX + 80, modalY + 30);

            // Resume button
            const resumeBtn = BUTTONS.PAUSED.resume;
            const resumeX = modalX + resumeBtn.x;
            const resumeY = modalY + resumeBtn.y;
            ctx.fillStyle = COLORS.green;
            ctx.fillRect(resumeX, resumeY, resumeBtn.w, resumeBtn.h);
            ctx.strokeStyle = '#000';
            ctx.strokeRect(resumeX + 0.5, resumeY + 0.5, resumeBtn.w, resumeBtn.h);
            ctx.fillStyle = '#000';
            ctx.fillText('Resume', resumeX + 25, resumeY + 17);

            // Return to Menu button
            const menuBtn = BUTTONS.PAUSED.returnToMenu;
            const menuX = modalX + menuBtn.x;
            const menuY = modalY + menuBtn.y;
            ctx.fillStyle = COLORS.green;
            ctx.fillRect(menuX, menuY, menuBtn.w, menuBtn.h);
            ctx.strokeStyle = '#000';
            ctx.strokeRect(menuX + 0.5, menuY + 0.5, menuBtn.w, menuBtn.h);
            ctx.fillStyle = '#000';
            ctx.fillText('Return to Menu', menuX + 30, menuY + 17);
        }
    }

    // Helper: draw standard green button
    drawButton(ctx, btn, text) {
        ctx.fillStyle = COLORS.green;
        ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(btn.x + 0.5, btn.y + 0.5, btn.w, btn.h);
        ctx.fillStyle = '#000';
        ctx.font = GAME_FONT;
        // Center text (round to integer pixels for crisp rendering)
        const textWidth = ctx.measureText(text).width;
        const textX = Math.round(btn.x + (btn.w - textWidth) / 2);
        const textY = Math.round(btn.y + btn.h / 2 + 5);
        ctx.fillText(text, textX, textY);
    }

    // Helper: draw toggle button (highlighted when selected)
    drawToggleButton(ctx, btn, text, selected) {
        ctx.fillStyle = selected ? COLORS.gold : '#ccc';
        ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(btn.x + 0.5, btn.y + 0.5, btn.w, btn.h);
        ctx.fillStyle = '#000';
        ctx.font = GAME_FONT;
        // Center text (round to integer pixels for crisp rendering)
        const textWidth = ctx.measureText(text).width;
        const textX = Math.round(btn.x + (btn.w - textWidth) / 2);
        const textY = Math.round(btn.y + btn.h / 2 + 5);
        ctx.fillText(text, textX, textY);
    }

    // Helper: draw back link (text link style)
    drawBackButton(ctx, btn, text = '← Back') {
        ctx.fillStyle = '#000';
        ctx.font = GAME_FONT;
        ctx.fillText(text, btn.x, btn.y + 15);
        // Underline
        const textWidth = ctx.measureText(text).width;
        ctx.fillRect(btn.x, btn.y + 18, textWidth, 1);
    }

    // Helper: draw debug hitbox outline (red rectangle)
    drawDebugHitbox(ctx, x, y, w, h) {
        if (!DEBUG_HITBOXES) return;
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, w, h);
    }
}
