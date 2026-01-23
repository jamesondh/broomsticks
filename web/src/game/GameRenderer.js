// GameRenderer.js - All canvas drawing operations for Broomsticks

import {
    GameState,
    GameMode,
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
            ctx.fillText('Difficulty:', 180, 167);
            this.drawToggleButton(ctx, btns.diffEasy, 'Easy', aiDifficulty === AIDifficulty.EASY);
            this.drawToggleButton(ctx, btns.diffMedium, 'Medium', aiDifficulty === AIDifficulty.MEDIUM);
            this.drawToggleButton(ctx, btns.diffHard, 'Hard', aiDifficulty === AIDifficulty.HARD);
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
        const { settings, settingsOptions } = this.game;
        const { startX, startY, colWidth, lineHeight, rowHeight, rows, cols } = PREGAME_SETTINGS_LAYOUT;

        ctx.fillStyle = '#000';
        ctx.font = GAME_FONT;

        // Row 0
        ctx.fillText(`Diving: ${settings.dive ? 'Yes' : 'No'}`, startX, startY);
        ctx.fillText(`Accel: ${settings.accel}`, startX + colWidth, startY);
        ctx.fillText(`MaxSpd: ${settings.maxSpeed}`, startX + colWidth * 2, startY);
        ctx.fillText(`Sound: ${settings.sound ? 'On' : 'Off'}`, startX + colWidth * 3, startY);

        // Row 1
        ctx.fillText(`Red: ${settings.redBalls}`, startX, startY + lineHeight);
        ctx.fillText(`Black: ${settings.blackBalls}`, startX + colWidth, startY + lineHeight);
        ctx.fillText(`Gold: ${settings.goldBalls}`, startX + colWidth * 2, startY + lineHeight);
        ctx.fillText(`GoldPts: < ${settings.goldPoints} >`, startX + colWidth * 3, startY + lineHeight);

        // Row 2
        ctx.fillText(`Time: < ${settings.duration} >`, startX, startY + lineHeight * 2);
        ctx.fillText(`Win: < ${settings.winScore} >`, startX + colWidth, startY + lineHeight * 2);

        const playerOption = settingsOptions.playerImg.find(p => p.value === settings.playerImg);
        const playerLabel = playerOption ? playerOption.label : 'Default';
        ctx.fillText(`< ${playerLabel} >`, startX + colWidth * 2, startY + lineHeight * 2);

        const bgOption = settingsOptions.bgImg.find(b => b.value === settings.bgImg);
        const bgLabel = bgOption ? bgOption.label : 'Sky 1';
        ctx.fillText(`< ${bgLabel} >`, startX + colWidth * 3, startY + lineHeight * 2);

        // Debug hitboxes for settings grid
        if (DEBUG_HITBOXES) {
            const { grid, twoWayHitboxes } = PREGAME_SETTINGS_LAYOUT;
            // Settings that use left/right arrow controls (range and list types)
            const twoWaySettings = ['goldPoints', 'duration', 'winScore', 'playerImg', 'bgImg'];

            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    const cellX = startX + col * colWidth;
                    const cellY = startY - rowHeight + row * lineHeight;
                    const settingKey = grid[row][col];

                    if (twoWaySettings.includes(settingKey)) {
                        // Draw hitboxes for the actual < and > arrow positions
                        const hitbox = twoWayHitboxes[settingKey];
                        const leftWidth = hitbox.leftEnd - hitbox.leftStart;
                        const rightWidth = hitbox.rightEnd - hitbox.rightStart;
                        this.drawDebugHitbox(ctx, cellX + hitbox.leftStart, cellY, leftWidth, rowHeight);
                        this.drawDebugHitbox(ctx, cellX + hitbox.rightStart, cellY, rightWidth, rowHeight);
                    } else {
                        // Draw single rectangle for cycle settings
                        this.drawDebugHitbox(ctx, cellX, cellY, colWidth, rowHeight);
                    }
                }
            }
        }
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
        ctx.fillText('ONLINE', 285, 160);

        // Quick Match button
        this.drawButton(ctx, btns.quickMatch, 'Quick Match');

        // Private Room button
        this.drawButton(ctx, btns.privateRoom, 'Private Room');

        // Back link
        this.drawBackButton(ctx, btns.back);

        // Coming soon notice
        ctx.fillStyle = '#666';
        ctx.fillText('(Coming in Phase 3)', 260, 330);
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
        ctx.fillText('PRIVATE ROOM', 255, 160);

        // Create Room button
        this.drawButton(ctx, btns.createRoom, 'Create Room');

        // Join Room button
        this.drawButton(ctx, btns.joinRoom, 'Join Room');

        // Back link
        this.drawBackButton(ctx, btns.back);

        // Mock notice
        ctx.fillStyle = '#666';
        ctx.fillText('(Mock UI - Phase 3)', 260, 330);
    }

    drawLobby(ctx) {
        const { assets } = this.game;
        const btns = BUTTONS.LOBBY;

        ctx.fillStyle = '#000';
        ctx.font = GAME_FONT;

        // Intro image
        if (assets.introImage) {
            ctx.drawImage(assets.introImage, 139, 39);
        }

        // Title
        ctx.fillText('LOBBY', 290, 160);

        // Mock room code
        ctx.fillText('Room Code: ABCD-1234', 245, 195);

        // Players list
        ctx.fillText('Players:', 280, 225);
        ctx.fillText('• You (Host)', 260, 245);

        // Start button (disabled look for mock)
        const start = btns.start;
        ctx.fillStyle = '#888';
        ctx.fillRect(start.x, start.y, start.w, start.h);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(start.x + 0.5, start.y + 0.5, start.w, start.h);
        ctx.fillStyle = '#000';
        ctx.fillText('Start', start.x + 30, start.y + 20);

        // Leave link
        this.drawBackButton(ctx, btns.leave, 'Leave');

        // Mock notice
        ctx.fillStyle = '#666';
        ctx.fillText('(Mock UI - Phase 3)', 260, 340);
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
        ctx.fillText('CONTROLS', 275, 140);

        // Instructions
        ctx.fillText('It\'s easier to just click on the keys rather than hold them down.', 139, 169);
        ctx.fillText('Click on your up key several times to start flying.', 174, 189);

        // Blue player controls
        ctx.fillText('Blue Player', 89, 219);
        ctx.fillText('use E, S, F keys', 89, 239);
        if (settings.dive) {
            ctx.fillText('use D to dive', 89, 254);
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

        // Draw players
        for (const player of players) {
            player.draw(ctx);
        }

        // Draw balls
        for (const ball of balls) {
            ball.draw(ctx);
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
            const diveKey = settings.dive ? ' D' : '';
            ctx.fillText(`E S F${diveKey} and 1`, 50, 415);
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

        // "PAUSED" title
        ctx.fillStyle = '#000';
        ctx.font = GAME_FONT;
        ctx.fillText('PAUSED', modalX + 70, modalY + 30);

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
        ctx.fillText('Return to Menu', menuX + 25, menuY + 17);
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
