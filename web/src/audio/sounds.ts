/**
 * Sound effect definitions for Broomsticks.
 * Audio files are sourced from the original Java version (broomsticksDevF).
 */

/**
 * Sound effect identifiers.
 */
export type SoundId = "score" | "catch" | "bump" | "win";

/**
 * Sound effect definition with path and optional settings.
 */
export interface SoundDef {
  /** Path to the audio file (relative to public/) */
  src: string;
  /** Base volume (0-1) */
  volume?: number;
  /** Whether to preload this sound */
  preload?: boolean;
}

/**
 * All sound effect definitions.
 * Paths are relative to web/public/.
 */
export const SOUNDS: Record<SoundId, SoundDef> = {
  /** Played when a goal is scored */
  score: {
    src: "/audio/score.wav",
    volume: 0.8,
    preload: true,
  },

  /** Played when a player catches the red ball */
  catch: {
    src: "/audio/catch.wav",
    volume: 0.7,
    preload: true,
  },

  /** Played when players collide or player hits black ball */
  bump: {
    src: "/audio/bump.wav",
    volume: 0.6,
    preload: true,
  },

  /** Played when a player wins the game */
  win: {
    src: "/audio/win.wav",
    volume: 1.0,
    preload: true,
  },
} as const;

/**
 * Get all sound IDs.
 */
export function getAllSoundIds(): SoundId[] {
  return Object.keys(SOUNDS) as SoundId[];
}
