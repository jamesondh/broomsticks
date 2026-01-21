// Game.js - Main game class
// Ported from BroomstickApplet.java

import { Ball } from './Ball.js';
import { Person } from './Person.js';

// Game states
export const GameState = {
    LOADING: 'loading',
    MODE_SELECT: 'mode_select',
    RULES: 'rules',
    READY: 'ready',
    PLAYING: 'playing',
    GAME_OVER: 'game_over'
};

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Original website URL
        this.websiteUrl = 'https://www.visbox.com/broomsticks/';

        // Colors (matching original)
        this.blue = '#0080ff';
        this.green = '#00a400';
        this.sky = '#d7d7ff';
        this.yellow = '#808000';
        this.gold = '#ffff00';

        // Image assets
        this.playerImages = null;     // [10][2][2] array
        this.ballImages = null;       // [2] array
        this.basketImage = null;
        this.basketHImage = null;
        this.introImage = null;
        this.backImage = null;
        this.fieldImage = null;

        // Game state
        this.state = GameState.LOADING;
        this.backToggle = false;
        this.currBasket = 0;
        this.timer = 0;

        // Game objects
        this.ball1 = null;
        this.ball2 = null;
        this.redball = null;
        this.player1 = null;
        this.player2 = null;

        // Input state
        this.keysPressed = new Set();

        // Offscreen buffer for double buffering
        this.offCanvas = document.createElement('canvas');
        this.offCanvas.width = 628;
        this.offCanvas.height = 368;
        this.offCtx = this.offCanvas.getContext('2d');

        // Bind methods
        this.gameLoop = this.gameLoop.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handleClick = this.handleClick.bind(this);

        this.lastUpdateTime = 0;
        this.running = false;
        this.updateInterval = 30; // 30ms per update, matching original Java
    }

    async init() {
        console.log('\n');
        console.log('---=== Broomsticks HTML5 Port ===---');
        console.log('    Original by Paul Rajlich (c) 2000-2011\n');

        // Set up event listeners
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
        this.canvas.addEventListener('click', this.handleClick);

        // Load assets
        await this.loadAssets();

        // Initialize game objects
        this.initGameObjects();

        // Start game loop
        this.running = true;
        this.state = GameState.MODE_SELECT;
        requestAnimationFrame(this.gameLoop);
    }

    async loadAssets() {
        console.log('Loading assets...');

        const loadImage = (src) => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = () => {
                    console.warn(`Failed to load: ${src}`);
                    resolve(null);
                };
                img.src = src;
            });
        };

        // Load main sprite sheets
        const [playersImg, itemsImg, introImg, backImg, fieldImg] = await Promise.all([
            loadImage('images/players.gif'),
            loadImage('images/items.gif'),
            loadImage('images/intro.gif'),
            loadImage('images/sky1.jpg'),
            loadImage('images/field.jpg')
        ]);

        this.introImage = introImg;
        this.backImage = backImg;
        this.fieldImage = fieldImg;

        // Extract player sprites from sprite sheet
        if (playersImg) {
            this.playerImages = this.extractPlayerSprites(playersImg);
        }

        // Extract ball and basket sprites from items
        if (itemsImg) {
            this.ballImages = this.extractBallSprites(itemsImg);
            this.extractBasketSprites(itemsImg);
        }

        console.log('Assets loaded');
    }

    extractPlayerSprites(playersImg) {
        // [10 models][2 vertical states][2 horizontal directions]
        const sprites = [];

        for (let model = 0; model < 10; model++) {
            sprites[model] = [];
            for (let vState = 0; vState < 2; vState++) {
                sprites[model][vState] = [];
                for (let hDir = 0; hDir < 2; hDir++) {
                    const canvas = document.createElement('canvas');
                    canvas.width = 39;
                    canvas.height = 39;
                    const ctx = canvas.getContext('2d');

                    // Calculate source position from sprite sheet
                    // Models 0-4: columns 0-159
                    // Models 5-9: columns 160-319
                    let sx, sy;
                    if (model < 5) {
                        sx = vState * 80 + hDir * 40 + 1;
                        sy = model * 40 + 41;
                    } else {
                        sx = vState * 80 + hDir * 40 + 161;
                        sy = (model - 5) * 40 + 41;
                    }

                    ctx.drawImage(playersImg, sx, sy, 39, 39, 0, 0, 39, 39);
                    sprites[model][vState][hDir] = canvas;
                }
            }
        }

        return sprites;
    }

    extractBallSprites(itemsImg) {
        const balls = [];

        for (let i = 0; i < 2; i++) {
            const canvas = document.createElement('canvas');
            canvas.width = 39;
            canvas.height = 39;
            const ctx = canvas.getContext('2d');

            // Ball sprites at (1, 41) and (1, 81)
            ctx.drawImage(itemsImg, 1, (i + 1) * 40 + 1, 39, 39, 0, 0, 39, 39);
            balls[i] = canvas;
        }

        return balls;
    }

    extractBasketSprites(itemsImg) {
        // Regular basket at (1, 121)
        const basketCanvas = document.createElement('canvas');
        basketCanvas.width = 39;
        basketCanvas.height = 39;
        const basketCtx = basketCanvas.getContext('2d');
        basketCtx.drawImage(itemsImg, 1, 121, 39, 39, 0, 0, 39, 39);
        this.basketImage = basketCanvas;

        // Highlighted basket at (41, 121)
        const basketHCanvas = document.createElement('canvas');
        basketHCanvas.width = 39;
        basketHCanvas.height = 39;
        const basketHCtx = basketHCanvas.getContext('2d');
        basketHCtx.drawImage(itemsImg, 41, 121, 39, 39, 0, 0, 39, 39);
        this.basketHImage = basketHCanvas;
    }

    initGameObjects() {
        // Create black balls
        this.ball1 = new Ball(this, 0, 325, 200);
        this.ball2 = new Ball(this, 0, 325, 300);
        this.ball1.speedFactor = 1.5;
        this.ball2.speedFactor = 1.5;

        // Create red ball
        this.redball = new Ball(this, 1, 325, 100);

        // Create players
        this.player1 = new Person(this.redball, this, 1, 100, 200);
        this.player2 = new Person(this.redball, this, 4, 520, 200);
        this.player2.side = 1;

        this.currBasket = 0;
    }

    handleKeyDown(e) {
        const key = e.key;
        const code = e.code;

        // Prevent default for game keys
        if (['ArrowUp', 'ArrowLeft', 'ArrowRight', 'Enter', 'e', 'E', 's', 'S', 'f', 'F', '1', 'b', 'B', 'p', 'P'].includes(key) ||
            ['ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(code)) {
            e.preventDefault();
        }

        // Avoid key repeat
        if (this.keysPressed.has(code)) {
            return;
        }
        this.keysPressed.add(code);

        // B key: toggle background
        if (key === 'b' || key === 'B') {
            this.backToggle = !this.backToggle;
        }

        // P key: toggle single/two player
        if (key === 'p' || key === 'P') {
            this.player1.isRobot = !this.player1.isRobot;
            if (!this.player1.isRobot) {
                this.player1.velocityX = 0;
            }
        }

        // Player 2 controls (arrow keys)
        if (code === 'ArrowLeft') {
            this.player2.left();
        }
        if (code === 'ArrowRight') {
            this.player2.right();
        }
        if (code === 'ArrowUp') {
            this.player2.up();
        }
        if (key === 'Enter') {
            this.player2.switchModel();
        }

        // Player 1 controls (only if not AI)
        if (!this.player1.isRobot) {
            if (key === 'e' || key === 'E') {
                this.player1.up();
            }
            if (key === 's' || key === 'S') {
                this.player1.left();
            }
            if (key === 'f' || key === 'F') {
                this.player1.right();
            }
            if (key === '1') {
                this.player1.switchModel();
            }
        }

        // AI skill adjustment (only in single player mode)
        if (this.player1.isRobot) {
            if (key === 's' || key === 'S') {
                this.player1.dumber();
            }
            if (key === 'f' || key === 'F') {
                this.player1.smarter();
            }
        }
    }

    handleKeyUp(e) {
        this.keysPressed.delete(e.code);
    }

    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        switch (this.state) {
            case GameState.MODE_SELECT:
                // Single player button
                if (x > 150 && x < 270 && y > 205 && y < 255) {
                    this.player1.isRobot = true;
                    this.state = GameState.RULES;
                }
                // Two player button
                if (x > 400 && x < 520 && y > 205 && y < 255) {
                    this.player1.isRobot = false;
                    this.state = GameState.RULES;
                }
                // Website link button (original: 175-500, 310-340)
                if (x > 186 && x < 506 && y > 341 && y < 371) {
                    this.openWebsite();
                }
                break;

            case GameState.RULES:
                // Continue button
                if (x > 215 && x < 445 && y > 165 && y < 185) {
                    this.state = GameState.READY;
                }
                break;

            case GameState.READY:
                // Start button
                if (x > 215 && x < 445 && y > 165 && y < 185) {
                    this.state = GameState.PLAYING;
                    this.player1.score = 0;
                    this.player2.score = 0;
                }
                break;

            case GameState.GAME_OVER:
                // Play again button
                if (x > 215 && x < 445 && y > 165 && y < 185) {
                    this.state = GameState.MODE_SELECT;
                    this.resetGameObjects();
                }
                // Website link button (original: 225-450, 350-370)
                if (x > 236 && x < 461 && y > 381 && y < 401) {
                    this.openWebsite();
                }
                break;
        }
    }

    resetGameObjects() {
        this.player1.x = 100;
        this.player1.y = 200;
        this.player1.velocityX = 0;
        this.player1.velocityY = 0;
        this.player1.score = 0;

        this.player2.x = 520;
        this.player2.y = 200;
        this.player2.velocityX = 0;
        this.player2.velocityY = 0;
        this.player2.score = 0;

        this.ball1.x = 325;
        this.ball1.y = 200;
        this.ball2.x = 325;
        this.ball2.y = 300;
        this.redball.x = 325;
        this.redball.y = 100;

        this.currBasket = 0;
    }

    openWebsite() {
        // Opens the official Broomsticks website in a new tab
        window.open(this.websiteUrl, '_blank');
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
            // This matches the original Java timing of ~33fps
            if (elapsed >= this.updateInterval) {
                this.checkCollisions();
                this.checkCaught();
                this.moveFlyers();

                if (this.timer > 0) {
                    this.timer--;
                }

                this.lastUpdateTime = timestamp;
            }
        } else {
            // For non-playing states, just track time
            this.lastUpdateTime = timestamp;
        }

        this.render();

        // Use requestAnimationFrame directly for smooth rendering
        // Game logic is throttled above to 30ms intervals
        requestAnimationFrame(this.gameLoop);
    }

    moveFlyers() {
        this.player1.move();
        this.player2.move();
        this.ball1.move();
        this.ball2.move();
        this.redball.move();
    }

    checkCaught() {
        const person = this.player1;
        const person2 = this.player2;
        const ball = this.redball;

        this.currBasket = 0;

        // Player 1 catching ball
        let dx = person.x + 8 - ball.x;
        let dy = person.y + 8 - ball.y;

        if (Math.abs(dx) < 20 && Math.abs(dy) < 20) {
            // Player 1 is holding the ball
            ball.x = person.velocityX > 0 ? person.x + 18 : person.x + 8;
            ball.y = person.y + 15;
            this.currBasket = 1;

            // Check if scoring (at right basket)
            if (person.x > 633 - person.w) {
                dy = ball.y - 200;
                if (Math.abs(dy) < 15) {
                    person.score += 10;
                    this.timer = 15;
                    ball.x = 325;
                    if (person.score >= 50) {
                        this.gameOver();
                    }
                }
            }
        }

        // Player 2 catching ball
        dx = person2.x + 8 - ball.x;
        dy = person2.y + 8 - ball.y;

        if (Math.abs(dx) < 20 && Math.abs(dy) < 20) {
            // Player 2 is holding the ball
            ball.x = person2.velocityX > 0 ? person2.x + 18 : person2.x + 8;
            ball.y = person2.y + 15;
            this.currBasket = 2;

            // Check if scoring (at left basket)
            if (person2.x < 17) {
                dy = ball.y - 200;
                if (Math.abs(dy) < 15) {
                    person2.score += 10;
                    this.timer = 15;
                    ball.x = 325;
                    if (person2.score >= 50) {
                        this.gameOver();
                    }
                }
            }
        }
    }

    checkCollisions() {
        const person = this.player1;
        const person2 = this.player2;
        const ball = this.ball1;
        const ball2 = this.ball2;

        // Player vs player collision
        let dx = person.x - person2.x;
        let dy = person.y - person2.y;

        if (Math.abs(dx) < person.w - 4 && Math.abs(dy) < person.h - 4) {
            // Lower player bumps higher player
            if (person.y < person2.y) {
                person2.y = 1000;
            } else if (person2.y < person.y) {
                person.y = 1000;
            }
        }

        // Player 1 vs black ball 1
        dx = person.x + 8 - ball.x;
        dy = person.y + 8 - ball.y;
        if (Math.abs(dx) < 20 && Math.abs(dy) < 20) {
            person.y = 1000;
        }

        // Player 2 vs black ball 1
        dx = person2.x + 8 - ball.x;
        dy = person2.y + 8 - ball.y;
        if (Math.abs(dx) < 20 && Math.abs(dy) < 20) {
            person2.y = 1000;
        }

        // Player 1 vs black ball 2
        dx = person.x + 8 - ball2.x;
        dy = person.y + 8 - ball2.y;
        if (Math.abs(dx) < 20 && Math.abs(dy) < 20) {
            person.y = 1000;
        }

        // Player 2 vs black ball 2
        dx = person2.x + 8 - ball2.x;
        dy = person2.y + 8 - ball2.y;
        if (Math.abs(dx) < 20 && Math.abs(dy) < 20) {
            person2.y = 1000;
        }
    }

    gameOver() {
        this.state = GameState.GAME_OVER;
        this.resetGameObjects();
    }

    render() {
        const ctx = this.ctx;

        // Clear canvas
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 650, 430);

        // Draw the off-screen buffer content
        this.renderOffscreen();
        ctx.drawImage(this.offCanvas, 11, 31);

        // Draw UI elements
        this.drawScores(ctx);
        this.drawBorder(ctx);
        this.drawTitle(ctx);

        if (this.state === GameState.PLAYING) {
            this.drawControls(ctx);
        }
    }

    renderOffscreen() {
        const ctx = this.offCtx;

        // Draw background
        // Original Java: if (this.backToggle || !this.started)
        // Show image background when toggle is on OR when not in active gameplay
        const showImageBackground = this.backToggle || this.state !== GameState.PLAYING;

        if (showImageBackground && this.backImage) {
            ctx.drawImage(this.backImage, 0, 0);
            if (this.fieldImage) {
                ctx.drawImage(this.fieldImage, 0, 343);
            }
        } else {
            // Solid color background
            ctx.fillStyle = this.sky;
            ctx.fillRect(0, 0, 628, 343);
            ctx.fillStyle = this.green;
            ctx.fillRect(0, 343, 628, 25);
            ctx.strokeStyle = '#000';
            ctx.beginPath();
            ctx.moveTo(0, 343);
            ctx.lineTo(628, 343);
            ctx.stroke();
            // Corner lines
            ctx.beginPath();
            ctx.moveTo(30, 343);
            ctx.lineTo(0, 368);
            ctx.moveTo(598, 343);
            ctx.lineTo(628, 368);
            ctx.stroke();
        }

        // Draw baskets
        this.drawBaskets(ctx);

        // Draw game scene
        this.drawScene(ctx);
    }

    drawBaskets(ctx) {
        // Left basket
        const leftBasket = this.currBasket === 2 ? this.basketHImage : this.basketImage;
        const leftPoleColor = this.currBasket === 2 ? this.gold : this.yellow;

        if (leftBasket) {
            ctx.drawImage(leftBasket, 10, 159);
        }
        ctx.strokeStyle = '#000';
        ctx.strokeRect(17, 198, 3, 160);
        ctx.fillStyle = leftPoleColor;
        ctx.fillRect(18, 198, 2, 160);

        // Right basket
        const rightBasket = this.currBasket === 1 ? this.basketHImage : this.basketImage;
        const rightPoleColor = this.currBasket === 1 ? this.gold : this.yellow;

        if (rightBasket) {
            ctx.drawImage(rightBasket, 598, 159);
        }
        ctx.strokeStyle = '#000';
        ctx.strokeRect(605, 198, 3, 160);
        ctx.fillStyle = rightPoleColor;
        ctx.fillRect(606, 198, 2, 160);
    }

    drawScene(ctx) {
        switch (this.state) {
            case GameState.LOADING:
                this.drawLoadingScreen(ctx);
                break;
            case GameState.MODE_SELECT:
                this.drawModeSelectScreen(ctx);
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
            case GameState.GAME_OVER:
                this.drawGameOverScreen(ctx);
                break;
        }
    }

    drawLoadingScreen(ctx) {
        ctx.fillStyle = '#000';
        ctx.font = '12px Helvetica, Arial, sans-serif';
        ctx.fillText('Loading images, please wait...', 239, 169);
        if (this.introImage) {
            ctx.drawImage(this.introImage, 139, 59);
        }
    }

    drawModeSelectScreen(ctx) {
        // Single player button
        ctx.fillStyle = this.green;
        ctx.fillRect(139, 174, 120, 50);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(139, 174, 120, 50);
        ctx.fillStyle = '#000';
        ctx.font = '12px Helvetica, Arial, sans-serif';
        ctx.fillText('Click here for', 159, 194);
        ctx.fillText('single player', 159, 209);

        // Two player button
        ctx.fillStyle = this.green;
        ctx.fillRect(389, 174, 120, 50);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(389, 174, 120, 50);
        ctx.fillStyle = '#000';
        ctx.fillText('Click here for', 409, 194);
        ctx.fillText('two player', 409, 209);

        // Guestbook text (original: "Visit my guestbook by clicking below!")
        ctx.fillText('Visit my guestbook by clicking below!', 209, 269);

        // Website link button (original: 175, 310, 320x30)
        ctx.fillStyle = this.green;
        ctx.fillRect(164, 279, 320, 30);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(164, 279, 320, 30);
        ctx.fillStyle = '#000';
        ctx.fillText('Official Website: http://www.visbox.com/broomsticks/', 179, 299);

        // Copyright
        ctx.fillText('Copyright (c) 2000-2011 Paul Rajlich, all rights reserved.', 179, 334);

        // Intro image
        if (this.introImage) {
            ctx.drawImage(this.introImage, 139, 39);
        }
    }

    drawRulesScreen(ctx) {
        // Continue button
        ctx.fillStyle = this.green;
        ctx.fillRect(204, 134, 230, 20);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(204, 134, 230, 20);
        ctx.fillStyle = '#000';
        ctx.font = '12px Helvetica, Arial, sans-serif';
        ctx.fillText('Click here to continue.', 249, 149);

        // Rules
        ctx.fillText('The rules of the game are:', 139, 209);
        ctx.fillText('1. When two players collide, the player that is lower is bumped.', 139, 229);
        ctx.fillText('2. When a player collides with a black ball, the player is bumped.', 139, 244);
        ctx.fillText('3. When a player gets close to the red ball, the player catches the ball.', 139, 259);
        ctx.fillText('4. When a player puts the red ball in the opponent\'s hoop, 10 points are scored.', 139, 274);
        ctx.fillText('5. First player to score 50 points wins.', 139, 289);
        ctx.fillText('Have fun! If you haven\'t played against a friend, you haven\'t played! :-)', 139, 319);

        if (this.introImage) {
            ctx.drawImage(this.introImage, 139, 39);
        }
    }

    drawReadyScreen(ctx) {
        // Start button
        ctx.fillStyle = this.green;
        ctx.fillRect(204, 134, 230, 20);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(204, 134, 230, 20);
        ctx.fillStyle = '#000';
        ctx.font = '12px Helvetica, Arial, sans-serif';
        ctx.fillText('Click here to start.', 264, 149);

        // Instructions
        ctx.fillText('It\'s easier to just click on the keys rather than hold them down.', 139, 299);
        ctx.fillText('Click on your up key several times to start flying.', 174, 314);

        if (!this.player1.isRobot) {
            ctx.fillText('Blue Player', 89, 209);
            ctx.fillText('use E, S, F keys', 89, 229);
            ctx.fillText('use 1 to switch player', 89, 244);
        } else {
            ctx.fillText('Computer Player', 89, 209);
            ctx.fillText('use S and F to adjust skill', 89, 229);
        }

        ctx.fillText('Green Player', 389, 209);
        ctx.fillText('use arrow keys', 389, 229);
        ctx.fillText('use ENTER to switch player', 389, 244);

        if (this.introImage) {
            ctx.drawImage(this.introImage, 139, 39);
        }
    }

    drawGameplay(ctx) {
        // Draw players
        this.player1.draw(ctx);
        this.player2.draw(ctx);

        // Draw balls
        this.ball1.draw(ctx);
        this.ball2.draw(ctx);
        this.redball.draw(ctx);
    }

    drawGameOverScreen(ctx) {
        // Play again button
        ctx.fillStyle = this.green;
        ctx.fillRect(204, 134, 230, 20);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(204, 134, 230, 20);
        ctx.fillStyle = '#000';
        ctx.font = '12px Helvetica, Arial, sans-serif';
        ctx.fillText('Game over. Click here to play again.', 214, 149);

        // iOS app text (from original)
        ctx.fillText('NEW! Get Broomsticks for the iphone/ipad!', 214, 224);
        ctx.fillText('Search for Broomsticks on the app store', 214, 239);

        // Full version link text and button
        ctx.fillText('Like this game? Get the full version here!:', 214, 309);
        ctx.fillStyle = this.green;
        ctx.fillRect(214, 319, 225, 20);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(214, 319, 225, 20);
        ctx.fillStyle = '#000';
        ctx.fillText('http://www.visbox.com/broomsticks/', 229, 334);

        if (this.introImage) {
            ctx.drawImage(this.introImage, 139, 39);
        }
    }

    drawScores(ctx) {
        const scoreHighlight = this.timer > 0 ? (this.currBasket === 1 ? 1 : this.currBasket === 2 ? 2 : 0) : 0;

        // Player 1 score (blue)
        ctx.fillStyle = scoreHighlight === 1 ? this.gold : this.blue;
        ctx.fillRect(48, 8, 100, 15);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(48, 8, 100, 15);

        // Player 2 score (green)
        ctx.fillStyle = scoreHighlight === 2 ? this.gold : this.green;
        ctx.fillRect(498, 8, 100, 15);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(498, 8, 100, 15);

        ctx.fillStyle = '#000';
        ctx.font = '12px Helvetica, Arial, sans-serif';
        ctx.fillText(`Score: ${this.player1.score}`, 50, 20);
        ctx.fillText(`Score: ${this.player2.score}`, 500, 20);
    }

    drawBorder(ctx) {
        ctx.strokeStyle = '#000';
        ctx.strokeRect(10, 30, 629, 369);
    }

    drawTitle(ctx) {
        ctx.fillStyle = '#000';
        ctx.font = '12px Helvetica, Arial, sans-serif';
        ctx.fillText('Broomsticks by Paul Rajlich', 245, 20);
    }

    drawControls(ctx) {
        ctx.fillStyle = '#000';
        ctx.font = '12px Helvetica, Arial, sans-serif';

        if (this.player1.isRobot) {
            ctx.fillText('skill:', 30, 415);
            this.drawSkill(ctx);
            ctx.fillText('S and F', 100, 415);
            ctx.fillText('P for two-player, B to change background', 200, 415);
        } else {
            ctx.fillText('E S F and 1', 50, 415);
            ctx.fillText('P for single-player, B to change background', 200, 415);
        }
        ctx.fillText('arrow-keys and ENTER', 500, 415);
    }

    drawSkill(ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(60, 405, 34, 10);
        ctx.fillStyle = 'red';
        ctx.fillRect(60, 405, 35 - this.player1.smart, 10);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(60, 405, 34, 10);
    }

    destroy() {
        this.running = false;
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        this.canvas.removeEventListener('click', this.handleClick);
    }
}
