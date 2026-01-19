import { create } from "zustand";
import type { Team, Score } from "../engine/types";

/**
 * Screen states for the game UI.
 */
export type Screen = "menu" | "playing" | "settings" | "results";

/**
 * Game store state.
 */
interface GameStoreState {
  /** Current screen */
  currentScreen: Screen;

  /** Last game result (for results screen) */
  lastResult: {
    winner: Team | null;
    score: Score;
  } | null;

  /** Whether the game is paused */
  isPaused: boolean;
}

/**
 * Game store actions.
 */
interface GameStoreActions {
  /** Navigate to a screen */
  setScreen: (screen: Screen) => void;

  /** Set the last game result */
  setLastResult: (winner: Team | null, score: Score) => void;

  /** Clear the last game result */
  clearLastResult: () => void;

  /** Pause the game */
  pause: () => void;

  /** Resume the game */
  resume: () => void;

  /** Toggle pause state */
  togglePause: () => void;

  /** Go to menu */
  goToMenu: () => void;

  /** Start playing */
  startGame: () => void;

  /** Open settings */
  openSettings: () => void;

  /** Show results */
  showResults: (winner: Team | null, score: Score) => void;
}

/**
 * Zustand store for game state management.
 */
export const useGameStore = create<GameStoreState & GameStoreActions>((set) => ({
  // Initial state
  currentScreen: "menu",
  lastResult: null,
  isPaused: false,

  // Actions
  setScreen: (screen) => set({ currentScreen: screen }),

  setLastResult: (winner, score) =>
    set({ lastResult: { winner, score } }),

  clearLastResult: () => set({ lastResult: null }),

  pause: () => set({ isPaused: true }),

  resume: () => set({ isPaused: false }),

  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),

  goToMenu: () =>
    set({
      currentScreen: "menu",
      isPaused: false,
    }),

  startGame: () =>
    set({
      currentScreen: "playing",
      isPaused: false,
      lastResult: null,
    }),

  openSettings: () => set({ currentScreen: "settings" }),

  showResults: (winner, score) =>
    set({
      currentScreen: "results",
      lastResult: { winner, score },
      isPaused: false,
    }),
}));

/**
 * Selector for current screen.
 */
export const selectScreen = (state: GameStoreState) => state.currentScreen;

/**
 * Selector for last result.
 */
export const selectLastResult = (state: GameStoreState) => state.lastResult;

/**
 * Selector for pause state.
 */
export const selectIsPaused = (state: GameStoreState) => state.isPaused;
