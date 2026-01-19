import type { CSSProperties } from "react";
import { Button } from "../ui";

export interface MainMenuProps {
  onPlay: () => void;
  onSettings: () => void;
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

const titleStyle: CSSProperties = {
  fontSize: "64px",
  fontWeight: "bold",
  marginBottom: "8px",
  textShadow: "0 4px 8px rgba(0, 0, 0, 0.5)",
  letterSpacing: "4px",
};

const subtitleStyle: CSSProperties = {
  fontSize: "16px",
  color: "#888",
  marginBottom: "48px",
};

const menuStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "16px",
  width: "240px",
};

const controlsHintStyle: CSSProperties = {
  position: "absolute",
  bottom: "24px",
  left: "50%",
  transform: "translateX(-50%)",
  color: "#666",
  fontSize: "13px",
  textAlign: "center",
};

export function MainMenu({ onPlay, onSettings }: MainMenuProps) {
  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>BROOMSTICKS</h1>
      <p style={subtitleStyle}>A game by Paul Rajlich</p>

      <div style={menuStyle}>
        <Button size="large" onClick={onPlay}>
          Play Game
        </Button>
        <Button size="large" variant="secondary" onClick={onSettings}>
          Settings
        </Button>
      </div>

      <div style={controlsHintStyle}>
        <div>Player 1: WASD</div>
        <div>Player 2: Arrow Keys</div>
      </div>
    </div>
  );
}
