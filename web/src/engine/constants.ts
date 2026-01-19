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
  /** Player-player collision hitbox shrink (from original) */
  COLLISION_HITBOX_SHRINK: 4,
  /** Player center offset for ball collision detection (from original) */
  PLAYER_CENTER_OFFSET: 8,
  /** Ball X offset when holder faces right */
  HELD_BALL_X_OFFSET_RIGHT: 18,
  /** Ball X offset when holder faces left */
  HELD_BALL_X_OFFSET_LEFT: 8,
  /** Ball Y offset relative to holder */
  HELD_BALL_Y_OFFSET: 15,
  /** Basket sprite Y offset from BASKET_Y */
  BASKET_SPRITE_Y_OFFSET: 21,
  /** Basket sprite X offset */
  BASKET_SPRITE_X_OFFSET: 7,
  /** Pole start Y offset from basket bottom */
  POLE_Y_OFFSET: 18,
} as const;

/**
 * Get ball dimensions by type.
 */
export function getBallDimensions(type: "red" | "black" | "gold"): {
  width: number;
  height: number;
} {
  if (type === "gold") {
    return { width: DIMENSIONS.GOLD_BALL_WIDTH, height: DIMENSIONS.GOLD_BALL_HEIGHT };
  }
  return { width: DIMENSIONS.BALL_WIDTH, height: DIMENSIONS.BALL_HEIGHT };
}

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
  /** Number of random movement choices for ball autonomy */
  BALL_MOVEMENT_CHOICES: 10,
  /** Ground proximity threshold for ball to fly up */
  BALL_GROUND_THRESHOLD: 90,
} as const;

/**
 * Spawn position constants.
 */
export const SPAWN = {
  /** Player 1 X position */
  PLAYER1_X: 100,
  /** Player 1 Y position */
  PLAYER1_Y: 200,
  /** Player 2 X offset from right edge */
  PLAYER2_X_OFFSET: 120,
  /** Player 2 Y position */
  PLAYER2_Y: 200,
  /** Red ball Y position */
  RED_BALL_Y: 100,
  /** Red ball Y spacing per additional ball */
  RED_BALL_Y_SPACING: 50,
  /** Black ball Y position */
  BLACK_BALL_Y: 200,
  /** Black ball Y spacing per additional ball */
  BLACK_BALL_Y_SPACING: 100,
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
