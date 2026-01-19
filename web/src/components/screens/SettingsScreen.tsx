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
  background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
  color: "#ffffff",
  fontFamily: "system-ui, -apple-system, sans-serif",
  padding: "32px",
  overflow: "auto",
};

const titleStyle: CSSProperties = {
  fontSize: "36px",
  fontWeight: "bold",
  marginBottom: "32px",
};

const sectionStyle: CSSProperties = {
  width: "100%",
  maxWidth: "400px",
  marginBottom: "24px",
};

const sectionTitleStyle: CSSProperties = {
  fontSize: "14px",
  color: "#888",
  textTransform: "uppercase",
  letterSpacing: "1px",
  marginBottom: "12px",
  paddingBottom: "8px",
  borderBottom: "1px solid #333",
};

const optionRowStyle: CSSProperties = {
  marginBottom: "16px",
};

const difficultyButtonsStyle: CSSProperties = {
  display: "flex",
  gap: "8px",
};

const difficultyButtonStyle = (
  isSelected: boolean,
  difficulty: AIDifficulty
): CSSProperties => {
  const colors: Record<AIDifficulty, string> = {
    easy: "#4a9",
    medium: "#49a",
    hard: "#a94",
    expert: "#a49",
  };
  return {
    flex: 1,
    padding: "10px",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "13px",
    background: isSelected ? colors[difficulty] : "#333",
    color: isSelected ? "#fff" : "#888",
    transition: "all 0.15s",
  };
};

const toggleRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "16px",
};

const toggleLabelStyle: CSSProperties = {
  color: "#ccc",
  fontSize: "14px",
};

const toggleButtonStyle = (isOn: boolean): CSSProperties => ({
  width: "50px",
  height: "26px",
  borderRadius: "13px",
  border: "none",
  cursor: "pointer",
  background: isOn ? "#4a90d9" : "#444",
  position: "relative",
  transition: "background 0.2s",
});

const toggleKnobStyle = (isOn: boolean): CSSProperties => ({
  position: "absolute",
  top: "3px",
  left: isOn ? "27px" : "3px",
  width: "20px",
  height: "20px",
  borderRadius: "10px",
  background: "#fff",
  transition: "left 0.2s",
});

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
          <button
            style={toggleButtonStyle(settings.sfxEnabled)}
            onClick={() => onUpdate({ sfxEnabled: !settings.sfxEnabled })}
          >
            <div style={toggleKnobStyle(settings.sfxEnabled)} />
          </button>
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
