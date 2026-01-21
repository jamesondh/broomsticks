// GoldBall.js - Gold ball with evasion AI
// Ported from Java Advanced version

import { Ball } from './Ball.js';

export class GoldBall extends Ball {
    constructor(game, x, y) {
        super(game, 0, x, y); // model 0 = gold ball
        this.isGoldBall = true;
        this.catchable = true;
        this.alive = false; // Hidden until timer expires
        this.smart = 1;     // Very smart AI (always acts when choice===0)
        this.w = 8;         // Smaller than regular balls (Java lines 1228-1229)
        this.h = 8;

        // 2x physics multipliers (from Java lines 1263-1264)
        this.maxSpeed = 2 * game.settings.maxSpeed;
        this.accel = 2 * game.settings.accel;
        this.canDive = true; // Gold ball can always dive
    }

    move() {
        if (!this.alive) return;

        // Evasion AI: flee from players within 100px
        for (const player of this.game.players) {
            const dx = this.x - player.x;
            const dy = this.y - player.y;

            if (Math.abs(dx) < 100 && Math.abs(dy) < 100) {
                const choice = Math.floor(Math.random() * this.smart);
                if (choice === 0) {
                    // Move away from player
                    if (player.x < this.x) this.right();
                    if (player.x > this.x) this.left();
                    if (player.y > this.y) this.up();
                    if (player.y < this.y) this.down();
                }
            }
        }

        // Call parent Ball.move() which includes random movement + FlyingObject.move()
        super.move();
    }

    down() {
        // Gold ball can always dive (bypasses FlyingObject.canDive check)
        this.velocityY += this.accel;
        if (this.velocityY > this.maxSpeed) this.velocityY = this.maxSpeed;
    }
}
