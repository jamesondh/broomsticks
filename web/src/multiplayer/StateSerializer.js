// StateSerializer.js - Game state serialization for network sync

/**
 * Serialize game state into a compact object for network transfer.
 * Only includes data needed for rendering on the client side.
 *
 * @param {Game} game - The game instance
 * @returns {Object} Compact state object
 */
export function serialize(game) {
    // Use integer positions and fixed-point velocities (100x) for precise reconciliation
    const players = game.players.map(player => ({
        x: Math.round(player.x),
        y: Math.round(player.y),
        vx: Math.round(player.velocityX * 100),
        vy: Math.round(player.velocityY * 100),
        score: player.score,
        model: player.model
    }));

    const balls = game.balls.map(ball => ({
        x: Math.round(ball.x),
        y: Math.round(ball.y),
        vx: Math.round(ball.velocityX * 100),
        vy: Math.round(ball.velocityY * 100),
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

    if (!skipPositionUpdate) {
        // Update players (decode fixed-point velocities)
        state.players.forEach((playerState, index) => {
            const player = game.players[index];
            if (player) {
                player.x = playerState.x;
                player.y = playerState.y;
                player.velocityX = playerState.vx / 100;
                player.velocityY = playerState.vy / 100;
                player.score = playerState.score;
                if (player.model !== playerState.model) {
                    player.model = playerState.model;
                }
            }
        });

        // Update balls (decode fixed-point velocities)
        state.balls.forEach((ballState, index) => {
            const ball = game.balls[index];
            if (ball) {
                ball.x = ballState.x;
                ball.y = ballState.y;
                ball.velocityX = ballState.vx / 100;
                ball.velocityY = ballState.vy / 100;
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
