import { useState, useEffect, useCallback } from "react";
import type { AIDifficulty } from "../engine/types";
import { AI_DIFFICULTY_MAP } from "../engine/constants";

const STORAGE_KEY = "broomsticks-settings";

/**
 * User-configurable game settings persisted to localStorage.
 */
export interface GameSettings {
  // AI
  aiDifficulty: AIDifficulty;

  // Balls
  redBallCount: number;
  blackBallCount: number;

  // Scoring
  winScore: number;

  // Audio
  sfxEnabled: boolean;
  sfxVolume: number;
}

/**
 * Default settings matching original gameplay.
 */
export const DEFAULT_SETTINGS: GameSettings = {
  aiDifficulty: "medium",
  redBallCount: 1,
  blackBallCount: 2,
  winScore: 50,
  sfxEnabled: true,
  sfxVolume: 0.7,
};

/**
 * Load settings from localStorage, falling back to defaults.
 */
function loadSettings(): GameSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to handle missing keys from older versions
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch {
    // Ignore parse errors, use defaults
  }
  return { ...DEFAULT_SETTINGS };
}

/**
 * Save settings to localStorage.
 */
function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage errors (e.g., quota exceeded)
  }
}

/**
 * Hook for managing game settings with localStorage persistence.
 */
export function useSettings() {
  const [settings, setSettingsState] = useState<GameSettings>(loadSettings);

  // Persist changes to localStorage
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  /**
   * Update one or more settings.
   */
  const updateSettings = useCallback((updates: Partial<GameSettings>) => {
    setSettingsState((prev) => ({ ...prev, ...updates }));
  }, []);

  /**
   * Reset all settings to defaults.
   */
  const resetSettings = useCallback(() => {
    setSettingsState({ ...DEFAULT_SETTINGS });
  }, []);

  /**
   * Get the AI smart value for the current difficulty.
   */
  const getAISmartValue = useCallback(() => {
    return AI_DIFFICULTY_MAP[settings.aiDifficulty];
  }, [settings.aiDifficulty]);

  return {
    settings,
    updateSettings,
    resetSettings,
    getAISmartValue,
  };
}
