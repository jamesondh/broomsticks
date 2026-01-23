// ClientPrediction.js - Host-authoritative client prediction with interpolation
// Client predicts ONLY local player movement. Remote entities use snapshot interpolation.

import { GameState } from '../game/GameConstants.js';

/**
 * SmoothCorrector - Handles smooth exponential blending toward server state
 */
class SmoothCorrector {
    /**
     * Smoothly correct a position toward target
     * @param {number} current - Current position
     * @param {number} target - Target (server) position
     * @param {number} error - Distance between current and target
     * @returns {number} Corrected position
     */
    correct(current, target, error) {
        // Snap on teleport (e.g., collision detection moved player far)
        if (error > 100) return target;

        // Adaptive blend: larger error = faster correction
        // Range: 15% (small errors) to 50% (large errors before snap threshold)
        const blendRate = Math.min(0.15 + error * 0.005, 0.5);

        return current + (target - current) * blendRate;
    }
}

/**
 * ClientPrediction - Local player prediction with snapshot interpolation
 *
 * Key principles:
 * 1. Client predicts ONLY local player movement (no collisions, no scoring)
 * 2. Remote entities (opponent, balls) use interpolation between server snapshots
 * 3. Server is authoritative for ALL game outcomes (scoring, game over, collisions)
 * 4. Client NEVER triggers game state changes - only accepts them from server
 */
export class ClientPrediction {
    constructor(game) {
        this.game = game;
        this.inputBuffer = new Map(); // tick -> input
        this.corrector = new SmoothCorrector();
        this.localPlayerIndex = 1;    // Client controls player 2 (green)

        // Maximum inputs to keep in buffer (prevents memory leak)
        this.maxBufferSize = 120; // ~4 seconds at 30fps

        // Track last server tick for reconciliation
        this.lastServerTick = 0;

        // Tick offset for authoritative tick calculation
        // authoritativeTick = localTick + tickOffset
        this.tickOffset = 0;

        // Snapshot buffer for interpolation
        this.snapshotBuffer = [];
        this.maxSnapshots = 10;
        this.interpolationDelay = 100; // 100ms render delay for smooth interpolation
    }

    /**
     * Get the authoritative tick for deterministic random seeding
     * This ensures client and host use the same tick value for RNG
     * @returns {number} Authoritative tick
     */
    getAuthoritativeTick() {
        return this.game.tick + this.tickOffset;
    }

    /**
     * Get the local player being controlled by this client
     */
    getLocalPlayer() {
        return this.game.players[this.localPlayerIndex];
    }

    /**
     * Get the remote player (controlled by host)
     */
    getRemotePlayer() {
        const remoteIndex = this.localPlayerIndex === 0 ? 1 : 0;
        return this.game.players[remoteIndex];
    }

    /**
     * Record an input for a specific tick for later reconciliation
     * @param {number} tick - The game tick when this input was applied
     * @param {Object} input - The input state {left, right, up, down, switch}
     */
    recordInput(tick, input) {
        // Record input (even if no directional input, for accurate replay)
        this.inputBuffer.set(tick, { ...input });

        // Efficient cleanup: only trim when significantly over limit
        if (this.inputBuffer.size > this.maxBufferSize * 1.5) {
            const ticks = Array.from(this.inputBuffer.keys()).sort((a, b) => a - b);
            const toRemove = ticks.slice(0, this.inputBuffer.size - this.maxBufferSize);
            for (const t of toRemove) {
                this.inputBuffer.delete(t);
            }
        }
    }

    /**
     * Apply input to the local player immediately for responsive feel
     * @param {Object} input - The input state {left, right, up, down, switch}
     */
    applyLocalInput(input) {
        const player = this.getLocalPlayer();
        if (!player) return;

        if (input.left) player.left();
        if (input.right) player.right();
        if (input.up) player.up();
        if (input.down) player.down();
    }

