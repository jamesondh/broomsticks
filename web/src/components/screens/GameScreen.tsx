import { useEffect, useRef, useCallback, useState } from "react";
import { Game, type GameEvent } from "../../engine/Game";
import { GameRenderer, GameUI } from "../../renderer";
import { KeyboardInput } from "../../input";
import { getAudioManager } from "../../audio";
import { useGameStore, useSettingsStore } from "../../store";
import { useGameLoop } from "../../hooks";
import type { PlayerInput } from "../../engine/types";
import "./screens.css";

/**
 * Main game screen with PixiJS rendering and game loop.
 */
export function GameScreen() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Game | null>(null);
  const rendererRef = useRef<GameRenderer | null>(null);
  const uiRef = useRef<GameUI | null>(null);
  const inputRef = useRef<KeyboardInput | null>(null);
  const lastSnapshotRef = useRef<ReturnType<Game["getSnapshot"]> | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { showResults, goToMenu, isPaused, pause, resume } = useGameStore();
  const settings = useSettingsStore();

  // Store showResults in a ref to avoid stale closures
  const showResultsRef = useRef(showResults);
  useEffect(() => {
    showResultsRef.current = showResults;
  }, [showResults]);

  // Initialize game, renderer, and input
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Capture settings at init time
    const initSettings = {
      aiDifficulty: settings.aiDifficulty,
      aiSmartValue: settings.getAISmartValue(),
      redBallCount: settings.redBallCount,
      blackBallCount: settings.blackBallCount,
      winScore: settings.winScore,
      sfxEnabled: settings.sfxEnabled,
      sfxVolume: settings.sfxVolume,
    };

    const init = async () => {
      try {
        // Create game with settings
        const game = new Game({
          aiDifficulty: initSettings.aiDifficulty,
          aiSmartValue: initSettings.aiSmartValue,
          redBallCount: initSettings.redBallCount,
          blackBallCount: initSettings.blackBallCount,
          winScore: initSettings.winScore,
        });
        gameRef.current = game;

        // Create and initialize renderer
        const renderer = new GameRenderer();
        await renderer.init(container);
        rendererRef.current = renderer;

        // Create UI and add to renderer
        const ui = new GameUI();
        renderer.getUIContainer().addChild(ui.container);
        uiRef.current = ui;

        // Create sprites from initial snapshot
        const initialSnapshot = game.getSnapshot();
        renderer.createSprites(initialSnapshot);
        lastSnapshotRef.current = initialSnapshot;

        // Create input handler
        const input = new KeyboardInput();
        input.attach();
        inputRef.current = input;

        // Load audio
        const audio = getAudioManager();
        await audio.load();
        audio.setEnabled(initSettings.sfxEnabled);
        audio.setVolume(initSettings.sfxVolume);

        // Subscribe to game events
        game.on((event: GameEvent) => {
          const eventAudio = getAudioManager();
          const eventUi = uiRef.current;
          const eventGame = gameRef.current;

          switch (event.type) {
            case "stateChange":
              if (event.to === "countdown" && eventGame) {
                eventUi?.showCountdown(eventGame.getCountdownSeconds());
              } else if (event.to === "playing") {
                eventUi?.hideCountdown();
              }
              break;

            case "countdown":
              eventUi?.showCountdown(event.seconds);
              eventAudio.play("pop");
              break;

            case "goal":
              eventUi?.triggerFlash(event.event.team);
              eventAudio.play("score");
              break;

            case "collision":
              if (event.event.type === "player-catch-ball") {
                eventAudio.play("catch");
              } else if (
                event.event.type === "player-player" ||
                event.event.type === "player-black-ball" ||
                event.event.type === "player-bump-ball"
              ) {
                eventAudio.play("bump");
              }
              break;

            case "gameOver":
              if (eventGame) {
                const score = eventGame.getScore();
                eventUi?.showGameOver(event.winner, score);
                eventAudio.play("win");
                // Delay transition to results screen
                setTimeout(() => {
                  showResultsRef.current(event.winner, score);
                }, 2000);
              }
              break;
          }
        });

        // Start the game
        game.start();

        setLoading(false);
      } catch (err) {
        console.error("Failed to initialize game:", err);
        setError(err instanceof Error ? err.message : "Failed to initialize game");
        setLoading(false);
      }
    };

    init();

    return () => {
      inputRef.current?.destroy();
      rendererRef.current?.destroy();
      gameRef.current = null;
      rendererRef.current = null;
      uiRef.current = null;
      inputRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle pause toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Escape") {
        if (isPaused) {
          resume();
          gameRef.current?.resume();
        } else {
          pause();
          gameRef.current?.pause();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPaused, pause, resume]);

  // Update UI pause state
  useEffect(() => {
    if (isPaused) {
      uiRef.current?.showPause();
    } else {
      uiRef.current?.hidePause();
    }
  }, [isPaused]);

  // Game loop callback
  const gameLoop = useCallback((now: number) => {
    const game = gameRef.current;
    const renderer = rendererRef.current;
    const ui = uiRef.current;
    const input = inputRef.current;

    if (!game || !renderer || !ui || !input) return;

    // Get player input
    const inputs = new Map<number, PlayerInput>();
    inputs.set(0, input.getInput());

    // Update game
    game.update(now, inputs);

    // Get current snapshot
    const snapshot = game.getSnapshot();

    // Update renderer from snapshot
    renderer.updateFromSnapshot(snapshot);

    // Update UI
    ui.updateScore(snapshot.score);
    ui.updateFromState(snapshot.state, snapshot.countdownSeconds ?? undefined);
    ui.update(16); // Approximate delta time

    // Render with interpolation
    const interpolation = game.getInterpolation();
    renderer.render(interpolation);

    lastSnapshotRef.current = snapshot;
  }, []);

  // Run game loop when not paused and not loading
  useGameLoop(gameLoop, !loading && !error && !isPaused);

  // Handle quit to menu
  const handleQuit = useCallback(() => {
    goToMenu();
  }, [goToMenu]);

  if (error) {
    return (
      <div className="screen game-screen error">
        <div className="error-content">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={handleQuit}>Back to Menu</button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen game-screen">
      <div
        ref={containerRef}
        className="game-container"
        style={{
          width: "640px",
          height: "400px",
          position: "relative",
        }}
      >
        {loading && (
          <div className="game-loading">
            <p>Loading...</p>
          </div>
        )}
      </div>

      {isPaused && (
        <div className="pause-menu">
          <button onClick={() => { resume(); gameRef.current?.resume(); }}>
            Resume
          </button>
          <button onClick={handleQuit}>
            Quit to Menu
          </button>
        </div>
      )}

      <div className="game-controls-hint">
        <span>WASD / Arrow Keys to move</span>
        <span>ESC to pause</span>
      </div>
    </div>
  );
}
