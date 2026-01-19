import { DIMENSIONS, AI } from "../constants";
import type { BallType, BallState, Bounds, GameConfig } from "../types";
import { FlyingObject } from "./FlyingObject";

/**
 * Options for creating a Ball.
 */
export interface BallOptions {
  type: BallType;
  x: number;
  y: number;
  bounds: Bounds;
}

/**
 * Ball entity that can be caught, bumped, and scored.
 * Red balls can be caught, black balls bump players, gold balls flee.
 */
export class Ball extends FlyingObject {
  /** Ball type determines behavior */
  readonly type: BallType;
  /** Whether ball is currently caught by a player */
  caught: boolean = false;
  /** Index of player holding this ball (null if not caught) */
  caughtByIndex: number | null = null;
  /** Whether ball is active in play */
  alive: boolean = true;
  /** Timer for autonomous movement decisions */
  private lastMoveTime: number = 0;

  constructor(options: BallOptions) {
    const isGold = options.type === "gold";
    super({
      x: options.x,
      y: options.y,
      width: isGold ? DIMENSIONS.GOLD_BALL_WIDTH : DIMENSIONS.BALL_WIDTH,
      height: isGold ? DIMENSIONS.GOLD_BALL_HEIGHT : DIMENSIONS.BALL_HEIGHT,
      bounds: options.bounds,
    });

    this.type = options.type;

    // Gold balls are faster and more agile
    if (isGold) {
      this.maxSpeed *= 2;
      this.accel *= 2;
    }
  }

  /**
   * Update ball position with autonomous movement.
   * @param dt Delta time in milliseconds
   * @param now Current timestamp in milliseconds
   * @param config Game configuration
   */
  override move(dt: number, config: GameConfig, now?: number): void {
    // If not in pass state, make autonomous decisions
    if (!this.isPass && now !== undefined) {
      if (now - this.lastMoveTime >= AI.DECISION_INTERVAL) {
        this.lastMoveTime = now;
        this.makeAutonomousDecision();
      }
    }

    super.move(dt, config);
  }

  /**
   * Make random movement decision (balls have some autonomy).
   */
  private makeAutonomousDecision(): void {
    const choice = Math.floor(Math.random() * AI.BALL_MOVEMENT_CHOICES);

    if (choice === 0) this.up();
    if (choice === 1) this.right();
    if (choice === 2) this.left();

    // Try to stay off the ground
    if (this.y > this.bounds.maxY - AI.BALL_GROUND_THRESHOLD) {
      this.up();
    }
  }

  /**
   * Reset caught state.
   */
  resetCaught(): void {
    this.caught = false;
    this.caughtByIndex = null;
  }

  /**
   * Mark ball as caught by a player.
   */
  setCaught(playerIndex: number): void {
    this.caught = true;
    this.caughtByIndex = playerIndex;
  }

  /**
   * Check if this ball type is catchable (red and gold are catchable).
   */
  isCatchable(): boolean {
    return this.type === "red" || this.type === "gold";
  }

  /**
   * Check if this ball bumps players on contact (black balls).
   */
  isBumper(): boolean {
    return this.type === "black";
  }

  /**
   * Get point value for scoring this ball.
   */
  getPointValue(config: GameConfig): number {
    if (this.type === "gold") {
      return config.goldBallPoints;
    }
    return config.pointsPerGoal;
  }

  /**
   * Reset ball to initial position.
   */
  override reset(): void {
    super.reset();
    this.caught = false;
    this.caughtByIndex = null;
    this.alive = true;
    this.lastMoveTime = 0;
  }

  /**
   * Get serializable state.
   */
  override getState(): BallState {
    return {
      ...super.getState(),
      type: this.type,
      caught: this.caught,
      caughtByIndex: this.caughtByIndex,
      alive: this.alive,
    };
  }

  /**
   * Restore from serialized state.
   */
  override setState(state: BallState): void {
    super.setState(state);
    this.caught = state.caught;
    this.caughtByIndex = state.caughtByIndex;
    this.alive = state.alive;
  }
}

/**
 * Gold ball with fleeing behavior.
 * Moves away from nearby players.
 */
export class GoldBall extends Ball {
  constructor(options: Omit<BallOptions, "type">) {
    super({ ...options, type: "gold" });
  }

  /**
   * Update with flee behavior - move away from nearby players.
   */
  updateFleeAI(
    playerPositions: Array<{ x: number; y: number }>
  ): void {
    const fleeDistance = AI.TARGETING_THRESHOLD;

    // Find the closest player
    let closestDist = Infinity;
    let closestPlayer: { x: number; y: number } | null = null;

    for (const player of playerPositions) {
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < closestDist && dist < fleeDistance) {
        closestDist = dist;
        closestPlayer = player;
      }
    }

    // Flee from closest player
    if (closestPlayer) {
      if (closestPlayer.x < this.x) {
        this.right();
      } else {
        this.left();
      }

      if (closestPlayer.y < this.y) {
        this.down();
      } else {
        this.up();
      }
    }
  }
}
