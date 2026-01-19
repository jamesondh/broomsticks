import { useEffect, useRef, useCallback } from "react";

/**
 * Custom hook for a requestAnimationFrame game loop.
 * Handles visibility changes and cleanup automatically.
 *
 * @param callback Function called each frame with current timestamp
 * @param active Whether the loop is active
 */
export function useGameLoop(
  callback: (now: number) => void,
  active: boolean = true
): void {
  const frameRef = useRef<number | null>(null);
  const callbackRef = useRef(callback);
  const activeRef = useRef(active);

  // Keep callback ref up to date
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Keep active ref up to date
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    if (!active) {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      return;
    }

    const loop = (now: number) => {
      if (activeRef.current) {
        callbackRef.current(now);
        frameRef.current = requestAnimationFrame(loop);
      }
    };

    frameRef.current = requestAnimationFrame(loop);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [active]);

  // Handle visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden - stop loop
        if (frameRef.current !== null) {
          cancelAnimationFrame(frameRef.current);
          frameRef.current = null;
        }
      } else if (activeRef.current) {
        // Page is visible and should be active - restart loop
        const loop = (now: number) => {
          if (activeRef.current) {
            callbackRef.current(now);
            frameRef.current = requestAnimationFrame(loop);
          }
        };
        frameRef.current = requestAnimationFrame(loop);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);
}

/**
 * Custom hook that returns a stable game loop callback.
 * Useful when you need more control over the loop timing.
 *
 * @param callback Function called each frame
 * @returns Object with start, stop, and isRunning functions
 */
export function useGameLoopControl(callback: (now: number) => void) {
  const frameRef = useRef<number | null>(null);
  const callbackRef = useRef(callback);
  const runningRef = useRef(false);

  // Keep callback ref up to date
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const start = useCallback(() => {
    if (runningRef.current) return;
    runningRef.current = true;

    const loop = (now: number) => {
      if (runningRef.current) {
        callbackRef.current(now);
        frameRef.current = requestAnimationFrame(loop);
      }
    };

    frameRef.current = requestAnimationFrame(loop);
  }, []);

  const stop = useCallback(() => {
    runningRef.current = false;
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);

  const isRunning = useCallback(() => runningRef.current, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return { start, stop, isRunning };
}
