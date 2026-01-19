import { Sprite, Texture, Rectangle, Container } from "pixi.js";
import type { PersonState } from "../../engine/types";
import { DIMENSIONS } from "../../engine/constants";

/**
 * Player sprite configuration.
 * Based on players.gif sprite sheet layout.
 */
export interface PlayerSpriteConfig {
  /** Frame width in pixels */
  frameWidth: number;
  /** Frame height in pixels */
  frameHeight: number;
  /** Number of models per team (0-4 left, 5-9 right) */
  modelsPerTeam: number;
}

const DEFAULT_CONFIG: PlayerSpriteConfig = {
  frameWidth: 38,
  frameHeight: 38,
  modelsPerTeam: 5,
};

/**
 * Sprite class for player rendering.
 * Handles directional frame selection and animation.
 */
export class PlayerSprite {
  /** The PixiJS sprite */
  readonly sprite: Sprite;

  /** Cached frame textures: [model][vState][hDir] */
  private frameTextures: Map<string, Texture> = new Map();

  /** Source texture (sprite sheet) */
  private sourceTexture: Texture;

  /** Configuration */
  private config: PlayerSpriteConfig;

  /** Current state tracking */
  private currentModel: number = 0;
  private currentTeam: number = 0;
  private currentVState: number = 0;
  private currentHDir: number = 0;

  constructor(sourceTexture: Texture, config: Partial<PlayerSpriteConfig> = {}) {
    this.sourceTexture = sourceTexture;
    this.config = { ...DEFAULT_CONFIG, ...config };

    this.sprite = new Sprite(Texture.WHITE);
    this.sprite.anchor.set(0.5);
    this.sprite.width = DIMENSIONS.PLAYER_WIDTH;
    this.sprite.height = DIMENSIONS.PLAYER_HEIGHT;
  }

  /**
   * Extract a frame texture from the sprite sheet.
   * Layout matches test-decomp: models 0-4 are left team, 5-9 are right team.
   * @param model 0-4 (actual model index within team)
   * @param team 0 = left, 1 = right
   * @param vState 0 = falling/neutral, 1 = rising
   * @param hDir 0 = facing right, 1 = facing left
   */
  private getFrameTexture(
    model: number,
    team: number,
    vState: number,
    hDir: number
  ): Texture {
    const key = `${model}-${team}-${vState}-${hDir}`;

    if (this.frameTextures.has(key)) {
      return this.frameTextures.get(key)!;
    }

    // Calculate sprite position in sheet
    // Left team (0-4): columns 0-159 (vState*80 + hDir*40)
    // Right team (5-9): columns 160-319 (vState*80 + hDir*40 + 160)
    // Each row is a model (0-4 for each team, offset by 1 row for header)
    const teamOffset = team * 160;
    const sx = teamOffset + vState * 80 + hDir * 40 + 1;
    const sy = model * 40 + 41;

    const frame = new Rectangle(
      sx,
      sy,
      this.config.frameWidth,
      this.config.frameHeight
    );

    const texture = new Texture({
      source: this.sourceTexture.source,
      frame,
    });

    this.frameTextures.set(key, texture);
    return texture;
  }

  /**
   * Update sprite based on player state.
   */
  update(state: PersonState): void {
    // Calculate model index within team (0-4)
    const modelInTeam = state.model % this.config.modelsPerTeam;

    // Determine vertical state: 0 = falling/neutral, 1 = rising
    const vState = state.vy < 0 ? 1 : 0;

    // Determine horizontal direction: 0 = right, 1 = left
    let hDir: number;
    if (state.vx > 0) {
      hDir = 0; // facing right
    } else if (state.vx < 0) {
      hDir = 1; // facing left
    } else {
      // At rest - face toward opponent's goal
      hDir = state.team === 0 ? 0 : 1;
    }

    // Only update texture if state changed
    if (
      modelInTeam !== this.currentModel ||
      state.team !== this.currentTeam ||
      vState !== this.currentVState ||
      hDir !== this.currentHDir
    ) {
      this.sprite.texture = this.getFrameTexture(
        modelInTeam,
        state.team,
        vState,
        hDir
      );
      this.currentModel = modelInTeam;
      this.currentTeam = state.team;
      this.currentVState = vState;
      this.currentHDir = hDir;
    }

    // Update position (center of sprite)
    this.sprite.x = state.x + DIMENSIONS.PLAYER_WIDTH / 2;
    this.sprite.y = state.y + DIMENSIONS.PLAYER_HEIGHT / 2;
    this.sprite.visible = true;
  }

  /**
   * Add sprite to a container.
   */
  addTo(container: Container): void {
    container.addChild(this.sprite);
  }

  /**
   * Remove sprite from parent container.
   */
  remove(): void {
    if (this.sprite.parent) {
      this.sprite.parent.removeChild(this.sprite);
    }
  }

  /**
   * Destroy and clean up resources.
   */
  destroy(): void {
    this.frameTextures.clear();
    this.sprite.destroy();
  }
}
