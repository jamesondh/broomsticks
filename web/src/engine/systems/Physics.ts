import { PHYSICS, DIMENSIONS } from "../constants";
import type { GameConfig } from "../types";
import type { Ball } from "../entities/Ball";
import type { Person } from "../entities/Person";

/**
 * State for the fixed timestep accumulator.
 */
export interface PhysicsState {
  accumulator: number;
  lastTime: number;
  interpolation: number;
  initialized: boolean;
}

/**
 * Create initial physics state.
 */
export function createPhysicsState(): PhysicsState {
  return {
    accumulator: 0,
    lastTime: 0,
    interpolation: 0,
    initialized: false,
  };
}

/**
 * Calculate how many fixed timestep updates to run.
 * Returns the number of steps and updates the accumulator.
 */
export function calculatePhysicsSteps(
  state: PhysicsState,
  currentTime: number
): number {
  // First frame - initialize lastTime
  if (!state.initialized) {
    state.lastTime = currentTime;
    state.initialized = true;
    return 0;
  }

  // Calculate delta time with cap to prevent spiral of death
  let deltaTime = currentTime - state.lastTime;
  if (deltaTime > PHYSICS.MAX_DELTA) {
    deltaTime = PHYSICS.MAX_DELTA;
  }

  state.lastTime = currentTime;
  state.accumulator += deltaTime;

  // Count how many fixed steps we can take
  let steps = 0;
  while (state.accumulator >= PHYSICS.FIXED_TIMESTEP) {
    state.accumulator -= PHYSICS.FIXED_TIMESTEP;
    steps++;
  }

  // Calculate interpolation factor for rendering
  state.interpolation = state.accumulator / PHYSICS.FIXED_TIMESTEP;

  return steps;
}

/**
 * Update all entities for one fixed timestep.
 */
export function updatePhysics(
  players: Person[],
  balls: Ball[],
  config: GameConfig,
  now: number
): void {
  const dt = PHYSICS.FIXED_TIMESTEP;

  // Update players
  for (const player of players) {
    // Handle destination-based movement
    if (!player.moveTowardDestination(dt)) {
      // Normal physics update
      player.move(dt, config);
    }
  }

  // Update balls
  for (const ball of balls) {
    if (!ball.alive) continue;

    // Caught balls don't move autonomously
    if (ball.caught) continue;

    ball.move(dt, config, now);
  }
}

/**
 * Update caught ball positions to follow their holders.
 */
export function updateCaughtBallPositions(
  players: Person[],
  balls: Ball[]
): void {
  for (const ball of balls) {
    if (!ball.caught || ball.caughtByIndex === null) continue;

    const holder = players[ball.caughtByIndex];
    if (!holder) continue;

    // Position ball relative to player based on facing direction
    if (holder.getFacingDirection() === 0) {
      // Facing right
      ball.x = holder.x + DIMENSIONS.HELD_BALL_X_OFFSET_RIGHT;
    } else {
      // Facing left
      ball.x = holder.x + DIMENSIONS.HELD_BALL_X_OFFSET_LEFT;
    }
    ball.y = holder.y + DIMENSIONS.HELD_BALL_Y_OFFSET;

    // Match holder's velocity
    ball.vx = holder.vx;
    ball.vy = holder.vy;
  }
}

/**
 * Get interpolated position for smooth rendering.
 */
export function getInterpolatedPosition(
  current: { x: number; y: number },
  previous: { x: number; y: number },
  interpolation: number
): { x: number; y: number } {
  return {
    x: previous.x + (current.x - previous.x) * interpolation,
    y: previous.y + (current.y - previous.y) * interpolation,
  };
}
