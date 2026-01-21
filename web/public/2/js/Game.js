// Game.js - Main game class with state machine, collisions, scoring
// Ported from br2.cxx

import { Ball } from './Ball.js';
import { Person } from './Person.js';

// Game states
export const GameState = {
    SETTINGS: 'settings',
    INTRO: 'intro',
    PLAYING: 'playing',
    GAME_OVER: 'game_over'
};

export class Game {
    constructor(canvas, settings) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.settings = settings;

        // Game dimensions
        this.width = 640;
        this.height = 480;
        this.midW = this.width / 2;
        this.midH = this.height / 2;
        this.top = 20;

        // Colors (from C++ brGraphics)
        this.white = '#ffffff';
        this.black = '#000000';
        this.red = '#ff0000';
        this.blue = '#aaaaff';
        this.green = '#55ff55';
        this.yellow = '#888800';
        this.gold = '#ffff00';
        this.gray = '#888888';

        // Image assets
        this.playersImage = null;
        this.itemsImage = null;
        this.skyImage = null;
        this.frontImage = null;
        this.introImage = null;

        // Game state
        this.state = GameState.SETTINGS;
        this.started = false;
        this.done = false;

        // Players (up to 4)
        this.players = [];
        this.numPlayers = 2;

        // Balls
        this.balls = [];

        // Scores
        this.teamScore = [0, 0];
        this.teamBasket = [0, 0]; // Which team has the ball
        this.timer = 0;
        this.winScore = 50;

        // Timing
        this.lastTime = 0;
        this.etime = 0;
        this.running = false;

