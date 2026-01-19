import { Container, Sprite, Texture } from "pixi.js";
import { FIELD, DIMENSIONS } from "../../engine/constants";

/**
 * Renders the game field background and basket sprites.
 */
export class FieldSprite {
  /** Container for all field elements */
  readonly container: Container;

  /** Background sprite */
  private background: Sprite;

  /** Left basket sprite */
  private basketLeft: Sprite;

  /** Right basket sprite */
  private basketRight: Sprite;

  constructor(
    fieldTexture: Texture,
    basketLeftTexture: Texture,
    basketRightTexture: Texture,
    fieldWidth: number = FIELD.WIDTH,
    fieldHeight: number = FIELD.HEIGHT
  ) {
    this.container = new Container();

    // Create background sprite
    this.background = new Sprite(fieldTexture);
    this.background.width = fieldWidth;
    this.background.height = fieldHeight;
    this.container.addChild(this.background);

    // Create left basket
    this.basketLeft = new Sprite(basketLeftTexture);
    this.basketLeft.x = 0;
    this.basketLeft.y = DIMENSIONS.BASKET_Y - this.basketLeft.height / 2;
    this.container.addChild(this.basketLeft);

    // Create right basket
    this.basketRight = new Sprite(basketRightTexture);
    this.basketRight.x = fieldWidth - this.basketRight.width;
    this.basketRight.y = DIMENSIONS.BASKET_Y - this.basketRight.height / 2;
    this.container.addChild(this.basketRight);
  }

  /**
   * Get the field width.
   */
  get width(): number {
    return this.background.width;
  }

  /**
   * Get the field height.
   */
  get height(): number {
    return this.background.height;
  }

  /**
   * Clean up resources.
   */
  destroy(): void {
    this.container.destroy({ children: true });
  }
}
