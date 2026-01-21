// Person.js - Player class with AI and hybrid input
// Ported from Person.cxx

import { FlyingObject } from './FlyingObject.js';

export class Person extends FlyingObject {
    constructor(game, target, model, x, y) {
        super(game, x, y);
        this.model = model; // 0-4 appearance variations
        this.target = target; // Ball reference for AI
        this.isRobot = false;
        this.smart = 15; // AI skill (1-30, lower = smarter)
        this.side = 0; // 0 = left (red team), 1 = right (black team)

        this.w = 38;
        this.h = 38;

        // Key bindings
        this.upKey = null;
        this.downKey = null;
        this.leftKey = null;
        this.rightKey = null;
        this.modelKey = null;
        this.robotKey = null;
        this.passKey = null;

        // Key state tracking for hybrid input
        this.upKeyDown = 0;
        this.downKeyDown = 0;
        this.leftKeyDown = 0;
        this.rightKeyDown = 0;

        // Info display position
        this.infoX = 0;
        this.infoY = 0;

        // Pass state
        this.passBall = false;
    }

    setKeys(up, down, left, right, model, pass, robot) {
        this.upKey = up;
        this.downKey = down;
        this.leftKey = left;
        this.rightKey = right;
        this.modelKey = model;
        this.passKey = pass;
        this.robotKey = robot;
    }

    setInfo(x, y) {
        this.infoX = x;
        this.infoY = y;
    }

    setSide(side) {
        this.side = side;
    }

    getSide() {
        return this.side;
    }

    getPassBall() {
        return this.passBall;
    }

    setPassBall(val) {
        this.passBall = val;
    }

    handleKeyEvent(key, isDown, now) {
        // Key up - clear key down time
        if (!isDown) {
            if (key === this.upKey) this.upKeyDown = 0;
            if (key === this.downKey) this.downKeyDown = 0;
            if (key === this.leftKey) this.leftKeyDown = 0;
            if (key === this.rightKey) this.rightKeyDown = 0;
            return;
        }

        // Key down - record time
        if (key === this.upKey) this.upKeyDown = now;
        if (key === this.downKey) this.downKeyDown = now;
        if (key === this.leftKey) this.leftKeyDown = now;
        if (key === this.rightKey) this.rightKeyDown = now;

        if (this.isRobot) {
            // In robot mode: left/right adjust skill, robotKey toggles to human
            if (key === this.leftKey) this.dumber();
            if (key === this.rightKey) this.smarter();
            if (key === this.robotKey) {
                this.isRobot = false;
                this.vx = 0;
            }
            if (key === this.passKey) this.passBall = true;
        } else {
            // Human mode: standard controls
            if (key === this.upKey) this.up();
            if (key === this.downKey) this.down();
            if (key === this.leftKey) this.left();
            if (key === this.rightKey) this.right();
            if (key === this.robotKey) {
                this.isRobot = true;
            }
            if (key === this.modelKey) this.switchModel();
            if (key === this.passKey) this.passBall = true;
        }
    }

    move(etime, now) {
        // AI movement
        if (this.isRobot && this.target) {
            // Make decision every 100ms (tenth of a second)
            if (now - this.lastMoveTime >= 100) {
                this.lastMoveTime = now;

                const choices = Math.floor(this.smart / 2) + 1;
                const choice = Math.floor(Math.random() * choices);

                if (choice === 0) {
                    // Check if our team has the ball
                    const teamHasBall = this.game.teamBasket[this.side];

                    if (teamHasBall) {
                        // We have the ball - head toward opponent's basket
                        if (this.side === 0) {
                            // Left team - go right
                            if (this.x < this.game.width - 50) this.right();
                            if (this.y > this.game.midH - 10) this.up();
                        } else {
                            // Right team - go left
                            if (this.x > 50) this.left();
                            if (this.y > this.game.midH - 10) this.up();
                        }
                    } else {
                        // Chase the ball
                        if (this.target.getY() < this.y) this.up();

                        if (Math.abs(this.target.getY() - this.y) < 100) {
                            if (this.target.getX() < this.x - 10) this.left();
                            else if (this.target.getX() > this.x + 10) this.right();
                        }

                        if (this.target.getY() > this.y) this.down();
                    }
                }
            }
        }

        // Hybrid input: continuous movement after 300ms hold
        if (!this.isRobot) {
            if (this.upKeyDown && (now - this.upKeyDown > 300)) this.up();
            if (this.downKeyDown && (now - this.downKeyDown > 300)) this.down();
            if (this.leftKeyDown && (now - this.leftKeyDown > 300)) this.left();
            if (this.rightKeyDown && (now - this.rightKeyDown > 300)) this.right();
        }

        super.move(etime);
    }

