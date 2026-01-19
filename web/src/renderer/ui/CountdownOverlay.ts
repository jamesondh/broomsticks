import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { FIELD } from "../../engine/constants";

/**
 * Countdown overlay configuration.
 */
export interface CountdownOverlayConfig {
  /** Field width */
  fieldWidth: number;
  /** Field height */
  fieldHeight: number;
  /** Font size for countdown numbers */
  fontSize: number;
  /** Text color */
  textColor: number;
  /** Background color */
  backgroundColor: number;
  /** Background alpha */
  backgroundAlpha: number;
}

const DEFAULT_CONFIG: CountdownOverlayConfig = {
  fieldWidth: FIELD.WIDTH,
  fieldHeight: FIELD.HEIGHT,
  fontSize: 72,
  textColor: 0xffffff,
  backgroundColor: 0x000000,
  backgroundAlpha: 0.5,
};

/**
 * Countdown overlay component.
 * Shows 3, 2, 1, GO! before game starts.
 */
export class CountdownOverlay {
  /** Container for all overlay elements */
  readonly container: Container;

  /** Configuration */
  private config: CountdownOverlayConfig;

  /** Semi-transparent background */
  private background: Graphics;

  /** Countdown text */
  private countdownText: Text;

  /** Current displayed value */
  private currentValue: number | string = "";

  constructor(config: Partial<CountdownOverlayConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.container = new Container();
    this.container.visible = false;

    // Create background
    this.background = new Graphics();
    this.background.rect(0, 0, this.config.fieldWidth, this.config.fieldHeight);
    this.background.fill({ color: this.config.backgroundColor, alpha: this.config.backgroundAlpha });

    // Create text style
    const textStyle = new TextStyle({
      fontFamily: "Helvetica, Arial, sans-serif",
      fontSize: this.config.fontSize,
      fontWeight: "bold",
      fill: this.config.textColor,
      stroke: { color: 0x000000, width: 4 },
      dropShadow: {
        color: 0x000000,
        blur: 4,
        angle: Math.PI / 4,
        distance: 2,
      },
    });

    // Create countdown text
    this.countdownText = new Text({ text: "", style: textStyle });
    this.countdownText.anchor.set(0.5);
    this.countdownText.x = this.config.fieldWidth / 2;
    this.countdownText.y = this.config.fieldHeight / 2;

    // Add to container
    this.container.addChild(this.background);
    this.container.addChild(this.countdownText);
  }

  /**
   * Show the countdown overlay with a specific number.
   */
  show(seconds: number): void {
    this.container.visible = true;
    this.setValue(seconds);
  }

  /**
   * Show "GO!" text.
   */
  showGo(): void {
    this.container.visible = true;
    this.setValue("GO!");
  }

  /**
   * Hide the countdown overlay.
   */
  hide(): void {
    this.container.visible = false;
  }

  /**
   * Set the displayed value.
   */
  setValue(value: number | string): void {
    if (this.currentValue === value) return;

    this.currentValue = value;
    this.countdownText.text = String(value);

    // Re-center after text change
    this.countdownText.x = this.config.fieldWidth / 2;
    this.countdownText.y = this.config.fieldHeight / 2;

    // Scale animation effect
    this.countdownText.scale.set(1.2);
    this.animateScale();
  }

  /**
   * Simple scale animation for countdown effect.
   */
  private animateScale(): void {
    const duration = 200;
    const startTime = performance.now();
    const startScale = 1.2;
    const endScale = 1.0;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out
      const eased = 1 - Math.pow(1 - progress, 2);
      const scale = startScale + (endScale - startScale) * eased;
      this.countdownText.scale.set(scale);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  /**
   * Check if overlay is currently visible.
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
