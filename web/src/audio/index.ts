/**
 * Audio module for Broomsticks.
 * Provides sound effect playback using Howler.js.
 */

export { AudioManager, getAudioManager, destroyAudioManager } from "./AudioManager";
export type { AudioManagerOptions } from "./AudioManager";
export { SOUNDS, getAllSoundIds } from "./sounds";
export type { SoundId, SoundDef } from "./sounds";
