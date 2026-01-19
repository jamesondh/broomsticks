import { useEffect, useRef, useState } from "react";
import { GameRenderer } from "../../renderer";
import type { GameSnapshot } from "../../engine/types";

interface GameCanvasProps {
  /** Callback when renderer is ready */
  onRendererReady?: (renderer: GameRenderer) => void;
  /** Initial game snapshot for creating sprites */
  initialSnapshot?: GameSnapshot;
  /** CSS class name for the container */
  className?: string;
}

/**
 * React component that mounts and manages the PixiJS GameRenderer.
 */
export function GameCanvas({
  onRendererReady,
  initialSnapshot,
  className,
}: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<GameRenderer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Don't re-initialize if already initialized
    if (rendererRef.current?.isInitialized()) {
      return;
    }

    const renderer = new GameRenderer();
    rendererRef.current = renderer;

    const initRenderer = async () => {
      try {
        await renderer.init(container);

        if (initialSnapshot) {
          renderer.createSprites(initialSnapshot);
        }

        setLoading(false);
        onRendererReady?.(renderer);
      } catch (err) {
        console.error("Failed to initialize renderer:", err);
        setError(err instanceof Error ? err.message : "Failed to initialize renderer");
        setLoading(false);
      }
    };

    initRenderer();

    return () => {
      if (rendererRef.current) {
        rendererRef.current.destroy();
        rendererRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally empty - only init once

  // Update sprites when initial snapshot changes
  useEffect(() => {
    if (initialSnapshot && rendererRef.current?.isInitialized()) {
      rendererRef.current.createSprites(initialSnapshot);
    }
  }, [initialSnapshot]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: "relative",
        width: "640px",
        height: "400px",
        overflow: "hidden",
      }}
    >
      {loading && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#1a1a2e",
            color: "#fff",
            fontFamily: "monospace",
          }}
        >
          Loading...
        </div>
      )}
      {error && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#2e1a1a",
            color: "#ff6b6b",
            fontFamily: "monospace",
            padding: "20px",
            textAlign: "center",
          }}
        >
          Error: {error}
        </div>
      )}
    </div>
  );
}
