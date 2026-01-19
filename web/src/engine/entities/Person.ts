import { DIMENSIONS, AI, AI_DIFFICULTY_MAP } from "../constants";
import type {
  Team,
  PersonState,
  Bounds,
  GameConfig,
  PlayerInput,
} from "../types";
import { FlyingObject } from "./FlyingObject";
import type { Ball } from "./Ball";

/**
 * Options for creating a Person.
 */
export interface PersonOptions {
  x: number;
  y: number;
  team: Team;
  model?: number;
  isRobot?: boolean;
  bounds: Bounds;
}

/**
 * Player entity that can be human-controlled or AI-controlled.
 * Can catch red balls, be bumped by black balls, and score goals.
 */
export class Person extends FlyingObject {
  /** Team side (0 = left, 1 = right) */
  readonly team: Team;
  /** Visual model index */
  model: number;
  /** Whether controlled by AI */
  isRobot: boolean;
  /** AI intelligence (lower = smarter) */
  smart: number = AI_DIFFICULTY_MAP.medium;
  /** Target ball for AI */
  targetBall: Ball | null = null;
  /** Index of held ball (null if not holding) */
  heldBallIndex: number | null = null;
  /** Whether pass was requested */
  wantsToPass: boolean = false;

  /** Timer for AI decisions */
  private lastMoveTime: number = 0;
  /** Touch/destination-based movement target */
  private destX: number = 0;
  private destY: number = 0;
  private destOn: boolean = false;

  constructor(options: PersonOptions) {
    super({
      x: options.x,
      y: options.y,
      width: DIMENSIONS.PLAYER_WIDTH,
      height: DIMENSIONS.PLAYER_HEIGHT,
      bounds: options.bounds,
    });

    this.team = options.team;
    this.model = options.model ?? 0;
    this.isRobot = options.isRobot ?? false;
  }

  /**
   * Handle player input for movement.
   */
  handleInput(input: PlayerInput): void {
    if (this.isRobot) return;

    if (input.up) this.up();
    if (input.down) this.down();
    if (input.left) this.left();
    if (input.right) this.right();
    if (input.pass) this.wantsToPass = true;
  }

  /**
   * Update AI behavior.
   * @param balls Array of balls in play
   * @param teamBasket Whether this player's team has the ball (for offense/defense)
   * @param now Current timestamp in milliseconds
   * @param config Game configuration
   */
  updateAI(
    _balls: Ball[],
    teamBasket: boolean,
    now: number,
    config: GameConfig
  ): void {
    if (!this.isRobot || !this.targetBall) return;

    // Make decisions at fixed intervals
    if (now - this.lastMoveTime < AI.DECISION_INTERVAL) return;
    this.lastMoveTime = now;

    // Calculate choice probability based on smart value
    const choices = Math.floor(this.smart / 2) + 1;
    const choice = Math.floor(Math.random() * choices);

    // Only act on choice 0 (smarter AI = more likely to act)
    if (choice !== 0) return;

    if (teamBasket) {
      // Offensive: we have the ball, move toward goal
      this.updateOffensiveAI(config);
    } else {
      // Defensive: chase the target ball
      this.updateDefensiveAI();
    }
  }

  /**
   * Offensive AI - move toward opponent's goal.
   */
  private updateOffensiveAI(config: GameConfig): void {
    if (this.team === 0) {
      // Left team scores on right
      if (this.x < config.fieldWidth - AI.OFFENSIVE_DISTANCE) {
        this.right();
      }
      if (this.y > config.fieldHeight / 2 - 10) {
        this.up();
      }
    } else {
      // Right team scores on left
      if (this.x > AI.OFFENSIVE_DISTANCE) {
        this.left();
      }
      if (this.y > config.fieldHeight / 2 - 10) {
        this.up();
      }
    }
  }

