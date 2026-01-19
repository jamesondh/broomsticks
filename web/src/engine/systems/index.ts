export {
  createPhysicsState,
  calculatePhysicsSteps,
  updatePhysics,
  updateCaughtBallPositions,
  getInterpolatedPosition,
} from "./Physics";
export type { PhysicsState } from "./Physics";

export {
  checkAABBCollision,
  checkDistanceCollision,
  checkPlayerCollisions,
  checkPlayerBallCollisions,
  runCollisionDetection,
  resetBallsCaughtState,
} from "./Collision";
export type { CollisionEvent } from "./Collision";

export {
  checkGoal,
  checkAllGoals,
  applyGoals,
  checkWinCondition,
  createScore,
  getTeamWithPossession,
} from "./Scoring";

export {
  createEmptyInput,
  createInput,
  hasActiveInput,
  mergeInputs,
  InputManager,
  ManualInputSource,
} from "./Input";
export type { InputSource } from "./Input";
