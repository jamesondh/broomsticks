// Person.js - Player class with AI
// Ported from Person.java

import { FlyingObject } from './FlyingObject.js';

export class Person extends FlyingObject {
    constructor(target, game, model, x, y) {
        super(game, x, y);
        this.model = model;       // Appearance (0-4)
        this.target = target;     // Ball reference for AI
        this.isRobot = false;
        this.smart = 15;          // AI skill (1-30, lower = smarter)
        this.score = 0;
        this.side = 0;            // 0 = left/blue, 1 = right/green
        this.w = 38;
        this.h = 38;
    }

    smarter() {
        this.smart -= 5;
        if (this.smart <= 1) {
            this.smart = 1;
        }
    }

    dumber() {
        this.smart += 5;
        if (this.smart >= 30) {
            this.smart = 30;
        }
    }

    move() {
        if (this.isRobot) {
            // Simulate Java's signed modulo: random.nextInt() % smart produces -(smart-1) to (smart-1)
            // Only rand === 0 triggers AI action, so probability is ~1/(2*smart) instead of 1/smart
            const rand = Math.floor(Math.random() * this.smart * 2) - this.smart;
            if (rand === 0) {
                // AI behavior: if carrying ball, go to right basket
                if (this.game.currBasket === 1) {
                    if (this.x < 600) {
                        this.right();
                    }
                    if (this.y > 200) {
                        this.up();
                    }
                } else {
                    // Chase the target ball
                    if (this.target.x < this.x - 10) {
                        this.left();
                    }
                    if (this.target.x > this.x + 10) {
                        this.right();
                    }
                    if (this.target.y < this.y) {
                        this.up();
                    }
                }
            }
        }
        super.move();
    }

    switchModel() {
        this.model++;
        if (this.model > 4) {
            this.model = 0;
        }
    }

    draw(ctx) {
        // Subtract offset (11, 31) to convert game coords to offscreen coords
        // This matches the Java's offgc.translate(-11, -31)
        const drawX = this.x - 11;
        const drawY = this.y - 31;

        // Determine which direction sprite to use based on velocity
        // n = horizontal direction: 0 = right, 1 = left
        let hDir;
        if (this.velocityX > 0) {
            hDir = 0;
        } else if (this.velocityX < 0) {
            hDir = 1;
        } else {
            hDir = this.side;
        }

        // n2 = vertical state: 0 = falling/neutral, 1 = rising
        const vDir = this.velocityY >= 0 ? 0 : 1;

        // Use model + 5 for green team (side 1)
        const modelIndex = this.side === 0 ? this.model : this.model + 5;

        if (this.game.assets.playerImages &&
            this.game.assets.playerImages[modelIndex] &&
            this.game.assets.playerImages[modelIndex][vDir] &&
            this.game.assets.playerImages[modelIndex][vDir][hDir]) {
            ctx.drawImage(this.game.assets.playerImages[modelIndex][vDir][hDir], drawX, drawY);
        } else {
            // Fallback: draw colored rectangle
            ctx.fillStyle = this.side === 0 ? '#0080ff' : '#00a400';
            ctx.fillRect(drawX, drawY, this.w, this.h);
            ctx.strokeStyle = '#000';
            ctx.strokeRect(drawX, drawY, this.w, this.h);
        }
    }
}
