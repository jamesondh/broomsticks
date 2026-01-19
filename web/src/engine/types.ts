import type { AI_DIFFICULTY_MAP } from "./constants";

/**
 * Player input state for a single frame.
 */
export interface PlayerInput {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  pass: boolean;
  timestamp: number;
}

/**
 * Ball type determines behavior and scoring.
 */
export type BallType = "red" | "black" | "gold";

/**
 * Team side (0 = left/red, 1 = right/black).
 */
export type Team = 0 | 1;

/**
 * AI difficulty level.
 */
export type AIDifficulty = keyof typeof AI_DIFFICULTY_MAP;

/**
 * Game state machine states.
 */
export type GameState =
  | "menu"
  | "countdown"
  | "playing"
  | "paused"
  | "scored"
  | "gameOver";

/**
 * Configuration for a game session.
 */
export interface GameConfig {
  // Physics
  gravity: number;
  acceleration: number;
  maxSpeed: number;
  terminalVelocity: number;
  diveEnabled: boolean;
  diveAcceleration: number;

  // Scoring
  winScore: number;
  pointsPerGoal: number;
  goalDetectionRadius: number;

  // Balls
  redBallCount: number;
  blackBallCount: number;
  goldBallEnabled: boolean;
  goldBallSpawnDelay: number;
  goldBallPoints: number;

  // Players
  playerCount: 2 | 4;
  passingEnabled: boolean;

  // AI
  aiDifficulty: AIDifficulty;
  aiSmartValue: number;

  // Time
  timeLimit: number | null;

  // Field
  fieldWidth: number;
  fieldHeight: number;
}

/**
 * Score state for both teams.
 */
export interface Score {
  left: number;
  right: number;
}

/**
 * Serializable entity position/velocity state.
 */
export interface EntityState {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

/**
 * Serializable ball state.
 */
export interface BallState extends EntityState {
  type: BallType;
  caught: boolean;
  caughtByIndex: number | null;
  alive: boolean;
}

/**
 * Serializable person state.
 */
export interface PersonState extends EntityState {
  team: Team;
  isRobot: boolean;
  model: number;
  heldBallIndex: number | null;
}

/**
 * Complete serializable game state snapshot.
 */
export interface GameSnapshot {
  state: GameState;
  tick: number;
  score: Score;
  players: PersonState[];
  balls: BallState[];
  countdownSeconds: number | null;
  winner: Team | null;
  /** Which team currently has possession of the red ball (for goal highlighting) */
  possession: Team | null;
}

/**
 * Result of a goal being scored.
 */
export interface GoalEvent {
  team: Team;
  points: number;
  ballType: BallType;
}

/**
 * Result of a collision check.
 */
export interface CollisionResult {
  collided: boolean;
  type?: "player-player" | "player-ball" | "ball-catch";
  bumpedPlayerIndex?: number;
  caughtBallIndex?: number;
}

/**
 * Bounds for entity movement.
 */
export interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}
