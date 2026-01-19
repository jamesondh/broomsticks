import {
  PHYSICS,
  DIMENSIONS,
  FIELD,
  SCORING,
  TIMING,
  AI_DIFFICULTY_MAP,
} from "./constants";
import type { GameConfig, AIDifficulty } from "./types";

/**
 * Default game configuration matching original Broomsticks gameplay.
 */
export const DEFAULT_CONFIG: GameConfig = {
  // Physics
  gravity: PHYSICS.GRAVITY,
  acceleration: PHYSICS.ACCELERATION,
  maxSpeed: PHYSICS.MAX_SPEED,
  terminalVelocity: PHYSICS.TERMINAL_VELOCITY,
  diveEnabled: true,
  diveAcceleration: PHYSICS.ACCELERATION * 1.5,

  // Scoring
  winScore: SCORING.WIN_SCORE,
  pointsPerGoal: SCORING.POINTS_PER_GOAL,
  goalDetectionRadius: DIMENSIONS.GOAL_DETECTION_RADIUS,

  // Balls
  redBallCount: 1,
  blackBallCount: 2,
  goldBallEnabled: false,
  goldBallSpawnDelay: TIMING.GOLD_BALL_SPAWN_DELAY,
  goldBallPoints: SCORING.GOLD_BALL_POINTS,

  // Players
  playerCount: 2,
  passingEnabled: false,

  // AI
  aiDifficulty: "medium",
  aiSmartValue: AI_DIFFICULTY_MAP.medium,

  // Time
  timeLimit: null,

  // Field
  fieldWidth: FIELD.WIDTH,
  fieldHeight: FIELD.HEIGHT,
};

/**
 * Create a game config with custom overrides.
 */
export function createConfig(overrides: Partial<GameConfig> = {}): GameConfig {
  const config = { ...DEFAULT_CONFIG, ...overrides };

  // Sync AI smart value with difficulty if difficulty changed
  if (overrides.aiDifficulty && !overrides.aiSmartValue) {
    config.aiSmartValue = AI_DIFFICULTY_MAP[config.aiDifficulty];
  }

  return config;
}

/**
 * Get the smart value for an AI difficulty level.
 */
export function getAISmartValue(difficulty: AIDifficulty): number {
  return AI_DIFFICULTY_MAP[difficulty];
}
