import { Sprite, Texture, Rectangle, Container, Graphics } from "pixi.js";
import type { BallState, BallType } from "../../engine/types";
import { DIMENSIONS } from "../../engine/constants";

/**
 * Ball sprite configuration.
 * Based on items.gif sprite sheet layout.
 */
export interface BallSpriteConfig {
  /** Ball frame size in sprite sheet */
  frameSize: number;
}

const DEFAULT_CONFIG: BallSpriteConfig = {
  frameSize: 39,
};

/**
 * Ball sprite positions in items.gif.
 * Original Java: CropImageFilter(1, (n+1)*40+1, 39, 39)
 * Ball 0 (black): y = (0+1)*40+1 = 41
 * Ball 1 (red): y = (1+1)*40+1 = 81
 */
const BALL_POSITIONS = {
  black: { x: 1, y: 41 },
  red: { x: 1, y: 81 },
  gold: { x: 1, y: 41 }, // Use same as black, will be tinted
};

/**
 * Sprite class for ball rendering.
 */
export class BallSprite {
  /** The PixiJS sprite */
  readonly sprite: Sprite;

  /** Ball type */
  private type: BallType;

  /** Source texture (sprite sheet) */
  private sourceTexture: Texture | null;

  /** Configuration */
  private config: BallSpriteConfig;

  /** Cached textures by type */
  private static textureCache: Map<string, Texture> = new Map();

  constructor(
    type: BallType,
    sourceTexture: Texture | null,
    config: Partial<BallSpriteConfig> = {}
  ) {
    this.type = type;
    this.sourceTexture = sourceTexture;
    this.config = { ...DEFAULT_CONFIG, ...config };

    const texture = this.getTexture();
    this.sprite = new Sprite(texture);
    this.sprite.anchor.set(0.5);

    // Set size based on ball type
    const isGold = type === "gold";
    this.sprite.width = isGold ? DIMENSIONS.GOLD_BALL_WIDTH : DIMENSIONS.BALL_WIDTH;
    this.sprite.height = isGold ? DIMENSIONS.GOLD_BALL_HEIGHT : DIMENSIONS.BALL_HEIGHT;

    // Apply tint based on ball type
    if (type === "red") {
      this.sprite.tint = 0xff0000;
    } else if (type === "gold") {
      this.sprite.tint = 0xffd700;
    }
  }

  /**
   * Get or create the texture for this ball type.
   */
  private getTexture(): Texture {
    const cacheKey = `ball-${this.type}`;

    if (BallSprite.textureCache.has(cacheKey)) {
      return BallSprite.textureCache.get(cacheKey)!;
    }

    let texture: Texture;

    if (!this.sourceTexture) {
      // Generate fallback texture when sprite sheet unavailable
      texture = this.generateFallbackTexture();
    } else {
      // Extract from sprite sheet
      const pos = BALL_POSITIONS[this.type];
      const frame = new Rectangle(
        pos.x,
        pos.y,
        this.config.frameSize,
        this.config.frameSize
      );
      texture = new Texture({
        source: this.sourceTexture.source,
        frame,
      });
    }

    BallSprite.textureCache.set(cacheKey, texture);
    return texture;
  }

  /**
   * Generate a fallback texture when sprite sheet is unavailable.
   */
  private generateFallbackTexture(): Texture {
    const size = this.type === "gold" ? 8 : 16;
    const color = this.type === "gold" ? 0xffd700 : this.type === "red" ? 0xff0000 : 0x000000;

    const graphics = new Graphics();
    graphics.circle(size / 2, size / 2, size / 2);
    graphics.fill({ color });

    // Convert graphics to texture
    // Note: In PixiJS 8, we need to use the renderer to generate texture
    // For now, return WHITE and handle coloring via tint
    return Texture.WHITE;
  }

  /**
   * Update sprite based on ball state.
   */
  update(state: BallState): void {
    // Calculate size
    const isGold = state.type === "gold";
    const width = isGold ? DIMENSIONS.GOLD_BALL_WIDTH : DIMENSIONS.BALL_WIDTH;
    const height = isGold ? DIMENSIONS.GOLD_BALL_HEIGHT : DIMENSIONS.BALL_HEIGHT;

    // Update position (center of sprite)
    this.sprite.x = state.x + width / 2;
    this.sprite.y = state.y + height / 2;

    // Ball stays visible when caught (it follows the player holding it)
    this.sprite.visible = state.alive;
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
    this.sprite.destroy();
  }

  /**
   * Clear the static texture cache.
   */
  static clearCache(): void {
    BallSprite.textureCache.clear();
  }
}