        // Bind methods
        this.gameLoop = this.gameLoop.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
    }

    async init() {
        console.log('\n');
        console.log('---=== Broomsticks 2 HTML5 Port ===---');
        console.log('    Original by Paul Rajlich (c) 2003-2004\n');

        // Load images
        await this.loadAssets();

        // Set up input
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
    }

    async loadAssets() {
        const loadImage = (src) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = () => {
                    console.warn(`Failed to load: ${src}`);
                    resolve(null);
                };
                img.src = src;
            });
        };

        const [players, items, sky, front, intro] = await Promise.all([
            loadImage('images/players.png'),
            loadImage('images/items.png'),
            loadImage('images/sky.png'),
            loadImage('images/front.png'),
            loadImage('images/intro.png')
        ]);

        this.playersImage = players;
        this.itemsImage = items;
        this.skyImage = sky;
        this.frontImage = front;
        this.introImage = intro;

        console.log('Assets loaded');
    }

    start() {
        // Get settings
        const cfg = this.settings.getAll();
        this.winScore = cfg.winScore;

        // Create balls
        this.balls = [];
        const numRed = cfg.redBalls;
        const numBlack = cfg.blackBalls;

        for (let i = 0; i < numRed; i++) {
            const ball = new Ball(this, 2, this.midW, this.midH - 20);
            ball.setCatchable(true);
            ball.setAccel(cfg.accel);
            ball.setMaxSpeed(cfg.maxSpeed);
            this.balls.push(ball);
        }

        for (let i = 0; i < numBlack; i++) {
            const ball = new Ball(this, 1, this.midW, this.midH + 20 + i * 30);
            ball.setAccel(cfg.accel);
            ball.setMaxSpeed(cfg.maxSpeed);
            this.balls.push(ball);
        }

        // Create players
        const targetBall = this.balls[0] || null;

        // Player 1 (Red team, left side)
        const p1 = new Person(this, targetBall, 1, 100, this.midH);
        p1.setKeys('e', 'x', 's', 'f', '1', '2', '4');
        p1.setSide(0);
        p1.setAccel(cfg.accel);
        p1.setMaxSpeed(cfg.maxSpeed);
        p1.setInfo(20, this.height - 15);

        // Player 2 (Black team, right side)
        const p2 = new Person(this, targetBall, 4, this.width - 100, this.midH);
        p2.setKeys('ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Shift', 'Control');
        p2.setSide(1);
        p2.setAccel(cfg.accel);
        p2.setMaxSpeed(cfg.maxSpeed);
        p2.setInfo(this.width - 290, this.height - 15);

        // Player 3 (Red team, left side - for 2v2)
        const p3 = new Person(this, targetBall, 2, 200, this.midH);
        p3.setKeys('i', 'm', 'j', 'l', '7', '8', '0');
        p3.setSide(0);
        p3.setAccel(cfg.accel);
        p3.setMaxSpeed(cfg.maxSpeed);
        p3.setInfo(20, this.height - 5);

        // Player 4 (Black team, right side - for 2v2)
        const p4 = new Person(this, targetBall, 2, this.width - 200, this.midH);
        p4.setKeys('Home', 'End', 'Delete', 'PageDown', 'Insert', 'PageUp', 'NumLock');
        p4.setSide(1);
        p4.setAccel(cfg.accel);
        p4.setMaxSpeed(cfg.maxSpeed);
        p4.setInfo(this.width - 290, this.height - 5);

        this.players = [p1, p2, p3, p4];
        this.numPlayers = 2;

        // Reset scores
        this.teamScore = [0, 0];
        this.teamBasket = [0, 0];
        this.timer = 0;

        // Start game
        this.state = GameState.INTRO;
        this.started = false;
        this.running = true;
        this.lastTime = performance.now();

        requestAnimationFrame(this.gameLoop);
    }

    stop() {
        this.running = false;
        this.state = GameState.SETTINGS;
    }

    gameLoop(timestamp) {
        if (!this.running) return;

        // Calculate elapsed time
        this.etime = timestamp - this.lastTime;
        if (this.etime > 100) this.etime = 100; // Cap to prevent huge jumps
        this.lastTime = timestamp;

        const now = timestamp;

        if (this.started) {
            this.checkCollisions();
            this.checkCaught(now);
            this.moveFlyers(now);

            if (this.timer > 0) {
                this.timer--;
            }
        }

        this.render();

        requestAnimationFrame(this.gameLoop);
    }

    moveFlyers(now) {
        for (let i = 0; i < this.numPlayers; i++) {
            this.players[i].move(this.etime, now);
        }
        for (const ball of this.balls) {
            ball.move(this.etime, now);
        }
    }

    checkCaught(now) {
        this.teamBasket[0] = 0;
        this.teamBasket[1] = 0;

        // Reset caught state for all balls
        for (const ball of this.balls) {
            ball.resetCaught();
        }

        // Check all pairs of players and balls
        for (let i = 0; i < this.numPlayers; i++) {
            const p = this.players[i];

            for (const ball of this.balls) {
                if (ball.isAlive() && ball.isCatchable()) {
                    const dx = Math.abs(p.getX() + 8 - ball.getX());
                    const dy = Math.abs(p.getY() + 8 - ball.getY());

                    if (dx < 20 && dy < 20) {
                        // Player catches the ball
                        if (p.getVX() > 0) {
                            ball.setX(p.getX() + 18);
                        } else {
                            ball.setX(p.getX() + 8);
                        }
                        ball.setY(p.getY() + 15);
                        this.teamBasket[p.getSide()] = 1;

                        // Handle passing in 2v2
                        if (this.numPlayers > 2 && p.getPassBall()) {
                            ball.setPass(true);

                            // Find teammate
                            let teammate;
                            if (i === 0) teammate = this.players[2];
                            else if (i === 1) teammate = this.players[3];
                            else if (i === 2) teammate = this.players[0];
                            else teammate = this.players[1];

                            // Calculate pass direction
                            const diffx = teammate.getX() - p.getX();
                            const diffy = teammate.getY() - p.getY();
                            const dist = Math.sqrt(diffx * diffx + diffy * diffy);

                            ball.setVX((diffx / dist) * 8);
                            ball.setVY((diffy / dist) * 8);
                            ball.setX(ball.getX() + 6 * ball.getVX() + Math.random() * 5);
                            ball.setY(ball.getY() + 6 * ball.getVY() + Math.random() * 5);
                        }

                        ball.setCaught();

                        // Check for scoring
                        const scoringX = (p.getSide() === 0 && p.getX() > this.width - 17 - p.getW()) ||
                                        (p.getSide() === 1 && p.getX() < 17);

                        if (scoringX) {
                            const dyGoal = Math.abs(ball.getY() - this.midH);
                            if (dyGoal < 20) {
                                this.teamScore[p.getSide()] += 10;
                                console.log(`Score! ${this.teamScore[0]} to ${this.teamScore[1]}`);
                                this.timer = 15;
                                ball.setX(this.midW);

                                if (this.teamScore[p.getSide()] >= this.winScore) {
                                    this.gameOver();
                                }
                            }
                        }
                    }
                }
            }
            p.setPassBall(false);
        }
    }

    checkCollisions() {
        // Check all pairs of players
        for (let i = 0; i < this.numPlayers; i++) {
            for (let j = 0; j < this.numPlayers; j++) {
                if (i !== j) {
                    const p1 = this.players[i];
                    const p2 = this.players[j];

                    const dx = Math.abs(p1.getX() - p2.getX());
                    const dy = Math.abs(p1.getY() - p2.getY());

                    if (dx < p1.getW() && dy < p1.getH()) {
                        // Lower player bumps higher player
                        if (p1.getY() < p2.getY()) {
                            p2.bump();
                        } else if (p2.getY() < p1.getY()) {
                            p1.bump();
                        }
                    }
                }
            }
        }

        // Check players vs black balls
        for (let i = 0; i < this.numPlayers; i++) {
            const p = this.players[i];

            for (const ball of this.balls) {
                if (ball.isAlive() && !ball.isCatchable()) {
                    const dx = Math.abs(p.getX() + 8 - ball.getX());
                    const dy = Math.abs(p.getY() + 8 - ball.getY());

                    if (dx < 20 && dy < 20) {
                        p.bump();
                    }
                }
            }
        }
    }

    gameOver() {
        this.started = false;
        this.state = GameState.GAME_OVER;

        // Reset positions
        for (const p of this.players) {
            p.reset();
        }
        for (const ball of this.balls) {
            ball.reset();
        }
    }

    setNumPlayers(num) {
        // Erase all players first
        this.numPlayers = num;

        // Update info positions
        if (num === 2) {
            this.players[0].setInfo(20, this.height - 15);
            this.players[1].setInfo(this.width - 290, this.height - 15);
        } else {
            this.players[0].setInfo(20, this.height - 20);
            this.players[1].setInfo(this.width - 290, this.height - 20);
            this.players[2].setInfo(20, this.height - 10);
            this.players[3].setInfo(this.width - 290, this.height - 10);
        }
    }

    handleKeyDown(e) {
        const key = e.key;
        const now = performance.now();

        // Prevent default for game keys
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', ' ', 'Escape'].includes(key)) {
            e.preventDefault();
        }

        // Start game from intro
        if (!this.started && this.state === GameState.INTRO) {
            if (key === 'Enter' || key === ' ') {
                this.started = true;
                this.state = GameState.PLAYING;
                this.teamScore = [0, 0];
                return;
            }
        }

        // Restart from game over
        if (this.state === GameState.GAME_OVER) {
            if (key === 'Enter' || key === ' ') {
                // Restart the game
                this.state = GameState.INTRO;
                return;
            }
        }

        // ESC to quit
        if (key === 'Escape') {
            this.stop();
            return;
        }

        // Space to toggle 2v2
        if (key === ' ' && this.started) {
            if (this.numPlayers === 2) {
                this.setNumPlayers(4);
            } else {
                this.setNumPlayers(2);
            }
        }

        // Pass to players
        for (let i = 0; i < this.numPlayers; i++) {
            this.players[i].handleKeyEvent(key, true, now);
        }
    }

    handleKeyUp(e) {
        const key = e.key;
        const now = performance.now();

        for (let i = 0; i < this.numPlayers; i++) {
            this.players[i].handleKeyEvent(key, false, now);
        }
    }

    render() {
        const ctx = this.ctx;

        // Clear
        ctx.fillStyle = this.black;
        ctx.fillRect(0, 0, this.width, this.height);

        if (this.state === GameState.INTRO || this.state === GameState.GAME_OVER) {
            this.drawIntro(ctx);
        } else if (this.state === GameState.PLAYING) {
            this.drawBackground(ctx);
            this.drawField(ctx);
            this.drawEntities(ctx);
            this.drawFront(ctx);
            this.drawScores(ctx);
            this.drawPlayerInfo(ctx);
        }
    }

    drawIntro(ctx) {
        if (this.introImage) {
            // Scale intro to fit canvas
            ctx.drawImage(this.introImage, 0, this.top, this.width, this.height - 40);
        }

        this.drawField(ctx);

        // Draw message
        ctx.fillStyle = this.white;
        ctx.font = '14px Helvetica, Arial, sans-serif';

        if (this.state === GameState.GAME_OVER) {
            const winner = this.teamScore[0] >= this.winScore ? 'Red Team' : 'Black Team';
            ctx.fillText(`Game Over! ${winner} wins!`, this.midW - 80, this.midH);
            ctx.fillText(`Final Score: ${this.teamScore[0]} - ${this.teamScore[1]}`, this.midW - 70, this.midH + 20);
            ctx.fillText('Press SPACE or ENTER to play again, ESC to return to settings', this.midW - 180, this.midH + 50);
        } else {
            ctx.fillText('Press SPACE or ENTER to start', this.midW - 100, this.midH);
            ctx.fillText('SPACEBAR toggles 2-on-2 mode', this.midW - 95, this.midH + 30);
        }
    }

    drawBackground(ctx) {
        if (this.skyImage) {
            ctx.drawImage(this.skyImage, 0, this.top, this.width, this.height - 40);
        } else {
            ctx.fillStyle = this.blue;
            ctx.fillRect(0, this.top, this.width, this.height - 40);
        }
    }

    drawFront(ctx) {
        if (this.frontImage) {
            ctx.drawImage(this.frontImage, 0, this.top, this.width, this.height - 40);
        }
    }

    drawField(ctx) {
        const hh = this.midH - 15;
        const ll = this.height - (hh + 39) - 31;

        // Left basket
        const leftHighlight = this.teamBasket[1] ? 1 : 0;
        const leftColor = leftHighlight ? this.gold : this.yellow;

        this.drawItem(ctx, 3, leftHighlight, 21, hh);

        // Left pole
        ctx.fillStyle = this.black;
        ctx.fillRect(28, hh + 39, 4, ll);
        ctx.fillStyle = leftColor;
        ctx.fillRect(29, hh + 39, 2, ll);

        // Right basket
        const rightHighlight = this.teamBasket[0] ? 1 : 0;
        const rightColor = rightHighlight ? this.gold : this.yellow;

        this.drawItem(ctx, 3, rightHighlight, this.width - 41, hh);

        // Right pole
        ctx.fillStyle = this.black;
        ctx.fillRect(this.width - 34, hh + 39, 4, ll);
        ctx.fillStyle = rightColor;
        ctx.fillRect(this.width - 33, hh + 39, 2, ll);
    }

    drawItem(ctx, model, which, x, y) {
        if (!this.itemsImage) return;

        const itemX = 1 + which * 40;
        const itemY = model * 40 + 1;

        ctx.drawImage(
            this.itemsImage,
            itemX, itemY, 39, 39,
            x, y, 39, 39
        );
    }

    drawEntities(ctx) {
        // Draw players
        for (let i = 0; i < this.numPlayers; i++) {
            this.players[i].draw(ctx);
        }

        // Draw balls
        for (const ball of this.balls) {
            ball.draw(ctx);
        }
    }

    drawScores(ctx) {
        const highlightLeft = this.timer > 0 && this.teamBasket[0] ? 1 : 0;
        const highlightRight = this.timer > 0 && this.teamBasket[1] ? 1 : 0;

        // Left score box (Red team)
        ctx.fillStyle = this.black;
        ctx.fillRect(48, 2, 100, 16);
        ctx.fillStyle = highlightLeft ? this.gold : this.black;
        ctx.fillRect(49, 3, 98, 14);

        // Right score box (Black team)
        ctx.fillStyle = this.black;
        ctx.fillRect(this.width - 152, 2, 100, 16);
        ctx.fillStyle = highlightRight ? this.gold : this.black;
        ctx.fillRect(this.width - 151, 3, 98, 14);

        // Score text
        ctx.fillStyle = this.white;
        ctx.font = '12px Helvetica, Arial, sans-serif';
        ctx.fillText(String(this.teamScore[0]), 78, 14);
        ctx.fillText(String(this.teamScore[1]), this.width - 121, 14);
    }

    drawPlayerInfo(ctx) {
        // Clear bottom area
        ctx.fillStyle = this.black;
        ctx.fillRect(0, this.height - 25, this.width, 25);

        // Mode text
        ctx.fillStyle = this.white;
        ctx.font = '10px Helvetica, Arial, sans-serif';

        if (this.numPlayers === 2) {
            ctx.fillText('SPACEBAR for 2-on-2', this.midW - 60, 10);
        } else {
            ctx.fillText('SPACEBAR for 1-on-1', this.midW - 60, 10);
        }

        // Draw player info
        for (let i = 0; i < this.numPlayers; i++) {
            this.players[i].drawInfo(ctx);
        }
    }

    destroy() {
        this.running = false;
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
    }
}
