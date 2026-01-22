// GameConstants.js - Centralized constants and configuration for Broomsticks

// Canvas dimensions
export const CANVAS_WIDTH = 650;
export const CANVAS_HEIGHT = 430;
export const GAME_WIDTH = 628;
export const GAME_HEIGHT = 368;

// UI offsets (game area positioned within canvas)
export const OFFSET_X = 11;
export const OFFSET_Y = 31;

// Physics constants
export const COLLISION_THRESHOLD = 20;
export const GROUND_Y = 343;
export const UPDATE_INTERVAL = 30; // 30ms per update, matching original Java

// Basket positions
export const LEFT_BASKET_X = 17;
export const RIGHT_BASKET_X = 633;
export const BASKET_Y = 200;

// Sprite dimensions
export const SPRITE_SIZE = 39;

// Colors (matching original Java applet)
export const COLORS = {
    blue: '#0080ff',
    green: '#00a400',
    sky: '#d7d7ff',
    yellow: '#808000',
    gold: '#ffff00'
};

// Font used throughout the game
export const GAME_FONT = '16px MS Sans Serif Extended, Helvetica, Arial, sans-serif';

// Default game settings
export const DEFAULT_SETTINGS = {
    dive: false,
    accel: 2,
    maxSpeed: 5,
    redBalls: 1,
    blackBalls: 2,
    goldBalls: 1,
    goldPoints: 150,
    duration: 60,
    winScore: 50,
    playerImg: '/game/images/players.gif',
    bgImg: '/game/images/sky1.jpg',
    sound: true
};

// Settings options for in-game settings screen
export const SETTINGS_OPTIONS = {
    dive: [false, true],
    accel: [1, 2, 3],
    maxSpeed: [4, 5, 6, 7],
    redBalls: [1, 2, 3],
    blackBalls: [0, 1, 2, 3],
    goldBalls: [0, 1, 2],
    goldPoints: { min: 50, max: 500, step: 10 },
    duration: { min: 5, max: 120, step: 5 },
    winScore: { min: 10, max: 200, step: 10 },
    playerImg: [
        { value: '/game/images/players.gif', label: 'Default' },
        { value: '/game/images/harden.gif', label: 'Harden' },
        { value: '/game/images/ZeldaPLAYERS-ted.gif', label: 'Zelda' },
        { value: '/game/images/playersJeronimus3.gif', label: 'Jeronimus' },
        { value: '/game/images/playersSol.gif', label: 'Sol' },
        { value: '/game/images/playersBen.gif', label: 'Ben' },
        { value: '/game/images/playersDavis.gif', label: 'Davis' },
        { value: '/game/images/playersDBZted.gif', label: 'Dragon Ball Z' },
        { value: '/game/images/playersNess.gif', label: 'Ness' },
        { value: '/game/images/playersXmas.gif', label: 'Christmas' }
    ],
    bgImg: [
        { value: '/game/images/sky1.jpg', label: 'Sky 1' },
        { value: '/game/images/castle1.0.jpg', label: 'Castle' }
    ],
    sound: [true, false]
};

// External URLs
export const GITHUB_URL = 'https://github.com/jamesondh/broomsticks';

// Game states
export const GameState = {
    LOADING: 'loading',
    MODE_SELECT: 'mode_select',
    SETTINGS: 'settings',
    RULES: 'rules',
    READY: 'ready',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'game_over'
};
