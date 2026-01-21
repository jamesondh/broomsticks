// main.js - Entry point for Broomsticks 2 HTML5 port

import { Game } from './Game.js';
import { Settings } from './Settings.js';

let game = null;
let settings = null;

// DOM elements
let settingsPanel;
let gameContainer;
let controlsInfo;
let playBtn;

// Setting inputs
let redBallsSelect;
let blackBallsSelect;
let accelSlider;
let accelValue;
let maxSpeedSlider;
let maxSpeedValue;
let winScoreInput;

function init() {
    // Get DOM elements
    settingsPanel = document.getElementById('settings-panel');
    gameContainer = document.getElementById('game-container');
    controlsInfo = document.getElementById('controls-info');
    playBtn = document.getElementById('playBtn');

    redBallsSelect = document.getElementById('redBalls');
    blackBallsSelect = document.getElementById('blackBalls');
    accelSlider = document.getElementById('accel');
    accelValue = document.getElementById('accelValue');
    maxSpeedSlider = document.getElementById('maxSpeed');
    maxSpeedValue = document.getElementById('maxSpeedValue');
    winScoreInput = document.getElementById('winScore');

    // Initialize settings
    settings = new Settings();

    // Load settings into UI
    loadSettingsToUI();

    // Set up event listeners
    setupEventListeners();

    // Initialize game
    const canvas = document.getElementById('gameCanvas');
    game = new Game(canvas, settings);
    game.init();

    // Start watching for game state changes
    startGameStateWatcher();
}

function loadSettingsToUI() {
    const cfg = settings.getAll();

    redBallsSelect.value = cfg.redBalls;
    blackBallsSelect.value = cfg.blackBalls;
    accelSlider.value = cfg.accel;
    accelValue.textContent = cfg.accel.toFixed(1);
    maxSpeedSlider.value = cfg.maxSpeed;
    maxSpeedValue.textContent = cfg.maxSpeed;
    winScoreInput.value = cfg.winScore;
}

function saveSettingsFromUI() {
    settings.set('redBalls', parseInt(redBallsSelect.value));
    settings.set('blackBalls', parseInt(blackBallsSelect.value));
    settings.set('accel', parseFloat(accelSlider.value));
    settings.set('maxSpeed', parseInt(maxSpeedSlider.value));
    settings.set('winScore', parseInt(winScoreInput.value));
}

function setupEventListeners() {
    // Play button
    playBtn.addEventListener('click', startGame);

    // Settings changes
    redBallsSelect.addEventListener('change', () => {
        settings.set('redBalls', parseInt(redBallsSelect.value));
    });

    blackBallsSelect.addEventListener('change', () => {
        settings.set('blackBalls', parseInt(blackBallsSelect.value));
    });

    accelSlider.addEventListener('input', () => {
        const val = parseFloat(accelSlider.value);
        accelValue.textContent = val.toFixed(1);
        settings.set('accel', val);
    });

    maxSpeedSlider.addEventListener('input', () => {
        const val = parseInt(maxSpeedSlider.value);
        maxSpeedValue.textContent = val;
        settings.set('maxSpeed', val);
    });

    winScoreInput.addEventListener('change', () => {
        let val = parseInt(winScoreInput.value);
        if (val < 10) val = 10;
        if (val > 1000) val = 1000;
        winScoreInput.value = val;
        settings.set('winScore', val);
    });
}

function startGameStateWatcher() {
    // Watch for game state changes to show/hide UI
    setInterval(() => {
        if (game && !game.running) {
            showSettings();
        }
    }, 100);
}

function startGame() {
    saveSettingsFromUI();

    // Hide settings, show game
    settingsPanel.classList.add('hidden');
    gameContainer.classList.add('active');
    controlsInfo.classList.add('active');

    game.start();
}

function showSettings() {
    settingsPanel.classList.remove('hidden');
    gameContainer.classList.remove('active');
    controlsInfo.classList.remove('active');
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
