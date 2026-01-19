import { Container, Text, TextStyle } from "pixi.js";
import type { Team } from "../../engine/types";
import { FIELD } from "../../engine/constants";

/**
 * Score flash configuration.
 */
export interface ScoreFlashConfig {
  /** Field width */
  fieldWidth: number;
  /** Field height */
  fieldHeight: number;
  /** Font size */
  fontSize: number;
  /** Flash duration in ms */
  duration: number;
  /** Left team color */
  leftColor: number;
  /** Right team color */
  rightColor: number;
}

const DEFAULT_CONFIG: ScoreFlashConfig = {
  fieldWidth: FIELD.WIDTH,
  fieldHeight: FIELD.HEIGHT,
  fontSize: 48,
  duration: 1500,
  leftColor: 0x0080ff,
  rightColor: 0x00a400,
};

/**
 * Score flash effect.
 * Shows "+10" text with animation when a team scores.
 */
export class ScoreFlash {
  /** Container for flash elements */
  readonly container: Container;

  /** Configuration */
  private config: ScoreFlashConfig;

  /** Flash text */
  private flashText: Text;

  /** Animation frame ID */
  private animationId: number = 0;

  /** Is animation playing */
  private isPlaying: boolean = false;

  constructor(config: Partial<ScoreFlashConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.container = new Container();
    this.container.visible = false;

    // Create text style
    const textStyle = new TextStyle({
      fontFamily: "Helvetica, Arial, sans-serif",
      fontSize: this.config.fontSize,
      fontWeight: "bold",
      fill: 0xffffff,
      stroke: { color: 0x000000, width: 3 },
    });

    // Create flash text
    this.flashText = new Text({ text: "+10", style: textStyle });
    this.flashText.anchor.set(0.5);

    this.container.addChild(this.flashText);
  }

  /**
   * Show the score flash for a team.
   */
  show(team: Team, points: number = 10): void {
    // Cancel any existing animation
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    // Set text and color
    this.flashText.text = `+${points}`;
    this.flashText.style.fill = team === 0 ? this.config.leftColor : this.config.rightColor;

    // Position based on team (near their scoring basket)
    // Left team scores on right basket, right team scores on left basket
    if (team === 0) {
      this.flashText.x = this.config.fieldWidth - 80;
    } else {
      this.flashText.x = 80;
    }
    this.flashText.y = 200;

    // Reset scale and alpha
    this.flashText.scale.set(0.5);
    this.flashText.alpha = 1;

    // Show container
    this.container.visible = true;
    this.isPlaying = true;

    // Start animation
    this.animate();
  }

  /**
   * Animate the flash effect.
   */
  private animate(): void {
    const startTime = performance.now();
    const duration = this.config.duration;
    const startY = 200;
    const endY = 100;
    const startScale = 0.5;
    const maxScale = 1.2;

    const animate = (now: number) => {
      if (!this.isPlaying) return;

      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Scale up quickly, then stay
      const scaleProgress = Math.min(progress * 4, 1);
      const scale = startScale + (maxScale - startScale) * easeOutBack(scaleProgress);
      this.flashText.scale.set(scale);

      // Move up slowly
      this.flashText.y = startY + (endY - startY) * easeOutQuad(progress);

      // Fade out in last 30%
      if (progress > 0.7) {
        const fadeProgress = (progress - 0.7) / 0.3;
        this.flashText.alpha = 1 - fadeProgress;
      }

      if (progress < 1) {
        this.animationId = requestAnimationFrame(animate);
      } else {
        this.hide();
      }
    };

    this.animationId = requestAnimationFrame(animate);
  }

  /**
   * Hide the flash.
   */
  hide(): void {
    this.isPlaying = false;
    this.container.visible = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = 0;
    }
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
    this.hide();
    this.container.destroy({ children: true });
  }
}

// Easing functions
function easeOutQuad(x: number): number {
  return 1 - (1 - x) * (1 - x);
}

function easeOutBack(x: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}
