// StateSerializer.js - Game state serialization for network sync

/**
 * Serialize game state into a compact object for network transfer.
 * Only includes data needed for rendering on the client side.
 *
 * @param {Game} game - The game instance
 * @returns {Object} Compact state object
 */
export function serialize(game) {
    const players = game.players.map(player => ({
        x: Math.round(player.x * 10) / 10,
        y: Math.round(player.y * 10) / 10,
        vx: Math.round(player.velocityX * 10) / 10,
        vy: Math.round(player.velocityY * 10) / 10,
        score: player.score,
        model: player.model
    }));

    const balls = game.balls.map(ball => ({
        x: Math.round(ball.x * 10) / 10,
        y: Math.round(ball.y * 10) / 10,
        vx: Math.round(ball.velocityX * 10) / 10,
        vy: Math.round(ball.velocityY * 10) / 10,
        alive: ball.alive !== false // GoldBall has alive property
    }));

    return {
        tick: game.simTick,  // Simulation tick for sync
        lastProcessedInputTick: game.lastProcessedInputTick || 0,  // For client input acknowledgment (Phase 7)
        players,
        balls,
        currBasket: game.currBasket,
        timer: game.timer,
        goldSpawned: game.goldSpawned,
        gameState: game.state  // Include game state for pause/game over sync
    };
}

/**
 * Apply received state to the game (client-side).
 * Updates positions, velocities, and game state.
 *
 * @param {Game} game - The game instance
 * @param {Object} state - State object from network
 * @param {boolean} skipPositionUpdate - If true, skip position/velocity updates (for client-side prediction)
 */
export function apply(game, state, skipPositionUpdate = false) {
    // Log tick comparison for debugging
    if (state.tick !== undefined) {
        console.log(`[State] Received tick ${state.tick}, local tick ${game.simTick}`);
    }

    if (!skipPositionUpdate) {
        // Update players
        state.players.forEach((playerState, index) => {
            const player = game.players[index];
            if (player) {
                player.x = playerState.x;
                player.y = playerState.y;
                player.velocityX = playerState.vx;
                player.velocityY = playerState.vy;
                player.score = playerState.score;
                if (player.model !== playerState.model) {
                    player.model = playerState.model;
                }
            }
        });

        // Update balls
        state.balls.forEach((ballState, index) => {
            const ball = game.balls[index];
            if (ball) {
                ball.x = ballState.x;
                ball.y = ballState.y;
                ball.velocityX = ballState.vx;
                ball.velocityY = ballState.vy;
                if (ball.isGoldBall) {
                    ball.alive = ballState.alive;
                }
            }
        });
    } else {
        // Even when skipping positions, sync scores from host
        state.players.forEach((playerState, index) => {
            const player = game.players[index];
            if (player) {
                player.score = playerState.score;
                if (player.model !== playerState.model) {
                    player.model = playerState.model;
                }
            }
        });

        // Sync gold ball alive state (catch events)
        state.balls.forEach((ballState, index) => {
            const ball = game.balls[index];
            if (ball && ball.isGoldBall) {
                ball.alive = ballState.alive;
            }
        });
    }

    // Always sync game state
    game.currBasket = state.currBasket;
    game.timer = state.timer;
    game.goldSpawned = state.goldSpawned;

    // Return gameState and tick for caller to handle
    return { gameState: state.gameState, tick: state.tick };
}