    /**
     * Predict local player movement ONLY - called every physics tick
     * Does NOT run collisions, scoring, or any authoritative game logic
     * @param {Object} localInput - Current input from local player
     */
    predictLocalPlayer(localInput) {
        // 1. Apply input to local player (changes velocity)
        this.applyLocalInput(localInput);
        this.recordInput(this.game.tick, localInput);

        // 2. Move local player only (no collisions, no scoring)
        const player = this.getLocalPlayer();
        if (player) {
            // Apply velocity to position
            player.x += player.velocityX * player.speedFactor;
            player.y += player.velocityY * player.speedFactor;

            // Apply gravity
            player.velocityY += 0.1;
            if (player.velocityY > 2.0) player.velocityY = 2.0;

            // Apply bounds
            player.bounds();
        }

        // DO NOT call physics.checkCaught(), checkCollisions(), or move balls/remote player
        // Those are all handled by the authoritative host
    }

    /**
     * Buffer a server snapshot for interpolation
     * @param {Object} serverState - The state received from server
     */
    bufferSnapshot(serverState) {
        const snapshot = {
            tick: serverState.tick,
            timestamp: performance.now(),
            players: serverState.players,
            balls: serverState.balls,
            currBasket: serverState.currBasket,
            timer: serverState.timer,
            goldSpawned: serverState.goldSpawned,
            gameState: serverState.gameState,
            winner: serverState.winner
        };

        this.snapshotBuffer.push(snapshot);

        // Keep buffer size limited
        if (this.snapshotBuffer.length > this.maxSnapshots) {
            this.snapshotBuffer.shift();
        }
    }

    /**
     * Interpolate remote entities between buffered snapshots
     * Called every frame for smooth rendering
     */
    interpolateRemoteEntities() {
        if (this.snapshotBuffer.length < 2) return;

        // Find the render time (current time minus interpolation delay)
        const renderTime = performance.now() - this.interpolationDelay;

        // Find two snapshots to interpolate between
        let before = null;
        let after = null;

        for (let i = 0; i < this.snapshotBuffer.length - 1; i++) {
            if (this.snapshotBuffer[i].timestamp <= renderTime &&
                this.snapshotBuffer[i + 1].timestamp >= renderTime) {
                before = this.snapshotBuffer[i];
                after = this.snapshotBuffer[i + 1];
                break;
            }
        }

        // If no valid interpolation pair found, use latest snapshot
        if (!before || !after) {
            const latest = this.snapshotBuffer[this.snapshotBuffer.length - 1];
            this.applySnapshotToRemoteEntities(latest);
            return;
        }

        // Calculate interpolation factor (0 to 1)
        const timeDiff = after.timestamp - before.timestamp;
        const t = timeDiff > 0 ? (renderTime - before.timestamp) / timeDiff : 0;

        // Interpolate remote player
        this.interpolateRemotePlayer(before, after, t);

        // Interpolate balls
        this.interpolateBalls(before, after, t);
    }

    /**
     * Interpolate remote player position between two snapshots
     */
    interpolateRemotePlayer(before, after, t) {
        const remotePlayer = this.getRemotePlayer();
        if (!remotePlayer) return;

        const remoteIndex = this.localPlayerIndex === 0 ? 1 : 0;
        const beforeState = before.players[remoteIndex];
        const afterState = after.players[remoteIndex];

        if (!beforeState || !afterState) return;

        // Linear interpolation
        remotePlayer.x = beforeState.x + (afterState.x - beforeState.x) * t;
        remotePlayer.y = beforeState.y + (afterState.y - beforeState.y) * t;

        // Use latest velocity for extrapolation
        remotePlayer.velocityX = afterState.vx;
        remotePlayer.velocityY = afterState.vy;

        // Sync authoritative state from latest
        remotePlayer.score = afterState.score;
        if (remotePlayer.model !== afterState.model) {
            remotePlayer.model = afterState.model;
        }
    }

