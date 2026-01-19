import type { CSSProperties } from "react";
import { Button } from "../ui";
import type { Team, Score } from "../../engine/types";

export interface ResultsScreenProps {
  winner: Team;
  score: Score;
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

const containerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  height: "100%",
  background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
  color: "#ffffff",
  fontFamily: "system-ui, -apple-system, sans-serif",
};

const resultBoxStyle: CSSProperties = {
  background: "rgba(0, 0, 0, 0.4)",
  borderRadius: "16px",
  padding: "48px 64px",
  textAlign: "center",
};

const winnerTitleStyle = (winner: Team): CSSProperties => ({
  fontSize: "48px",
  fontWeight: "bold",
  marginBottom: "8px",
  color: winner === 0 ? "#e74c3c" : "#333",
  textShadow: "0 4px 8px rgba(0, 0, 0, 0.5)",
});

const winnerSubtitleStyle: CSSProperties = {
  fontSize: "20px",
  color: "#888",
  marginBottom: "32px",
};

const scoreContainerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "24px",
  marginBottom: "40px",
};

const teamScoreStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "8px",
};

const teamLabelStyle = (team: Team): CSSProperties => ({
  fontSize: "14px",
  textTransform: "uppercase",
  letterSpacing: "2px",
  color: team === 0 ? "#e74c3c" : "#666",
});

const scoreNumberStyle = (isWinner: boolean): CSSProperties => ({
  fontSize: "64px",
  fontWeight: "bold",
  color: isWinner ? "#fff" : "#555",
});

const separatorStyle: CSSProperties = {
  fontSize: "32px",
  color: "#444",
};

const buttonRowStyle: CSSProperties = {
  display: "flex",
  gap: "16px",
};

export function ResultsScreen({
  winner,
  score,
  onPlayAgain,
  onMainMenu,
}: ResultsScreenProps) {
  const winnerName = winner === 0 ? "RED" : "BLACK";
  const playerWon = winner === 0;

  return (
    <div style={containerStyle}>
      <div style={resultBoxStyle}>
        <div style={winnerTitleStyle(winner)}>
          {playerWon ? "YOU WIN!" : "YOU LOSE"}
        </div>
        <div style={winnerSubtitleStyle}>
          {winnerName} team wins the match
        </div>

        <div style={scoreContainerStyle}>
          <div style={teamScoreStyle}>
            <div style={teamLabelStyle(0)}>Red</div>
            <div style={scoreNumberStyle(winner === 0)}>{score.left}</div>
          </div>

          <div style={separatorStyle}>-</div>

          <div style={teamScoreStyle}>
            <div style={teamLabelStyle(1)}>Black</div>
            <div style={scoreNumberStyle(winner === 1)}>{score.right}</div>
          </div>
        </div>

        <div style={buttonRowStyle}>
          <Button size="large" onClick={onPlayAgain}>
            Play Again
          </Button>
          <Button size="large" variant="secondary" onClick={onMainMenu}>
            Main Menu
          </Button>
        </div>
      </div>
    </div>
  );
}
