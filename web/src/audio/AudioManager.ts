import { Howl, Howler } from "howler";
import { SOUNDS, type SoundKey } from "./sounds";

/**
 * Audio manager for game sound effects.
 * Wraps Howler.js for easy sound playback.
 */
export class AudioManager {
  /** Loaded sound instances */
  private sounds: Map<SoundKey, Howl> = new Map();

  /** Whether audio is enabled */
  private _enabled: boolean = true;

  /** Global volume (0-1) */
  private _volume: number = 0.7;

  /** Whether sounds are loaded */
  private loaded: boolean = false;

  /** Singleton instance */
  private static instance: AudioManager | null = null;

  private constructor() {}

  /**
   * Get the singleton instance.
   */
  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /**
   * Load all sound effects.
   */
  async load(): Promise<void> {
    if (this.loaded) return;

    const loadPromises: Promise<void>[] = [];

    for (const [key, src] of Object.entries(SOUNDS)) {
      const promise = new Promise<void>((resolve) => {
        const howl = new Howl({
          src: [src],
          volume: this._volume,
          preload: true,
          onload: () => resolve(),
          onloaderror: (_id, error) => {
            console.warn(`Failed to load sound ${key}:`, error);
            resolve(); // Don't reject - allow game to continue without sound
          },
        });
        this.sounds.set(key as SoundKey, howl);
      });
      loadPromises.push(promise);
    }

    await Promise.all(loadPromises);
    this.loaded = true;
  }

  /**
   * Play a sound effect.
   */
  play(sound: SoundKey): void {
    if (!this._enabled) return;

    const howl = this.sounds.get(sound);
    if (howl) {
      howl.play();
    }
  }

  /**
   * Stop a specific sound.
   */
  stop(sound: SoundKey): void {
    const howl = this.sounds.get(sound);
    if (howl) {
      howl.stop();
    }
  }

  /**
   * Stop all sounds.
   */
  stopAll(): void {
    Howler.stop();
  }

  /**
   * Enable or disable audio.
   */
  setEnabled(enabled: boolean): void {
    this._enabled = enabled;
    if (!enabled) {
      this.stopAll();
    }
  }

  /**
   * Check if audio is enabled.
   */
  get enabled(): boolean {
    return this._enabled;
  }

  /**
   * Set global volume.
   */
  setVolume(volume: number): void {
    this._volume = Math.max(0, Math.min(1, volume));

    // Update all loaded sounds
    for (const howl of this.sounds.values()) {
      howl.volume(this._volume);
    }
  }

  /**
   * Get global volume.
   */
  get volume(): number {
    return this._volume;
  }

  /**
   * Mute all audio.
   */
  mute(): void {
    Howler.mute(true);
  }

  /**
   * Unmute all audio.
   */
  unmute(): void {
    Howler.mute(false);
  }

  /**
   * Clean up all sounds.
   */
  destroy(): void {
    for (const howl of this.sounds.values()) {
      howl.unload();
    }
    this.sounds.clear();
    this.loaded = false;
  }
}

/**
 * Get the audio manager singleton.
 */
export function getAudioManager(): AudioManager {
  return AudioManager.getInstance();
}
