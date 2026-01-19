import { Assets, Texture, Rectangle } from "pixi.js";

/**
 * Asset paths for game resources.
 */
export const ASSET_PATHS = {
  field: "/images/field.jpg",
  players: "/images/players.png",
  items: "/images/items.png",
  intro: "/images/intro.png",
} as const;

/**
 * Sprite sheet frame definitions.
 * Players.gif: 4 cols (team/direction) x 8 rows (models), 38x38 per frame
 * Items.gif: balls (16x16), gold (8x8), baskets
 */
export const SPRITE_FRAMES = {
  player: {
    width: 38,
    height: 38,
    cols: 4,
    rows: 8,
  },
  ball: {
    width: 16,
    height: 16,
  },
  goldBall: {
    width: 8,
    height: 8,
  },
} as const;

/**
 * Player sprite frame indices.
 * Column layout: 0=red-left, 1=red-right, 2=black-left, 3=black-right
 */
export const PLAYER_FRAMES = {
  // Team 0 (red/left team)
  team0: {
    left: 0,
    right: 1,
  },
  // Team 1 (black/right team)
  team1: {
    left: 2,
    right: 3,
  },
} as const;

/**
 * Loaded asset textures.
 */
export interface GameAssets {
  field: Texture;
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
 * frameIndex: 0=red-left, 1=red-right, 2=black-left, 3=black-right
 */
function extractPlayerFrames(playersTexture: Texture): Texture[][] {
  const { width, height, cols, rows } = SPRITE_FRAMES.player;
  const frames: Texture[][] = [];

  for (let model = 0; model < rows; model++) {
    const modelFrames: Texture[] = [];
    for (let col = 0; col < cols; col++) {
      const frame = new Texture({
        source: playersTexture.source,
        frame: new Rectangle(col * width, model * height, width, height),
      });
      modelFrames.push(frame);
    }
    frames.push(modelFrames);
  }

  return frames;
}

/**
 * Extract ball textures from the items spritesheet.
 * Layout (from items.gif analysis):
 * - Red ball at (0, 0), 16x16
 * - Black ball at (16, 0), 16x16
 * - Gold ball at (32, 0), 8x8
 * - Basket left at (0, 16)
 * - Basket right at (x, 16)
 */
function extractItemTextures(itemsTexture: Texture): {
  redBall: Texture;
  blackBall: Texture;
  goldBall: Texture;
  basketLeft: Texture;
  basketRight: Texture;
} {
  const redBall = new Texture({
    source: itemsTexture.source,
    frame: new Rectangle(0, 0, 16, 16),
  });

  const blackBall = new Texture({
    source: itemsTexture.source,
    frame: new Rectangle(16, 0, 16, 16),
  });

  const goldBall = new Texture({
    source: itemsTexture.source,
    frame: new Rectangle(32, 0, 8, 8),
  });

  // Baskets - adjust coordinates based on actual sprite layout
  const basketLeft = new Texture({
    source: itemsTexture.source,
    frame: new Rectangle(0, 16, 32, 48),
  });

  const basketRight = new Texture({
    source: itemsTexture.source,
    frame: new Rectangle(32, 16, 32, 48),
  });

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
  const urls = [ASSET_PATHS.field, ASSET_PATHS.players, ASSET_PATHS.items, ASSET_PATHS.intro];
  const textureMap = await Assets.load(urls);

  // Assets.load returns an object keyed by the URL
  const field = textureMap[ASSET_PATHS.field] as Texture;
  const players = textureMap[ASSET_PATHS.players] as Texture;
  const items = textureMap[ASSET_PATHS.items] as Texture;
  const intro = textureMap[ASSET_PATHS.intro] as Texture;

  // Validate that all textures loaded successfully
  if (!players || !items || !field || !intro) {
    throw new Error(
      `Failed to load textures: ${JSON.stringify({
        field: !!field,
        players: !!players,
        items: !!items,
        intro: !!intro,
      })}`
    );
  }

  // Extract individual frames
  const playerFrames = extractPlayerFrames(players);
  const itemTextures = extractItemTextures(items);

  loadedAssets = {
    field,
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
      ASSET_PATHS.field,
      ASSET_PATHS.players,
      ASSET_PATHS.items,
      ASSET_PATHS.intro,
    ]);
    loadedAssets = null;
  }
}
