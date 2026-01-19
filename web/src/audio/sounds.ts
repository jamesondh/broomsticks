/**
 * Sound effect definitions.
 */
export const SOUNDS = {
  /** Goal scored */
  score: "/audio/score.mp3",

  /** Ball caught by player */
  catch: "/audio/catch.mp3",

  /** Player collision/bump */
  bump: "/audio/bump.mp3",

  /** Countdown tick */
  pop: "/audio/pop.mp3",

  /** Game over / win */
  win: "/audio/win.mp3",
} as const;

/**
 * Sound effect keys.
 */
export type SoundKey = keyof typeof SOUNDS;

/**
 * Mapping from game events to sounds.
 */
export const EVENT_SOUNDS: Record<string, SoundKey> = {
  goal: "score",
  "collision.catch": "catch",
  "collision.bump": "bump",
  countdown: "pop",
  gameOver: "win",
};
