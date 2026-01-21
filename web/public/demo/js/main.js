// main.js - Entry point for Broomsticks HTML5 Port

import { Game } from './Game.js';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');

    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }

    // Create and initialize the game
    const game = new Game(canvas);
    game.init().catch(err => {
        console.error('Failed to initialize game:', err);
    });

    // Make game accessible for debugging
    window.game = game;
});
