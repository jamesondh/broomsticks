import { Assets, Texture, Rectangle, SCALE_MODES } from "pixi.js";

/**
 * Asset paths for game resources.
 */
export const ASSET_PATHS = {
  sky: "/images/sky.png",
  front: "/images/front.png",
  players: "/images/players-raw.png",
  items: "/images/items-raw.png",
  intro: "/images/intro.png",
} as const;

/**
 * Sprite sheet frame definitions based on original C++ version.
 * Players: 8 cols x 5 rows, 40px cells with 1px border, 39px sprites
 * Items: 2 cols x 4 rows, 40px cells with 1px border, 39px sprites
 * Header offset for players: 41px
 */
export const SPRITE_FRAMES = {
  player: {
    width: 39,
    height: 39,
    cellSize: 40,
    headerOffset: 41,
    models: 5,
  },
  item: {
    width: 39,
    height: 39,
    cellSize: 40,
  },
} as const;

/**
 * Player sprite x-offsets based on team and direction.
 * From C++ code: x = team*160 + v*80 + h*40 + 1
 * We use v=0 (descending) for all, h determines left/right facing.
 */
export const PLAYER_FRAME_X = {
  // Team 0 (red/left team)
  team0: {
    left: 1,    // team=0, v=0, h=0
    right: 41,  // team=0, v=0, h=1
  },
  // Team 1 (black/right team)
  team1: {
    left: 161,  // team=1, v=0, h=0
    right: 201, // team=1, v=0, h=1
  },
} as const;

/**
 * Loaded asset textures.
 */
export interface GameAssets {
  sky: Texture;
  front: Texture;
  players: Texture;
  items: Texture;
  intro: Texture;
  playerFrames: Texture[][];
  redBall: Texture;
  blackBall: Texture;
  goldBall: Texture;
  basketLeft: Texture;
  basketRight: Texture;
}

let loadedAssets: GameAssets | null = null;

/**
 * Extract player frame textures from the players spritesheet.
 * Returns a 2D array: [model][frameIndex]
 * frameIndex: 0=team0-left, 1=team0-right, 2=team1-left, 3=team1-right
 *
 * Based on C++ code: x = team*160 + v*80 + h*40 + 1, y = model*40 + 41
 * We use v=0 (descending) for all frames.
 */
function extractPlayerFrames(playersTexture: Texture): Texture[][] {
  const { width, height, cellSize, headerOffset, models } = SPRITE_FRAMES.player;
  const frames: Texture[][] = [];

  // X offsets for each frame type: [team0-left, team0-right, team1-left, team1-right]
  const xOffsets = [
    PLAYER_FRAME_X.team0.left,
    PLAYER_FRAME_X.team0.right,
    PLAYER_FRAME_X.team1.left,
    PLAYER_FRAME_X.team1.right,
  ];

  for (let model = 0; model < models; model++) {
    const modelFrames: Texture[] = [];
    const y = model * cellSize + headerOffset;

    for (const x of xOffsets) {
      const frame = new Texture({
        source: playersTexture.source,
        frame: new Rectangle(x, y, width, height),
      });
      // Use nearest neighbor for crisp pixel art
      frame.source.scaleMode = SCALE_MODES.NEAREST;
      modelFrames.push(frame);
    }
    frames.push(modelFrames);
  }

  return frames;
}

/**
 * Extract item textures from the items spritesheet.
 * Layout based on C++ code: x = 1 + which*40, y = model*40 + 1
 *
 * Items.bmp (81x161) has 2 columns x 4 rows of 40px cells.
 * Ball colors by model: 1=black, 2=red
 * Baskets in model 3.
 *
 * Note: The actual ball sprites are smaller than the 39x39 cell,
 * centered within the cell. We extract the full cell.
 */
