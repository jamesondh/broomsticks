import { Container, Text, Graphics, TextStyle } from "pixi.js";
import type { Score, Team, GameState } from "../engine/types";
import { FIELD } from "../engine/constants";

/**
 * Text styles for UI elements.
 */
const STYLES = {
  score: new TextStyle({
    fontFamily: "monospace",
    fontSize: 24,
    fontWeight: "bold",
    fill: "#ffffff",
    stroke: { color: "#000000", width: 3 },
  }),
  countdown: new TextStyle({
    fontFamily: "monospace",
    fontSize: 72,
    fontWeight: "bold",
    fill: "#ffffff",
    stroke: { color: "#000000", width: 6 },
  }),
  message: new TextStyle({
    fontFamily: "monospace",
    fontSize: 32,
    fontWeight: "bold",
    fill: "#ffffff",
    stroke: { color: "#000000", width: 4 },
  }),
  winner: new TextStyle({
    fontFamily: "monospace",
    fontSize: 48,
    fontWeight: "bold",
    fill: "#ffd700",
    stroke: { color: "#000000", width: 5 },
  }),
};

/**
 * Team colors for visual feedback.
 */
const TEAM_COLORS = {
  0: 0xcc0000, // Red team (left)
  1: 0x333333, // Black team (right)
} as const;

/**
 * In-game UI manager using PixiJS.
 * Renders scoreboard, countdown, score flash, and game over overlays.
 */
export class GameUI {
  /** Root container for all UI elements */
  readonly container: Container;

  /** Scoreboard container */
  private scoreboard!: Container;
  private leftScoreText!: Text;
  private rightScoreText!: Text;
  private separatorText!: Text;

  /** Countdown overlay */
  private countdownContainer!: Container;
  private countdownText!: Text;

  /** Score flash overlay */
  private flashContainer!: Container;
  private flashGraphics!: Graphics;

  /** Game over overlay */
  private gameOverContainer!: Container;
  private gameOverBackground!: Graphics;
  private winnerText!: Text;
  private finalScoreText!: Text;
  private promptText!: Text;

  /** Pause overlay */
  private pauseContainer!: Container;
  private pauseBackground!: Graphics;
  private pauseText!: Text;

  /** Field dimensions */
  private fieldWidth: number;
  private fieldHeight: number;

  /** Flash animation state */
  private flashAlpha: number = 0;
  private flashTeam: Team | null = null;

  constructor(width: number = FIELD.WIDTH, height: number = FIELD.HEIGHT) {
    this.fieldWidth = width;
    this.fieldHeight = height;
    this.container = new Container();

    this.createScoreboard();
    this.createCountdown();
    this.createFlash();
    this.createGameOver();
    this.createPause();

    // Initially hide overlays
    this.countdownContainer.visible = false;
    this.flashContainer.visible = false;
    this.gameOverContainer.visible = false;
    this.pauseContainer.visible = false;
  }

  /**
   * Create the scoreboard UI.
   */
  private createScoreboard(): void {
    this.scoreboard = new Container();

    // Left score (red team)
    this.leftScoreText = new Text({ text: "0", style: STYLES.score });
    this.leftScoreText.anchor.set(1, 0);

    // Separator
    this.separatorText = new Text({ text: " - ", style: STYLES.score });
    this.separatorText.anchor.set(0.5, 0);

    // Right score (black team)
    this.rightScoreText = new Text({ text: "0", style: STYLES.score });
    this.rightScoreText.anchor.set(0, 0);

    // Position at top center
    const centerX = this.fieldWidth / 2;
    this.separatorText.x = centerX;
    this.separatorText.y = 10;
    this.leftScoreText.x = centerX - 20;
    this.leftScoreText.y = 10;
    this.rightScoreText.x = centerX + 20;
    this.rightScoreText.y = 10;

    this.scoreboard.addChild(this.leftScoreText);
    this.scoreboard.addChild(this.separatorText);
    this.scoreboard.addChild(this.rightScoreText);

    this.container.addChild(this.scoreboard);
  }

  /**
   * Create the countdown overlay.
   */
  private createCountdown(): void {
    this.countdownContainer = new Container();

    this.countdownText = new Text({ text: "3", style: STYLES.countdown });
    this.countdownText.anchor.set(0.5, 0.5);
    this.countdownText.x = this.fieldWidth / 2;
    this.countdownText.y = this.fieldHeight / 2;

    this.countdownContainer.addChild(this.countdownText);
    this.container.addChild(this.countdownContainer);
  }

  /**
   * Create the score flash overlay.
   */
  private createFlash(): void {
    this.flashContainer = new Container();

    this.flashGraphics = new Graphics();
    this.flashContainer.addChild(this.flashGraphics);

    this.container.addChild(this.flashContainer);
  }

