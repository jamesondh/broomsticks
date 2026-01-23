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
    MAIN_MENU: 'main_menu',
    HELP_MENU: 'help_menu',
    RULES: 'rules',
    CONTROLS: 'controls',
    PRE_GAME: 'pre_game',
    ONLINE_MENU: 'online_menu',
    MATCHMAKING: 'matchmaking',
    PRIVATE_ROOM_MENU: 'private_room_menu',
    LOBBY: 'lobby',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'game_over'
};

// Game modes
export const GameMode = {
    SINGLE: 'single',
    LOCAL: 'local',
    ONLINE: 'online'
};

// AI difficulty levels
export const AIDifficulty = {
    EASY: 'easy',
    MEDIUM: 'medium',
    HARD: 'hard'
};

// AI difficulty settings (smart = lower is harder, reactionDelay = frames before responding)
export const AI_DIFFICULTY_SETTINGS = {
    easy:   { smart: 30, reactionDelay: 8 },
    medium: { smart: 20, reactionDelay: 4 },
    hard:   { smart: 10, reactionDelay: 0 }
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
    MAIN_MENU: {
        singlePlayer:    { x: 214, y: 140, w: 200, h: 35 },
        localMultiplayer: { x: 214, y: 185, w: 200, h: 35 },
        online:          { x: 214, y: 230, w: 200, h: 35 },
        helpIcon:        { x: 580, y: 20, w: 30, h: 30 },
        guestbook:       { x: 180, y: 290, w: 120, h: 20 },
        github:          { x: 320, y: 290, w: 120, h: 20 }
    },
    HELP_MENU: {
        rules:    { x: 214, y: 180, w: 200, h: 35 },
        controls: { x: 214, y: 225, w: 200, h: 35 },
        back:     { x: 280, y: 290, w: 60, h: 20 }
    },
    RULES: {
        back: { x: 280, y: 320, w: 60, h: 20 }
    },
    CONTROLS: {
        back: { x: 280, y: 320, w: 60, h: 20 }
    },
    PRE_GAME: {
        // Difficulty buttons (single player)
        diffEasy:   { x: 244, y: 165, w: 60, h: 25 },
        diffMedium: { x: 314, y: 165, w: 70, h: 25 },
        diffHard:   { x: 394, y: 165, w: 60, h: 25 },
        // Player count buttons (local multiplayer)
        players2: { x: 270, y: 165, w: 40, h: 25 },
        players4: { x: 320, y: 165, w: 40, h: 25 },
        // Settings toggle and start/back
        settingsToggle: { x: 254, y: 205, w: 120, h: 20 },
        start:          { x: 264, y: 310, w: 100, h: 30 },
        back:           { x: 280, y: 345, w: 60, h: 20 }
    },
    ONLINE_MENU: {
        quickMatch:  { x: 214, y: 180, w: 200, h: 35 },
        privateRoom: { x: 214, y: 225, w: 200, h: 35 },
        back:        { x: 280, y: 290, w: 60, h: 20 }
    },
    MATCHMAKING: {
        cancel: { x: 264, y: 220, w: 100, h: 30 }
    },
    PRIVATE_ROOM_MENU: {
        createRoom: { x: 214, y: 180, w: 200, h: 35 },
        joinRoom:   { x: 214, y: 225, w: 200, h: 35 },
        back:       { x: 280, y: 290, w: 60, h: 20 }
    },
    LOBBY: {
        start: { x: 264, y: 260, w: 100, h: 30 },
        leave: { x: 280, y: 300, w: 60, h: 20 }
    },
    PLAYING: {
        pauseIcon: { x: 10, y: 8, w: 32, h: 15, mainCanvas: true }
    },
    PAUSED: {
        pauseIcon:    { x: 10, y: 8, w: 32, h: 15, mainCanvas: true },
        resume:       { x: 50, y: 45, w: 100, h: 25, modalRelative: true },
        returnToMenu: { x: 25, y: 80, w: 150, h: 25, modalRelative: true }
    },
    GAME_OVER: {
        playAgain: { x: 204, y: 134, w: 230, h: 20 },
        website:   { x: 214, y: 319, w: 225, h: 20 }
    }
};

// Settings screen layout (offscreen canvas coords) - legacy, kept for reference
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

// Pre-game expanded settings layout (4-column grid)
export const PREGAME_SETTINGS_LAYOUT = {
    startX: 60,       // X of first column
    startY: 240,      // Y of first row text baseline
    colWidth: 140,    // Width per column
    lineHeight: 18,   // Vertical spacing
    rowHeight: 16,    // Clickable height per row
    cols: 4,          // Number of columns
    rows: 3,          // Number of rows
    // Settings arranged in grid: [row][col]
    grid: [
        ['dive', 'accel', 'maxSpeed', 'sound'],
        ['redBalls', 'blackBalls', 'goldBalls', 'goldPoints'],
        ['duration', 'winScore', 'playerImg', 'bgImg']
    ]
};
