import { useGameStore, useSettingsStore } from "../../store";
import { Button, Slider, Toggle } from "../ui";
import type { AIDifficulty } from "../../engine/types";
import "./screens.css";

const DIFFICULTY_OPTIONS: { value: AIDifficulty; label: string }[] = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
  { value: "expert", label: "Expert" },
];

/**
 * Settings screen.
 */
export function SettingsScreen() {
  const { goToMenu } = useGameStore();
  const {
    aiDifficulty,
    redBallCount,
    blackBallCount,
    winScore,
    sfxEnabled,
    sfxVolume,
    particlesEnabled,
    screenShakeEnabled,
    setAIDifficulty,
    setRedBallCount,
    setBlackBallCount,
    setWinScore,
    setSfxEnabled,
    setSfxVolume,
    setParticlesEnabled,
    setScreenShakeEnabled,
    resetDefaults,
  } = useSettingsStore();

  return (
    <div className="screen settings-screen">
      <div className="settings-content">
        <h1 className="settings-title">Settings</h1>

        <div className="settings-sections">
          {/* Game Settings */}
          <section className="settings-section">
            <h2 className="section-title">Game</h2>

            <div className="setting-row">
              <label className="setting-label">AI Difficulty</label>
              <div className="difficulty-buttons">
                {DIFFICULTY_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    className={`difficulty-btn ${aiDifficulty === value ? "active" : ""}`}
                    onClick={() => setAIDifficulty(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <Slider
              label="Red Balls"
              value={redBallCount}
              min={1}
              max={3}
              onChange={setRedBallCount}
            />

            <Slider
              label="Black Balls"
              value={blackBallCount}
              min={0}
              max={5}
              onChange={setBlackBallCount}
            />

            <Slider
              label="Win Score"
              value={winScore}
              min={10}
              max={100}
              step={10}
              onChange={setWinScore}
            />
          </section>

          {/* Audio Settings */}
          <section className="settings-section">
            <h2 className="section-title">Audio</h2>

            <Toggle
              label="Sound Effects"
              checked={sfxEnabled}
              onChange={setSfxEnabled}
            />

            <Slider
              label="Volume"
              value={sfxVolume}
              min={0}
              max={1}
              step={0.1}
              formatValue={(v) => `${Math.round(v * 100)}%`}
              onChange={setSfxVolume}
              disabled={!sfxEnabled}
            />
          </section>

          {/* Visual Settings */}
          <section className="settings-section">
            <h2 className="section-title">Visual</h2>

            <Toggle
              label="Particles"
              checked={particlesEnabled}
              onChange={setParticlesEnabled}
            />

            <Toggle
              label="Screen Shake"
              checked={screenShakeEnabled}
              onChange={setScreenShakeEnabled}
            />
          </section>
        </div>

        <div className="settings-buttons">
          <Button variant="ghost" size="small" onClick={resetDefaults}>
            Reset Defaults
          </Button>
          <Button variant="primary" size="medium" onClick={goToMenu}>
            Back
          </Button>
        </div>
      </div>
    </div>
  );
}
