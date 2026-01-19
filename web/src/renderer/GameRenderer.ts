import { Application, Container, Sprite, Texture, Graphics, Assets, Rectangle } from "pixi.js";
import type { Game } from "../engine/Game";
import type { PersonState, BallState } from "../engine/types";
import { FIELD, DIMENSIONS } from "../engine/constants";

/**
 * Sprite sheet configuration for extracting frames from sprite sheets.
 */
interface SpriteSheetConfig {
  players: {
    frameWidth: number;
    frameHeight: number;
    teamsPerRow: number;
    directionsPerTeam: number;
    modelsCount: number;
  };
  items: {
    cellWidth: number;
    cellHeight: number;
    ballBlackX: number;
    ballBlackY: number;
    ballRedX: number;
    ballRedY: number;
    ballGoldX: number;
    ballGoldY: number;
    basketLeftX: number;
    basketLeftY: number;
    basketRightX: number;
    basketRightY: number;
  };
}

/**
 * Default sprite sheet configuration based on analysis of original assets.
 * players.gif: 8 columns (4 per team), 8 rows (models), 38x38px per frame
 * items.gif: grid layout with balls and baskets
 */
const DEFAULT_SPRITE_CONFIG: SpriteSheetConfig = {
  players: {
    frameWidth: 38,
    frameHeight: 38,
    teamsPerRow: 2,
    directionsPerTeam: 4, // descending (2) + ascending (2)
    modelsCount: 8,
  },
  items: {
    cellWidth: 20,
    cellHeight: 38,
    // Ball positions in items.gif (based on visual inspection)
    ballBlackX: 0,
    ballBlackY: 38, // Row 1
    ballRedX: 0,
    ballRedY: 0, // Use basket position as placeholder - red ball not separate
    ballGoldX: 0,
    ballGoldY: 152, // Bottom rows
    // Basket positions
    basketLeftX: 0,
    basketLeftY: 0,
    basketRightX: 20,
    basketRightY: 0,
  },
};

/**
 * Renderer options.
 */
export interface GameRendererOptions {
  /** Container element to mount the canvas */
  container: HTMLElement;
  /** Game field width (default: 640) */
  width?: number;
  /** Game field height (default: 400) */
  height?: number;
  /** Background color (default: sky blue) */
  backgroundColor?: number;
  /** Whether to auto-resize to fit container (default: true) */
  autoResize?: boolean;
}

/**
 * Main game renderer using PixiJS.
 * Handles all visual rendering, sprite management, and canvas scaling.
 */
export class GameRenderer {
  /** PixiJS application instance */
  private app: Application;

  /** Container element */
  private container: HTMLElement;

  /** Game field dimensions */
  private readonly fieldWidth: number;
  private readonly fieldHeight: number;

  /** Whether auto-resize is enabled */
  private autoResize: boolean;

  /** Main game container (for scaling) */
  private gameContainer: Container;

  /** Layer containers */
  private backgroundLayer: Container;
  private entityLayer: Container;
  private uiLayer: Container;

  /** Sprite references for updates */
  private playerSprites: Sprite[] = [];
  private ballSprites: Sprite[] = [];
  private basketLeftSprite: Sprite | null = null;
  private basketRightSprite: Sprite | null = null;

  /** Loaded textures */
  private textures: {
    players: Texture | null;
    items: Texture | null;
    field: Texture | null;
    sky: Texture | null;
  } = {
    players: null,
    items: null,
    field: null,
    sky: null,
  };

  /** Player frame textures cache (extracted from spritesheet) */
  private playerFrameTextures: Map<string, Texture> = new Map();

  /** Ball textures cache */
  private ballTextures: Map<string, Texture> = new Map();

  /** Current scale factor */
  private scale: number = 1;

  /** ResizeObserver for container resize handling */
  private resizeObserver: ResizeObserver | null = null;

  /** Initialization promise */
  private initPromise: Promise<void> | null = null;

  /** Whether renderer is initialized */
  private initialized: boolean = false;

  constructor(options: GameRendererOptions) {
    this.container = options.container;
    this.fieldWidth = options.width ?? FIELD.WIDTH;
    this.fieldHeight = options.height ?? FIELD.HEIGHT;
    this.autoResize = options.autoResize ?? true;

    // Create PixiJS application
    this.app = new Application();

    // Create layer containers
    this.gameContainer = new Container();
    this.backgroundLayer = new Container();
    this.entityLayer = new Container();
    this.uiLayer = new Container();
  }

