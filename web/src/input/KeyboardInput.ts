import type { PlayerInput } from "../engine/types";
import type { InputSource } from "../engine/systems/Input";

/**
 * Key bindings for player controls.
 */
export interface KeyBindings {
  up: string[];
  down: string[];
  left: string[];
  right: string[];
  pass: string[];
}

/**
 * Default key bindings (WASD + Arrow keys).
 */
export const DEFAULT_BINDINGS: KeyBindings = {
  up: ["KeyW", "ArrowUp"],
  down: ["KeyS", "ArrowDown"],
  left: ["KeyA", "ArrowLeft"],
  right: ["KeyD", "ArrowRight"],
  pass: ["Space"],
};

/**
 * Keyboard input source with hybrid tap/hold detection.
 *
 * - Tap: Quick press and release (< HOLD_DELAY ms) triggers one-frame input
 * - Hold: Holding key triggers continuous input after HOLD_DELAY
 */
export class KeyboardInput implements InputSource {
  /** Key bindings */
  private bindings: KeyBindings;

  /** Currently pressed keys */
  private keysPressed: Set<string> = new Set();

  /** Time when each key was pressed */
  private keyDownTime: Map<string, number> = new Map();

  /** Keys that have been tapped (quick press/release) */
  private tappedKeys: Set<string> = new Set();

  /** Delay before continuous input (ms) */
  private readonly HOLD_DELAY = 150;

  /** Whether input listeners are attached */
  private attached: boolean = false;

  constructor(bindings: KeyBindings = DEFAULT_BINDINGS) {
    this.bindings = bindings;
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
  }

  /**
   * Attach keyboard event listeners.
   */
  attach(): void {
    if (this.attached) return;
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    this.attached = true;
  }

  /**
   * Detach keyboard event listeners.
   */
  detach(): void {
    if (!this.attached) return;
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    this.attached = false;
    this.keysPressed.clear();
    this.keyDownTime.clear();
    this.tappedKeys.clear();
  }

  /**
   * Handle keydown events.
   */
  private handleKeyDown(e: KeyboardEvent): void {
    // Prevent repeat events
    if (e.repeat) return;

    const code = e.code;

    // Check if this key is bound
    if (!this.isKeyBound(code)) return;

    // Prevent default for game keys
    e.preventDefault();

    if (!this.keysPressed.has(code)) {
      this.keysPressed.add(code);
      this.keyDownTime.set(code, performance.now());
    }
  }

  /**
   * Handle keyup events.
   */
  private handleKeyUp(e: KeyboardEvent): void {
    const code = e.code;

    if (!this.keysPressed.has(code)) return;

    // Check if this was a tap (short press)
    const downTime = this.keyDownTime.get(code);
    if (downTime !== undefined) {
      const duration = performance.now() - downTime;
      if (duration < this.HOLD_DELAY) {
        // Mark as tapped for one frame
        this.tappedKeys.add(code);
      }
    }

    this.keysPressed.delete(code);
    this.keyDownTime.delete(code);
  }

  /**
   * Check if a key is bound to any action.
   */
  private isKeyBound(code: string): boolean {
    return (
      this.bindings.up.includes(code) ||
      this.bindings.down.includes(code) ||
      this.bindings.left.includes(code) ||
      this.bindings.right.includes(code) ||
      this.bindings.pass.includes(code)
    );
  }

  /**
   * Check if an action is currently active.
   */
  private isActionActive(action: keyof KeyBindings, now: number): boolean {
    const keys = this.bindings[action];

    for (const code of keys) {
      // Check for tap
      if (this.tappedKeys.has(code)) {
        return true;
      }

      // Check for hold
      if (this.keysPressed.has(code)) {
        const downTime = this.keyDownTime.get(code);
        if (downTime !== undefined && now - downTime >= this.HOLD_DELAY) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Get current input state (implements InputSource interface).
   */
  getInput(): PlayerInput {
    const now = performance.now();

    const input: PlayerInput = {
      up: this.isActionActive("up", now),
      down: this.isActionActive("down", now),
      left: this.isActionActive("left", now),
      right: this.isActionActive("right", now),
      pass: this.isActionActive("pass", now),
      timestamp: now,
    };

    // Clear tapped keys after reading input
    this.tappedKeys.clear();

    return input;
  }

  /**
   * Update (called each frame, implements InputSource interface).
   */
  update(): void {
    // No-op - input is read on demand
  }

  /**
   * Cleanup (implements InputSource interface).
   */
  destroy(): void {
    this.detach();
  }

  /**
   * Update key bindings.
   */
  setBindings(bindings: KeyBindings): void {
    this.bindings = bindings;
  }

  /**
   * Get current key bindings.
   */
  getBindings(): KeyBindings {
    return { ...this.bindings };
  }

  /**
   * Check if any movement key is pressed.
   */
  isAnyKeyPressed(): boolean {
    return this.keysPressed.size > 0;
  }
}
