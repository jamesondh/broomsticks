import { Container, Sprite, Texture, Rectangle, Graphics } from "pixi.js";
import { FIELD, DIMENSIONS } from "../../engine/constants";

/**
 * Field sprite configuration.
 */
export interface FieldSpriteConfig {
  /** Field width */
  width: number;
  /** Field height */
  height: number;
  /** Ground line Y position (from bottom) */
  groundMargin: number;
  /** Sky color (fallback) */
  skyColor: number;
  /** Ground color (fallback) */
  groundColor: number;
}

const DEFAULT_CONFIG: FieldSpriteConfig = {
  width: FIELD.WIDTH,
  height: FIELD.HEIGHT,
  groundMargin: FIELD.GROUND_MARGIN,
  skyColor: 0xd7d7ff, // Light blue-ish
  groundColor: 0x00a400, // Green
};

/**
 * Basket positions from items.gif.
 * Original Java: CropImageFilter(1, 121, 39, 39) for normal, (41, 121, 39, 39) for highlighted
 */
const BASKET_SPRITE = {
  normal: { x: 1, y: 121, width: 39, height: 39 },
  highlighted: { x: 41, y: 121, width: 39, height: 39 },
};

/**
 * Field sprite class - manages background, ground, and basket rendering.
 */
export class FieldSprite {
  /** Container for all field elements */
  readonly container: Container;

  /** Background sprite (sky) */
  private backgroundSprite: Sprite | null = null;

  /** Ground sprite/graphics */
  private groundGraphics: Graphics;

  /** Left basket sprite */
  private leftBasket: Sprite | null = null;

  /** Right basket sprite */
  private rightBasket: Sprite | null = null;

  /** Left basket pole graphics */
  private leftPole: Graphics;

  /** Right basket pole graphics */
  private rightPole: Graphics;

  /** Configuration */
  private config: FieldSpriteConfig;

  /** Textures */
  private normalBasketTexture: Texture | null = null;
  private highlightedBasketTexture: Texture | null = null;

  /** Current highlight state: 0 = none, 1 = right (player 1 scoring), 2 = left (player 2 scoring) */
  private highlightState: number = 0;

  constructor(config: Partial<FieldSpriteConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    this.container = new Container();
    this.groundGraphics = new Graphics();
    this.leftPole = new Graphics();
    this.rightPole = new Graphics();

    // Add graphics to container
    this.container.addChild(this.groundGraphics);
    this.container.addChild(this.leftPole);
    this.container.addChild(this.rightPole);

    // Draw initial fallback background
    this.drawFallbackBackground();
  }

  /**
   * Set the background texture (sky image).
   */
  setBackgroundTexture(texture: Texture): void {
    if (this.backgroundSprite) {
      this.container.removeChild(this.backgroundSprite);
    }

    this.backgroundSprite = new Sprite(texture);
    this.backgroundSprite.width = this.config.width;
    this.backgroundSprite.height = this.config.height;

    // Add at the back
    this.container.addChildAt(this.backgroundSprite, 0);
  }

  /**
   * Set the items texture (for basket extraction).
   */
  setItemsTexture(texture: Texture): void {
    // Extract normal basket texture
    this.normalBasketTexture = new Texture({
      source: texture.source,
      frame: new Rectangle(
        BASKET_SPRITE.normal.x,
        BASKET_SPRITE.normal.y,
        BASKET_SPRITE.normal.width,
        BASKET_SPRITE.normal.height
      ),
    });

    // Extract highlighted basket texture
    this.highlightedBasketTexture = new Texture({
      source: texture.source,
      frame: new Rectangle(
        BASKET_SPRITE.highlighted.x,
        BASKET_SPRITE.highlighted.y,
        BASKET_SPRITE.highlighted.width,
        BASKET_SPRITE.highlighted.height
      ),
    });

    this.createBaskets();
  }