  /**
   * Defensive AI - chase the target ball.
   */
  private updateDefensiveAI(): void {
    if (!this.targetBall) return;

    const target = this.targetBall;

    // Vertical: follow ball
    if (target.y < this.y) {
      this.up();
    }

    // Horizontal: only chase if vertically close
    if (Math.abs(target.y - this.y) < AI.TARGETING_THRESHOLD) {
      if (target.x < this.x - 10) {
        this.left();
      } else if (target.x > this.x + 10) {
        this.right();
      }
    }

    if (target.y > this.y) {
      this.down();
    }
  }

  /**
   * Update with destination-based movement (for touch controls).
   */
  moveTowardDestination(dt: number, _config: GameConfig): boolean {
    if (!this.destOn) return false;

    // Update position
    const scale = dt / 40;
    this.x += this.vx * scale;
    this.y += this.vy * scale;
    this.applyBounds();

    // Check if reached destination
    const dx = this.destX - this.x;
    const dy = this.destY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < this.maxSpeed * scale) {
      this.destOn = false;
    }

    // Handle edge case: already at destination
    if (this.vx === 0 && this.vy === 0) {
      this.destOn = false;
    }

    return this.destOn;
  }

  /**
   * Set a destination for movement (touch controls).
   */
  setDestination(x: number, y: number): void {
    this.destOn = true;
    this.destX = x;
    this.destY = y;

    const dx = x - this.x;
    const dy = y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0) {
      this.vx = (dx / dist) * this.maxSpeed;
      this.vy = (dy / dist) * this.maxSpeed;
    }
  }

  /**
   * Clear destination movement.
   */
  clearDestination(): void {
    this.destOn = false;
  }

  /**
   * Bump this player (send to ground).
   */
  bump(): void {
    // Only bump if in the air
    if (this.y < this.bounds.maxY - 40) {
      this.y = 10000; // Will be clamped by bounds
      this.applyBounds();
    }
  }

  /**
   * Toggle between robot and human control.
   */
  toggleRobot(): void {
    this.isRobot = !this.isRobot;
    this.vx = 0;
  }

  /**
   * Make AI smarter (lower smart value).
   */
  smarter(): void {
    this.smart -= 5;
    if (this.smart <= 1) this.smart = 1;
  }

  /**
   * Make AI dumber (higher smart value).
   */
  dumber(): void {
    this.smart += 5;
    if (this.smart >= 30) this.smart = 30;
  }

  /**
   * Set smart value directly.
   */
  setSmart(value: number): void {
    this.smart = Math.max(1, Math.min(30, value));
  }

  /**
   * Switch to next visual model.
   */
  switchModel(): void {
    this.model = (this.model + 1) % 5;
  }

  /**
   * Check if this player is holding a ball.
   */
  isHoldingBall(): boolean {
    return this.heldBallIndex !== null;
  }

  /**
   * Get horizontal facing direction.
   * Returns 0 for right, 1 for left.
   */
  getFacingDirection(): number {
    if (this.vx > 0) return 0;
    if (this.vx < 0) return 1;
    return this.team; // Default to team direction when stationary
  }

  /**
   * Check if moving up (for animation).
   */
  isMovingUp(): boolean {
    return this.vy < 0;
  }

  /**
   * Reset player state.
   */
  override reset(): void {
    super.reset();
    this.heldBallIndex = null;
    this.wantsToPass = false;
    this.destOn = false;
    this.lastMoveTime = 0;
  }

  /**
   * Get serializable state.
   */
  override getState(): PersonState {
    return {
      ...super.getState(),
      team: this.team,
      isRobot: this.isRobot,
      model: this.model,
      heldBallIndex: this.heldBallIndex,
    };
  }

  /**
   * Restore from serialized state.
   */
  override setState(state: PersonState): void {
    super.setState(state);
    this.isRobot = state.isRobot;
    this.model = state.model;
    this.heldBallIndex = state.heldBallIndex;
  }

  /**
   * Set target ball for AI.
   */
  setTargetBall(ball: Ball | null): void {
    this.targetBall = ball;
  }
}
