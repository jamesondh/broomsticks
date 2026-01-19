import { Application, Container, Sprite, Texture, Graphics, Assets, Rectangle } from "pixi.js";
import type { Game, GameEvent } from "../engine/Game";
import type { PersonState, BallState, Team, Score } from "../engine/types";
import { FIELD, DIMENSIONS } from "../engine/constants";
import { BallSprite } from "./sprites/BallSprite";
import { FieldSprite } from "./sprites/FieldSprite";
import { Scoreboard } from "./ui/Scoreboard";
import { CountdownOverlay } from "./ui/CountdownOverlay";
import { ScoreFlash } from "./ui/ScoreFlash";
import { WinScreen } from "./ui/WinScreen";

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
    frameSize: number;
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
 * Default sprite sheet configuration based on original Java source.
 * players.gif: 321x241, 40px cell grid with 1px padding, 39x39 actual frames
 * Layout: Team 0 at x=1, Team 1 at x=161, 5 models per team
 * items.gif: 81x161, grid layout with balls and baskets
 */
const DEFAULT_SPRITE_CONFIG: SpriteSheetConfig = {
  players: {
    frameWidth: 39,
    frameHeight: 39,
    teamsPerRow: 2,
    directionsPerTeam: 4, // descending (2) + ascending (2)
    modelsCount: 5, // 5 models per team (0-4 for team 0, 5-9 maps to 0-4 for team 1)
  },
  items: {
    cellWidth: 40,
    cellHeight: 40,
    frameSize: 39,
    // Ball positions from original Java: CropImageFilter(1, (n+1)*40+1, 39, 39)
    ballBlackX: 1,
    ballBlackY: 41, // Row 1: (0+1)*40+1 = 41
    ballRedX: 1,
    ballRedY: 81, // Row 2: (1+1)*40+1 = 81
    ballGoldX: 1,
    ballGoldY: 121, // Row 3 (estimated)
    // Basket positions from original Java: CropImageFilter(1, 121, 39, 39) and (41, 121, 39, 39)
    basketLeftX: 1,
    basketLeftY: 121,
    basketRightX: 41,
    basketRightY: 121,
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

  /** UI Components */
  private fieldSprite: FieldSprite | null = null;
  private scoreboard: Scoreboard | null = null;
  private countdownOverlay: CountdownOverlay | null = null;
  private scoreFlash: ScoreFlash | null = null;
  private winScreen: WinScreen | null = null;

  /** Game event unsubscribe function */
  private unsubscribeGame: (() => void) | null = null;

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
      roundPixels: true, // Snap sprites to pixel grid
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

    // Set up background with new FieldSprite
    this.setupField();

    // Set up UI components
    this.setupUI();

    // Set up resize handling
    if (this.autoResize) {
      this.setupResizeObserver();
      this.handleResize();
    }

    this.initialized = true;
  }

  /**
   * Set up field (background, baskets) using FieldSprite.
   */
  private setupField(): void {
    this.fieldSprite = new FieldSprite({
      width: this.fieldWidth,
      height: this.fieldHeight,
    });

    // Set textures if available
    if (this.textures.sky) {
      this.fieldSprite.setBackgroundTexture(this.textures.sky);
    }
    if (this.textures.items) {
      this.fieldSprite.setItemsTexture(this.textures.items);
    }

    this.fieldSprite.addTo(this.backgroundLayer);
  }

  /**
   * Set up all UI components.
   */
  private setupUI(): void {
    // Scoreboard
    this.scoreboard = new Scoreboard({ fieldWidth: this.fieldWidth });
    this.scoreboard.addTo(this.uiLayer);

    // Countdown overlay
    this.countdownOverlay = new CountdownOverlay({
      fieldWidth: this.fieldWidth,
      fieldHeight: this.fieldHeight,
    });
    this.countdownOverlay.addTo(this.uiLayer);

    // Score flash
    this.scoreFlash = new ScoreFlash({
      fieldWidth: this.fieldWidth,
      fieldHeight: this.fieldHeight,
    });
    this.scoreFlash.addTo(this.uiLayer);

    // Win screen
    this.winScreen = new WinScreen({
      fieldWidth: this.fieldWidth,
      fieldHeight: this.fieldHeight,
    });
    this.winScreen.addTo(this.uiLayer);
  }

  /**
   * Load all required textures.
   */
  private async loadTextures(): Promise<void> {
    try {
      // Load sprite sheets (PNG format - GIF requires @pixi/gif extension)
      const [players, items, sky] = await Promise.all([
        Assets.load<Texture>("/images/players.png"),
        Assets.load<Texture>("/images/items.png"),
        Assets.load<Texture>("/images/sky1.jpg"),
      ]);

      // Set nearest-neighbor scaling for pixel art (prevents blurriness)
      if (players?.source) {
        players.source.scaleMode = "nearest";
      }
      if (items?.source) {
        items.source.scaleMode = "nearest";
      }

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
   * The balls in items.png are ~16x16 pixels in the top-left of each 40x40 cell.
   * Ball positions: black at y=41, red at y=81
   */
  private extractBallTextures(): void {
    if (!this.textures.items) return;

    // Ball sprites are ~16x16, positioned at top-left of their cells
    // Extract just the ball portion, not the full 39x39 cell
    const ballSize = 17; // Slightly larger to capture full ball with border

    // Black ball - row 1: starts at y=41
    this.ballTextures.set(
      "black",
      this.extractTextureRegion(
        this.textures.items,
        1, // x position
        41, // y position (row 1)
        ballSize,
        ballSize
      )
    );

    // Red ball - row 2: starts at y=81
    this.ballTextures.set(
      "red",
      this.extractTextureRegion(
        this.textures.items,
        1,
        81, // y position (row 2)
        ballSize,
        ballSize
      )
    );

    // Gold ball - use black ball texture, will be tinted gold
    this.ballTextures.set(
      "gold",
      this.ballTextures.get("black") ?? Texture.WHITE
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
   * Based on original Java: CropImageFilter(n2*80 + n3*40 + 1, n*40 + 41, 39, 39)
   * where n2 = vState (0=falling, 1=rising), n3 = hDir (0=right, 1=left)
   * @param team 0 = left (Team 1), 1 = right (Team 2)
   * @param model Player model index (0-4 per team, or 0-9 total where 5-9 = team 1)
   * @param direction 0 = right, 1 = left
   * @param ascending Whether moving upward (vState: 0=falling, 1=rising)
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
    // Map model to 0-4 range for each team
    const modelInTeam = model % config.modelsCount;
    const vState = ascending ? 1 : 0;
    const hDir = direction;

    const cacheKey = `${team}-${modelInTeam}-${hDir}-${vState}`;

    // Check cache
    if (this.playerFrameTextures.has(cacheKey)) {
      return this.playerFrameTextures.get(cacheKey)!;
    }

    // Original Java extraction logic:
    // Team 0 (models 0-4): x = vState*80 + hDir*40 + 1
    // Team 1 (models 5-9): x = vState*80 + hDir*40 + 161
    // y = modelInTeam * 40 + 41
    const teamOffset = team === 0 ? 1 : 161;
    const x = vState * 80 + hDir * 40 + teamOffset;
    const y = modelInTeam * 40 + 41;

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
   * Bind to a game instance to receive events.
   */
  bindToGame(game: Game): void {
    // Unsubscribe from previous game
    if (this.unsubscribeGame) {
      this.unsubscribeGame();
    }

    // Subscribe to game events
    this.unsubscribeGame = game.on((event: GameEvent) => {
      this.handleGameEvent(event, game);
    });

    // Set up win screen callback
    if (this.winScreen) {
      this.winScreen.setOnPlayAgain(() => {
        game.returnToMenu();
        this.winScreen?.hide();
      });
    }
  }

  /**
   * Handle game events for UI updates.
   */
  private handleGameEvent(event: GameEvent, game: Game): void {
    switch (event.type) {
      case "stateChange":
        this.handleStateChange(event.from, event.to, game);
        break;
      case "countdown":
        this.countdownOverlay?.show(event.seconds);
        break;
      case "goal":
        // Flash the score and highlight basket
        this.scoreFlash?.show(event.event.team, event.event.points);
        this.scoreboard?.highlightTeam(event.event.team);
        // Highlight the basket (inverted: team 0 scores on right, team 1 on left)
        this.fieldSprite?.setHighlight(event.event.team === 0 ? 1 : 2);
        break;
      case "gameOver":
        this.winScreen?.show(event.winner, game.getScore());
        break;
    }
  }

  /**
   * Handle game state changes.
   */
  private handleStateChange(from: string, to: string, _game: Game): void {
    // Hide countdown when leaving countdown state
    if (from === "countdown" && to === "playing") {
      this.countdownOverlay?.showGo();
      setTimeout(() => this.countdownOverlay?.hide(), 500);
    }

    // Clear basket highlight when returning to playing
    if (to === "playing") {
      this.fieldSprite?.setHighlight(0);
    }

    // Hide win screen when leaving game over
    if (from === "gameOver") {
      this.winScreen?.hide();
    }
  }

  /**
   * Render the current game state.
   */
  render(game: Game): void {
    if (!this.initialized) return;

    const snapshot = game.getSnapshot();

    // Update scoreboard
    this.scoreboard?.update(snapshot.score);

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
        // Gold ball uses black texture with gold tint
        // Red ball uses red texture from sprite sheet (no tint needed)
        sprite.tint = ball.type === "gold" ? 0xffd700 : 0xffffff;
      }

      // Ball stays visible when caught (it follows the player holding it)
      sprite.visible = ball.alive;
    }

    // Hide unused ball sprites
    for (let i = snapshot.balls.length; i < this.ballSprites.length; i++) {
      this.ballSprites[i].visible = false;
    }
  }

  /**
   * Show countdown with a specific number.
   */
  showCountdown(seconds: number): void {
    this.countdownOverlay?.show(seconds);
  }

  /**
   * Hide countdown overlay.
   */
  hideCountdown(): void {
    this.countdownOverlay?.hide();
  }

  /**
   * Show score flash.
   */
  showScoreFlash(team: Team, points?: number): void {
    this.scoreFlash?.show(team, points);
  }

  /**
   * Show win screen.
   */
  showWinScreen(winner: Team, score: Score): void {
    this.winScreen?.show(winner, score);
  }

  /**
   * Hide win screen.
   */
  hideWinScreen(): void {
    this.winScreen?.hide();
  }

  /**
   * Set basket highlight.
   */
  setBasketHighlight(state: number): void {
    this.fieldSprite?.setHighlight(state);
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
    // Unsubscribe from game events
    if (this.unsubscribeGame) {
      this.unsubscribeGame();
      this.unsubscribeGame = null;
    }

    // Stop resize observer
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    // Remove window resize listener
    window.removeEventListener("resize", this.handleResize.bind(this));

    // Clean up UI components
    this.fieldSprite?.destroy();
    this.scoreboard?.destroy();
    this.countdownOverlay?.destroy();
    this.scoreFlash?.destroy();
    this.winScreen?.destroy();

    // Clear texture caches
    this.playerFrameTextures.clear();
    this.ballTextures.clear();
    BallSprite.clearCache();

    // Destroy PixiJS application
    this.app.destroy(true, { children: true, texture: true });

    this.initialized = false;
  }
}
