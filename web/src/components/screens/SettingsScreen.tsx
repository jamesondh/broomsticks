import type { CSSProperties } from "react";
import { Button, Slider } from "../ui";
import type { GameSettings } from "../../hooks/useSettings";
import type { AIDifficulty } from "../../engine/types";

export interface SettingsScreenProps {
  settings: GameSettings;
  onUpdate: (updates: Partial<GameSettings>) => void;
  onReset: () => void;
  onBack: () => void;
}

const containerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  height: "100%",
  background: "var(--color-bg-page)",
  color: "var(--color-text-primary)",
  fontFamily: "var(--font-family)",
  padding: "32px",
  overflow: "auto",
};

const titleStyle: CSSProperties = {
  fontSize: "var(--font-size-2xl)",
  fontWeight: "bold",
  marginBottom: "32px",
};

const sectionStyle: CSSProperties = {
  width: "100%",
  maxWidth: "400px",
  marginBottom: "24px",
  background: "var(--color-bg-card)",
  border: "1px solid var(--color-border)",
  padding: "16px",
};

const sectionTitleStyle: CSSProperties = {
  fontSize: "var(--font-size-md)",
  color: "var(--color-text-secondary)",
  textTransform: "uppercase",
  letterSpacing: "1px",
  marginBottom: "12px",
  paddingBottom: "8px",
  borderBottom: "1px solid var(--color-border-light)",
};

const optionRowStyle: CSSProperties = {
  marginBottom: "16px",
};

const difficultyButtonsStyle: CSSProperties = {
  display: "flex",
  gap: "8px",
};

const difficultyColors: Record<AIDifficulty, string> = {
  easy: "var(--color-difficulty-easy)",
  medium: "var(--color-difficulty-medium)",
  hard: "var(--color-difficulty-hard)",
  expert: "var(--color-difficulty-expert)",
};

const difficultyButtonStyle = (
  isSelected: boolean,
  difficulty: AIDifficulty
): CSSProperties => {
  return {
    flex: 1,
    padding: "10px",
    border: "none",
    borderRadius: 0,
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "var(--font-size-base)",
    background: isSelected ? difficultyColors[difficulty] : "var(--color-btn-inactive)",
    color: isSelected ? "var(--color-text-inverse)" : "var(--color-text-muted)",
  };
};

const toggleRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "16px",
};

const toggleLabelStyle: CSSProperties = {
  color: "var(--color-text-secondary)",
  fontSize: "var(--font-size-md)",
};

const checkboxStyle: CSSProperties = {
  width: "20px",
  height: "20px",
  cursor: "pointer",
};

const buttonRowStyle: CSSProperties = {
  display: "flex",
  gap: "16px",
  marginTop: "24px",
};

const DIFFICULTIES: { value: AIDifficulty; label: string }[] = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
  { value: "expert", label: "Expert" },
];

export function SettingsScreen({
  settings,
  onUpdate,
  onReset,
  onBack,
}: SettingsScreenProps) {
  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>Settings</h1>

      {/* AI Difficulty */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>AI Difficulty</div>
        <div style={difficultyButtonsStyle}>
          {DIFFICULTIES.map(({ value, label }) => (
            <button
              key={value}
              style={difficultyButtonStyle(settings.aiDifficulty === value, value)}
              onClick={() => onUpdate({ aiDifficulty: value })}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Ball Counts */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Balls</div>
        <div style={optionRowStyle}>
          <Slider
            label="Red Balls (scoreable)"
            value={settings.redBallCount}
            min={1}
            max={5}
            onChange={(value) => onUpdate({ redBallCount: value })}
          />
        </div>
        <div style={optionRowStyle}>
          <Slider
            label="Black Balls (obstacles)"
            value={settings.blackBallCount}
            min={0}
            max={5}
            onChange={(value) => onUpdate({ blackBallCount: value })}
          />
        </div>
      </div>

      {/* Scoring */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Scoring</div>
        <div style={optionRowStyle}>
          <Slider
            label="Win Score"
            value={settings.winScore}
            min={10}
            max={100}
            step={10}
            onChange={(value) => onUpdate({ winScore: value })}
          />
        </div>
      </div>

      {/* Audio */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Audio</div>
        <div style={toggleRowStyle}>
          <span style={toggleLabelStyle}>Sound Effects</span>
          <input
            type="checkbox"
            checked={settings.sfxEnabled}
            onChange={() => onUpdate({ sfxEnabled: !settings.sfxEnabled })}
            style={checkboxStyle}
          />
        </div>
        {settings.sfxEnabled && (
          <div style={optionRowStyle}>
            <Slider
              label="Volume"
              value={settings.sfxVolume}
              min={0}
              max={1}
              step={0.1}
              onChange={(value) => onUpdate({ sfxVolume: value })}
              valueFormatter={(v) => `${Math.round(v * 100)}%`}
            />
          </div>
        )}
      </div>

      {/* Buttons */}
      <div style={buttonRowStyle}>
        <Button onClick={onBack}>Back</Button>
        <Button variant="danger" onClick={onReset}>
          Reset to Defaults
        </Button>
      </div>
    </div>
  );
}
