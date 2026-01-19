import { useState, useCallback } from "react";
import { GuestbookSearch } from "./components/GuestbookSearch";
import { GameTest } from "./components/GameTest";
import {
  MainMenu,
  GameScreen,
  SettingsScreen,
  ResultsScreen,
} from "./components/screens";
import { useSettings } from "./hooks/useSettings";
import type { Team, Score } from "./engine/types";

type Screen = "menu" | "game" | "settings" | "results" | "guestbook" | "test";

interface GameResult {
  winner: Team;
  score: Score;
}

function getInitialScreen(): Screen {
  if (typeof window !== "undefined") {
    const hash = window.location.hash;
    if (hash === "#guestbook") return "guestbook";
    if (hash === "#test") return "test";
  }
  return "menu";
}

function App() {
  const [screen, setScreen] = useState<Screen>(getInitialScreen);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const { settings, updateSettings, resetSettings } = useSettings();

  const navigateTo = useCallback((newScreen: Screen) => {
    setScreen(newScreen);
    if (newScreen === "guestbook" || newScreen === "test") {
      window.location.hash = newScreen;
    } else {
      window.location.hash = "";
    }
  }, []);

  const handlePlay = useCallback(() => {
    setGameResult(null);
    navigateTo("game");
  }, [navigateTo]);

  const handleSettings = useCallback(() => {
    navigateTo("settings");
  }, [navigateTo]);

  const handleBackToMenu = useCallback(() => {
    navigateTo("menu");
  }, [navigateTo]);

  const handleGameOver = useCallback(
    (winner: Team, score: Score) => {
      setGameResult({ winner, score });
      navigateTo("results");
    },
    [navigateTo]
  );

  const handlePlayAgain = useCallback(() => {
    setGameResult(null);
    navigateTo("game");
  }, [navigateTo]);

  // Guestbook screen
  if (screen === "guestbook") {
    return (
      <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "10px", background: "#333", color: "white" }}>
          <button
            onClick={() => navigateTo("menu")}
          >
            Back to Game
          </button>
        </div>
        <GuestbookSearch />
      </div>
    );
  }

  // Visual test screen (for development)
  if (screen === "test") {
    return (
      <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
        <GameTest />
        <div
          style={{
            padding: "5px 10px",
            background: "#222",
            color: "#666",
            fontSize: "11px",
          }}
        >
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigateTo("menu");
            }}
            style={{ color: "#888" }}
          >
            Back to Main Menu
          </a>
        </div>
      </div>
    );
  }

  // Main app screens
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, position: "relative" }}>
        {screen === "menu" && (
          <MainMenu onPlay={handlePlay} onSettings={handleSettings} />
        )}

        {screen === "settings" && (
          <SettingsScreen
            settings={settings}
            onUpdate={updateSettings}
            onReset={resetSettings}
            onBack={handleBackToMenu}
          />
        )}

        {screen === "game" && (
          <GameScreen
            settings={settings}
            onBack={handleBackToMenu}
            onGameOver={handleGameOver}
          />
        )}

        {screen === "results" && gameResult && (
          <ResultsScreen
            winner={gameResult.winner}
            score={gameResult.score}
            onPlayAgain={handlePlayAgain}
            onMainMenu={handleBackToMenu}
          />
        )}
      </div>

      {/* Footer links (only show on menu/settings screens) */}
      {(screen === "menu" || screen === "settings") && (
        <div
          style={{
            padding: "8px 16px",
            background: "#111",
            color: "#444",
            fontSize: "11px",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <a
            href="#guestbook"
            onClick={(e) => {
              e.preventDefault();
              navigateTo("guestbook");
            }}
            style={{ color: "#555" }}
          >
            Guestbook Archive
          </a>
          <a
            href="#test"
            onClick={(e) => {
              e.preventDefault();
              navigateTo("test");
            }}
            style={{ color: "#555" }}
          >
            Visual Test
          </a>
        </div>
      )}
    </div>
  );
}

export default App;
