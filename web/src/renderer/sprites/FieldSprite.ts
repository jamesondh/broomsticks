import { Container, Sprite, Texture } from "pixi.js";
import { FIELD, DIMENSIONS } from "../../engine/constants";

/**
 * Renders the game field background with sky, optional front overlay, and basket sprites.
 *
 * The C++ version uses:
 * - sky.bmp (640x440) as the main background
 * - front.bmp (640x420) as a semi-transparent overlay (color-keyed on white)
 * - Baskets drawn at specific positions
 *
 * For the web version, we use sky as the main background.
 * The front overlay is optional (can be used for foreground effects).
 */
export class FieldSprite {
  /** Container for all field elements */
  readonly container: Container;

  /** Sky background sprite */
  private sky: Sprite;

  /** Front overlay sprite (optional) */
  private front: Sprite | null = null;

  /** Left basket sprite */
  private basketLeft: Sprite;

  /** Right basket sprite */
  private basketRight: Sprite;

  /** Configured field dimensions */
  private fieldWidth: number;
  private fieldHeight: number;

  constructor(
    skyTexture: Texture,
    frontTexture: Texture | null,
    basketLeftTexture: Texture,
    basketRightTexture: Texture,
    fieldWidth: number = FIELD.WIDTH,
    fieldHeight: number = FIELD.HEIGHT
  ) {
    this.container = new Container();
    this.fieldWidth = fieldWidth;
    this.fieldHeight = fieldHeight;

    // Create sky background sprite (scales to fill field)
    this.sky = new Sprite(skyTexture);
    this.sky.width = fieldWidth;
    this.sky.height = fieldHeight;
    this.container.addChild(this.sky);

    // Create left basket
    this.basketLeft = new Sprite(basketLeftTexture);
    this.basketLeft.anchor.set(0.5, 0);
    this.basketLeft.x = DIMENSIONS.BASKET_LEFT_X + this.basketLeft.width / 2;
    this.basketLeft.y = DIMENSIONS.BASKET_Y - 20;
    this.container.addChild(this.basketLeft);

    // Create right basket
    this.basketRight = new Sprite(basketRightTexture);
    this.basketRight.anchor.set(0.5, 0);
    this.basketRight.x = fieldWidth - DIMENSIONS.BASKET_RIGHT_X_OFFSET - this.basketRight.width / 2;
    this.basketRight.y = DIMENSIONS.BASKET_Y - 20;
    this.container.addChild(this.basketRight);

    // Front overlay is added later if needed (after entities are drawn)
    if (frontTexture) {
      this.front = new Sprite(frontTexture);
      this.front.width = fieldWidth;
      this.front.height = fieldHeight;
      // Don't add to container - it needs to be on top of entities
    }
  }

  /**
   * Get the front overlay sprite (to add on top of entities).
   */
  getFrontOverlay(): Sprite | null {
    return this.front;
  }

  /**
   * Get the field width.
   */
  get width(): number {
    return this.fieldWidth;
  }

  /**
   * Get the field height.
   */
  get height(): number {
    return this.fieldHeight;
  }

  /**
   * Clean up resources.
   */
  destroy(): void {
    this.container.destroy({ children: true });
    if (this.front) {
      this.front.destroy();
    }
  }
}
