import { useEffect, useRef, useState, useCallback } from "react";
import type { CSSProperties } from "react";
import { Game } from "../../engine/Game";
import { GameRenderer } from "../../renderer/GameRenderer";
import { AudioManager } from "../../audio";
import { Button } from "../ui";
import type { PlayerInput, Team, Score } from "../../engine/types";
import type { GameSettings } from "../../hooks/useSettings";
import { AI_DIFFICULTY_MAP } from "../../engine/constants";

export interface GameScreenProps {
  settings: GameSettings;
  onBack: () => void;
  onGameOver: (winner: Team, score: Score) => void;
}

const containerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
  background: "var(--color-bg-dark)",
};

const hudStyle: CSSProperties = {
  padding: "10px 16px",
  background: "var(--color-bg-dark-subtle)",
  color: "var(--color-text-inverse)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const scoreStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "16px",
  fontSize: "var(--font-size-lg)",
  fontWeight: "bold",
};

const teamScoreStyle = (team: Team): CSSProperties => ({
  padding: "4px 16px",
  borderRadius: 0,
  background: team === 0 ? "var(--color-team-red-bg)" : "var(--color-team-black-bg)",
  minWidth: "60px",
  textAlign: "center",
});

const pauseOverlayStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0, 0, 0, 0.7)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "16px",
  color: "var(--color-text-inverse)",
};

const pauseTitleStyle: CSSProperties = {
  fontSize: "var(--font-size-2xl)",
  fontWeight: "bold",
  marginBottom: "16px",
};

const canvasContainerStyle: CSSProperties = {
  flex: 1,
  position: "relative",
  overflow: "hidden",
  background: "#000",
};

export function GameScreen({ settings, onBack, onGameOver }: GameScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Game | null>(null);
  const rendererRef = useRef<GameRenderer | null>(null);
  const audioRef = useRef<AudioManager | null>(null);
  const animationRef = useRef<number>(0);

  const [, setGameState] = useState<string>("menu");
  const [score, setScore] = useState<Score>({ left: 0, right: 0 });
  const [isInitialized, setIsInitialized] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Initialize game and renderer
  useEffect(() => {
    if (!containerRef.current) return;

    const init = async () => {
      // Create game instance with settings
      const game = new Game({
        redBallCount: settings.redBallCount,
        blackBallCount: settings.blackBallCount,
        winScore: settings.winScore,
        aiDifficulty: settings.aiDifficulty,
        aiSmartValue: AI_DIFFICULTY_MAP[settings.aiDifficulty],
      });
      gameRef.current = game;

      // Set player 1 (right side) as AI
      game.setPlayerRobot(1, true);

      // Create renderer
      const renderer = new GameRenderer({
        container: containerRef.current!,
        autoResize: true,
      });

      await renderer.init();
      renderer.bindToGame(game);
      rendererRef.current = renderer;

      // Create and load audio manager
      const audio = new AudioManager({
        volume: settings.sfxEnabled ? settings.sfxVolume : 0,
      });
      await audio.load();
      if (!settings.sfxEnabled) {
        audio.toggleMute();
      }
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
          // Notify parent of game over
          const finalScore = game.getScore();
          const winner: Team = finalScore.left >= settings.winScore ? 0 : 1;
          onGameOver(winner, finalScore);
        }
      });

      setIsInitialized(true);

      // Auto-start the game
      game.start();
    };

    init();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      rendererRef.current?.destroy();
      audioRef.current?.destroy();
    };
  }, [settings, onGameOver]);

  // Pause toggle handler (defined before useEffect that uses it)
  const handlePauseToggle = useCallback(() => {
    const game = gameRef.current;
    if (!game) return;

    if (game.state === "playing") {
      game.pause();
      setIsPaused(true);
    } else if (game.state === "paused") {
      game.resume();
      setIsPaused(false);
    }
  }, []);

  // Game loop
  useEffect(() => {
    if (!isInitialized) return;

    const inputs = new Map<number, PlayerInput>();
    const keyState: Record<string, boolean> = {};

    const handleKeyDown = (e: KeyboardEvent) => {
      keyState[e.code] = true;
      // Escape to pause
      if (e.code === "Escape") {
        handlePauseToggle();
      }
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

      // Update input for player 0 (human) - WASD
      inputs.set(0, {
        up: keyState["KeyW"] || false,
        down: keyState["KeyS"] || false,
        left: keyState["KeyA"] || false,
        right: keyState["KeyD"] || false,
        pass: false,
        timestamp: now,
      });

      // Update input for player 1 (AI controlled, but allow arrow keys for local 2P)
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
  }, [isInitialized, handlePauseToggle]);

  const handleResume = () => {
    gameRef.current?.resume();
    setIsPaused(false);
  };

  const handleQuit = () => {
    onBack();
  };

  return (
    <div style={containerStyle}>
      {/* HUD */}
      <div style={hudStyle}>
        <Button size="small" variant="secondary" onClick={handlePauseToggle}>
          {isPaused ? "Resume" : "Pause"}
        </Button>

        <div style={scoreStyle}>
          <div style={teamScoreStyle(0)}>{score.left}</div>
          <span style={{ color: "var(--color-text-muted)" }}>-</span>
          <div style={teamScoreStyle(1)}>{score.right}</div>
        </div>

        <div style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)" }}>
          First to {settings.winScore}
        </div>
      </div>

      {/* Game canvas */}
      <div ref={containerRef} style={canvasContainerStyle}>
        {/* Pause overlay */}
        {isPaused && (
          <div style={pauseOverlayStyle}>
            <div style={pauseTitleStyle}>PAUSED</div>
            <Button onClick={handleResume}>Resume</Button>
            <Button variant="secondary" onClick={handleQuit}>
              Quit to Menu
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