    /**
     * Interpolate ball positions between two snapshots
     */
    interpolateBalls(before, after, t) {
        for (let i = 0; i < this.game.balls.length; i++) {
            const ball = this.game.balls[i];
            const beforeState = before.balls[i];
            const afterState = after.balls[i];

            if (!beforeState || !afterState) continue;

            // If ball is held, position at carrier's interpolated position
            if (afterState.holder !== null) {
                const carrierIndex = afterState.holder;
                const carrier = this.game.players[carrierIndex];
                if (carrier) {
                    // Ball follows carrier with offset
                    ball.x = carrier.velocityX > 0 ? carrier.x + 18 : carrier.x + 8;
                    ball.y = carrier.y + 15;
                    ball.velocityX = 0;
                    ball.velocityY = 0;
                    ball.alive = afterState.alive;
                    ball.holder = carrier;  // Track holder on client too
                    continue;
                }
            }

            // Clear holder for free balls
            ball.holder = null;

            // Normal interpolation for free balls
            ball.x = beforeState.x + (afterState.x - beforeState.x) * t;
            ball.y = beforeState.y + (afterState.y - beforeState.y) * t;

            // Use latest velocity
            ball.velocityX = afterState.vx;
            ball.velocityY = afterState.vy;

            // Sync alive state from latest
            ball.alive = afterState.alive;
        }
    }

    /**
     * Apply a snapshot directly to remote entities (no interpolation)
     */
    applySnapshotToRemoteEntities(snapshot) {
        // Apply to remote player
        const remotePlayer = this.getRemotePlayer();
        if (remotePlayer) {
            const remoteIndex = this.localPlayerIndex === 0 ? 1 : 0;
            const state = snapshot.players[remoteIndex];
            if (state) {
                remotePlayer.x = state.x;
                remotePlayer.y = state.y;
                remotePlayer.velocityX = state.vx;
                remotePlayer.velocityY = state.vy;
                remotePlayer.score = state.score;
                if (remotePlayer.model !== state.model) {
                    remotePlayer.model = state.model;
                }
            }
        }

        // Apply to balls
        snapshot.balls.forEach((state, i) => {
            const ball = this.game.balls[i];
            if (ball && state) {
                // If ball is held, position at carrier
                if (state.holder !== null) {
                    const carrier = this.game.players[state.holder];
                    if (carrier) {
                        ball.x = carrier.velocityX > 0 ? carrier.x + 18 : carrier.x + 8;
                        ball.y = carrier.y + 15;
                        ball.velocityX = 0;
                        ball.velocityY = 0;
                        ball.holder = carrier;
                        ball.alive = state.alive;
                        return;
                    }
                }

                // Free ball
                ball.holder = null;
                ball.x = state.x;
                ball.y = state.y;
                ball.velocityX = state.vx;
                ball.velocityY = state.vy;
                ball.alive = state.alive;
            }
        });
    }

    /**
     * Reconcile local prediction with authoritative server state
     * Called when server state arrives - applies smooth corrections
     * @param {Object} serverState - The state received from the server
     */
    reconcile(serverState) {
        // Fix: handle tick 0 correctly (check for undefined/null, not falsy)
        if (serverState.tick === undefined || serverState.tick === null) return;

        const serverTick = serverState.tick;
        this.lastServerTick = serverTick;

        // Update tick offset for authoritative tick calculation
        // This ensures seeded random uses the same tick on client and host
        this.tickOffset = serverTick - this.game.tick;

        // 1. Buffer snapshot for interpolation
        this.bufferSnapshot(serverState);

        // 2. Reconcile local player (smooth only, no replay)
        // Server state already includes effect of acknowledged inputs
        // Just smoothly converge to server position
        this.reconcileLocalPlayer(serverState);

        // 3. Sync authoritative game state (currBasket, timer, gameState, winner)
        this.syncGameState(serverState);

        // 4. Clean up old inputs (no longer needed for replay)
        const ackClientTick = serverState.ackClientTick || 0;
        this.cleanupInputBuffer(ackClientTick);
    }

