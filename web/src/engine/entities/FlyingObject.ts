import { PHYSICS } from "../constants";
import type { Bounds, EntityState, GameConfig } from "../types";

/**
 * Options for creating a FlyingObject.
 */
export interface FlyingObjectOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  bounds: Bounds;
}

/**
 * Base class for all moving entities in the game.
 * Handles position, velocity, acceleration, and boundary collision.
 */
export class FlyingObject {
  /** Current X position */
  x: number;
  /** Current Y position */
  y: number;
  /** Current X velocity */
  vx: number = 0;
  /** Current Y velocity */
  vy: number = 0;
  /** Entity width */
  readonly width: number;
  /** Entity height */
  readonly height: number;

  /** Initial X position for reset */
  protected readonly initX: number;
  /** Initial Y position for reset */
  protected readonly initY: number;

  /** Movement bounds */
  protected bounds: Bounds;

  /** Acceleration rate */
  protected accel: number = PHYSICS.ACCELERATION;
  /** Maximum speed */
  protected maxSpeed: number = PHYSICS.MAX_SPEED;
  /** Whether diving (downward acceleration) is enabled */
  protected diveEnabled: boolean = true;
  /** Whether currently in a pass state (affects bounds behavior) */
  protected isPass: boolean = false;

  constructor(options: FlyingObjectOptions) {
    this.x = options.x;
    this.y = options.y;
    this.initX = options.x;
    this.initY = options.y;
    this.width = options.width;
    this.height = options.height;
    this.bounds = options.bounds;
  }

  /**
   * Reset entity to initial position and zero velocity.
   */
  reset(): void {
    this.x = this.initX;
    this.y = this.initY;
    this.vx = 0;
    this.vy = 0;
    this.isPass = false;
  }

  /**
   * Update position based on velocity and apply gravity.
   * @param dt Delta time in milliseconds
   * @param config Game configuration
   */
  move(dt: number, config: GameConfig): void {
    const scale = dt / PHYSICS.ORIGINAL_FRAME_TIME;

    // Use Math.floor for snappier, grid-aligned movement (matches original Java)
    this.x = Math.floor(this.x + this.vx * scale);
    this.y = Math.floor(this.y + this.vy * scale);

    // Apply gravity unconditionally, then cap at terminal velocity
    this.vy += config.gravity * scale;
    if (this.vy > config.terminalVelocity) {
      this.vy = config.terminalVelocity;
    }

    this.applyBounds();
  }

  /**
   * Apply boundary constraints and handle wall/ceiling/ground collisions.
   */
  protected applyBounds(): void {
    let hit = false;

    // Left wall
    if (this.x < this.bounds.minX) {
      this.x = this.bounds.minX;
      this.vx = -this.vx;
      hit = true;
    }

    // Right wall
    if (this.x > this.bounds.maxX - this.width) {
      this.x = this.bounds.maxX - this.width;
      this.vx = -this.vx;
      hit = true;
    }

    // Ceiling
    if (this.y < this.bounds.minY) {
      this.y = this.bounds.minY;
      this.vy = -this.vy;
      // Prevent stuck at ceiling with zero velocity
      if (this.vy === 0) {
        this.vy += 0.1;
      }
      hit = true;
    }

    // Ground - stop completely
    if (this.y > this.bounds.maxY - this.height) {
      this.y = this.bounds.maxY - this.height;
      this.vy = 0;
      this.vx = 0;
      hit = true;
    }

    // Cancel pass state if hit a boundary
    if (hit) {
      this.isPass = false;
    }
  }

  /**
   * Accelerate left.
   */
  left(): void {
    this.vx -= this.accel;
    if (this.vx < -this.maxSpeed) {
      this.vx = -this.maxSpeed;
    }
  }

  /**
   * Accelerate right.
   */
  right(): void {
    this.vx += this.accel;
    if (this.vx > this.maxSpeed) {
      this.vx = this.maxSpeed;
    }
  }

  /**
   * Accelerate up.
   */
  up(): void {
    this.vy -= this.accel;
    if (this.vy < -this.maxSpeed) {
      this.vy = -this.maxSpeed;
    }
  }

  /**
   * Accelerate down (dive).
   */
  down(): void {
    if (!this.diveEnabled) return;
    this.vy += this.accel;
    if (this.vy > this.maxSpeed) {
      this.vy = this.maxSpeed;
    }
  }

  /**
   * Check if this entity is on the ground.
   */
  isOnGround(): boolean {
    return this.y >= this.bounds.maxY - this.height - 1;
  }

  /**
   * Get center X coordinate.
   */
  get centerX(): number {
    return this.x + this.width / 2;
  }

  /**
   * Get center Y coordinate.
   */
  get centerY(): number {
    return this.y + this.height / 2;
  }

  /**
   * Get serializable state.
   */
  getState(): EntityState {
    return {
      x: this.x,
      y: this.y,
      vx: this.vx,
      vy: this.vy,
    };
  }

  /**
   * Restore from serialized state.
   */
  setState(state: EntityState): void {
    this.x = state.x;
    this.y = state.y;
    this.vx = state.vx;
    this.vy = state.vy;
  }

  /**
   * Update configuration values.
   */
  updateConfig(config: GameConfig): void {
    this.accel = config.acceleration;
    this.maxSpeed = config.maxSpeed;
    this.diveEnabled = config.diveEnabled;
  }

  /**
   * Set pass state.
   */
  setPass(value: boolean): void {
    this.isPass = value;
  }

  /**
   * Get pass state.
   */
  getPass(): boolean {
    return this.isPass;
  }
}
