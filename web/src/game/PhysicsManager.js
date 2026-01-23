// PhysicsManager.js - Collision detection and scoring for Broomsticks

import { COLLISION_THRESHOLD, GROUND_Y, LEFT_BASKET_X, RIGHT_BASKET_X, BASKET_Y } from './GameConstants.js';

export class PhysicsManager {
    constructor(game) {
        this.game = game;
    }

    checkCollisions() {
        const { player1, player2, balls } = this.game;

        // Player vs player collision
        let dx = player1.x - player2.x;
        let dy = player1.y - player2.y;

        // Player collision: w and h thresholds (Java line 861)
        if (Math.abs(dx) < player1.w && Math.abs(dy) < player1.h) {
            // Lower player bumps higher player
            // Only play bump if not near ground (Java line 862)
            if (player1.y < GROUND_Y - player1.h - 50) {
                this.game.assets.playSound('bump');
            }
            if (player1.y < player2.y) {
                player2.y = 1000;
            } else if (player2.y < player1.y) {
                player1.y = 1000;
            }
        }

        // Player vs black ball collisions
        for (const ball of balls) {
            if (ball.catchable || ball.isGoldBall) continue; // Skip red and gold balls
            if (!ball.alive) continue;

            // Player 1 vs black ball
            dx = player1.x + 8 - ball.x;
            dy = player1.y + 8 - ball.y;
            if (Math.abs(dx) < COLLISION_THRESHOLD && Math.abs(dy) < COLLISION_THRESHOLD) {
                // Only play bump if not near ground (Java line 882)
                if (player1.y < GROUND_Y - player1.h - 50) {
                    this.game.assets.playSound('bump');
                }
                player1.y = 1000;
            }

            // Player 2 vs black ball
            dx = player2.x + 8 - ball.x;
            dy = player2.y + 8 - ball.y;
            if (Math.abs(dx) < COLLISION_THRESHOLD && Math.abs(dy) < COLLISION_THRESHOLD) {
                // Only play bump if not near ground (Java line 882)
                if (player2.y < GROUND_Y - player2.h - 50) {
                    this.game.assets.playSound('bump');
                }
                player2.y = 1000;
            }
        }
    }

    checkCaught() {
        const { players, balls, player1, player2, settings } = this.game;

        // Reset basket state for this frame
        this.game.teamBasket[0] = false;
        this.game.teamBasket[1] = false;
        this.game.currBasket = 0;

        // Check each player against each catchable ball
        for (const person of players) {
            for (const ball of balls) {
                if (!ball.catchable || !ball.alive) continue;

                const dx = person.x + 8 - ball.x;
                const dy = person.y + 8 - ball.y;

                // Ball catch detection: 20px threshold (Java line 809)
                if (Math.abs(dx) < COLLISION_THRESHOLD && Math.abs(dy) < COLLISION_THRESHOLD) {
                    // Mark ball as held by this player
                    // Actual positioning happens in Game.repositionHeldBalls() after player movement
                    ball.holder = person;

                    // Set basket highlight
                    if (person === player1) {
                        this.game.currBasket = 1;
                    } else {
                        this.game.currBasket = 2;
                    }

                    // Mark this team as holding a ball
                    this.game.teamBasket[person.side] = true;

                    // Play grab sound only on transition (Java line 821)
                    if (!this.game.prevTeamBasket[person.side]) {
                        this.game.assets.playSound('grab');
                    }

                    // Check if scoring
                    if (ball.isGoldBall) {
                        // Gold ball scoring
                        this.checkGoldScore(person, ball);
                    } else {
                        // Regular red ball scoring
                        this.checkRegularScore(person, ball);
                    }
                }
            }
        }

        // Clear holder for balls that are no longer being held
        // A ball is free if no team is holding any ball (simplified: if teamBasket is all false)
        for (const ball of balls) {
            if (ball.catchable && ball.alive) {
                // Check if this ball's holder is still valid
                if (ball.holder && !this.game.teamBasket[ball.holder.side]) {
                    ball.holder = null;
                }
            }
        }

        // Save state for next frame (Java lines 847-848)
        this.game.prevTeamBasket[0] = this.game.teamBasket[0];
        this.game.prevTeamBasket[1] = this.game.teamBasket[1];
    }

    checkRegularScore(person, ball) {
        const { settings } = this.game;

        // Player 1 (left side) scores at right basket
        if (person.side === 0 && person.x > RIGHT_BASKET_X - person.w) {
            const dy = ball.y - BASKET_Y;
            // Score detection: 20px threshold (Java line 828)
            if (Math.abs(dy) < COLLISION_THRESHOLD) {
                person.score += 10;
                this.game.timer = 15;
                ball.x = 325;
                ball.y = 200;
                this.game.assets.playSound('score');

                // Check win condition (only if no gold balls configured)
                if (settings.goldBalls === 0 && person.score >= settings.winScore) {
                    this.game.gameOver(person.side);
                }
            }
        }

        // Player 2 (right side) scores at left basket
        if (person.side === 1 && person.x < LEFT_BASKET_X) {
            const dy = ball.y - BASKET_Y;
            if (Math.abs(dy) < COLLISION_THRESHOLD) {
                person.score += 10;
                this.game.timer = 15;
                ball.x = 325;
                ball.y = 200;
                this.game.assets.playSound('score');

                if (settings.goldBalls === 0 && person.score >= settings.winScore) {
                    this.game.gameOver(person.side);
                }
            }
        }
    }

    checkGoldScore(person, ball) {
        const { settings } = this.game;

        // Player 1 scores at right basket
        if (person.side === 0 && person.x > RIGHT_BASKET_X - person.w) {
            const dy = ball.y - BASKET_Y;
            if (Math.abs(dy) < COLLISION_THRESHOLD) {
                person.score += settings.goldPoints;
                ball.alive = false;
                // Win sound plays in gameOver() - don't play here (Java line 737)
                this.game.gameOver(person.side);
            }
        }

        // Player 2 scores at left basket
        if (person.side === 1 && person.x < LEFT_BASKET_X) {
            const dy = ball.y - BASKET_Y;
            if (Math.abs(dy) < COLLISION_THRESHOLD) {
                person.score += settings.goldPoints;
                ball.alive = false;
                // Win sound plays in gameOver() - don't play here (Java line 737)
                this.game.gameOver(person.side);
            }
        }
    }

    checkGoldBallTimer() {
        const { settings, balls, goldSpawned, startTime } = this.game;

        if (settings.goldBalls === 0 || goldSpawned) return;

        const elapsed = Date.now() - startTime;
        const duration = settings.duration * 1000;

        if (elapsed >= duration) {
            // Spawn gold balls
            for (const ball of balls) {
                if (ball.isGoldBall && !ball.alive) {
                    ball.alive = true;
                }
            }
            this.game.goldSpawned = true;
        }
    }
}
