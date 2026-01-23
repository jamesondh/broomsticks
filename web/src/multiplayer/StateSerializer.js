// StateSerializer.js - Game state serialization for network sync

import { NetworkMode } from '../game/GameConstants.js';

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
        tick: game.tick,
        ackClientTick: game.networkManager?.getLastClientTick() || 0,
        players,
        balls,
        currBasket: game.currBasket,
        timer: game.timer,
        goldSpawned: game.goldSpawned
    };
}

/**
 * Apply received state to the game (client-side).
 * Delegates to the prediction system for smooth corrections.
 *
 * @param {Game} game - The game instance
 * @param {Object} state - State object from network
 */
export function apply(game, state) {
    // Only apply on client
    if (game.networkMode !== NetworkMode.CLIENT) return;

    // Delegate to prediction system for smooth corrections
    if (game.prediction) {
        game.prediction.reconcile(state);
    }
}
