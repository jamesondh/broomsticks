// GameConstants.js - Centralized constants and configuration for Broomsticks

// Debug flag - set to true to render red hitbox outlines
export const DEBUG_HITBOXES = false;

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
    bgImg: null,
    sound: true,
    volume: 1.0
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
        { value: '/game/images/playersJeronimus3.gif', label: 'Jeron' },
        { value: '/game/images/playersSol.gif', label: 'Sol' },
        { value: '/game/images/playersBen.gif', label: 'Ben' },
        { value: '/game/images/playersDavis.gif', label: 'Davis' },
        { value: '/game/images/playersDBZted.gif', label: 'DBZ' },
        { value: '/game/images/playersNess.gif', label: 'Ness' },
        { value: '/game/images/playersXmas.gif', label: 'Xmas' }
    ],
    bgImg: [
        { value: null, label: 'Solid' },
        { value: '/game/images/sky1.jpg', label: 'Sky' },
        { value: '/game/images/sky3.jpg', label: 'Blue Sky' },
        { value: '/game/images/sky-cpp.jpg', label: 'Sky (v2)' },
        { value: '/game/images/castle.jpg', label: 'Castle' },
        { value: '/game/images/diagon-alley.jpg', label: 'Diagon Alley' },
        { value: '/game/images/leeds-castle.jpg', label: 'Leeds Castle' },
        { value: '/game/images/winter.jpg', label: 'Winter' }
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
    JOIN_ROOM: 'join_room',
    LOBBY: 'lobby',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'game_over'
};

// Network modes for online multiplayer
export const NetworkMode = {
    OFFLINE: 'offline',
    HOST: 'host',
    CLIENT: 'client'
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
    HARD: 'hard',
    EXPERT: 'expert'
};

// AI difficulty settings (smart = lower is harder, reactionDelay = frames before responding)
export const AI_DIFFICULTY_SETTINGS = {
    easy: { smart: 30, reactionDelay: 8 },
    medium: { smart: 20, reactionDelay: 4 },
    hard: { smart: 10, reactionDelay: 0 },
    expert: { smart: 1, reactionDelay: 0 }
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
        singlePlayer: { x: 214, y: 140, w: 200, h: 35 },
        localMultiplayer: { x: 214, y: 185, w: 200, h: 35 },
        online: { x: 214, y: 230, w: 200, h: 35 },
        helpIcon: { x: 580, y: 20, w: 30, h: 30 },
        volumeIcon: { x: 580, y: 55, w: 30, h: 30 },
        guestbook: { x: 240, y: 280, w: 55, h: 20 },
        github: { x: 340, y: 280, w: 35, h: 20 }
    },
    HELP_MENU: {
        rules: { x: 214, y: 180, w: 200, h: 35 },
        controls: { x: 214, y: 225, w: 200, h: 35 },
        back: { x: 290, y: 290, w: 60, h: 20 }
    },
    RULES: {
        back: { x: 290, y: 310, w: 60, h: 20 }
    },
    CONTROLS: {
        back: { x: 290, y: 290, w: 60, h: 20 }
    },
    PRE_GAME: {
        // Difficulty buttons (single player)
        diffEasy: { x: 214, y: 150, w: 50, h: 25 },
        diffMedium: { x: 274, y: 150, w: 55, h: 25 },
        diffHard: { x: 339, y: 150, w: 50, h: 25 },
        diffExpert: { x: 399, y: 150, w: 55, h: 25 },
        // Player count buttons (local multiplayer)
        players2: { x: 290, y: 150, w: 40, h: 25 },
        players4: { x: 340, y: 150, w: 40, h: 25 },
        // Start/back
        start: { x: 264, y: 275, w: 100, h: 30 },
        back: { x: 290, y: 310, w: 60, h: 20 }
    },
    ONLINE_MENU: {
        quickMatch: { x: 214, y: 180, w: 200, h: 35 },
        privateRoom: { x: 214, y: 225, w: 200, h: 35 },
        back: { x: 290, y: 290, w: 60, h: 20 }
    },
    MATCHMAKING: {
        cancel: { x: 264, y: 220, w: 100, h: 30 }
    },
    PRIVATE_ROOM_MENU: {
        createRoom: { x: 214, y: 180, w: 200, h: 35 },
        joinRoom: { x: 214, y: 225, w: 200, h: 35 },
        back: { x: 290, y: 290, w: 60, h: 20 }
    },
    JOIN_ROOM: {
        codeInput: { x: 214, y: 180, w: 200, h: 35 },
        join: { x: 264, y: 250, w: 100, h: 30 },
        back: { x: 290, y: 290, w: 60, h: 20 }
    },
    LOBBY: {
        start: { x: 264, y: 277, w: 100, h: 30 },
        leave: { x: 300, y: 315, w: 60, h: 20 },
        copyLink: { x: 165, y: 160, w: 60, h: 22 } // below room code
    },
    PLAYING: {
        pauseIcon: { x: 10, y: 8, w: 32, h: 15, mainCanvas: true }
    },
    PAUSED: {
        pauseIcon: { x: 10, y: 8, w: 32, h: 15, mainCanvas: true },
        resume: { x: 50, y: 45, w: 90, h: 25, modalRelative: true },
        returnToMenu: { x: 25, y: 80, w: 140, h: 25, modalRelative: true }
    },
    GAME_OVER: {
        playAgain: { x: 204, y: 200, w: 230, h: 20 },
        website: { x: 214, y: 319, w: 225, h: 20 }
    }
};

