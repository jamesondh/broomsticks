// main.js - Entry point for Broomsticks Advanced
// Auto-starts game with in-game settings screen

import { Game } from './Game.js';

// Scale the game to fill the screen while maintaining aspect ratio
function scaleGame() {
    const container = document.getElementById('game-container');
    if (!container) return;

    const gameWidth = 650;
    const gameHeight = 430;
    const gameRatio = gameWidth / gameHeight;

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const windowRatio = windowWidth / windowHeight;

    let scale;
    if (windowRatio > gameRatio) {
        // Window is wider than game - fit to height
        scale = windowHeight / gameHeight;
    } else {
        // Window is taller than game - fit to width
        scale = windowWidth / gameWidth;
    }

    container.style.transform = `scale(${scale})`;
}

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', async () => {
    const canvas = document.getElementById('gameCanvas');

    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }

    // Scale game to fill screen
    scaleGame();
    window.addEventListener('resize', scaleGame);

    // Auto-start the game with default settings (null triggers defaults)
    // Settings can be modified in-game on the settings screen
    const game = new Game(canvas, null);
    await game.init();

    // Make game accessible for debugging
    window.game = game;
});
