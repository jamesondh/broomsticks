import { FIELD, TIMING } from "./constants";
import { createConfig } from "./config";
import type {
  GameConfig,
  GameState,
  Score,
  Team,
  PlayerInput,
  GameSnapshot,
  GoalEvent,
  Bounds,
} from "./types";
import { Person } from "./entities/Person";
import { Ball } from "./entities/Ball";
import {
  createPhysicsState,
  calculatePhysicsSteps,
  updatePhysics,
  updateCaughtBallPositions,
  runCollisionDetection,
  checkAllGoals,
  applyGoals,
  checkWinCondition,
  createScore,
  getTeamWithPossession,
  createEmptyInput,
} from "./systems";
import type { PhysicsState, CollisionEvent } from "./systems";

/**
 * Event emitted by the game.
 */
export type GameEvent =
  | { type: "stateChange"; from: GameState; to: GameState }
  | { type: "goal"; event: GoalEvent }
  | { type: "collision"; event: CollisionEvent }
  | { type: "countdown"; seconds: number }
  | { type: "gameOver"; winner: Team };

/**
 * Event listener callback.
 */
export type GameEventListener = (event: GameEvent) => void;

/**
 * Main game class that manages the game loop and state.
 */
export class Game {
  /** Current game configuration */
  readonly config: GameConfig;

  /** Current game state */
  private _state: GameState = "menu";

  /** Current tick number */
  private tick: number = 0;

  /** Current score */
  private score: Score;

  /** All player entities */
  private players: Person[] = [];

  /** All ball entities */
  private balls: Ball[] = [];

  /** Physics state for fixed timestep */
  private physics: PhysicsState;

  /** Countdown timer */
  private countdownSeconds: number = 0;
  private countdownTimer: number = 0;

  /** Scored display timer */
  private scoredTimer: number = 0;

  /** Winner (set when game ends) */
  private winner: Team | null = null;

  /** Event listeners */
  private listeners: Set<GameEventListener> = new Set();

  /** Field bounds */
  private bounds: Bounds;

  constructor(config: Partial<GameConfig> = {}) {
    this.config = createConfig(config);
    this.score = createScore();
    this.physics = createPhysicsState();

    this.bounds = {
      minX: 0,
      maxX: this.config.fieldWidth,
      minY: 0,
      maxY: this.config.fieldHeight - FIELD.GROUND_MARGIN,
    };

    this.initializeEntities();
  }

  /**
   * Initialize player and ball entities based on config.
   */
  private initializeEntities(): void {
    const { fieldWidth } = this.config;

    // Create players
    // Player 1 (left team, human by default)
    this.players.push(
      new Person({
        x: 100,
        y: 200,
        team: 0,
        model: 1,
        isRobot: false,
        bounds: this.bounds,
      })
    );

    // Player 2 (right team, can be AI)
    this.players.push(
      new Person({
        x: fieldWidth - 120,
        y: 200,
        team: 1,
        model: 4,
        isRobot: true,
        bounds: this.bounds,
      })
    );

    // Set AI smart values
    for (const player of this.players) {
      if (player.isRobot) {
        player.setSmart(this.config.aiSmartValue);
      }
    }

    // Create balls
    const centerX = fieldWidth / 2;

    // Red ball (always 1 for now, configurable later)
    for (let i = 0; i < this.config.redBallCount; i++) {
      this.balls.push(
        new Ball({
          type: "red",
          x: centerX,
          y: 100 + i * 50,
          bounds: this.bounds,
        })
      );
    }

    // Black balls
    for (let i = 0; i < this.config.blackBallCount; i++) {
      this.balls.push(
        new Ball({
          type: "black",
          x: centerX,
          y: 200 + i * 100,
          bounds: this.bounds,
        })
      );
    }

    // Assign target balls to AI players
    const redBall = this.balls.find((b) => b.type === "red") ?? null;
    for (const player of this.players) {
      player.setTargetBall(redBall);
    }
  }

  /**
   * Get current game state.
   */
  get state(): GameState {
    return this._state;
  }

  /**
   * Transition to a new state.
   */
  private setState(newState: GameState): void {
    const oldState = this._state;
    if (oldState === newState) return;

    this._state = newState;
    this.emit({ type: "stateChange", from: oldState, to: newState });
  }

  /**
   * Start the game (transitions from menu to countdown).
   */
  start(): void {
    if (this._state !== "menu") return;

    this.reset();
    this.startCountdown();
  }

  /**
   * Reset game state for a new match.
   */
  reset(): void {
    this.tick = 0;
    this.score = createScore();
    this.winner = null;
    this.scoredTimer = 0;

    for (const player of this.players) {
      player.reset();
    }

    for (const ball of this.balls) {
      ball.reset();
    }
  }

  /**
   * Start the countdown before play.
   */
  private startCountdown(): void {
    this.countdownSeconds = TIMING.COUNTDOWN_SECONDS;
    this.countdownTimer = 0;
    this.setState("countdown");
    this.emit({ type: "countdown", seconds: this.countdownSeconds });
  }

  /**
   * Pause the game.
   */
  pause(): void {
    if (this._state === "playing") {
      this.setState("paused");
    }
  }

  /**
   * Resume from pause.
   */
  resume(): void {
    if (this._state === "paused") {
      this.setState("playing");
    }
  }

