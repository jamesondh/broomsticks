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
    dive: true,
    accel: 2,
    maxSpeed: 5,
    redBalls: 1,
    blackBalls: 2,
    goldBalls: 0,
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

// Pause modal dimensions (used by renderer and input handler)
export const PAUSE_MODAL = {
    width: 200,
    height: 120,
    get x() { return (CANVAS_WIDTH - this.width) / 2; },
    get y() { return (CANVAS_HEIGHT - this.height) / 2; }
};

// Button definitions: coords are in offscreen canvas space unless marked otherwise
// InputHandler applies OFFSET_X/OFFSET_Y for hit testing on offscreen buttons
export const BUTTONS = {
    MODE_SELECT: {
        singlePlayer: { x: 139, y: 174, w: 120, h: 50 },
        twoPlayer:    { x: 389, y: 174, w: 120, h: 50 },
        guestbook:    { x: 214, y: 259, w: 200, h: 30 },
        github:       { x: 248, y: 317, w: 118, h: 16 }
    },
    SETTINGS: {
        continueBtn:  { x: 204, y: 280, w: 230, h: 25 }
    },
    RULES: {
        continueBtn:  { x: 204, y: 134, w: 230, h: 20 }
    },
    READY: {
        startBtn:     { x: 204, y: 134, w: 230, h: 20 }
    },
    PLAYING: {
        pauseIcon:    { x: 10, y: 8, w: 32, h: 15, mainCanvas: true }
    },
    PAUSED: {
        pauseIcon:    { x: 10, y: 8, w: 32, h: 15, mainCanvas: true },
        resume:       { x: 50, y: 45, w: 100, h: 25, modalRelative: true },
        returnToMenu: { x: 25, y: 80, w: 150, h: 25, modalRelative: true }
    },
    GAME_OVER: {
        playAgain:    { x: 204, y: 134, w: 230, h: 20 },
        website:      { x: 214, y: 319, w: 225, h: 20 }
    }
};

// Settings screen layout (offscreen canvas coords)
export const SETTINGS_LAYOUT = {
    startY: 165,      // Y of first row text baseline
    lineHeight: 18,   // Vertical spacing
    rowHeight: 16,    // Clickable height per row
    left: {
        textX: 200,   // Text draw position
        hitX: 190,    // Hitbox start (10px padding left of text)
        hitW: 120,    // Hitbox width
    },
    right: {
        textX: 320,   // Text draw position
        hitX: 310,    // Hitbox start (10px padding left of text)
        hitW: 210,    // Hitbox width
        splitAt: 105, // Boundary for left/right click zones (relative to hitX)
    },
};
