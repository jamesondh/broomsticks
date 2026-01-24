// Ball.js - Ball class
// Ported from Ball.java with corrected model mapping

import { FlyingObject } from './FlyingObject.js';
import { randRange } from './DeterministicRandom.js';
import { NetworkMode } from './GameConstants.js';

export class Ball extends FlyingObject {
    constructor(game, model, x, y) {
        super(game, x, y);
        // Ball model: 0 = gold, 1 = black, 2 = red
        this.model = model;
        this.w = 16;
        this.h = 16;
        this.alive = true;      // Whether ball is active/visible
        this.catchable = false; // Whether player can catch this ball
        this.isGoldBall = false;
        this.entityId = 0;      // Set by Game.initGameObjects() for deterministic random
    }

    move() {
        if (!this.alive) return;

        // Random movement: simulating Java's signed modulo behavior
        // Java's random.nextInt() % 20 produces -19 to 19, so 0,1,2 each have ~2.5% probability
        // We simulate this by using a larger range and only acting on specific values
        let rand;
        if (this.game.networkMode !== NetworkMode.OFFLINE) {
            // Online: deterministic random (channel 0 for ball wiggle)
            rand = randRange(
                this.game.randomSeed,
                this.game.simTick,
                this.entityId,
                0,  // channel
                -20,
                19
            );
        } else {
            // Offline: original behavior
            rand = Math.floor(Math.random() * 40) - 20;
        }

        if (rand === 0) {
            this.up();
        }
        if (rand === 1) {
            this.right();
        }
        if (rand === 2) {
            this.left();
        }

        // Fly up if too close to ground (Java: y > height - 90)
        // In offscreen coords, height=368, so y > 278 in offscreen
        // In game coords (add 31), y > 309
        if (this.y > 309) {
            this.up();
        }

        super.move();
    }

    draw(ctx) {
        if (!this.alive) return;

        // Subtract offset (11, 31) to convert game coords to offscreen coords
        // This matches the Java's offgc.translate(-11, -31)
        const drawX = this.x - 11;
        const drawY = this.y - 31;

        if (this.game.assets.ballImages && this.game.assets.ballImages[this.model]) {
            ctx.drawImage(this.game.assets.ballImages[this.model], drawX, drawY);
        } else {
            // Fallback: draw colored circle
            ctx.beginPath();
            ctx.arc(drawX + this.w / 2, drawY + this.h / 2, this.w / 2, 0, Math.PI * 2);
            let color;
            switch (this.model) {
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
}
