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
  background: "var(--color-bg-page)",
  color: "var(--color-text-primary)",
  fontFamily: "var(--font-family)",
};

const resultBoxStyle: CSSProperties = {
  background: "var(--color-bg-card)",
  border: "1px solid var(--color-border)",
  borderRadius: 0,
  padding: "48px 64px",
  textAlign: "center",
};

const winnerTitleStyle = (winner: Team): CSSProperties => ({
  fontSize: "var(--font-size-3xl)",
  fontWeight: "bold",
  marginBottom: "8px",
  color: winner === 0 ? "var(--color-team-red)" : "var(--color-team-black)",
});

const winnerSubtitleStyle: CSSProperties = {
  fontSize: "var(--font-size-lg)",
  color: "var(--color-text-secondary)",
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
  fontSize: "var(--font-size-md)",
  textTransform: "uppercase",
  letterSpacing: "2px",
  color: team === 0 ? "var(--color-team-red)" : "var(--color-text-muted)",
});

const scoreNumberStyle = (isWinner: boolean): CSSProperties => ({
  fontSize: "var(--font-size-4xl)",
  fontWeight: "bold",
  color: isWinner ? "var(--color-text-primary)" : "var(--color-text-secondary)",
});

const separatorStyle: CSSProperties = {
  fontSize: "var(--font-size-xl)",
  color: "var(--color-text-muted)",
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
