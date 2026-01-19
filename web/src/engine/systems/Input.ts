import type { PlayerInput } from "../types";

/**
 * Create an empty player input state.
 */
export function createEmptyInput(): PlayerInput {
  return {
    up: false,
    down: false,
    left: false,
    right: false,
    pass: false,
    timestamp: 0,
  };
}

/**
 * Create input from directional values.
 */
export function createInput(
  up: boolean,
  down: boolean,
  left: boolean,
  right: boolean,
  pass: boolean = false,
  timestamp: number = Date.now()
): PlayerInput {
  return { up, down, left, right, pass, timestamp };
}

/**
 * Check if any direction is active in the input.
 */
export function hasActiveInput(input: PlayerInput): boolean {
  return input.up || input.down || input.left || input.right || input.pass;
}

/**
 * Merge two inputs (OR the directions together).
 */
export function mergeInputs(a: PlayerInput, b: PlayerInput): PlayerInput {
  return {
    up: a.up || b.up,
    down: a.down || b.down,
    left: a.left || b.left,
    right: a.right || b.right,
    pass: a.pass || b.pass,
    timestamp: Math.max(a.timestamp, b.timestamp),
  };
}

/**
 * Input source abstraction for supporting multiple input types.
 */
export interface InputSource {
  /** Get current input state */
  getInput(): PlayerInput;
  /** Update input state (called each frame) */
  update?(now: number): void;
  /** Clean up resources */
  destroy?(): void;
}

/**
 * Input manager that combines multiple input sources.
 */
export class InputManager {
  private sources: Map<string, InputSource> = new Map();

  /**
   * Register an input source for a player.
   */
  addSource(playerId: number, sourceId: string, source: InputSource): void {
    this.sources.set(`${playerId}:${sourceId}`, source);
  }

  /**
   * Remove an input source.
   */
  removeSource(playerId: number, sourceId: string): void {
    const key = `${playerId}:${sourceId}`;
    const source = this.sources.get(key);
    if (source?.destroy) {
      source.destroy();
    }
    this.sources.delete(key);
  }

  /**
   * Update all input sources.
   */
  update(now: number): void {
    for (const source of this.sources.values()) {
      source.update?.(now);
    }
  }

  /**
   * Get combined input for a player.
   */
  getPlayerInput(playerId: number): PlayerInput {
    let result = createEmptyInput();

    for (const [key, source] of this.sources) {
      if (key.startsWith(`${playerId}:`)) {
        result = mergeInputs(result, source.getInput());
      }
    }

    return result;
  }

  /**
   * Get inputs for all players.
   */
  getAllInputs(): Map<number, PlayerInput> {
    const inputs = new Map<number, PlayerInput>();

    // Get unique player IDs
    const playerIds = new Set<number>();
    for (const key of this.sources.keys()) {
      const playerId = parseInt(key.split(":")[0], 10);
      playerIds.add(playerId);
    }

    // Get combined input for each player
    for (const playerId of playerIds) {
      inputs.set(playerId, this.getPlayerInput(playerId));
    }

    return inputs;
  }

  /**
   * Clean up all sources.
   */
  destroy(): void {
    for (const source of this.sources.values()) {
      source.destroy?.();
    }
    this.sources.clear();
  }
}

/**
 * Simple input source that can be manually set.
 * Useful for AI or network inputs.
 */
export class ManualInputSource implements InputSource {
  private input: PlayerInput = createEmptyInput();

  setInput(input: PlayerInput): void {
    this.input = input;
  }

  getInput(): PlayerInput {
    return this.input;
  }

  clear(): void {
    this.input = createEmptyInput();
  }
}