    smarter() {
        this.smart -= 2;
        if (this.smart < 1) this.smart = 1;
    }

    dumber() {
        this.smart += 2;
        if (this.smart > 30) this.smart = 30;
    }

    switchModel() {
        this.model++;
        if (this.model > 4) this.model = 0;
    }

    erase(ctx) {
        // In canvas, we just redraw the background, handled by Game
    }

    draw(ctx) {
        // Determine sprite direction
        let h; // horizontal: 0 = facing right, 1 = facing left
        if (this.vx > 0) h = 0;
        else if (this.vx < 0) h = 1;
        else h = this.side; // Default to facing inward

        // Vertical state: 0 = falling/neutral, 1 = rising
        const v = this.vy < 0 ? 1 : 0;

        // Sprite position in sheet:
        // x = team*160 + v*80 + h*40 + 1
        // y = model*40 + 41 (no animation frames in this version)
        const spriteX = this.side * 160 + v * 80 + h * 40 + 1;
        const spriteY = this.model * 40 + 41;

        if (this.game.playersImage) {
            ctx.drawImage(
                this.game.playersImage,
                spriteX, spriteY, 39, 39,
                Math.floor(this.x), Math.floor(this.y), 39, 39
            );
        } else {
            // Fallback: draw colored rectangle
            ctx.fillStyle = this.side === 0 ? '#cc3333' : '#333333';
            ctx.fillRect(this.x, this.y, this.w, this.h);
            ctx.strokeStyle = '#000';
            ctx.strokeRect(this.x, this.y, this.w, this.h);
        }
    }

    drawInfo(ctx) {
        const x = this.infoX;
        const y = this.infoY;

        ctx.fillStyle = '#000000';
        ctx.fillRect(x, y, 300, 12);

        ctx.font = '10px Helvetica, Arial, sans-serif';
        ctx.fillStyle = '#ffffff';

        if (this.isRobot) {
            ctx.fillText('skill:', x + 2, y + 10);

            // Skill bar background
            ctx.fillStyle = '#888888';
            ctx.fillRect(x + 40, y + 1, 35, 10);
            ctx.fillStyle = '#000000';
            ctx.fillRect(x + 41, y + 2, 33, 8);
            // Skill bar fill (lower smart = more fill)
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(x + 41, y + 2, 33 - this.smart, 8);

            ctx.fillStyle = '#ffffff';
            ctx.fillText(this.getKeyHint(), x + 80, y + 10);
        } else {
            ctx.fillText(this.getKeyHint(), x + 2, y + 10);
        }
    }

    getKeyHint() {
        // Return human-readable key hints
        if (this.upKey === 'ArrowUp') {
            if (this.isRobot) return 'LEFT RIGHT SHIFT CTRL';
            return 'arrow-keys ENTER SHIFT CTRL';
        }
        if (this.upKey === 'Home') {
            if (this.isRobot) return 'DEL PDN PUP NMLK';
            return 'HOME END DEL PDN INS PUP NMLK';
        }
        // Default: show the actual keys
        const keys = [this.leftKey, this.rightKey, this.passKey, this.robotKey];
        if (!this.isRobot) {
            return `${this.upKey} ${this.downKey} ${this.leftKey} ${this.rightKey} ${this.modelKey} ${this.passKey} ${this.robotKey}`;
        }
        return keys.join(' ');
    }
}
