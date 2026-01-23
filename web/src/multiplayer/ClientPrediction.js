// ClientPrediction.js - Local-first client prediction with full simulation
// Runs the entire game simulation locally, treating network updates as corrections

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
 * ClientPrediction - Full local simulation with server reconciliation
 *
 * Instead of only predicting the local player, this system:
 * 1. Runs the FULL game simulation locally (all players, all balls)
 * 2. Smoothly corrects toward server state when updates arrive
 * 3. Replays unacknowledged inputs after correction if needed
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
     * Run full simulation for ALL entities - called every physics tick
     * This is the core of local-first prediction
     * @param {Object} localInput - Current input from local player
     */
    runFullSimulation(localInput) {
        // 1. Apply local input to local player
        this.applyLocalInput(localInput);
        this.recordInput(this.game.tick, localInput);

        // 2. Run full physics for ALL entities
        this.runFullPhysics();
    }

    /**
     * Run physics simulation for all game entities
     * IMPORTANT: Must match exact order of host tick in Game.js:
     * checkCollisions -> checkCaught -> checkGoldBallTimer -> moveFlyers
     */
    runFullPhysics() {
        // 1. Run collision checks BEFORE movement (matches host order)
        this.game.physics.checkCollisions();
        this.game.physics.checkCaught();
        this.game.physics.checkGoldBallTimer();

        // 2. Move all flyers AFTER collision checks (matches host moveFlyers())
        // Move players (with robot AI disabled to prevent local AI execution)
        for (const player of this.game.players) {
            const wasRobot = player.isRobot;
            player.isRobot = false;
            player.move();
            player.isRobot = wasRobot;
        }

        // Move balls (will use seeded random once Phase 3 is implemented)
        for (const ball of this.game.balls) {
            ball.move();
        }
    }

    /**
     * Reconcile local prediction with authoritative server state
     * Called when server state arrives - applies smooth corrections
     * @param {Object} serverState - The state received from the server
     */
    reconcile(serverState) {
        if (!serverState.tick) return;

        const serverTick = serverState.tick;
        const ackClientTick = serverState.ackClientTick || 0;
        this.lastServerTick = serverTick;

        // Update tick offset for authoritative tick calculation
        // This ensures seeded random uses the same tick on client and host
        this.tickOffset = serverTick - this.game.tick;

        // 1. Reconcile local player (snap/smooth to server position)
        this.reconcileLocalPlayer(serverState);

        // 2. Replay unacknowledged inputs to re-predict from corrected state
        this.replayInputs(ackClientTick);

        // 3. Smooth correct remote player position
        this.correctRemotePlayer(serverState);

        // 4. Smooth correct ball positions
        this.correctBalls(serverState);

        // 5. Sync authoritative game state
        this.syncGameState(serverState);

        // 6. Clean up acknowledged inputs (use ack, not serverTick)
        this.cleanupInputBuffer(ackClientTick);
    }

    /**
     * Reconcile local player with server state
     * Uses relaxed thresholds to reduce jitter:
     * - Small errors (<15px): trust client, ignore
     * - Medium errors (15-50px): smooth blend toward server
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
            // Medium error: smooth blend toward server
            player.x = this.corrector.correct(player.x, serverPlayerState.x, totalError);
            player.y = this.corrector.correct(player.y, serverPlayerState.y, totalError);
            player.velocityX = serverPlayerState.vx;
            player.velocityY = serverPlayerState.vy;
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
                // Advance position by one step (player.move() applies velocity to position)
                const wasRobot = player.isRobot;
                player.isRobot = false;
                player.move();
                player.isRobot = wasRobot;
            }
        }
    }

    /**
     * Smooth correct remote player toward server position
     * @param {Object} serverState - Server state
     */
    correctRemotePlayer(serverState) {
        const remotePlayer = this.getRemotePlayer();
        if (!remotePlayer) return;

        const remoteIndex = this.localPlayerIndex === 0 ? 1 : 0;
        const serverPlayerState = serverState.players[remoteIndex];
        if (!serverPlayerState) return;

        // Calculate error
        const errorX = Math.abs(remotePlayer.x - serverPlayerState.x);
        const errorY = Math.abs(remotePlayer.y - serverPlayerState.y);
        const totalError = Math.sqrt(errorX * errorX + errorY * errorY);

        // Apply smooth correction
        remotePlayer.x = this.corrector.correct(remotePlayer.x, serverPlayerState.x, totalError);
        remotePlayer.y = this.corrector.correct(remotePlayer.y, serverPlayerState.y, totalError);

        // Directly update velocity (for accurate extrapolation next frame)
        remotePlayer.velocityX = serverPlayerState.vx;
        remotePlayer.velocityY = serverPlayerState.vy;

        // Sync other authoritative state
        remotePlayer.score = serverPlayerState.score;
        if (remotePlayer.model !== serverPlayerState.model) {
            remotePlayer.model = serverPlayerState.model;
        }
    }

    /**
     * Smooth correct ball positions toward server state
     * @param {Object} serverState - Server state
     */
    correctBalls(serverState) {
        serverState.balls.forEach((ballState, index) => {
            const ball = this.game.balls[index];
            if (!ball) return;

            // Calculate error
            const errorX = Math.abs(ball.x - ballState.x);
            const errorY = Math.abs(ball.y - ballState.y);
            const totalError = Math.sqrt(errorX * errorX + errorY * errorY);

            // Apply smooth correction
            ball.x = this.corrector.correct(ball.x, ballState.x, totalError);
            ball.y = this.corrector.correct(ball.y, ballState.y, totalError);

            // Directly update velocity
            ball.velocityX = ballState.vx;
            ball.velocityY = ballState.vy;

            // Sync alive state for ALL balls (not just gold balls)
            // This fixes the freeze bug where caught balls stay visible on client
            ball.alive = ballState.alive;
        });
    }

    /**
     * Sync authoritative game state from server
     * @param {Object} serverState - Server state
     */
    syncGameState(serverState) {
        this.game.currBasket = serverState.currBasket;
        this.game.timer = serverState.timer;
        this.game.goldSpawned = serverState.goldSpawned;
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
        this.lastServerTick = 0;
        this.tickOffset = 0;
    }
}
