import { useState, useCallback, useEffect } from "react";
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
type GuestbookTab = "search" | "highlights";

interface GameResult {
  winner: Team;
  score: Score;
}

interface ScreenState {
  screen: Screen;
  guestbookTab: GuestbookTab;
}

function getScreenFromPath(): ScreenState {
  if (typeof window === "undefined") {
    return { screen: "menu", guestbookTab: "search" };
  }

  const pathname = window.location.pathname;

  // Handle legacy hash routes - redirect to path-based routes
  const hash = window.location.hash;
  if (hash === "#guestbook") {
    window.history.replaceState(null, "", "/guestbook/search");
    return { screen: "guestbook", guestbookTab: "search" };
  }
  if (hash === "#test") {
    window.history.replaceState(null, "", "/test");
    return { screen: "test", guestbookTab: "search" };
  }

  // Path-based routing
  if (pathname === "/guestbook/highlights") {
    return { screen: "guestbook", guestbookTab: "highlights" };
  }
  if (pathname === "/guestbook/search" || pathname === "/guestbook") {
    return { screen: "guestbook", guestbookTab: "search" };
  }
  if (pathname === "/test") {
    return { screen: "test", guestbookTab: "search" };
  }

  return { screen: "menu", guestbookTab: "search" };
}

function App() {
  const [screenState, setScreenState] = useState<ScreenState>(getScreenFromPath);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const { settings, updateSettings, resetSettings } = useSettings();

  const { screen, guestbookTab } = screenState;

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setScreenState(getScreenFromPath());
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigateTo = useCallback((newScreen: Screen, tab?: GuestbookTab) => {
    const newTab = tab || "search";
    setScreenState({ screen: newScreen, guestbookTab: newTab });

    // Update URL with pushState
    let path = "/";
    if (newScreen === "guestbook") {
      path = `/guestbook/${newTab}`;
    } else if (newScreen === "test") {
      path = "/test";
    }
    window.history.pushState(null, "", path);
  }, []);

  const handleTabChange = useCallback((tab: GuestbookTab) => {
    navigateTo("guestbook", tab);
  }, [navigateTo]);

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
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <div style={{
          padding: "10px",
          background: "var(--color-bg-card)",
          borderBottom: "1px solid var(--color-border)",
        }}>
          <button
            onClick={() => navigateTo("menu")}
            style={{
              background: "var(--color-btn-secondary)",
              color: "var(--color-text-inverse)",
              border: "none",
              borderRadius: 0,
              padding: "6px 12px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Back to Game
          </button>
        </div>
        <GuestbookSearch activeTab={guestbookTab} onTabChange={handleTabChange} />
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
            background: "var(--color-bg-dark-subtle)",
            color: "var(--color-text-muted)",
            fontSize: "var(--font-size-xs)",
          }}
        >
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigateTo("menu");
            }}
            style={{ color: "var(--color-text-muted)" }}
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
            background: "var(--color-bg-card)",
            borderTop: "1px solid var(--color-border)",
            color: "var(--color-text-secondary)",
            fontSize: "var(--font-size-xs)",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <a
            href="/guestbook/search"
            onClick={(e) => {
              e.preventDefault();
              navigateTo("guestbook");
            }}
            style={{ color: "var(--color-link)" }}
          >
            Guestbook Archive
          </a>
          <a
            href="https://github.com/jamesondh/broomsticks"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--color-link)" }}
          >
            GitHub
          </a>
        </div>
      )}
    </div>
  );
}

export default App;
