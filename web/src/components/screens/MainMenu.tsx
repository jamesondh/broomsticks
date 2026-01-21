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
  background: "var(--color-bg-page)",
  color: "var(--color-text-primary)",
  fontFamily: "var(--font-family)",
};

const subtitleStyle: CSSProperties = {
  fontSize: "var(--font-size-md)",
  color: "var(--color-text-secondary)",
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
  color: "var(--color-text-muted)",
  fontSize: "var(--font-size-base)",
  textAlign: "center",
};

const logoStyle: CSSProperties = {
  width: "674px",        // 337px × 2
  maxWidth: "100%",      // Prevents overflow on mobile
  height: "auto",
  imageRendering: "pixelated",
  marginBottom: "48px",
  padding: "0 24px",
};

export function MainMenu({ onPlay, onSettings }: MainMenuProps) {
  return (
    <div style={containerStyle}>
      <img src="/images/intro.gif" alt="Broomsticks Logo" style={logoStyle} />
      <p style={subtitleStyle}>Ported by Jameson Hodge</p>

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
