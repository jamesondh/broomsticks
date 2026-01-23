// Ball.js - Ball class
// Ported from Ball.java with corrected model mapping

import { FlyingObject } from './FlyingObject.js';
import { randomIntFor } from '../multiplayer/SeededRandom.js';

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
        this.ballIndex = 0;     // Set by Game.js for deterministic random seeding
        this.holder = null;     // Player holding this ball (null when free)
    }

    move() {
        if (!this.alive) return;

        // Get authoritative tick for deterministic random seeding
        // Client uses tick + offset to match host's tick
        const tick = this.game.prediction
            ? this.game.prediction.getAuthoritativeTick()
            : this.game.tick;

        // Deterministic random movement using seeded random
        // Seed: tick * entity offset ensures unique but deterministic per ball per tick
        const rand = randomIntFor(tick, this.ballIndex, -20, 20);

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
        // Round to integers to prevent sub-pixel blur from anti-aliasing
        const drawX = Math.round(this.x - 11);
        const drawY = Math.round(this.y - 31);

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
