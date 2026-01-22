// GameRenderer.js - All canvas drawing operations for Broomsticks

import {
    GameState,
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
    GAME_WIDTH,
    GAME_HEIGHT,
    OFFSET_X,
    OFFSET_Y,
    GROUND_Y,
    COLORS,
    GAME_FONT,
    GITHUB_URL,
    BUTTONS,
    PAUSE_MODAL,
    SETTINGS_LAYOUT
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
            case GameState.MODE_SELECT:
                this.drawModeSelectScreen(ctx);
                break;
            case GameState.SETTINGS:
                this.drawSettingsScreen(ctx);
                break;
            case GameState.RULES:
                this.drawRulesScreen(ctx);
                break;
            case GameState.READY:
                this.drawReadyScreen(ctx);
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

    drawModeSelectScreen(ctx) {
        const { assets } = this.game;
        const btns = BUTTONS.MODE_SELECT;

        // Single player button
        const sp = btns.singlePlayer;
        ctx.fillStyle = COLORS.green;
        ctx.fillRect(sp.x, sp.y, sp.w, sp.h);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(sp.x + 0.5, sp.y + 0.5, sp.w, sp.h);
        ctx.fillStyle = '#000';
        ctx.font = GAME_FONT;
        ctx.fillText('Click here for', sp.x + 20, sp.y + 20);
        ctx.fillText('single player', sp.x + 20, sp.y + 35);

        // Two player button
        const tp = btns.twoPlayer;
        ctx.fillStyle = COLORS.green;
        ctx.fillRect(tp.x, tp.y, tp.w, tp.h);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(tp.x + 0.5, tp.y + 0.5, tp.w, tp.h);
        ctx.fillStyle = '#000';
        ctx.fillText('Click here for', tp.x + 20, tp.y + 20);
        ctx.fillText('two player', tp.x + 20, tp.y + 35);

        // Guestbook button
        const gb = btns.guestbook;
        ctx.fillStyle = COLORS.green;
        ctx.fillRect(gb.x, gb.y, gb.w, gb.h);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(gb.x + 0.5, gb.y + 0.5, gb.w, gb.h);
        ctx.fillStyle = '#000';
        ctx.fillText('Visit the Guestbook', gb.x + 50, gb.y + 20);

        // Attribution text (centered)
        ctx.fillText('A game by Paul Rajlich (2000-2011), port by Jameson Hodge (2026)', 149, 310);

        // GitHub link (underlined text)
        const gh = btns.github;
        ctx.fillText('View Source on GitHub', gh.x, gh.y + 13);
        ctx.fillStyle = '#000';
        ctx.fillRect(gh.x, gh.y + 16, gh.w, 1);

        // Intro image
        if (assets.introImage) {
            ctx.drawImage(assets.introImage, 139, 39);
        }
    }

    drawSettingsScreen(ctx) {
        const { assets, settings, settingsOptions } = this.game;
        const { left, right, startY, lineHeight } = SETTINGS_LAYOUT;

        ctx.fillStyle = '#000';
        ctx.font = GAME_FONT;

        // Intro image
        if (assets.introImage) {
            ctx.drawImage(assets.introImage, 139, 19);
        }

        // Title
        ctx.fillText('SETTINGS', 280, 140);

        // Left column
        ctx.fillText(`Diving: ${settings.dive ? 'Yes' : 'No'}`, left.textX, startY);
        ctx.fillText(`Acceleration: ${settings.accel}`, left.textX, startY + lineHeight);
        ctx.fillText(`Max speed: ${settings.maxSpeed}`, left.textX, startY + lineHeight * 2);
        ctx.fillText(`Red balls: ${settings.redBalls}`, left.textX, startY + lineHeight * 3);
        ctx.fillText(`Black balls: ${settings.blackBalls}`, left.textX, startY + lineHeight * 4);
        ctx.fillText(`Gold balls: ${settings.goldBalls}`, left.textX, startY + lineHeight * 5);

        // Right column
        ctx.fillText(`Gold points: < ${settings.goldPoints} >`, right.textX, startY);
        ctx.fillText(`Seconds to gold: < ${settings.duration} >`, right.textX, startY + lineHeight);
        ctx.fillText(`Score to win: < ${settings.winScore} >`, right.textX, startY + lineHeight * 2);
        ctx.fillText(`Sound: ${settings.sound ? 'On' : 'Off'}`, right.textX, startY + lineHeight * 3);

        // Player sprite setting
        const playerOption = settingsOptions.playerImg.find(p => p.value === settings.playerImg);
        const playerLabel = playerOption ? playerOption.label : 'Default';
        ctx.fillText(`Player: < ${playerLabel} >`, right.textX, startY + lineHeight * 4);

        // Background setting
        const bgOption = settingsOptions.bgImg.find(b => b.value === settings.bgImg);
        const bgLabel = bgOption ? bgOption.label : 'Sky 1';
        ctx.fillText(`Background: < ${bgLabel} >`, right.textX, startY + lineHeight * 5);

        // Continue button
        const cont = BUTTONS.SETTINGS.continueBtn;
        ctx.fillStyle = COLORS.green;
        ctx.fillRect(cont.x, cont.y, cont.w, cont.h);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(cont.x + 0.5, cont.y + 0.5, cont.w, cont.h);
        ctx.fillStyle = '#000';
        ctx.fillText('Click here to continue.', cont.x + 45, cont.y + 17);

        // Instructions
        ctx.fillText('Click on settings to change them.', 210, 330);
    }

    drawRulesScreen(ctx) {
        const { assets, settings } = this.game;
        const cont = BUTTONS.RULES.continueBtn;

        // Continue button
        ctx.fillStyle = COLORS.green;
        ctx.fillRect(cont.x, cont.y, cont.w, cont.h);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(cont.x + 0.5, cont.y + 0.5, cont.w, cont.h);
        ctx.fillStyle = '#000';
        ctx.font = GAME_FONT;
        ctx.fillText('Click here to continue.', cont.x + 45, cont.y + 15);

        // Rules
        ctx.fillText('The rules of the game are:', 139, 209);
        ctx.fillText('1. When two players collide, the player that is lower is bumped.', 139, 229);
        ctx.fillText('2. When a player collides with a black ball, the player is bumped.', 139, 244);
        ctx.fillText('3. When a player gets close to the red ball, the player catches the ball.', 139, 259);
        ctx.fillText('4. When a player puts the red ball in the opponent\'s hoop, 10 points are scored.', 139, 274);
        ctx.fillText(`5. First player to score ${settings.winScore} points wins.`, 139, 289);

        if (settings.goldBalls > 0) {
            ctx.fillText(`6. Gold ball appears after ${settings.duration}s - worth ${settings.goldPoints} points!`, 139, 304);
        }

        ctx.fillText('Have fun! If you haven\'t played against a friend, you haven\'t played! :-)', 139, 334);

        if (assets.introImage) {
            ctx.drawImage(assets.introImage, 139, 39);
        }
    }

    drawReadyScreen(ctx) {
        const { assets, settings, player1 } = this.game;
        const start = BUTTONS.READY.startBtn;

        // Start button
        ctx.fillStyle = COLORS.green;
        ctx.fillRect(start.x, start.y, start.w, start.h);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(start.x + 0.5, start.y + 0.5, start.w, start.h);
        ctx.fillStyle = '#000';
        ctx.font = GAME_FONT;
        ctx.fillText('Click here to start.', start.x + 60, start.y + 15);

        // Instructions
        ctx.fillText('It\'s easier to just click on the keys rather than hold them down.', 139, 299);
        ctx.fillText('Click on your up key several times to start flying.', 174, 314);

        if (!player1.isRobot) {
            ctx.fillText('Blue Player', 89, 209);
            ctx.fillText('use E, S, F keys', 89, 229);
            if (settings.dive) {
                ctx.fillText('use D to dive', 89, 244);
                ctx.fillText('use 1 to switch player', 89, 259);
            } else {
                ctx.fillText('use 1 to switch player', 89, 244);
            }
        } else {
            ctx.fillText('Computer Player', 89, 209);
            ctx.fillText('use S and F to adjust skill', 89, 229);
        }

        ctx.fillText('Green Player', 389, 209);
        ctx.fillText('use arrow keys', 389, 229);
        if (settings.dive) {
            ctx.fillText('use DOWN to dive', 389, 244);
            ctx.fillText('use ENTER to switch player', 389, 259);
        } else {
            ctx.fillText('use ENTER to switch player', 389, 244);
        }

        if (assets.introImage) {
            ctx.drawImage(assets.introImage, 139, 39);
        }
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

        // iOS app text
        ctx.fillText('NEW! Get Broomsticks for the iphone/ipad!', 214, 224);
        ctx.fillText('Search for Broomsticks on the app store', 214, 239);

        // Full version link text and button
        ctx.fillText('Like this game? Get the full version here!:', 214, 309);
        const ws = btns.website;
        ctx.fillStyle = COLORS.green;
        ctx.fillRect(ws.x, ws.y, ws.w, ws.h);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(ws.x + 0.5, ws.y + 0.5, ws.w, ws.h);
        ctx.fillStyle = '#000';
        ctx.fillText('http://www.visbox.com/broomsticks/', ws.x + 15, ws.y + 15);

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
            ctx.fillText('skill:', 30, 415);
            this.drawSkill(ctx);
            ctx.fillText('S and F', 100, 415);
            ctx.fillText('P for two-player, B to change background', 200, 415);
        } else {
            const diveKey = settings.dive ? ' D' : '';
            ctx.fillText(`E S F${diveKey} and 1`, 50, 415);
            ctx.fillText('P for single-player, B to change background', 200, 415);
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
}
