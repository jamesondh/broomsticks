// Ball.js - Ball class with passing support
// Ported from Ball.cxx

import { FlyingObject } from './FlyingObject.js';

export class Ball extends FlyingObject {
    constructor(game, model, x, y) {
        super(game, x, y);
        this.model = model; // 1 = black, 2 = red (matches C++ item indices)
        this.alive = true;
        this.caught = false;
        this.lastCaught = false;
        this.w = 16;
        this.h = 16;
        this.lastMoveTime = 0;
    }

    move(etime, now) {
        // Random movement only when not being passed
        if (!this.pass) {
            // Make decision every 100ms (tenth of a second)
            if (now - this.lastMoveTime >= 100) {
                this.lastMoveTime = now;

                const choices = 10;
                const choice = Math.floor(Math.random() * choices);

                if (choice === 0) this.up();
                if (choice === 1) this.right();
                if (choice === 2) this.left();
            }

            // Fly up if too close to ground (90 pixels from bottom)
            if (this.y > this.game.height - 90) {
                this.up();
            }
        }

        super.move(etime);
    }

    erase(ctx) {
        // In canvas, we just redraw the background, handled by Game
    }

    draw(ctx) {
        if (!this.alive) return;

        // model: 1 = black ball, 2 = red ball
        // In items.png sprite sheet: row 0 = basket, row 1 = black ball, row 2 = red ball
        // Sprites are 39x39 in the sheet (matching C++ drawItem)
        const spriteX = 1;
        const spriteY = this.model * 40 + 1;

        if (this.game.itemsImage) {
            ctx.drawImage(
                this.game.itemsImage,
                spriteX, spriteY, 39, 39,
                Math.floor(this.x), Math.floor(this.y), 39, 39
            );
        } else {
            // Fallback: draw colored circle
            ctx.beginPath();
            ctx.arc(this.x + 8, this.y + 8, 8, 0, Math.PI * 2);
            ctx.fillStyle = this.model === 1 ? '#000000' : '#ff0000';
            ctx.fill();
            ctx.closePath();
        }
    }

    isCatchable() {
        return this.catchable;
    }

    setCatchable(val) {
        this.catchable = val;
    }

    isAlive() {
        return this.alive;
    }

    setCaught() {
        this.caught = true;
    }

    resetCaught() {
        this.lastCaught = this.caught;
        this.caught = false;
    }
}
