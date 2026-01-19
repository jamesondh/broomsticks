import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AIDifficulty } from "../engine/types";
import { AI_DIFFICULTY_MAP } from "../engine/constants";

/**
 * Settings store state.
 */
interface SettingsState {
  /** AI difficulty level */
  aiDifficulty: AIDifficulty;

  /** Number of red balls (1-3) */
  redBallCount: number;

  /** Number of black balls (0-5) */
  blackBallCount: number;

  /** Score required to win (10-100) */
  winScore: number;

  /** Sound effects enabled */
  sfxEnabled: boolean;

  /** Sound effects volume (0-1) */
  sfxVolume: number;

  /** Particles enabled */
  particlesEnabled: boolean;

  /** Screen shake enabled */
  screenShakeEnabled: boolean;
}

/**
 * Settings store actions.
 */
interface SettingsActions {
  /** Set AI difficulty */
  setAIDifficulty: (difficulty: AIDifficulty) => void;

  /** Set red ball count */
  setRedBallCount: (count: number) => void;

  /** Set black ball count */
  setBlackBallCount: (count: number) => void;

  /** Set win score */
  setWinScore: (score: number) => void;

  /** Set SFX enabled */
  setSfxEnabled: (enabled: boolean) => void;

  /** Set SFX volume */
  setSfxVolume: (volume: number) => void;

  /** Set particles enabled */
  setParticlesEnabled: (enabled: boolean) => void;

  /** Set screen shake enabled */
  setScreenShakeEnabled: (enabled: boolean) => void;

  /** Reset to defaults */
  resetDefaults: () => void;

  /** Get AI smart value from difficulty */
  getAISmartValue: () => number;
}

/**
 * Default settings values.
 */
const DEFAULT_SETTINGS: SettingsState = {
  aiDifficulty: "medium",
  redBallCount: 1,
  blackBallCount: 2,
  winScore: 50,
  sfxEnabled: true,
  sfxVolume: 0.7,
  particlesEnabled: true,
  screenShakeEnabled: true,
};

/**
 * Zustand store for persisted game settings.
 */
export const useSettingsStore = create<SettingsState & SettingsActions>()(
  persist(
    (set, get) => ({
      // Initial state
      ...DEFAULT_SETTINGS,

      // Actions
      setAIDifficulty: (difficulty) => set({ aiDifficulty: difficulty }),

      setRedBallCount: (count) =>
        set({ redBallCount: Math.max(1, Math.min(3, count)) }),

      setBlackBallCount: (count) =>
        set({ blackBallCount: Math.max(0, Math.min(5, count)) }),

      setWinScore: (score) =>
        set({ winScore: Math.max(10, Math.min(100, score)) }),

      setSfxEnabled: (enabled) => set({ sfxEnabled: enabled }),

      setSfxVolume: (volume) =>
        set({ sfxVolume: Math.max(0, Math.min(1, volume)) }),

      setParticlesEnabled: (enabled) => set({ particlesEnabled: enabled }),

      setScreenShakeEnabled: (enabled) => set({ screenShakeEnabled: enabled }),

      resetDefaults: () => set(DEFAULT_SETTINGS),

      getAISmartValue: () => {
        const difficulty = get().aiDifficulty;
        return AI_DIFFICULTY_MAP[difficulty];
      },
    }),
    {
      name: "broomsticks-settings",
    }
  )
);

/**
 * Selector for AI difficulty.
 */
export const selectAIDifficulty = (state: SettingsState) => state.aiDifficulty;

/**
 * Selector for ball counts.
 */
export const selectBallCounts = (state: SettingsState) => ({
  red: state.redBallCount,
  black: state.blackBallCount,
});

/**
 * Selector for win score.
 */
export const selectWinScore = (state: SettingsState) => state.winScore;

/**
 * Selector for audio settings.
 */
export const selectAudioSettings = (state: SettingsState) => ({
  enabled: state.sfxEnabled,
  volume: state.sfxVolume,
});

/**
 * Selector for visual settings.
 */
export const selectVisualSettings = (state: SettingsState) => ({
  particles: state.particlesEnabled,
  screenShake: state.screenShakeEnabled,
});