  /**
   * Initialize the renderer asynchronously.
   * Must be called before using the renderer.
   */
  async init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.doInit();
    return this.initPromise;
  }

  private async doInit(): Promise<void> {
    // Get device pixel ratio for high-DPI support
    const resolution = Math.min(window.devicePixelRatio || 1, 2);

    // Initialize PixiJS application
    await this.app.init({
      width: this.fieldWidth,
      height: this.fieldHeight,
      backgroundColor: 0x87ceeb, // Sky blue
      resolution,
      autoDensity: true,
      antialias: false, // Pixel art should not be antialiased
    });

    // Mount canvas to container
    this.container.appendChild(this.app.canvas);

    // Set up layer hierarchy
    this.gameContainer.addChild(this.backgroundLayer);
    this.gameContainer.addChild(this.entityLayer);
    this.gameContainer.addChild(this.uiLayer);
    this.app.stage.addChild(this.gameContainer);

    // Load textures
    await this.loadTextures();

    // Set up background
    this.setupBackground();

    // Set up resize handling
    if (this.autoResize) {
      this.setupResizeObserver();
      this.handleResize();
    }

    this.initialized = true;
  }

  /**
   * Load all required textures.
   */
  private async loadTextures(): Promise<void> {
    try {
      // Load sprite sheets
      const [players, items, sky] = await Promise.all([
        Assets.load<Texture>("/images/players.gif"),
        Assets.load<Texture>("/images/items.gif"),
        Assets.load<Texture>("/images/sky1.jpg"),
      ]);

      this.textures.players = players;
      this.textures.items = items;
      this.textures.sky = sky;

      // Pre-extract commonly used textures
      this.extractBallTextures();
    } catch (error) {
      console.error("Failed to load textures:", error);
      // Create fallback colored rectangles
      this.createFallbackTextures();
    }
  }

  /**
   * Extract ball textures from items sprite sheet.
   */
  private extractBallTextures(): void {
    if (!this.textures.items) return;

    const config = DEFAULT_SPRITE_CONFIG.items;

    // Black ball - from row 1, col 0
    this.ballTextures.set(
      "black",
      this.extractTextureRegion(
        this.textures.items,
        config.ballBlackX,
        config.ballBlackY,
        DIMENSIONS.BALL_WIDTH,
        DIMENSIONS.BALL_HEIGHT
      )
    );

    // Red ball - for now use a tinted version or same as black
    // The original items.gif doesn't have a separate red ball sprite
    // We'll use the black ball and tint it in the sprite
    this.ballTextures.set(
      "red",
      this.ballTextures.get("black") ?? Texture.WHITE
    );

    // Gold ball - smaller, from bottom of items.gif
    this.ballTextures.set(
      "gold",
      this.extractTextureRegion(
        this.textures.items,
        config.ballGoldX,
        config.ballGoldY,
        DIMENSIONS.GOLD_BALL_WIDTH,
        DIMENSIONS.GOLD_BALL_HEIGHT
      )
    );
  }

  /**
   * Extract a region from a texture as a new texture.
   */
  private extractTextureRegion(
    source: Texture,
    x: number,
    y: number,
    width: number,
    height: number
  ): Texture {
    const frame = new Rectangle(x, y, width, height);

    return new Texture({
      source: source.source,
      frame,
    });
  }

  /**
   * Create fallback textures when loading fails.
   */
  private createFallbackTextures(): void {
    // Create simple colored circle textures for balls
    const graphics = new Graphics();

    // Black ball
    graphics.circle(8, 8, 8).fill({ color: 0x000000 });

    // Red ball (separate)
    const redGraphics = new Graphics();
    redGraphics.circle(8, 8, 8).fill({ color: 0xff0000 });

    // Gold ball (smaller)
    const goldGraphics = new Graphics();
    goldGraphics.circle(4, 4, 4).fill({ color: 0xffd700 });

    // Note: In production, we'd convert these to textures
    // For now, we'll handle missing textures in the render methods
  }

  /**
   * Set up background sprites.
   */
  private setupBackground(): void {
    // Add sky background if loaded
    if (this.textures.sky) {
      const sky = new Sprite(this.textures.sky);
      sky.width = this.fieldWidth;
      sky.height = this.fieldHeight;
      this.backgroundLayer.addChild(sky);
    }

    // Add baskets
    this.setupBaskets();
  }

  /**
   * Set up basket sprites.
   */
  private setupBaskets(): void {
    if (!this.textures.items) return;

    const config = DEFAULT_SPRITE_CONFIG.items;

    // Left basket
    const leftBasketTexture = this.extractTextureRegion(
      this.textures.items,
      config.basketLeftX,
      config.basketLeftY,
      config.cellWidth,
      config.cellHeight
    );

    this.basketLeftSprite = new Sprite(leftBasketTexture);
    this.basketLeftSprite.x = DIMENSIONS.BASKET_LEFT_X - 10;
    this.basketLeftSprite.y = DIMENSIONS.BASKET_Y - 20;
    this.backgroundLayer.addChild(this.basketLeftSprite);

    // Right basket
    const rightBasketTexture = this.extractTextureRegion(
      this.textures.items,
      config.basketRightX,
      config.basketRightY,
      config.cellWidth,
      config.cellHeight
    );

    this.basketRightSprite = new Sprite(rightBasketTexture);
    this.basketRightSprite.x =
      this.fieldWidth - DIMENSIONS.BASKET_RIGHT_X_OFFSET - 10;
    this.basketRightSprite.y = DIMENSIONS.BASKET_Y - 20;
    this.backgroundLayer.addChild(this.basketRightSprite);
  }

  /**
   * Set up ResizeObserver for container resize handling.
   */
  private setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver(() => {
      this.handleResize();
    });
    this.resizeObserver.observe(this.container);

    // Also handle window resize for device pixel ratio changes
    window.addEventListener("resize", this.handleResize.bind(this));
  }

  /**
   * Handle container resize - scale canvas to fit while maintaining aspect ratio.
   */
  handleResize(): void {
    const containerWidth = this.container.clientWidth;
    const containerHeight = this.container.clientHeight;

    if (containerWidth === 0 || containerHeight === 0) return;

    const aspectRatio = this.fieldWidth / this.fieldHeight;
    const containerAspectRatio = containerWidth / containerHeight;

    let newWidth: number;
    let newHeight: number;

    if (containerAspectRatio > aspectRatio) {
      // Container is wider - fit to height
      newHeight = containerHeight;
      newWidth = newHeight * aspectRatio;
    } else {
      // Container is taller - fit to width
      newWidth = containerWidth;
      newHeight = newWidth / aspectRatio;
    }

    // Calculate scale factor
    this.scale = newWidth / this.fieldWidth;

    // Update renderer size
    this.app.renderer.resize(newWidth, newHeight);

    // Scale the game container
    this.gameContainer.scale.set(this.scale);

    // Center in container if needed
    const canvas = this.app.canvas;
    canvas.style.position = "absolute";
    canvas.style.left = `${(containerWidth - newWidth) / 2}px`;
    canvas.style.top = `${(containerHeight - newHeight) / 2}px`;
  }

  /**
   * Get player texture frame based on state.
   * @param team 0 = left (Team 1), 1 = right (Team 2)
   * @param model Player model index (0-7)
   * @param direction 0 = right, 1 = left
   * @param ascending Whether moving upward
   */
  private getPlayerTexture(
    team: number,
    model: number,
    direction: number,
    ascending: boolean
  ): Texture {
    if (!this.textures.players) {
      return Texture.WHITE;
    }

    const config = DEFAULT_SPRITE_CONFIG.players;
    const cacheKey = `${team}-${model}-${direction}-${ascending ? 1 : 0}`;

    // Check cache
    if (this.playerFrameTextures.has(cacheKey)) {
      return this.playerFrameTextures.get(cacheKey)!;
    }

    // Calculate frame position in sprite sheet
    // Layout: Team1 descending (2), Team1 ascending (2), Team2 descending (2), Team2 ascending (2)
    // Each row is a different model

    // Column calculation:
    // Team 0: cols 0-3 (descending 0-1, ascending 2-3)
    // Team 1: cols 4-7 (descending 4-5, ascending 6-7)
    const teamOffset = team * 4;
    const ascendingOffset = ascending ? 2 : 0;
    const directionOffset = direction; // 0 or 1 within the pair
    const col = teamOffset + ascendingOffset + directionOffset;

    // Row is the model
    const row = model % config.modelsCount;

    const x = col * config.frameWidth;
    const y = row * config.frameHeight;

    const texture = this.extractTextureRegion(
      this.textures.players,
      x,
      y,
      config.frameWidth,
      config.frameHeight
    );

    this.playerFrameTextures.set(cacheKey, texture);
    return texture;
  }

  /**
   * Synchronize sprite count with game state.
   */
  private syncSprites(players: PersonState[], balls: BallState[]): void {
    // Sync player sprites
    while (this.playerSprites.length < players.length) {
      const sprite = new Sprite(Texture.WHITE);
      sprite.anchor.set(0.5);
      this.playerSprites.push(sprite);
      this.entityLayer.addChild(sprite);
    }

    // Sync ball sprites
    while (this.ballSprites.length < balls.length) {
      const sprite = new Sprite(Texture.WHITE);
      sprite.anchor.set(0.5);
      this.ballSprites.push(sprite);
      this.entityLayer.addChild(sprite);
    }
  }

  /**
   * Render the current game state.
   */
  render(game: Game): void {
    if (!this.initialized) return;

    const snapshot = game.getSnapshot();

    // Sync sprites with game state
    this.syncSprites(snapshot.players, snapshot.balls);

    // Update player sprites
    for (let i = 0; i < snapshot.players.length; i++) {
      const player = snapshot.players[i];
      const sprite = this.playerSprites[i];

      // Update position
      sprite.x = player.x + DIMENSIONS.PLAYER_WIDTH / 2;
      sprite.y = player.y + DIMENSIONS.PLAYER_HEIGHT / 2;

      // Update texture based on state
      const direction = player.vx >= 0 ? 0 : 1;
      const ascending = player.vy < 0;
      const texture = this.getPlayerTexture(
        player.team,
        player.model,
        direction,
        ascending
      );
      sprite.texture = texture;
      sprite.width = DIMENSIONS.PLAYER_WIDTH;
      sprite.height = DIMENSIONS.PLAYER_HEIGHT;
      sprite.visible = true;
    }

    // Hide unused player sprites
    for (let i = snapshot.players.length; i < this.playerSprites.length; i++) {
      this.playerSprites[i].visible = false;
    }

    // Update ball sprites
    for (let i = 0; i < snapshot.balls.length; i++) {
      const ball = snapshot.balls[i];
      const sprite = this.ballSprites[i];

      // Update position
      const width =
        ball.type === "gold"
          ? DIMENSIONS.GOLD_BALL_WIDTH
          : DIMENSIONS.BALL_WIDTH;
      const height =
        ball.type === "gold"
          ? DIMENSIONS.GOLD_BALL_HEIGHT
          : DIMENSIONS.BALL_HEIGHT;

      sprite.x = ball.x + width / 2;
      sprite.y = ball.y + height / 2;
      sprite.width = width;
      sprite.height = height;

      // Update texture
      const ballTexture = this.ballTextures.get(ball.type);
      if (ballTexture) {
        sprite.texture = ballTexture;
        sprite.tint = ball.type === "red" ? 0xff0000 : 0xffffff;
      }

      sprite.visible = ball.alive && !ball.caught;
    }

    // Hide unused ball sprites
    for (let i = snapshot.balls.length; i < this.ballSprites.length; i++) {
      this.ballSprites[i].visible = false;
    }
  }

  /**
   * Get the canvas element.
   */
  getCanvas(): HTMLCanvasElement {
    return this.app.canvas;
  }

  /**
   * Get current scale factor.
   */
  getScale(): number {
    return this.scale;
  }

  /**
   * Get the PixiJS application (for advanced usage).
   */
  getApp(): Application {
    return this.app;
  }

  /**
   * Get the entity layer container (for adding custom sprites).
   */
  getEntityLayer(): Container {
    return this.entityLayer;
  }

  /**
   * Get the UI layer container (for adding UI elements).
   */
  getUILayer(): Container {
    return this.uiLayer;
  }

  /**
   * Check if renderer is initialized.
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Destroy the renderer and clean up resources.
   */
  destroy(): void {
    // Stop resize observer
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    // Remove window resize listener
    window.removeEventListener("resize", this.handleResize.bind(this));

    // Clear texture caches
    this.playerFrameTextures.clear();
    this.ballTextures.clear();

    // Destroy PixiJS application
    this.app.destroy(true, { children: true, texture: true });

    this.initialized = false;
  }
}