  /**
   * Create the game over overlay.
   */
  private createGameOver(): void {
    this.gameOverContainer = new Container();

    // Semi-transparent background
    this.gameOverBackground = new Graphics();
    this.gameOverBackground.rect(0, 0, this.fieldWidth, this.fieldHeight);
    this.gameOverBackground.fill({ color: 0x000000, alpha: 0.7 });

    // Winner text
    this.winnerText = new Text({ text: "WINNER!", style: STYLES.winner });
    this.winnerText.anchor.set(0.5, 0.5);
    this.winnerText.x = this.fieldWidth / 2;
    this.winnerText.y = this.fieldHeight / 2 - 50;

    // Final score
    this.finalScoreText = new Text({ text: "0 - 0", style: STYLES.message });
    this.finalScoreText.anchor.set(0.5, 0.5);
    this.finalScoreText.x = this.fieldWidth / 2;
    this.finalScoreText.y = this.fieldHeight / 2 + 10;

    // Prompt to continue
    this.promptText = new Text({
      text: "Press SPACE to continue",
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 18,
        fill: "#aaaaaa",
      }),
    });
    this.promptText.anchor.set(0.5, 0.5);
    this.promptText.x = this.fieldWidth / 2;
    this.promptText.y = this.fieldHeight / 2 + 70;

    this.gameOverContainer.addChild(this.gameOverBackground);
    this.gameOverContainer.addChild(this.winnerText);
    this.gameOverContainer.addChild(this.finalScoreText);
    this.gameOverContainer.addChild(this.promptText);

    this.container.addChild(this.gameOverContainer);
  }

  /**
   * Create the pause overlay.
   */
  private createPause(): void {
    this.pauseContainer = new Container();

    // Semi-transparent background
    this.pauseBackground = new Graphics();
    this.pauseBackground.rect(0, 0, this.fieldWidth, this.fieldHeight);
    this.pauseBackground.fill({ color: 0x000000, alpha: 0.5 });

    // Pause text
    this.pauseText = new Text({ text: "PAUSED", style: STYLES.message });
    this.pauseText.anchor.set(0.5, 0.5);
    this.pauseText.x = this.fieldWidth / 2;
    this.pauseText.y = this.fieldHeight / 2;

    this.pauseContainer.addChild(this.pauseBackground);
    this.pauseContainer.addChild(this.pauseText);

    this.container.addChild(this.pauseContainer);
  }

  /**
   * Update the scoreboard.
   */
  updateScore(score: Score): void {
    this.leftScoreText.text = String(score.left);
    this.rightScoreText.text = String(score.right);
  }

  /**
   * Show the countdown overlay.
   */
  showCountdown(seconds: number): void {
    this.countdownContainer.visible = true;

    if (seconds <= 0) {
      this.countdownText.text = "GO!";
    } else {
      this.countdownText.text = String(seconds);
    }

    // Pulse animation
    this.countdownText.scale.set(1.2);
  }

  /**
   * Hide the countdown overlay.
   */
  hideCountdown(): void {
    this.countdownContainer.visible = false;
  }

  /**
   * Trigger score flash for a team.
   */
  triggerFlash(team: Team): void {
    this.flashTeam = team;
    this.flashAlpha = 0.5;
    this.flashContainer.visible = true;
  }

  /**
   * Show the game over overlay.
   */
  showGameOver(winner: Team, score: Score): void {
    this.gameOverContainer.visible = true;

    const teamName = winner === 0 ? "RED" : "BLACK";
    this.winnerText.text = `${teamName} WINS!`;
    this.winnerText.style.fill = winner === 0 ? "#cc0000" : "#333333";

    this.finalScoreText.text = `${score.left} - ${score.right}`;
  }

  /**
   * Hide the game over overlay.
   */
  hideGameOver(): void {
    this.gameOverContainer.visible = false;
  }

  /**
   * Show the pause overlay.
   */
  showPause(): void {
    this.pauseContainer.visible = true;
  }

  /**
   * Hide the pause overlay.
   */
  hidePause(): void {
    this.pauseContainer.visible = false;
  }

  /**
   * Update UI state based on game state.
   */
  updateFromState(state: GameState, countdownSeconds?: number): void {
    switch (state) {
      case "countdown":
        if (countdownSeconds !== undefined) {
          this.showCountdown(countdownSeconds);
        }
        this.hideGameOver();
        this.hidePause();
        break;
      case "playing":
        this.hideCountdown();
        this.hideGameOver();
        this.hidePause();
        break;
      case "paused":
        this.showPause();
        break;
      case "gameOver":
        this.hideCountdown();
        this.hidePause();
        // Game over is shown via showGameOver()
        break;
      default:
        this.hideCountdown();
        this.hideGameOver();
        this.hidePause();
        break;
    }
  }

  /**
   * Update animations (call each frame).
   */
  update(deltaTime: number): void {
    // Countdown pulse animation
    if (this.countdownContainer.visible) {
      const scale = this.countdownText.scale.x;
      if (scale > 1) {
        this.countdownText.scale.set(Math.max(1, scale - deltaTime * 0.01));
      }
    }

    // Flash fade animation
    if (this.flashAlpha > 0 && this.flashTeam !== null) {
      this.flashAlpha -= deltaTime * 0.003;
      if (this.flashAlpha <= 0) {
        this.flashAlpha = 0;
        this.flashContainer.visible = false;
        this.flashTeam = null;
      } else {
        this.flashGraphics.clear();
        this.flashGraphics.rect(0, 0, this.fieldWidth, this.fieldHeight);
        this.flashGraphics.fill({
          color: TEAM_COLORS[this.flashTeam],
          alpha: this.flashAlpha,
        });
      }
    }
  }

  /**
   * Clean up resources.
   */
  destroy(): void {
    this.container.destroy({ children: true });
  }
}