// Pre-game expanded settings layout (4-column grid)
export const PREGAME_SETTINGS_LAYOUT = {
    startX: 114,       // X of first column
    startY: 212,      // Y of first row text baseline
    colWidth: 100,    // Width per column
    lineHeight: 18,   // Vertical spacing
    rowHeight: 16,    // Clickable height per row
    cols: 4,          // Number of columns
    rows: 3,          // Number of rows
    // Settings arranged in grid: [row][col]
    grid: [
        ['dive', 'accel', 'maxSpeed', 'sound'],
        ['redBalls', 'blackBalls', 'goldBalls', 'goldPoints'],
        ['duration', 'winScore', 'playerImg', 'bgImg']
    ],
    // Hitbox offsets for two-way < > controls (relative to cell start)
    // Each defines the x-offset where the < and > arrows are clickable
    twoWayHitboxes: {
        goldPoints: { leftStart: 0, leftEnd: 80, rightStart: 80, rightEnd: 100 },
        duration: { leftStart: 0, leftEnd: 45, rightStart: 45, rightEnd: 100 },
        winScore: { leftStart: 0, leftEnd: 40, rightStart: 40, rightEnd: 100 },
        playerImg: { leftStart: 0, leftEnd: 60, rightStart: 60, rightEnd: 100 },
        bgImg: { leftStart: 0, leftEnd: 45, rightStart: 45, rightEnd: 100 }
    }
};

// Settings shown in online lobby (simulation-affecting only)
export const LOBBY_SETTINGS = [
    'dive', 'accel', 'maxSpeed',           // Row 1: physics
    'redBalls', 'blackBalls', 'goldBalls', // Row 2: balls
    'goldPoints', 'duration', 'winScore'   // Row 2-3: scoring
];

// Lobby settings layout (reuses PREGAME_SETTINGS_LAYOUT grid structure)
export const LOBBY_SETTINGS_LAYOUT = {
    startX: 165,       // X of first column
    startY: 222,       // Y of first row text baseline
    colWidth: 100,      // Width per column
    lineHeight: 18,    // Vertical spacing
    rowHeight: 16,     // Clickable height per row
    cols: 4,           // Number of columns
    rows: 3,           // Number of rows
    // Settings arranged in grid: [row][col] - simulation-affecting only, no sound/playerImg/bgImg
    grid: [
        ['dive', 'accel', 'maxSpeed', null],
        ['redBalls', 'blackBalls', 'goldBalls'],
        ['duration', 'winScore', 'goldPoints', null]
    ],
    // Hitbox offsets for two-way < > controls (same as PREGAME)
    twoWayHitboxes: {
        goldPoints: { leftStart: 0, leftEnd: 80, rightStart: 80, rightEnd: 100 },
        duration: { leftStart: 0, leftEnd: 45, rightStart: 45, rightEnd: 100 },
        winScore: { leftStart: 0, leftEnd: 40, rightStart: 40, rightEnd: 100 }
    }
};
