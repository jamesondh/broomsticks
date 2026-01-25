import { useEffect, useRef, useCallback } from 'react';
// @ts-expect-error - Game.js is a vanilla JS module
import { Game } from './Game.js';
import './game.css';

interface BroomsticksGameProps {
  autoJoinRoom?: string;
}

export function BroomsticksGame({ autoJoinRoom }: BroomsticksGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);

  const updateScale = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const baseWidth = 650;
    const baseHeight = 430;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const scaleX = windowWidth / baseWidth;
    const scaleY = windowHeight / baseHeight;
    const scale = Math.min(scaleX, scaleY);

    container.style.transform = `scale(${scale})`;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Apply scale BEFORE creating game to ensure getBoundingClientRect() is accurate
    updateScale();

    // Force layout reflow so CSS transform is fully applied before game init
    void container.offsetHeight;

    // Initialize the game
    const game = new Game(canvas, undefined, autoJoinRoom);
    gameRef.current = game;

    // Initialize asynchronously - game state transitions to MODE_SELECT when ready
    (async () => {
      await game.init();
    })().catch(console.error);

    // Set up scaling
    window.addEventListener('resize', updateScale);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', updateScale);
      if (gameRef.current) {
        gameRef.current.destroy();
        gameRef.current = null;
      }
    };
  }, [updateScale, autoJoinRoom]);

  return (
    <div className="game-page">
      <div
        id="game-container"
        ref={containerRef}
        style={{
          position: 'relative',
          width: '650px',
          height: '430px',
          transformOrigin: 'center center',
        }}
      >
        <canvas
          id="gameCanvas"
          ref={canvasRef}
          width={650}
          height={430}
          style={{
            display: 'block',
            backgroundColor: 'white',
            imageRendering: 'pixelated',
          }}
        />
      </div>
    </div>
  );
}
