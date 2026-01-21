// FlyingObject.js - Base class for all moving entities
// Ported from FlyingObject.cxx - implements delta-time physics

export class FlyingObject {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.initX = x;
        this.initY = y;

        this.vx = 0;
        this.vy = 0;

        this.catchable = false;
        this.isGoldBall = false;
        this.pass = false;

        // Physics config - can be overridden per instance
        this.accel = 2;
        this.maxSpeed = 6;
        this.dive = true; // Allow downward movement

        // Dimensions
        this.w = 10;
        this.h = 10;

        // Bounds (set based on game dimensions)
        this.minx = 0;
        this.miny = 20;
        this.maxx = 640;
        this.maxy = 460; // height - 20

        this.lastMoveTime = 0;
    }

    reset() {
        this.x = this.initX;
        this.y = this.initY;
        this.vx = 0;
        this.vy = 0;
        this.pass = false;
    }

    // Delta-time physics: normalized to 25 fps (40ms base frame time)
    move(etime) {
        const dt = etime / 40; // Normalize to 25fps

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Gravity: terminal velocity of 2
        if (this.vy < 2) {
            this.vy += 0.1 * dt;
        }

        this.bounds();
    }

    bounds() {
        let hit = false;

        // Left wall
        if (this.x < this.minx) {
            this.x = this.minx;
            this.vx = -this.vx;
            hit = true;
        }

        // Right wall
        if (this.x > this.maxx - this.w) {
            this.x = this.maxx - this.w;
            this.vx = -this.vx;
            hit = true;
        }

        // Ceiling
        if (this.y < this.miny) {
            this.y = this.miny;
            this.vy = -this.vy;
            if (this.vy === 0) {
                this.vy += 0.1;
            }
            hit = true;
        }

        // Floor
        if (this.y > this.maxy - this.h - 10) {
            this.y = this.maxy - this.h - 10;
            this.vy = 0;
            this.vx = 0;
            hit = true;
        }

        // Reset pass state when hitting a wall
        if (hit) {
            this.pass = false;
        }
    }

    left() {
        this.vx -= this.accel;
        if (this.vx < -this.maxSpeed) {
            this.vx = -this.maxSpeed;
        }
    }

    right() {
        this.vx += this.accel;
        if (this.vx > this.maxSpeed) {
            this.vx = this.maxSpeed;
        }
    }

    up() {
        this.vy -= this.accel;
        if (this.vy < -this.maxSpeed) {
            this.vy = -this.maxSpeed;
        }
    }

    down() {
        if (!this.dive) return;
        this.vy += this.accel;
        if (this.vy > this.maxSpeed) {
            this.vy = this.maxSpeed;
        }
    }

    // Bump player (used when hit by ball or other player)
    bump() {
        this.y = 1000; // Send off screen, will respawn at floor
    }

    setAccel(accel) {
        this.accel = accel;
    }

    setMaxSpeed(maxSpeed) {
        this.maxSpeed = maxSpeed;
    }

    getX() { return this.x; }
    getY() { return this.y; }
    getVX() { return this.vx; }
    getVY() { return this.vy; }
    getW() { return this.w; }
    getH() { return this.h; }

    setX(x) { this.x = x; }
    setY(y) { this.y = y; }
    setVX(vx) { this.vx = vx; }
    setVY(vy) { this.vy = vy; }
    setPass(pass) { this.pass = pass; }
}
