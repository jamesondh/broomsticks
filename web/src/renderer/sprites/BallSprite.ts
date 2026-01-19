import { Sprite, Texture } from "pixi.js";
import type { BallState, BallType } from "../../engine/types";

/**
 * Renders a ball sprite based on its type.
 */
export class BallSprite {
  /** The PIXI sprite */
  readonly sprite: Sprite;

  /** Ball type */
  private type: BallType;

  /** Whether the ball is alive (visible) */
  private alive: boolean = true;

  /** Previous position for interpolation */
  private prevX: number = 0;
  private prevY: number = 0;

  /** Current position */
  private currentX: number = 0;
  private currentY: number = 0;

  constructor(
    type: BallType,
    redBallTexture: Texture,
    blackBallTexture: Texture,
    goldBallTexture: Texture
  ) {
    this.type = type;

    // Select texture based on type
    let texture: Texture;
    switch (type) {
      case "red":
        texture = redBallTexture;
        break;
      case "black":
        texture = blackBallTexture;
        break;
      case "gold":
        texture = goldBallTexture;
        break;
    }

    this.sprite = new Sprite(texture);

    // Center the anchor
    this.sprite.anchor.set(0.5, 0.5);
  }

  /**
   * Update the sprite from entity state.
   * Call this each physics tick to store state for interpolation.
   */
  updateFromState(state: BallState): void {
    // Store previous position for interpolation
    this.prevX = this.currentX;
    this.prevY = this.currentY;

    // Update current position
    this.currentX = state.x;
    this.currentY = state.y;

    // Update visibility
    this.alive = state.alive;
    this.sprite.visible = this.alive;
  }

  /**
   * Set position directly (for initial placement).
   */
  setPosition(x: number, y: number): void {
    this.prevX = x;
    this.prevY = y;
    this.currentX = x;
    this.currentY = y;
    this.sprite.x = x;
    this.sprite.y = y;
  }

  /**
   * Render with interpolation between physics frames.
   * @param alpha Interpolation factor (0-1)
   */
  render(alpha: number): void {
    if (!this.alive) {
      return;
    }
    this.sprite.x = this.prevX + (this.currentX - this.prevX) * alpha;
    this.sprite.y = this.prevY + (this.currentY - this.prevY) * alpha;
  }

  /**
   * Get the ball's type.
   */
  getType(): BallType {
    return this.type;
  }

  /**
   * Check if the ball is alive.
   */
  isAlive(): boolean {
    return this.alive;
  }

  /**
   * Clean up resources.
   */
  destroy(): void {
    this.sprite.destroy();
  }
}
