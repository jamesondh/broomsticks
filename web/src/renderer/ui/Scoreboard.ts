import { Container, Graphics, Text, TextStyle } from "pixi.js";
import type { Score, Team } from "../../engine/types";
import { FIELD } from "../../engine/constants";

/**
 * Scoreboard configuration.
 */
export interface ScoreboardConfig {
  /** Field width */
  fieldWidth: number;
  /** Box width */
  boxWidth: number;
  /** Box height */
  boxHeight: number;
  /** Y position */
  y: number;
  /** Left team color (blue) */
  leftColor: number;
  /** Right team color (green) */
  rightColor: number;
  /** Highlight color (gold) */
  highlightColor: number;
  /** Font size */
  fontSize: number;
}

const DEFAULT_CONFIG: ScoreboardConfig = {
  fieldWidth: FIELD.WIDTH,
  boxWidth: 100,
  boxHeight: 15,
  y: 8,
  leftColor: 0x0080ff, // Blue
  rightColor: 0x00a400, // Green
  highlightColor: 0xffff00, // Gold
  fontSize: 12,
};

/** Margin from field edge for score boxes */
const SCORE_BOX_MARGIN = 48;

/**
 * Scoreboard UI component.
 * Displays scores for both teams with highlight on goal.
 */
export class Scoreboard {
  /** Container for all scoreboard elements */
  readonly container: Container;

  /** Configuration */
  private config: ScoreboardConfig;

  /** Left score box */
  private leftBox: Graphics;

  /** Right score box */
  private rightBox: Graphics;

  /** Left score text */
  private leftText: Text;

  /** Right score text */
  private rightText: Text;

  /** Title text */
  private titleText: Text;

  /** Current score */
  private score: Score = { left: 0, right: 0 };

  /** Highlight state: null, 0 (left), or 1 (right) */
  private highlight: Team | null = null;

  /** Highlight timer for auto-reset */
  private highlightTimer: number = 0;

  constructor(config: Partial<ScoreboardConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.container = new Container();

    // Create text style
    const textStyle = new TextStyle({
      fontFamily: "Helvetica, Arial, sans-serif",
      fontSize: this.config.fontSize,
      fill: 0x000000,
    });

    // Create boxes
    this.leftBox = new Graphics();
    this.rightBox = new Graphics();

    // Create text
    this.leftText = new Text({ text: "Score: 0", style: textStyle });
    this.rightText = new Text({ text: "Score: 0", style: textStyle });
    this.titleText = new Text({
      text: "Broomsticks by Paul Rajlich",
      style: textStyle,
    });

    // Position elements
    this.positionElements();

    // Add to container
    this.container.addChild(this.leftBox);
    this.container.addChild(this.rightBox);
    this.container.addChild(this.leftText);
    this.container.addChild(this.rightText);
    this.container.addChild(this.titleText);

    // Initial draw
    this.draw();
  }

  /** Get left box X position */
  private get leftBoxX(): number {
    return SCORE_BOX_MARGIN;
  }

  /** Get right box X position */
  private get rightBoxX(): number {
    return this.config.fieldWidth - SCORE_BOX_MARGIN - this.config.boxWidth;
  }

  /**
   * Position all elements.
   */
  private positionElements(): void {
    // Text positions (with small padding)
    this.leftText.x = this.leftBoxX + 4;
    this.leftText.y = this.config.y + 2;

    this.rightText.x = this.rightBoxX + 4;
    this.rightText.y = this.config.y + 2;

    // Title centered
    this.titleText.x = this.config.fieldWidth / 2 - this.titleText.width / 2;
    this.titleText.y = this.config.y + 2;
  }

  /**
   * Draw the score boxes.
   */
  private draw(): void {
    // Left box
    this.leftBox.clear();
    const leftColor = this.highlight === 0 ? this.config.highlightColor : this.config.leftColor;
    this.leftBox.rect(this.leftBoxX, this.config.y, this.config.boxWidth, this.config.boxHeight);
    this.leftBox.fill({ color: leftColor });
    this.leftBox.stroke({ color: 0x000000, width: 1 });

    // Right box
    this.rightBox.clear();
    const rightColor = this.highlight === 1 ? this.config.highlightColor : this.config.rightColor;
    this.rightBox.rect(this.rightBoxX, this.config.y, this.config.boxWidth, this.config.boxHeight);
    this.rightBox.fill({ color: rightColor });
    this.rightBox.stroke({ color: 0x000000, width: 1 });
  }

  /**
   * Update the scoreboard with new score.
   */
  update(score: Score): void {
    if (score.left !== this.score.left || score.right !== this.score.right) {
      this.score = { ...score };
      this.leftText.text = `Score: ${score.left}`;
      this.rightText.text = `Score: ${score.right}`;
    }
  }

  /**
   * Set highlight for a team (called when they score).
   */
  setHighlight(team: Team | null): void {
    if (this.highlight !== team) {
      this.highlight = team;
      this.draw();
    }
  }

  /**
   * Start highlight with auto-reset timer.
   */
  highlightTeam(team: Team, duration: number = 1500): void {
    this.setHighlight(team);

    // Clear previous timer
    if (this.highlightTimer) {
      window.clearTimeout(this.highlightTimer);
    }

    // Set new timer to clear highlight
    this.highlightTimer = window.setTimeout(() => {
      this.setHighlight(null);
      this.highlightTimer = 0;
    }, duration);
  }

  /**
   * Add to a parent container.
   */
  addTo(parent: Container): void {
    parent.addChild(this.container);
  }

  /**
   * Show/hide the scoreboard.
   */
  setVisible(visible: boolean): void {
    this.container.visible = visible;
  }

  /**
   * Destroy and clean up resources.
   */
  destroy(): void {
    if (this.highlightTimer) {
      window.clearTimeout(this.highlightTimer);
    }
    this.container.destroy({ children: true });
  }
}
