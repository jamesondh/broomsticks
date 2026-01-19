import { DIMENSIONS } from "../constants";
import type { Person } from "../entities/Person";
import type { Ball } from "../entities/Ball";

/**
 * Result of collision detection between entities.
 */
export interface CollisionEvent {
  type:
    | "player-player"
    | "player-black-ball"
    | "player-catch-ball"
    | "player-bump-ball";
  bumpedPlayerIndex?: number;
  catcherIndex?: number;
  ballIndex?: number;
}

/**
 * Check if two rectangles overlap (AABB collision).
 */
export function checkAABBCollision(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

/**
 * Check distance-based collision (circular).
 */
export function checkDistanceCollision(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  radius: number
): boolean {
  const dx = ax - bx;
  const dy = ay - by;
  return Math.abs(dx) < radius && Math.abs(dy) < radius;
}

/**
 * Check and handle all player-player collisions.
 * Lower player gets bumped when they collide.
 */
export function checkPlayerCollisions(players: Person[]): CollisionEvent[] {
  const events: CollisionEvent[] = [];

  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const p1 = players[i];
      const p2 = players[j];

      // Use slightly smaller hitbox (w-4, h-4 from original)
      const dx = p1.x - p2.x;
      const dy = p1.y - p2.y;
      const collisionWidth = p1.width - 4;
      const collisionHeight = p1.height - 4;

      if (
        Math.abs(dx) < collisionWidth &&
        Math.abs(dy) < collisionHeight
      ) {
        // Bump the lower player
        if (p1.y < p2.y) {
          p2.bump();
          events.push({ type: "player-player", bumpedPlayerIndex: j });
        } else if (p2.y < p1.y) {
          p1.bump();
          events.push({ type: "player-player", bumpedPlayerIndex: i });
        }
        // If same height, no bump
      }
    }
  }

  return events;
}

/**
 * Check and handle player-ball collisions.
 * Red balls: can be caught
 * Black balls: bump the player
 */
export function checkPlayerBallCollisions(
  players: Person[],
  balls: Ball[]
): CollisionEvent[] {
  const events: CollisionEvent[] = [];

  for (let pi = 0; pi < players.length; pi++) {
    const player = players[pi];

    for (let bi = 0; bi < balls.length; bi++) {
      const ball = balls[bi];

      if (!ball.alive) continue;
      if (ball.caught && ball.caughtByIndex === pi) continue; // Already holding

      // Use center-offset collision detection (+8 offset from original)
      const dx = player.x + 8 - ball.x;
      const dy = player.y + 8 - ball.y;
      const radius = DIMENSIONS.CATCH_RADIUS;

      if (Math.abs(dx) < radius && Math.abs(dy) < radius) {
        if (ball.isBumper()) {
          // Black ball bumps player
          player.bump();
          events.push({
            type: "player-black-ball",
            bumpedPlayerIndex: pi,
            ballIndex: bi,
          });
        } else if (ball.isCatchable() && !ball.caught) {
          // Red/gold ball can be caught
          ball.setCaught(pi);
          player.heldBallIndex = bi;
          events.push({
            type: "player-catch-ball",
            catcherIndex: pi,
            ballIndex: bi,
          });
        }
      }
    }
  }

  return events;
}

/**
 * Run all collision checks and return events.
 */
export function runCollisionDetection(
  players: Person[],
  balls: Ball[]
): CollisionEvent[] {
  const events: CollisionEvent[] = [];

  // Player vs player
  events.push(...checkPlayerCollisions(players));

  // Player vs ball
  events.push(...checkPlayerBallCollisions(players, balls));

  return events;
}

/**
 * Reset caught state for all balls before new collision checks.
 */
export function resetBallsCaughtState(balls: Ball[]): void {
  for (const ball of balls) {
    ball.resetCaught();
  }
}
