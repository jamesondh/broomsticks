import { useGameStore } from "../../store";
import { Button } from "../ui";
import "./screens.css";

/**
 * Main menu screen.
 */
export function MainMenu() {
  const { startGame, openSettings } = useGameStore();

  return (
    <div className="screen menu-screen">
      <div className="menu-content">
        <div className="menu-logo">
          <img src="/images/intro.gif" alt="Broomsticks" className="logo-image" />
          <h1 className="logo-text">BROOMSTICKS</h1>
        </div>

        <div className="menu-buttons">
          <Button
            variant="primary"
            size="large"
            onClick={startGame}
            autoFocus
          >
            Play
          </Button>

          <Button
            variant="secondary"
            size="medium"
            onClick={openSettings}
          >
            Settings
          </Button>
        </div>

        <div className="menu-footer">
          <p className="credits">
            Original game by Paul Rajlich (2000-2004)
          </p>
          <p className="credits">
            HTML5 port by Jameson Hodge
          </p>
        </div>
      </div>
    </div>
  );
}
