import { Sprite, Texture } from "pixi.js";
import type { PersonState, Team } from "../../engine/types";

/**
 * Player frame indices within each model's texture array.
 * Layout: [team0-left, team0-right, team1-left, team1-right]
 */
const PLAYER_FRAME_INDEX = {
  team0: { left: 0, right: 1 },
  team1: { left: 2, right: 3 },
} as const;

/**
 * Renders a player sprite with direction-based frame selection.
 */
export class PlayerSprite {
  /** The PIXI sprite */
  readonly sprite: Sprite;

  /** Player model (determines row in spritesheet) */
  private model: number;

  /** Player team */
  private team: Team;

  /** Available frame textures for this player's model */
  private frames: Texture[];

  /** Current direction (-1 = left, 1 = right) */
  private direction: 1 | -1 = 1;

  /** Previous position for interpolation */
  private prevX: number = 0;
  private prevY: number = 0;

  /** Current position */
  private currentX: number = 0;
  private currentY: number = 0;

  constructor(model: number, team: Team, playerFrames: Texture[][]) {
    this.model = model;
    this.team = team;

    // Get frames for this model
    this.frames = playerFrames[model] ?? playerFrames[0];

    // Create sprite with initial frame
    const initialFrame = this.getFrameForDirection(1);
    this.sprite = new Sprite(initialFrame);

    // Center the anchor
    this.sprite.anchor.set(0.5, 0.5);
  }

  /**
   * Get the correct texture frame based on team and direction.
   */
  private getFrameForDirection(dir: 1 | -1): Texture {
    // Frame indices: 0=team0-left, 1=team0-right, 2=team1-left, 3=team1-right
    const teamFrames = this.team === 0 ? PLAYER_FRAME_INDEX.team0 : PLAYER_FRAME_INDEX.team1;
    const frameIndex = dir === -1 ? teamFrames.left : teamFrames.right;
    return this.frames[frameIndex];
  }

  /**
   * Update the sprite from entity state.
   * Call this each physics tick to store state for interpolation.
   */
  updateFromState(state: PersonState): void {
    // Store previous position for interpolation
    this.prevX = this.currentX;
    this.prevY = this.currentY;

    // Update current position
    this.currentX = state.x;
    this.currentY = state.y;

    // Update direction based on velocity
    if (state.vx > 0.1) {
      this.direction = 1;
    } else if (state.vx < -0.1) {
      this.direction = -1;
    }

    // Update frame based on direction
    this.sprite.texture = this.getFrameForDirection(this.direction);
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
    this.sprite.x = this.prevX + (this.currentX - this.prevX) * alpha;
    this.sprite.y = this.prevY + (this.currentY - this.prevY) * alpha;
  }

  /**
   * Get the player's team.
   */
  getTeam(): Team {
    return this.team;
  }

  /**
   * Get the player's model.
   */
  getModel(): number {
    return this.model;
  }

  /**
   * Clean up resources.
   */
  destroy(): void {
    this.sprite.destroy();
  }
}
