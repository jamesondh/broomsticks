import { Howl, Howler } from "howler";
import { SOUNDS, getAllSoundIds, type SoundId } from "./sounds";

/**
 * Audio manager options.
 */
export interface AudioManagerOptions {
  /** Initial master volume (0-1, default: 0.7) */
  volume?: number;
  /** Whether SFX are enabled (default: true) */
  enabled?: boolean;
  /** Whether to mute all audio (default: false) */
  muted?: boolean;
}

/**
 * Manages all game audio using Howler.js.
 * Handles loading, playing, and volume control for sound effects.
 */
export class AudioManager {
  /** Loaded Howl instances by sound ID */
  private sounds: Map<SoundId, Howl> = new Map();

  /** Master volume (0-1) */
  private _volume: number;

  /** Whether SFX are enabled */
  private _enabled: boolean;

  /** Whether audio is muted */
  private _muted: boolean;

  /** Whether sounds are loaded */
  private _loaded: boolean = false;

  /** Loading promise (for awaiting load completion) */
  private loadPromise: Promise<void> | null = null;

  constructor(options: AudioManagerOptions = {}) {
    this._volume = options.volume ?? 0.7;
    this._enabled = options.enabled ?? true;
    this._muted = options.muted ?? false;

    // Set global Howler volume
    Howler.volume(this._muted ? 0 : this._volume);
  }

  /**
   * Load all sound effects.
   * Call this before playing any sounds.
   */
  async load(): Promise<void> {
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = this.doLoad();
    return this.loadPromise;
  }

  /**
   * Internal load implementation.
   */
  private async doLoad(): Promise<void> {
    const soundIds = getAllSoundIds();

    const loadPromises = soundIds.map((id) => {
      return new Promise<void>((resolve) => {
        const def = SOUNDS[id];

        const howl = new Howl({
          src: [def.src],
          volume: def.volume ?? 1.0,
          preload: def.preload ?? true,
          onload: () => resolve(),
          onloaderror: (_id, error) => {
            console.warn(`Failed to load sound "${id}":`, error);
            // Resolve anyway - missing sounds shouldn't break the game
            resolve();
          },
        });

        this.sounds.set(id, howl);
      });
    });

    await Promise.all(loadPromises);
    this._loaded = true;
  }

  /**
   * Play a sound effect.
   * @param id - The sound effect to play
   * @returns The Howler sound ID (for stopping/manipulating), or undefined if not played
   */
  play(id: SoundId): number | undefined {
    if (!this._enabled || this._muted) {
      return undefined;
    }

    const howl = this.sounds.get(id);
    if (!howl) {
      console.warn(`Sound "${id}" not loaded`);
      return undefined;
    }

    return howl.play();
  }

  /**
   * Stop a specific sound or all sounds.
   * @param id - Optional sound ID to stop (stops all if omitted)
   */
  stop(id?: SoundId): void {
    if (id) {
      this.sounds.get(id)?.stop();
    } else {
      for (const howl of this.sounds.values()) {
        howl.stop();
      }
    }
  }

  /**
   * Get the master volume.
   */
  get volume(): number {
    return this._volume;
  }

  /**
   * Set the master volume (0-1).
   */
  set volume(value: number) {
    this._volume = Math.max(0, Math.min(1, value));
    if (!this._muted) {
      Howler.volume(this._volume);
    }
  }

  /**
   * Get whether SFX are enabled.
   */
  get enabled(): boolean {
    return this._enabled;
  }

  /**
   * Set whether SFX are enabled.
   */
  set enabled(value: boolean) {
    this._enabled = value;
  }

  /**
   * Get whether audio is muted.
   */
  get muted(): boolean {
    return this._muted;
  }

  /**
   * Set whether audio is muted.
   */
  set muted(value: boolean) {
    this._muted = value;
    Howler.volume(value ? 0 : this._volume);
  }

  /**
   * Toggle mute state.
   * @returns New muted state
   */
  toggleMute(): boolean {
    this.muted = !this._muted;
    return this._muted;
  }

  /**
   * Check if sounds are loaded.
   */
  get loaded(): boolean {
    return this._loaded;
  }

  /**
   * Unload all sounds and clean up resources.
   */
  destroy(): void {
    for (const howl of this.sounds.values()) {
      howl.unload();
    }
    this.sounds.clear();
    this._loaded = false;
    this.loadPromise = null;
  }
}

/**
 * Singleton instance for global audio management.
 */
let globalAudioManager: AudioManager | null = null;

/**
 * Get or create the global AudioManager instance.
 */
export function getAudioManager(): AudioManager {
  if (!globalAudioManager) {
    globalAudioManager = new AudioManager();
  }
  return globalAudioManager;
}

/**
 * Destroy the global AudioManager instance.
 */
export function destroyAudioManager(): void {
  if (globalAudioManager) {
    globalAudioManager.destroy();
    globalAudioManager = null;
  }
}
