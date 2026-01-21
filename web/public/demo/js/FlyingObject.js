// FlyingObject.js - Base physics class for all flying objects
// Ported from FlyingObject.java

export class FlyingObject {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.w = 0;
        this.h = 0;
        this.velocityX = 0;
        this.velocityY = 0;
        this.speedFactor = 1.0;
    }

    move() {
        this.x = Math.floor(this.x + this.velocityX * this.speedFactor);
        this.y = Math.floor(this.y + this.velocityY * this.speedFactor);

        // Apply gravity
        this.velocityY += 0.1;

        // Terminal velocity (max fall speed)
        if (this.velocityY > 2.0) {
            this.velocityY = 2.0;
        }

        this.bounds();
    }

    bounds() {
        // Left boundary
        if (this.x < 11) {
            this.x = 11;
            this.velocityX = -this.velocityX;
        }

        // Right boundary
        if (this.x > 639 - this.w) {
            this.x = 639 - this.w;
            this.velocityX = -this.velocityX;
        }

        // Top boundary
        if (this.y < 31) {
            this.y = 31;
            this.velocityY = -this.velocityY;
            if (this.velocityY === 0) {
                this.velocityY += 0.1;
            }
        }

        // Bottom boundary (ground)
        if (this.y > 399 - this.h - 10) {
            this.y = 399 - this.h - 10;
            this.velocityY = 0;
            this.velocityX = 0;
        }
    }

    left() {
        this.velocityX -= 2.0;
        if (this.velocityX < -4.0) {
            this.velocityX = -4.0;
        }
    }

    right() {
        this.velocityX += 2.0;
        if (this.velocityX > 4.0) {
            this.velocityX = 4.0;
        }
    }

    up() {
        this.velocityY -= 2.0;
        if (this.velocityY < -4.0) {
            this.velocityY = -4.0;
        }
    }

    draw(ctx) {
        // Override in subclasses
    }
}
