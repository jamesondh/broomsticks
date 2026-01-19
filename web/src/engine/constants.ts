/**
 * Physics constants for the game engine.
 * Based on original C++/Java implementations.
 */
export const PHYSICS = {
  /** Gravity applied per frame when vy < terminal velocity */
  GRAVITY: 0.1,
  /** Acceleration applied when moving */
  ACCELERATION: 2.0,
  /** Maximum horizontal/vertical speed (matches original Java) */
  MAX_SPEED: 4.0,
  /** Maximum falling speed (gravity caps here) */
  TERMINAL_VELOCITY: 2.0,
  /** Fixed timestep in milliseconds (~33 Hz, matches original Java 30ms interval) */
  FIXED_TIMESTEP: 30,
  /** Maximum delta time to prevent spiral of death */
  MAX_DELTA: 100,
  /** Original frame time the physics was designed for (30ms per update) */
  ORIGINAL_FRAME_TIME: 30,
} as const;

/**
 * Entity dimensions in pixels.
 * Based on original sprite sizes.
 */
export const DIMENSIONS = {
  /** Player sprite width */
  PLAYER_WIDTH: 38,
  /** Player sprite height */
  PLAYER_HEIGHT: 38,
  /** Ball sprite width */
  BALL_WIDTH: 16,
  /** Ball sprite height */
  BALL_HEIGHT: 16,
  /** Gold ball sprite width */
  GOLD_BALL_WIDTH: 8,
  /** Gold ball sprite height */
  GOLD_BALL_HEIGHT: 8,
  /** Radius for catching/collision detection */
  CATCH_RADIUS: 20,
  /** Radius for player-player collision */
  PLAYER_COLLISION_RADIUS: 28,
  /** Radius for goal detection (vertical tolerance) */
  GOAL_DETECTION_RADIUS: 20,
  /** Y position of basket opening (center of goal zone) */
  BASKET_Y: 175,
  /** X position of left basket */
  BASKET_LEFT_X: 17,
  /** Offset from right edge for right basket */
  BASKET_RIGHT_X_OFFSET: 17,
} as const;

/**
 * Default field dimensions.
 * Can be overridden by game config.
 */
export const FIELD = {
  /** Default field width */
  WIDTH: 640,
  /** Default field height */
  HEIGHT: 400,
  /** Minimum Y bound (ceiling) */
  MIN_Y: 0,
  /** Ground Y position (calculated as HEIGHT - ground margin) */
  GROUND_MARGIN: 20,
} as const;

/**
 * AI behavior constants.
 */
export const AI = {
  /** Interval between AI decisions in milliseconds */
  DECISION_INTERVAL: 100,
  /** Distance threshold for ball targeting */
  TARGETING_THRESHOLD: 100,
  /** Distance from goal before AI goes offensive */
  OFFENSIVE_DISTANCE: 50,
} as const;

/**
 * AI difficulty presets.
 * Lower values = smarter AI.
 */
export const AI_DIFFICULTY_MAP = {
  easy: 30,
  medium: 15,
  hard: 6,
  expert: 1,
} as const;

/**
 * Scoring constants.
 */
export const SCORING = {
  /** Points awarded per goal */
  POINTS_PER_GOAL: 10,
  /** Points required to win */
  WIN_SCORE: 50,
  /** Gold ball point value */
  GOLD_BALL_POINTS: 150,
} as const;

/**
 * Game timing constants.
 */
export const TIMING = {
  /** Countdown duration in seconds */
  COUNTDOWN_SECONDS: 3,
  /** Duration to show "scored" state in milliseconds */
  SCORED_DISPLAY_DURATION: 1500,
  /** Gold ball spawn delay in milliseconds */
  GOLD_BALL_SPAWN_DELAY: 30000,
} as const;
