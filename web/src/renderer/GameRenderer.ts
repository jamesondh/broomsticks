import { Application, Container } from "pixi.js";
import type { GameSnapshot } from "../engine/types";
import { FIELD } from "../engine/constants";
import { loadAssets, type GameAssets } from "./AssetLoader";
import { FieldSprite, PlayerSprite, BallSprite } from "./sprites";

/**
 * Main PixiJS renderer for the game.
 * Manages sprite creation, updates, and rendering with interpolation.
 */
export class GameRenderer {
  /** PixiJS application instance */
  private app: Application;

  /** Loaded game assets */
  private assets: GameAssets | null = null;

  /** Field background and baskets */
  private fieldSprite: FieldSprite | null = null;

  /** Player sprites */
  private playerSprites: PlayerSprite[] = [];

  /** Ball sprites */
  private ballSprites: BallSprite[] = [];

  /** Container for game entities (players, balls) */
  private entityContainer: Container;

  /** Container for UI elements */
  private uiContainer: Container;

  /** Whether the renderer is initialized */
  private initialized: boolean = false;

  /** Field dimensions */
  private fieldWidth: number;
  private fieldHeight: number;

  constructor(width: number = FIELD.WIDTH, height: number = FIELD.HEIGHT) {
    this.app = new Application();
    this.fieldWidth = width;
    this.fieldHeight = height;
    this.entityContainer = new Container();
    this.uiContainer = new Container();
  }

  /**
   * Initialize the renderer and attach to a DOM element.
   */
  async init(container: HTMLElement): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Initialize PixiJS application
    await this.app.init({
      width: this.fieldWidth,
      height: this.fieldHeight,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      backgroundColor: 0x87ceeb, // Sky blue fallback
    });

    // Append canvas to container
    container.appendChild(this.app.canvas);

    // Load assets
    this.assets = await loadAssets();

    // Create field background with sky
    this.fieldSprite = new FieldSprite(
      this.assets.sky,
      null, // front overlay disabled for now
      this.assets.basketLeft,
      this.assets.basketRight,
      this.fieldWidth,
      this.fieldHeight
    );
    this.app.stage.addChild(this.fieldSprite.container);

    // Add entity container (above field)
    this.app.stage.addChild(this.entityContainer);

    // Add UI container (topmost)
    this.app.stage.addChild(this.uiContainer);

    this.initialized = true;
  }

  /**
   * Create sprites from initial game snapshot.
   */
  createSprites(snapshot: GameSnapshot): void {
    if (!this.assets) {
      throw new Error("Renderer not initialized. Call init() first.");
    }

    // Clear existing sprites
    this.clearSprites();

    // Create player sprites
    for (const playerState of snapshot.players) {
      const sprite = new PlayerSprite(
        playerState.model,
        playerState.team,
        this.assets.playerFrames
      );
      sprite.setPosition(playerState.x, playerState.y);
      this.playerSprites.push(sprite);
      this.entityContainer.addChild(sprite.sprite);
    }

    // Create ball sprites
    for (const ballState of snapshot.balls) {
      const sprite = new BallSprite(
        ballState.type,
        this.assets.redBall,
        this.assets.blackBall,
        this.assets.goldBall
      );
      sprite.setPosition(ballState.x, ballState.y);
      this.ballSprites.push(sprite);
      this.entityContainer.addChild(sprite.sprite);
    }
  }

  /**
   * Update sprites from game snapshot (call each physics tick).
   */
  updateFromSnapshot(snapshot: GameSnapshot): void {
    // Update player sprites
    for (let i = 0; i < snapshot.players.length; i++) {
      const sprite = this.playerSprites[i];
      if (sprite) {
        sprite.updateFromState(snapshot.players[i]);
      }
    }

    // Update ball sprites
    for (let i = 0; i < snapshot.balls.length; i++) {
      const sprite = this.ballSprites[i];
      if (sprite) {
        sprite.updateFromState(snapshot.balls[i]);
      }
    }
  }

  /**
   * Render with interpolation (call each animation frame).
   * @param alpha Interpolation factor between physics frames (0-1)
   */
  render(alpha: number): void {
    // Interpolate player positions
    for (const sprite of this.playerSprites) {
      sprite.render(alpha);
    }

    // Interpolate ball positions
    for (const sprite of this.ballSprites) {
      sprite.render(alpha);
    }

    // PixiJS renders automatically via ticker, but we can force if needed
    this.app.render();
  }

  /**
   * Get the UI container for adding overlay elements.
   */
  getUIContainer(): Container {
    return this.uiContainer;
  }

  /**
   * Get the PixiJS application.
   */
  getApp(): Application {
    return this.app;
  }

  /**
   * Get the canvas element.
   */
  getCanvas(): HTMLCanvasElement {
    return this.app.canvas;
  }

  /**
   * Check if initialized.
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Clear all entity sprites.
   */
  private clearSprites(): void {
    for (const sprite of this.playerSprites) {
      sprite.destroy();
    }
    this.playerSprites = [];

    for (const sprite of this.ballSprites) {
      sprite.destroy();
    }
    this.ballSprites = [];
  }

  /**
   * Resize the renderer.
   */
  resize(width: number, height: number): void {
    this.app.renderer.resize(width, height);
    this.fieldWidth = width;
    this.fieldHeight = height;
  }

  /**
   * Clean up all resources.
   */
  destroy(): void {
    this.clearSprites();

    if (this.fieldSprite) {
      this.fieldSprite.destroy();
      this.fieldSprite = null;
    }

    this.entityContainer.destroy({ children: true });
    this.uiContainer.destroy({ children: true });

    this.app.destroy(true, { children: true, texture: true });
    this.initialized = false;
  }
}
