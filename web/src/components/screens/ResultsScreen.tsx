import { useGameStore } from "../../store";
import { Button } from "../ui";
import "./screens.css";

/**
 * Results screen shown after game ends.
 */
export function ResultsScreen() {
  const { lastResult, goToMenu, startGame } = useGameStore();

  if (!lastResult) {
    return (
      <div className="screen results-screen">
        <div className="results-content">
          <h1>No Results</h1>
          <Button variant="primary" onClick={goToMenu}>
            Back to Menu
          </Button>
        </div>
      </div>
    );
  }

  const { winner, score } = lastResult;
  const teamName = winner === 0 ? "RED" : "BLACK";
  const teamClass = winner === 0 ? "team-red" : "team-black";

  return (
    <div className="screen results-screen">
      <div className="results-content">
        <h1 className={`results-winner ${teamClass}`}>
          {teamName} WINS!
        </h1>

        <div className="results-score">
          <span className="score-left">{score.left}</span>
          <span className="score-separator">-</span>
          <span className="score-right">{score.right}</span>
        </div>

        <div className="results-buttons">
          <Button
            variant="primary"
            size="large"
            onClick={startGame}
            autoFocus
          >
            Play Again
          </Button>

          <Button
            variant="secondary"
            size="medium"
            onClick={goToMenu}
          >
            Main Menu
          </Button>
        </div>
      </div>
    </div>
  );
}
