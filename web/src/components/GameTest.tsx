import { useEffect, useRef, useState } from "react";
import { Game } from "../engine/Game";
import { GameRenderer } from "../renderer/GameRenderer";
import { AudioManager } from "../audio";
import type { PlayerInput } from "../engine/types";

/**
 * Visual test component for the game renderer.
 * Tests all Phase 2.3 (sprites) and Phase 2.4 (UI) components.
 */
export function GameTest() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Game | null>(null);
  const rendererRef = useRef<GameRenderer | null>(null);
  const audioRef = useRef<AudioManager | null>(null);
  const animationRef = useRef<number>(0);

  const [gameState, setGameState] = useState<string>("menu");
  const [score, setScore] = useState({ left: 0, right: 0 });
  const [isInitialized, setIsInitialized] = useState(false);
  const [showHitboxes, setShowHitboxes] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Initialize game and renderer
  useEffect(() => {
    if (!containerRef.current) return;

    const init = async () => {
      // Create game instance
      const game = new Game({
        redBallCount: 1,
        blackBallCount: 2,
        winScore: 50,
      });
      gameRef.current = game;

      // Create renderer
      const renderer = new GameRenderer({
        container: containerRef.current!,
        autoResize: true,
      });

      await renderer.init();
      renderer.bindToGame(game);
      rendererRef.current = renderer;

      // Create and load audio manager
      const audio = new AudioManager({ volume: 0.7 });
      await audio.load();
      audioRef.current = audio;

      // Track game state changes and play sounds
      game.on((event) => {
        if (event.type === "stateChange") {
          setGameState(event.to);
        }
        if (event.type === "goal") {
          setScore(game.getScore());
          audio.play("score");
        }
        if (event.type === "collision") {
          // Play appropriate sound based on collision type
          if (event.event.type === "player-catch-ball") {
            audio.play("catch");
          } else if (
            event.event.type === "player-player" ||
            event.event.type === "player-black-ball"
          ) {
            audio.play("bump");
          }
        }
        if (event.type === "gameOver") {
          audio.play("win");
        }
      });

      setIsInitialized(true);
    };

    init();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      rendererRef.current?.destroy();
      audioRef.current?.destroy();
    };
  }, []);

  // Game loop
  useEffect(() => {
    if (!isInitialized) return;

    const inputs = new Map<number, PlayerInput>();
    const keyState: Record<string, boolean> = {};

    const handleKeyDown = (e: KeyboardEvent) => {
      keyState[e.code] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keyState[e.code] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    const loop = (now: number) => {
      const game = gameRef.current;
      const renderer = rendererRef.current;

      if (!game || !renderer) return;

      // Update input for player 0 (human)
      // Controls: WASD (W=up, A=left, S=dive/down, D=right)
      inputs.set(0, {
        up: keyState["KeyW"] || false,
        down: keyState["KeyS"] || false,
        left: keyState["KeyA"] || false,
        right: keyState["KeyD"] || false,
        pass: false,
        timestamp: now,
      });

      // Update input for player 1 (arrows for 2-player testing)
      inputs.set(1, {
        up: keyState["ArrowUp"] || false,
        down: keyState["ArrowDown"] || false,
        left: keyState["ArrowLeft"] || false,
        right: keyState["ArrowRight"] || false,
        pass: false,
        timestamp: now,
      });

      // Update game
      game.update(now, inputs);

      // Render
      renderer.render(game);

      animationRef.current = requestAnimationFrame(loop);
    };

    animationRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isInitialized]);

  const handleStart = () => {
    gameRef.current?.start();
  };

  const handlePause = () => {
    const game = gameRef.current;
    if (game?.state === "playing") {
      game.pause();
    } else if (game?.state === "paused") {
      game.resume();
    }
  };

  const handleReset = () => {
    gameRef.current?.returnToMenu();
    setScore({ left: 0, right: 0 });
  };

  const handleTestCountdown = () => {
    rendererRef.current?.showCountdown(3);
    setTimeout(() => rendererRef.current?.showCountdown(2), 1000);
    setTimeout(() => rendererRef.current?.showCountdown(1), 2000);
    setTimeout(() => rendererRef.current?.hideCountdown(), 3000);
  };

  const handleTestScoreFlash = () => {
    rendererRef.current?.showScoreFlash(0, 10);
  };

  const handleTestWinScreen = () => {
    rendererRef.current?.showWinScreen(0, { left: 50, right: 30 });
  };

  const handleToggleAI = () => {
    const game = gameRef.current;
    if (game) {
      // Toggle player 1 between AI and human
      const players = game.getPlayers();
      if (players[1]) {
        game.setPlayerRobot(1, !players[1].isRobot);
      }
    }
  };

  const handleToggleHitboxes = () => {
    const renderer = rendererRef.current;
    if (renderer) {
      const newValue = !showHitboxes;
      setShowHitboxes(newValue);
      renderer.setDebugHitboxes(newValue);
    }
  };

  const handleToggleMute = () => {
    const audio = audioRef.current;
    if (audio) {
      const newMuted = audio.toggleMute();
      setIsMuted(newMuted);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#1a1a1a" }}>
      {/* Control panel */}
      <div style={{ padding: "10px", background: "#333", color: "white", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontWeight: "bold" }}>Broomsticks Visual Test</span>
        <span style={{ color: "#888" }}>|</span>
        <span>State: {gameState}</span>
        <span style={{ color: "#888" }}>|</span>
        <span>Score: {score.left} - {score.right}</span>
        <span style={{ color: "#888" }}>|</span>

        <button onClick={handleStart} disabled={gameState !== "menu"}>Start Game</button>
        <button onClick={handlePause} disabled={gameState !== "playing" && gameState !== "paused"}>
          {gameState === "paused" ? "Resume" : "Pause"}
        </button>
        <button onClick={handleReset}>Reset to Menu</button>
        <button onClick={handleToggleAI}>Toggle P2 AI</button>

        <span style={{ color: "#888" }}>|</span>
        <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={showHitboxes}
            onChange={handleToggleHitboxes}
          />
          <span style={{ fontSize: "12px" }}>Hitboxes</span>
        </label>

        <span style={{ color: "#888" }}>|</span>
        <button onClick={handleToggleMute} style={{ minWidth: "60px" }}>
          {isMuted ? "Unmute" : "Mute"}
        </button>

        <span style={{ color: "#888" }}>|</span>
        <span style={{ fontSize: "12px", color: "#888" }}>UI Tests:</span>
        <button onClick={handleTestCountdown}>Countdown</button>
        <button onClick={handleTestScoreFlash}>Score Flash</button>
        <button onClick={handleTestWinScreen}>Win Screen</button>
      </div>

      {/* Controls help */}
      <div style={{ padding: "5px 10px", background: "#2a2a2a", color: "#aaa", fontSize: "12px" }}>
        P1: WASD | P2: Arrow keys | Press Start to begin
      </div>

      {/* Game container */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          position: "relative",
          overflow: "hidden",
          background: "#000",
        }}
      />
    </div>
  );
}