    /**
     * Reconcile local player with server state
     * Uses relaxed thresholds to reduce jitter:
     * - Small errors (<15px): trust client, ignore
     * - Medium errors (15-50px): smooth blend position only, keep client velocity
     * - Large errors (>50px): snap (collision/teleport events)
     * @param {Object} serverState - Server state
     */
    reconcileLocalPlayer(serverState) {
        const player = this.getLocalPlayer();
        if (!player) return;

        const serverPlayerState = serverState.players[this.localPlayerIndex];
        if (!serverPlayerState) return;

        // Calculate prediction error
        const errorX = Math.abs(player.x - serverPlayerState.x);
        const errorY = Math.abs(player.y - serverPlayerState.y);
        const totalError = Math.sqrt(errorX * errorX + errorY * errorY);

        if (totalError > 50) {
            // Large error (collision/teleport): snap to server immediately
            player.x = serverPlayerState.x;
            player.y = serverPlayerState.y;
            player.velocityX = serverPlayerState.vx;
            player.velocityY = serverPlayerState.vy;
        } else if (totalError > 15) {
            // Medium error: smooth blend position only, keep client velocity
            // DON'T overwrite velocity - let client maintain control for responsiveness
            player.x = this.corrector.correct(player.x, serverPlayerState.x, totalError);
            player.y = this.corrector.correct(player.y, serverPlayerState.y, totalError);
        }
        // Small errors (<15px): trust client prediction, don't correct

        // Always sync score from server (authoritative)
        player.score = serverPlayerState.score;
    }

    /**
     * Replay inputs from ackTick+1 to current tick
     * Re-applies local inputs that the server hasn't acknowledged yet,
     * allowing the client to predict forward from the corrected position.
     * @param {number} ackTick - The last client tick acknowledged by the host
     */
    replayInputs(ackTick) {
        const currentTick = this.game.tick;

        // Get sorted ticks to replay (ackTick+1 through currentTick)
        const ticksToReplay = Array.from(this.inputBuffer.keys())
            .filter(t => t > ackTick && t <= currentTick)
            .sort((a, b) => a - b);

        if (ticksToReplay.length === 0) return;

        // Replay each input: apply input then advance position
        const player = this.getLocalPlayer();
        if (!player) return;

        for (const tick of ticksToReplay) {
            const input = this.inputBuffer.get(tick);
            if (input) {
                // Apply input (changes velocity)
                this.applyLocalInput(input);

                // Advance position by one step (same logic as predictLocalPlayer)
                player.x += player.velocityX * player.speedFactor;
                player.y += player.velocityY * player.speedFactor;
                player.velocityY += 0.1;
                if (player.velocityY > 2.0) player.velocityY = 2.0;
                player.bounds();
            }
        }
    }

    /**
     * Sync authoritative game state from server
     * Client NEVER triggers game outcomes - only accepts them from server
     * @param {Object} serverState - Server state
     */
    syncGameState(serverState) {
        // Sync currBasket, timer, goldSpawned
        this.game.currBasket = serverState.currBasket;
        this.game.timer = serverState.timer;
        this.game.goldSpawned = serverState.goldSpawned;

        // Accept authoritative game state from server
        // This is the ONLY place where the client can transition to GAME_OVER
        if (serverState.gameState === GameState.GAME_OVER && this.game.state !== GameState.GAME_OVER) {
            this.game.winner = serverState.winner;
            this.game.state = GameState.GAME_OVER;
            this.game.assets.playSound('win');
            this.game.resetGameObjects();
        }
    }

    /**
     * Clean up acknowledged inputs from buffer
     * @param {number} ackTick - The last tick acknowledged by host
     */
    cleanupInputBuffer(ackTick) {
        const toDelete = [];
        for (const tick of this.inputBuffer.keys()) {
            if (tick <= ackTick) {
                toDelete.push(tick);
            }
        }
        for (const tick of toDelete) {
            this.inputBuffer.delete(tick);
        }
    }

    /**
     * Reset the prediction system (e.g., when leaving a game)
     */
    reset() {
        this.inputBuffer.clear();
        this.snapshotBuffer = [];
        this.lastServerTick = 0;
        this.tickOffset = 0;
    }
}
