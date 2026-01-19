// Constants
export {
  PHYSICS,
  DIMENSIONS,
  FIELD,
  AI,
  AI_DIFFICULTY_MAP,
  SCORING,
  TIMING,
} from "./constants";

// Configuration
export { DEFAULT_CONFIG, createConfig, getAISmartValue } from "./config";

// Types
export type {
  PlayerInput,
  BallType,
  Team,
  AIDifficulty,
  GameState,
  GameConfig,
  Score,
  EntityState,
  BallState,
  PersonState,
  GameSnapshot,
  GoalEvent,
  CollisionResult,
  Bounds,
} from "./types";

// Entities
export { FlyingObject, Ball, GoldBall, Person } from "./entities";
export type {
  FlyingObjectOptions,
  BallOptions,
  PersonOptions,
} from "./entities";

// Systems
export {
  createPhysicsState,
  calculatePhysicsSteps,
  updatePhysics,
  updateCaughtBallPositions,
  getInterpolatedPosition,
  checkAABBCollision,
  checkPlayerCollisions,
  checkPlayerBallCollisions,
  runCollisionDetection,
  resetBallsCaughtState,
  checkGoal,
  checkAllGoals,
  applyGoals,
  checkWinCondition,
  createScore,
  getTeamWithPossession,
  createEmptyInput,
  createInput,
  hasActiveInput,
  mergeInputs,
  InputManager,
  ManualInputSource,
} from "./systems";
export type { PhysicsState, CollisionEvent, InputSource } from "./systems";

// Game
export { Game } from "./Game";
export type { GameEvent, GameEventListener } from "./Game";
