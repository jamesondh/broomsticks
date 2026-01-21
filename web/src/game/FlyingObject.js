// FlyingObject.js - Base physics class for all flying objects
// Ported from FlyingObject.java with configurable physics

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

        // Use configurable physics from game settings
        this.accel = game.settings.accel;
        this.maxSpeed = game.settings.maxSpeed;
        this.canDive = game.settings.dive;
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
        this.velocityX -= this.accel;
        if (this.velocityX < -this.maxSpeed) {
            this.velocityX = -this.maxSpeed;
        }
    }

    right() {
        this.velocityX += this.accel;
        if (this.velocityX > this.maxSpeed) {
            this.velocityX = this.maxSpeed;
        }
    }

    up() {
        this.velocityY -= this.accel;
        if (this.velocityY < -this.maxSpeed) {
            this.velocityY = -this.maxSpeed;
        }
    }

    down() {
        if (!this.canDive) return;
        this.velocityY += this.accel;
        if (this.velocityY > this.maxSpeed) {
            this.velocityY = this.maxSpeed;
        }
    }

    draw(ctx) {
        // Override in subclasses
    }
}
