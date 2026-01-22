import { useState, useCallback, useEffect } from "react";
import { GuestbookSearch } from "./components/GuestbookSearch";
import { BroomsticksGame } from "./game";

type Screen = "landing" | "guestbook";
type GuestbookTab = "search" | "highlights";

interface ScreenState {
  screen: Screen;
  guestbookTab: GuestbookTab;
}

function getScreenFromPath(): ScreenState {
  if (typeof window === "undefined") {
    return { screen: "landing", guestbookTab: "search" };
  }

  const pathname = window.location.pathname;

  // Handle legacy hash routes - redirect to path-based routes
  const hash = window.location.hash;
  if (hash === "#guestbook") {
    window.history.replaceState(null, "", "/guestbook/search");
    return { screen: "guestbook", guestbookTab: "search" };
  }

  // Path-based routing
  if (pathname === "/guestbook/highlights") {
    return { screen: "guestbook", guestbookTab: "highlights" };
  }
  if (pathname === "/guestbook/search" || pathname === "/guestbook") {
    return { screen: "guestbook", guestbookTab: "search" };
  }

  return { screen: "landing", guestbookTab: "search" };
}

function App() {
  const [screenState, setScreenState] = useState<ScreenState>(getScreenFromPath);

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
    }
    window.history.pushState(null, "", path);
  }, []);

  const handleTabChange = useCallback((tab: GuestbookTab) => {
    navigateTo("guestbook", tab);
  }, [navigateTo]);

  const handleBackToHome = useCallback(() => {
    navigateTo("landing");
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
            onClick={handleBackToHome}
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

  // Landing page - show the game
  return <BroomsticksGame />;
}

export default App;