  /**
   * Main update loop - call this each frame.
   */
  update(now: number, inputs: Map<number, PlayerInput>): void {
    // Handle state-specific updates
    switch (this._state) {
      case "countdown":
        this.updateCountdown(now);
        break;
      case "playing":
        this.updatePlaying(now, inputs);
        break;
      case "scored":
        this.updateScored(now);
        break;
      default:
        // menu, paused, gameOver - no updates
        break;
    }
  }

  /**
   * Update during countdown state.
   */
  private updateCountdown(now: number): void {
    // Initialize timer on first call
    if (this.countdownTimer === 0) {
      this.countdownTimer = now;
    }

    const elapsed = now - this.countdownTimer;
    const secondsElapsed = Math.floor(elapsed / 1000);

    if (secondsElapsed >= 1) {
      this.countdownSeconds--;
      this.countdownTimer = now;

      if (this.countdownSeconds <= 0) {
        this.setState("playing");
      } else {
        this.emit({ type: "countdown", seconds: this.countdownSeconds });
      }
    }
  }

  /**
   * Update during playing state.
   */
  private updatePlaying(now: number, inputs: Map<number, PlayerInput>): void {
    // Calculate physics steps
    const steps = calculatePhysicsSteps(this.physics, now);

    for (let i = 0; i < steps; i++) {
      this.tick++;
      this.fixedUpdate(now, inputs);
    }
  }

  /**
   * Fixed timestep update.
   */
  private fixedUpdate(now: number, inputs: Map<number, PlayerInput>): void {
    // Apply inputs to human players
    for (let i = 0; i < this.players.length; i++) {
      const player = this.players[i];
      const input = inputs.get(i) ?? createEmptyInput();

      if (!player.isRobot) {
        player.handleInput(input);
      }
    }

    // Update AI
    const teamHasBall = this.getTeamPossession();
    for (let i = 0; i < this.players.length; i++) {
      const player = this.players[i];
      if (player.isRobot) {
        const hasTheBall = teamHasBall === player.team;
        player.updateAI(this.balls, hasTheBall, now, this.config);
      }
    }

    // Update physics
    updatePhysics(this.players, this.balls, this.config, now);

    // Update caught ball positions
    updateCaughtBallPositions(this.players, this.balls);

    // Check collisions
    const collisionEvents = runCollisionDetection(this.players, this.balls);
    for (const event of collisionEvents) {
      this.emit({ type: "collision", event });
    }

    // Check goals
    const goalEvents = checkAllGoals(this.players, this.balls, this.config);
    if (goalEvents.length > 0) {
      this.score = applyGoals(
        goalEvents,
        this.score,
        this.balls,
        this.players
      );

      for (const event of goalEvents) {
        this.emit({ type: "goal", event });
      }

      // Check for winner
      const winner = checkWinCondition(this.score, this.config);
      if (winner !== null) {
        this.winner = winner;
        this.setState("gameOver");
        this.emit({ type: "gameOver", winner });
      } else {
        // Show scored state briefly
        this.scoredTimer = 0;
        this.setState("scored");
      }
    }
  }

  /**
   * Update during scored state (brief pause after goal).
   */
  private updateScored(now: number): void {
    if (this.scoredTimer === 0) {
      this.scoredTimer = now;
    }

    const elapsed = now - this.scoredTimer;
    if (elapsed >= TIMING.SCORED_DISPLAY_DURATION) {
      this.setState("playing");
    }
  }

  /**
   * Get which team has possession.
   */
  private getTeamPossession(): Team | null {
    return getTeamWithPossession(this.players, this.balls);
  }

  /**
   * Add an event listener.
   */
  on(listener: GameEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Emit an event to all listeners.
   */
  private emit(event: GameEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  /**
   * Get a snapshot of the current game state.
   */
  getSnapshot(): GameSnapshot {
    return {
      state: this._state,
      tick: this.tick,
      score: { ...this.score },
      players: this.players.map((p) => p.getState()),
      balls: this.balls.map((b) => b.getState()),
      countdownSeconds:
        this._state === "countdown" ? this.countdownSeconds : null,
      winner: this.winner,
      possession: this.getTeamPossession(),
    };
  }

  /**
   * Get current score.
   */
  getScore(): Score {
    return { ...this.score };
  }

  /**
   * Get all players.
   */
  getPlayers(): readonly Person[] {
    return this.players;
  }

  /**
   * Get all balls.
   */
  getBalls(): readonly Ball[] {
    return this.balls;
  }

  /**
   * Get the winner (null if game not over).
   */
  getWinner(): Team | null {
    return this.winner;
  }

  /**
   * Get current tick number.
   */
  getTick(): number {
    return this.tick;
  }

  /**
   * Get physics interpolation factor.
   */
  getInterpolation(): number {
    return this.physics.interpolation;
  }

  /**
   * Get countdown seconds remaining.
   */
  getCountdownSeconds(): number {
    return this.countdownSeconds;
  }

  /**
   * Set a player as human or AI.
   */
  setPlayerRobot(playerIndex: number, isRobot: boolean): void {
    const player = this.players[playerIndex];
    if (player) {
      player.isRobot = isRobot;
      if (isRobot) {
        player.setSmart(this.config.aiSmartValue);
      }
    }
  }

  /**
   * Set AI difficulty for all AI players.
   */
  setAIDifficulty(smartValue: number): void {
    for (const player of this.players) {
      if (player.isRobot) {
        player.setSmart(smartValue);
      }
    }
  }

  /**
   * Return to menu state.
   */
  returnToMenu(): void {
    this.setState("menu");
  }
}
