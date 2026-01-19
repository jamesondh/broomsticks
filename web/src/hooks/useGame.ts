import { useEffect, useRef, useCallback, useState } from "react";
import { Game, type GameEvent } from "../engine/Game";
import type { GameConfig, GameSnapshot, PlayerInput } from "../engine/types";
import { useGameStore } from "../store/gameStore";

/**
 * Custom hook for managing a Game instance.
 * Handles creation, events, and lifecycle.
 */
export function useGame(config?: Partial<GameConfig>) {
  const gameRef = useRef<Game | null>(null);
  const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null);
  const { showResults } = useGameStore();

  // Create game instance
  useEffect(() => {
    const game = new Game(config);
    gameRef.current = game;
    setSnapshot(game.getSnapshot());

    return () => {
      gameRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only create once - config changes don't recreate

  // Subscribe to game events
  useEffect(() => {
    const game = gameRef.current;
    if (!game) return;

    const unsubscribe = game.on((event: GameEvent) => {
      switch (event.type) {
        case "stateChange":
          setSnapshot(game.getSnapshot());
          break;
        case "gameOver": {
          const finalScore = game.getScore();
          showResults(event.winner, finalScore);
          break;
        }
        case "goal":
          // Update snapshot after goal
          setSnapshot(game.getSnapshot());
          break;
      }
    });

    return unsubscribe;
  }, [showResults]);

  // Start the game
  const start = useCallback(() => {
    gameRef.current?.start();
  }, []);

  // Pause the game
  const pause = useCallback(() => {
    gameRef.current?.pause();
  }, []);

  // Resume the game
  const resume = useCallback(() => {
    gameRef.current?.resume();
  }, []);

  // Reset the game
  const reset = useCallback(() => {
    gameRef.current?.reset();
    if (gameRef.current) {
      setSnapshot(gameRef.current.getSnapshot());
    }
  }, []);

  // Return to menu
  const returnToMenu = useCallback(() => {
    gameRef.current?.returnToMenu();
    if (gameRef.current) {
      setSnapshot(gameRef.current.getSnapshot());
    }
  }, []);

  // Update the game (call each frame)
  const update = useCallback((now: number, inputs: Map<number, PlayerInput>) => {
    const game = gameRef.current;
    if (!game) return;

    game.update(now, inputs);
    setSnapshot(game.getSnapshot());
  }, []);

  // Get current snapshot without triggering re-render
  const getSnapshot = useCallback((): GameSnapshot | null => {
    return gameRef.current?.getSnapshot() ?? null;
  }, []);

  // Get interpolation factor
  const getInterpolation = useCallback((): number => {
    return gameRef.current?.getInterpolation() ?? 0;
  }, []);

  // Get the game instance (use sparingly)
  const getGame = useCallback((): Game | null => {
    return gameRef.current;
  }, []);

  return {
    snapshot,
    start,
    pause,
    resume,
    reset,
    returnToMenu,
    update,
    getSnapshot,
    getInterpolation,
    getGame,
  };
}

/**
 * Hook for subscribing to specific game events.
 */
export function useGameEvents(
  game: Game | null,
  onEvent: (event: GameEvent) => void
) {
  const callbackRef = useRef(onEvent);

  useEffect(() => {
    callbackRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!game) return;

    return game.on((event) => {
      callbackRef.current(event);
    });
  }, [game]);
}