function extractItemTextures(itemsTexture: Texture): {
  redBall: Texture;
  blackBall: Texture;
  goldBall: Texture;
  basketLeft: Texture;
  basketRight: Texture;
} {
  const { width, height, cellSize } = SPRITE_FRAMES.item;

  // Red ball: model=2, which=0 -> x=1, y=81
  const redBall = new Texture({
    source: itemsTexture.source,
    frame: new Rectangle(1, 2 * cellSize + 1, width, height),
  });
  redBall.source.scaleMode = SCALE_MODES.NEAREST;

  // Black ball: model=1, which=0 -> x=1, y=41
  const blackBall = new Texture({
    source: itemsTexture.source,
    frame: new Rectangle(1, 1 * cellSize + 1, width, height),
  });
  blackBall.source.scaleMode = SCALE_MODES.NEAREST;

  // Gold ball: model=0, which=0 -> x=1, y=1
  // (Gold ball is smaller, centered in cell)
  const goldBall = new Texture({
    source: itemsTexture.source,
    frame: new Rectangle(1, 1, width, height),
  });
  goldBall.source.scaleMode = SCALE_MODES.NEAREST;

  // Baskets: model=3 -> y=121
  // Left basket: which=0 -> x=1
  const basketLeft = new Texture({
    source: itemsTexture.source,
    frame: new Rectangle(1, 3 * cellSize + 1, width, height),
  });
  basketLeft.source.scaleMode = SCALE_MODES.NEAREST;

  // Right basket: which=1 -> x=41
  const basketRight = new Texture({
    source: itemsTexture.source,
    frame: new Rectangle(1 + cellSize, 3 * cellSize + 1, width, height),
  });
  basketRight.source.scaleMode = SCALE_MODES.NEAREST;

  return { redBall, blackBall, goldBall, basketLeft, basketRight };
}

/**
 * Load all game assets.
 * Uses PIXI.Assets for efficient loading with caching.
 */
export async function loadAssets(): Promise<GameAssets> {
  if (loadedAssets) {
    return loadedAssets;
  }

  // Load all assets directly by URL - this handles caching automatically
  const urls = [
    ASSET_PATHS.sky,
    ASSET_PATHS.front,
    ASSET_PATHS.players,
    ASSET_PATHS.items,
    ASSET_PATHS.intro,
  ];
  const textureMap = await Assets.load(urls);

  // Assets.load returns an object keyed by the URL
  const sky = textureMap[ASSET_PATHS.sky] as Texture;
  const front = textureMap[ASSET_PATHS.front] as Texture;
  const players = textureMap[ASSET_PATHS.players] as Texture;
  const items = textureMap[ASSET_PATHS.items] as Texture;
  const intro = textureMap[ASSET_PATHS.intro] as Texture;

  // Validate that all textures loaded successfully
  if (!sky || !front || !players || !items || !intro) {
    throw new Error(
      `Failed to load textures: ${JSON.stringify({
        sky: !!sky,
        front: !!front,
        players: !!players,
        items: !!items,
        intro: !!intro,
      })}`
    );
  }

  // Set nearest-neighbor scaling for pixel art textures
  players.source.scaleMode = SCALE_MODES.NEAREST;
  items.source.scaleMode = SCALE_MODES.NEAREST;

  // Extract individual frames
  const playerFrames = extractPlayerFrames(players);
  const itemTextures = extractItemTextures(items);

  loadedAssets = {
    sky,
    front,
    players,
    items,
    intro,
    playerFrames,
    ...itemTextures,
  };

  return loadedAssets;
}

/**
 * Get loaded assets (throws if not loaded).
 */
export function getAssets(): GameAssets {
  if (!loadedAssets) {
    throw new Error("Assets not loaded. Call loadAssets() first.");
  }
  return loadedAssets;
}

/**
 * Check if assets are loaded.
 */
export function areAssetsLoaded(): boolean {
  return loadedAssets !== null;
}

/**
 * Unload all assets and clear cache.
 */
export async function unloadAssets(): Promise<void> {
  if (loadedAssets) {
    await Assets.unload([
      ASSET_PATHS.sky,
      ASSET_PATHS.front,
      ASSET_PATHS.players,
      ASSET_PATHS.items,
      ASSET_PATHS.intro,
    ]);
    loadedAssets = null;
  }
}
