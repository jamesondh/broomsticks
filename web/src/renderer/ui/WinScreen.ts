import { Container, Graphics, Text, TextStyle } from "pixi.js";
import type { Team, Score } from "../../engine/types";
import { FIELD } from "../../engine/constants";

/**
 * Win screen configuration.
 */
export interface WinScreenConfig {
  /** Field width */
  fieldWidth: number;
  /** Field height */
  fieldHeight: number;
  /** Background color */
  backgroundColor: number;
  /** Background alpha */
  backgroundAlpha: number;
  /** Left team color */
  leftColor: number;
  /** Right team color */
  rightColor: number;
  /** Button color (green) */
  buttonColor: number;
}

const DEFAULT_CONFIG: WinScreenConfig = {
  fieldWidth: FIELD.WIDTH,
  fieldHeight: FIELD.HEIGHT,
  backgroundColor: 0x000000,
  backgroundAlpha: 0.7,
  leftColor: 0x0080ff,
  rightColor: 0x00a400,
  buttonColor: 0x00a400,
};

/**
 * Win screen overlay.
 * Shows game over message with final score and play again button.
 */
export class WinScreen {
  /** Container for all elements */
  readonly container: Container;

  /** Configuration */
  private config: WinScreenConfig;

  /** Background overlay */
  private background: Graphics;

  /** Winner text */
  private winnerText: Text;

  /** Score text */
  private scoreText: Text;

  /** Play again button */
  private playAgainButton: Graphics;

  /** Play again text */
  private playAgainText: Text;

  /** Callback for play again click */
  private onPlayAgain: (() => void) | null = null;

  constructor(config: Partial<WinScreenConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.container = new Container();
    this.container.visible = false;
    this.container.eventMode = "static";

    // Create background
    this.background = new Graphics();
    this.background.rect(0, 0, this.config.fieldWidth, this.config.fieldHeight);
    this.background.fill({ color: this.config.backgroundColor, alpha: this.config.backgroundAlpha });

    // Create text styles
    const titleStyle = new TextStyle({
      fontFamily: "Helvetica, Arial, sans-serif",
      fontSize: 36,
      fontWeight: "bold",
      fill: 0xffffff,
      stroke: { color: 0x000000, width: 3 },
    });

    const scoreStyle = new TextStyle({
      fontFamily: "Helvetica, Arial, sans-serif",
      fontSize: 24,
      fill: 0xffffff,
    });

    const buttonTextStyle = new TextStyle({
      fontFamily: "Helvetica, Arial, sans-serif",
      fontSize: 14,
      fill: 0x000000,
    });

    // Create winner text
    this.winnerText = new Text({ text: "", style: titleStyle });
    this.winnerText.anchor.set(0.5);
    this.winnerText.x = this.config.fieldWidth / 2;
    this.winnerText.y = 100;

    // Create score text
    this.scoreText = new Text({ text: "", style: scoreStyle });
    this.scoreText.anchor.set(0.5);
    this.scoreText.x = this.config.fieldWidth / 2;
    this.scoreText.y = 160;

    // Create play again button
    this.playAgainButton = new Graphics();
    this.playAgainButton.eventMode = "static";
    this.playAgainButton.cursor = "pointer";
    this.drawButton(false);

    // Create play again text
    this.playAgainText = new Text({
      text: "Click here to play again",
      style: buttonTextStyle,
    });
    this.playAgainText.anchor.set(0.5);
    this.playAgainText.x = this.config.fieldWidth / 2;
    this.playAgainText.y = 230;

    // Button interactions
    this.playAgainButton.addEventListener("pointerover", () => this.drawButton(true));
    this.playAgainButton.addEventListener("pointerout", () => this.drawButton(false));
    this.playAgainButton.addEventListener("pointerdown", () => {
      if (this.onPlayAgain) {
        this.onPlayAgain();
      }
    });

    // Add to container
    this.container.addChild(this.background);
    this.container.addChild(this.winnerText);
    this.container.addChild(this.scoreText);
    this.container.addChild(this.playAgainButton);
    this.container.addChild(this.playAgainText);
  }

  /**
   * Draw the play again button.
   */
  private drawButton(hover: boolean): void {
    const buttonWidth = 200;
    const buttonHeight = 25;
    const x = this.config.fieldWidth / 2 - buttonWidth / 2;
    const y = 215;

    this.playAgainButton.clear();
    this.playAgainButton.rect(x, y, buttonWidth, buttonHeight);
    this.playAgainButton.fill({ color: hover ? 0x00c400 : this.config.buttonColor });
    this.playAgainButton.stroke({ color: 0x000000, width: 1 });
  }

  /**
   * Show the win screen.
   */
  show(winner: Team, score: Score): void {
    // Update winner text
    const teamName = winner === 0 ? "Blue" : "Green";
    const teamColor = winner === 0 ? this.config.leftColor : this.config.rightColor;
    this.winnerText.text = `${teamName} Wins!`;
    this.winnerText.style.fill = teamColor;

    // Update score text
    this.scoreText.text = `Final Score: ${score.left} - ${score.right}`;

    // Show container
    this.container.visible = true;
  }

  /**
   * Hide the win screen.
   */
  hide(): void {
    this.container.visible = false;
  }

  /**
   * Set callback for play again button.
   */
  setOnPlayAgain(callback: () => void): void {
    this.onPlayAgain = callback;
  }

  /**
   * Check if visible.
   */
  isVisible(): boolean {
    return this.container.visible;
  }

  /**
   * Add to a parent container.
   */
  addTo(parent: Container): void {
    parent.addChild(this.container);
  }

  /**
   * Destroy and clean up resources.
   */
  destroy(): void {
    this.container.destroy({ children: true });
  }
}