  /**
   * Draw fallback colored background when no image available.
   */
  private drawFallbackBackground(): void {
    const groundY = this.config.height - this.config.groundMargin;

    // Clear and redraw ground
    this.groundGraphics.clear();

    // Sky
    this.groundGraphics.rect(0, 0, this.config.width, groundY);
    this.groundGraphics.fill({ color: this.config.skyColor });

    // Ground
    this.groundGraphics.rect(0, groundY, this.config.width, this.config.groundMargin);
    this.groundGraphics.fill({ color: this.config.groundColor });

    // Ground line
    this.groundGraphics.moveTo(0, groundY);
    this.groundGraphics.lineTo(this.config.width, groundY);
    this.groundGraphics.stroke({ color: 0x000000, width: 1 });

    // Corner lines (from original)
    this.groundGraphics.moveTo(30, groundY);
    this.groundGraphics.lineTo(0, this.config.height);
    this.groundGraphics.moveTo(this.config.width - 30, groundY);
    this.groundGraphics.lineTo(this.config.width, this.config.height);
    this.groundGraphics.stroke({ color: 0x000000, width: 1 });
  }

  /**
   * Create basket sprites.
   */
  private createBaskets(): void {
    if (!this.normalBasketTexture) return;

    // Remove existing baskets
    if (this.leftBasket) {
      this.container.removeChild(this.leftBasket);
    }
    if (this.rightBasket) {
      this.container.removeChild(this.rightBasket);
    }

    // Create left basket
    this.leftBasket = new Sprite(this.normalBasketTexture);
    this.leftBasket.x = DIMENSIONS.BASKET_LEFT_X - 7;
    this.leftBasket.y = DIMENSIONS.BASKET_Y - 41;
    this.container.addChild(this.leftBasket);

    // Create right basket (flipped horizontally to face the other way)
    this.rightBasket = new Sprite(this.normalBasketTexture);
    this.rightBasket.scale.x = -1; // Flip horizontally
    // Position mirrored from left basket: right edge offset matches left edge offset
    this.rightBasket.x = this.config.width - DIMENSIONS.BASKET_RIGHT_X_OFFSET + 7;
    this.rightBasket.y = DIMENSIONS.BASKET_Y - 41;
    this.container.addChild(this.rightBasket);

    // Draw poles
    this.drawPoles();
  }

  /**
   * Draw basket poles.
   */
  private drawPoles(): void {
    const poleY = DIMENSIONS.BASKET_Y - 2;
    const poleHeight = this.config.height - DIMENSIONS.BASKET_Y - this.config.groundMargin + 20;

    // Left pole
    this.leftPole.clear();
    this.leftPole.rect(DIMENSIONS.BASKET_LEFT_X, poleY, 3, poleHeight);
    this.leftPole.stroke({ color: 0x000000, width: 1 });
    this.leftPole.rect(DIMENSIONS.BASKET_LEFT_X + 1, poleY, 2, poleHeight);
    this.leftPole.fill({ color: this.highlightState === 2 ? 0xffff00 : 0x808000 });

    // Right pole
    const rightPoleX = this.config.width - DIMENSIONS.BASKET_RIGHT_X_OFFSET - 3;
    this.rightPole.clear();
    this.rightPole.rect(rightPoleX, poleY, 3, poleHeight);
    this.rightPole.stroke({ color: 0x000000, width: 1 });
    this.rightPole.rect(rightPoleX + 1, poleY, 2, poleHeight);
    this.rightPole.fill({ color: this.highlightState === 1 ? 0xffff00 : 0x808000 });
  }

  /**
   * Set highlight state for baskets (when scoring).
   * @param state 0 = none, 1 = right basket (P1 scoring), 2 = left basket (P2 scoring)
   */
  setHighlight(state: number): void {
    if (this.highlightState === state) return;

    this.highlightState = state;

    // Update basket textures
    if (this.leftBasket && this.normalBasketTexture && this.highlightedBasketTexture) {
      this.leftBasket.texture = state === 2 ? this.highlightedBasketTexture : this.normalBasketTexture;
    }
    if (this.rightBasket && this.normalBasketTexture && this.highlightedBasketTexture) {
      this.rightBasket.texture = state === 1 ? this.highlightedBasketTexture : this.normalBasketTexture;
    }

    // Update poles
    this.drawPoles();
  }

  /**
   * Toggle between image and solid color background.
   */
  toggleBackground(useImage: boolean): void {
    if (this.backgroundSprite) {
      this.backgroundSprite.visible = useImage;
    }
    this.groundGraphics.visible = !useImage || !this.backgroundSprite;
  }

  /**
   * Add to a parent container.
   */
  addTo(parent: Container): void {
    parent.addChild(this.container);
  }

  /**
   * Destroy and clean up resources.
   */
  destroy(): void {
    this.container.destroy({ children: true });
  }
}
