// Ball.js - Ball class
// Ported from Ball.java

import { FlyingObject } from './FlyingObject.js';

export class Ball extends FlyingObject {
    constructor(game, model, x, y) {
        super(game, x, y);
        this.model = model; // 0 = black ball, 1 = red ball
        this.w = 17;
        this.h = 17;
    }

    move() {
        // Random movement: simulating Java's signed modulo behavior
        // Java's random.nextInt() % 20 produces -19 to 19, so 0,1,2 each have ~2.5% probability
        // We simulate this by using a larger range and only acting on specific values
        const rand = Math.floor(Math.random() * 40) - 20; // -20 to 19

        if (rand === 0) {
            this.up();
        }
        if (rand === 1) {
            this.right();
        }
        if (rand === 2) {
            this.left();
        }

        // Fly up if too close to ground
        if (this.y > 330) {
            this.up();
        }

        super.move();
    }

    draw(ctx) {
        // Subtract offset (11, 31) to convert game coords to offscreen coords
        // This matches the Java's offgc.translate(-11, -31)
        const drawX = this.x - 11;
        const drawY = this.y - 31;

        if (this.game.ballImages && this.game.ballImages[this.model]) {
            ctx.drawImage(this.game.ballImages[this.model], drawX, drawY);
        } else {
            // Fallback: draw colored circle
            ctx.beginPath();
            ctx.arc(drawX + this.w / 2, drawY + this.h / 2, this.w / 2, 0, Math.PI * 2);
            ctx.fillStyle = this.model === 0 ? '#000000' : '#ff0000';
            ctx.fill();
            ctx.closePath();
        }
    }
}
