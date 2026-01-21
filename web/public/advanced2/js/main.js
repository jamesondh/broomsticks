// main.js - Entry point for Broomsticks Advanced
// Reads settings from form overlay before starting game

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
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const settingsOverlay = document.getElementById('settingsOverlay');
    const startBtn = document.getElementById('startBtn');
    const playerImgSelect = document.getElementById('playerImg');
    const settingsIntro = document.getElementById('settingsIntro');

    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }

    // Scale game to fill screen
    scaleGame();
    window.addEventListener('resize', scaleGame);

    // Update intro image when player sprite changes (for Harden special case)
    playerImgSelect.addEventListener('change', () => {
        const playerImg = playerImgSelect.value;
        if (playerImg.includes('harden')) {
            settingsIntro.src = 'images/introHarden.gif';
        } else {
            settingsIntro.src = 'images/intro.gif';
        }
    });

    // Handle start button click
    startBtn.addEventListener('click', async () => {
        // Read settings from form
        const settings = {
            dive: document.getElementById('dive').value === 'yes',
            accel: parseInt(document.getElementById('accel').value, 10),
            maxSpeed: parseInt(document.getElementById('maxspeed').value, 10),
            redBalls: parseInt(document.getElementById('red').value, 10),
            blackBalls: parseInt(document.getElementById('black').value, 10),
            goldBalls: parseInt(document.getElementById('gold').value, 10),
            goldPoints: parseInt(document.getElementById('goldval').value, 10),
            duration: parseInt(document.getElementById('duration').value, 10),
            winScore: parseInt(document.getElementById('winscore').value, 10),
            playerImg: document.getElementById('playerImg').value,
            bgImg: document.getElementById('bgImg').value,
            sound: document.getElementById('sound').value === 'on'
        };

        console.log('Starting game with settings:', settings);

        // Hide settings overlay
        settingsOverlay.classList.add('hidden');

        // Create and initialize the game with settings
        const game = new Game(canvas, settings);
        await game.init();

        // Make game accessible for debugging
        window.game = game;
    });
});
