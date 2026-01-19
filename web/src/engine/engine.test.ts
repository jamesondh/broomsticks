import { describe, it, expect, beforeEach } from "vitest";
import {
  PHYSICS,
  DIMENSIONS,
  FIELD,
  DEFAULT_CONFIG,
  createConfig,
  FlyingObject,
  Ball,
  Person,
  Game,
  createPhysicsState,
  calculatePhysicsSteps,
  checkDistanceCollision,
  checkPlayerCollisions,
  checkPlayerBallCollisions,
  checkWinCondition,
  createScore,
  createEmptyInput,
  createInput,
  hasActiveInput,
  mergeInputs,
} from "./index";
import type { Bounds, Score } from "./types";

// Helper to create default bounds
function createBounds(): Bounds {
  return {
    minX: 0,
    maxX: FIELD.WIDTH,
    minY: 0,
    maxY: FIELD.HEIGHT - FIELD.GROUND_MARGIN,
  };
}

describe("FlyingObject", () => {
  let obj: FlyingObject;

  beforeEach(() => {
    obj = new FlyingObject({
      x: 100,
      y: 100,
      width: 10,
      height: 10,
      bounds: createBounds(),
    });
  });

  it("initializes with correct position", () => {
    expect(obj.x).toBe(100);
    expect(obj.y).toBe(100);
    expect(obj.vx).toBe(0);
    expect(obj.vy).toBe(0);
  });

  it("resets to initial position", () => {
    obj.x = 200;
    obj.y = 200;
    obj.vx = 5;
    obj.vy = 5;
    obj.reset();

    expect(obj.x).toBe(100);
    expect(obj.y).toBe(100);
    expect(obj.vx).toBe(0);
    expect(obj.vy).toBe(0);
  });

  it("applies gravity during move", () => {
    const initialVy = obj.vy;
    obj.move(PHYSICS.ORIGINAL_FRAME_TIME, DEFAULT_CONFIG);

    expect(obj.vy).toBeGreaterThan(initialVy);
    expect(obj.vy).toBeCloseTo(PHYSICS.GRAVITY);
  });

  it("caps terminal velocity", () => {
    obj.vy = PHYSICS.TERMINAL_VELOCITY - 0.05;
    obj.move(PHYSICS.ORIGINAL_FRAME_TIME, DEFAULT_CONFIG);

    expect(obj.vy).toBeLessThanOrEqual(PHYSICS.TERMINAL_VELOCITY + 0.1);
  });

  it("bounces off left wall", () => {
    obj.x = 0;
    obj.vx = -5;
    obj.move(PHYSICS.ORIGINAL_FRAME_TIME, DEFAULT_CONFIG);

    expect(obj.vx).toBe(5); // Reversed
    expect(obj.x).toBe(0); // Clamped
  });

  it("bounces off right wall", () => {
    obj.x = FIELD.WIDTH - obj.width;
    obj.vx = 5;
    obj.move(PHYSICS.ORIGINAL_FRAME_TIME, DEFAULT_CONFIG);

    expect(obj.vx).toBe(-5); // Reversed
  });

  it("bounces off ceiling", () => {
    obj.y = 0;
    obj.vy = -5;
    obj.move(PHYSICS.ORIGINAL_FRAME_TIME, DEFAULT_CONFIG);

    expect(obj.vy).toBeGreaterThan(0); // Reversed
    expect(obj.y).toBe(0); // Clamped
  });

  it("stops on ground", () => {
    const groundY = FIELD.HEIGHT - FIELD.GROUND_MARGIN - obj.height;
    obj.y = groundY + 1;
    obj.vx = 5;
    obj.vy = 5;
    obj.move(PHYSICS.ORIGINAL_FRAME_TIME, DEFAULT_CONFIG);

    expect(obj.vx).toBe(0);
    expect(obj.vy).toBe(0);
    expect(obj.y).toBe(groundY);
  });

  it("accelerates left", () => {
    obj.left();
    expect(obj.vx).toBe(-PHYSICS.ACCELERATION);
  });

  it("accelerates right", () => {
    obj.right();
    expect(obj.vx).toBe(PHYSICS.ACCELERATION);
  });

  it("accelerates up", () => {
    obj.up();
    expect(obj.vy).toBe(-PHYSICS.ACCELERATION);
  });

  it("accelerates down", () => {
    obj.down();
    expect(obj.vy).toBe(PHYSICS.ACCELERATION);
  });

  it("caps max speed", () => {
    for (let i = 0; i < 10; i++) {
      obj.left();
    }
    expect(obj.vx).toBe(-PHYSICS.MAX_SPEED);

    for (let i = 0; i < 20; i++) {
      obj.right();
    }
    expect(obj.vx).toBe(PHYSICS.MAX_SPEED);
  });

  it("calculates center coordinates", () => {
    expect(obj.centerX).toBe(105);
    expect(obj.centerY).toBe(105);
  });
});

describe("Ball", () => {
  let redBall: Ball;
  let blackBall: Ball;

  beforeEach(() => {
    redBall = new Ball({
      type: "red",
      x: 100,
      y: 100,
      bounds: createBounds(),
    });
    blackBall = new Ball({
      type: "black",
      x: 200,
      y: 100,
      bounds: createBounds(),
    });
  });

  it("red ball is catchable", () => {
    expect(redBall.isCatchable()).toBe(true);
    expect(redBall.isBumper()).toBe(false);
  });

  it("black ball is bumper", () => {
    expect(blackBall.isCatchable()).toBe(false);
    expect(blackBall.isBumper()).toBe(true);
  });

  it("tracks caught state", () => {
    expect(redBall.caught).toBe(false);

    redBall.setCaught(0);
    expect(redBall.caught).toBe(true);
    expect(redBall.caughtByIndex).toBe(0);
  });

  it("resets caught state", () => {
    redBall.setCaught(0);
    redBall.resetCaught();

    expect(redBall.caught).toBe(false);
    expect(redBall.caughtByIndex).toBe(null);
  });

  it("has correct dimensions", () => {
    expect(redBall.width).toBe(DIMENSIONS.BALL_WIDTH);
    expect(redBall.height).toBe(DIMENSIONS.BALL_HEIGHT);
  });

  it("returns correct point value", () => {
    expect(redBall.getPointValue(DEFAULT_CONFIG)).toBe(
      DEFAULT_CONFIG.pointsPerGoal
    );
  });
});

describe("Person", () => {
  let player: Person;

  beforeEach(() => {
    player = new Person({
      x: 100,
      y: 100,
      team: 0,
      model: 0,
      isRobot: false,
      bounds: createBounds(),
    });
  });

  it("initializes with correct properties", () => {
    expect(player.team).toBe(0);
    expect(player.model).toBe(0);
    expect(player.isRobot).toBe(false);
    expect(player.width).toBe(DIMENSIONS.PLAYER_WIDTH);
    expect(player.height).toBe(DIMENSIONS.PLAYER_HEIGHT);
  });

  it("handles input when not robot", () => {
    player.handleInput(createInput(true, false, false, false));
    expect(player.vy).toBe(-PHYSICS.ACCELERATION);
  });

  it("ignores input when robot", () => {
    player.isRobot = true;
    player.handleInput(createInput(true, false, false, false));
    expect(player.vy).toBe(0); // No change
  });

  it("toggles robot mode", () => {
    expect(player.isRobot).toBe(false);
    player.toggleRobot();
    expect(player.isRobot).toBe(true);
    player.toggleRobot();
    expect(player.isRobot).toBe(false);
  });

  it("adjusts smart value", () => {
    player.setSmart(15);
    expect(player.smart).toBe(15);

    player.smarter();
    expect(player.smart).toBe(10);

    player.dumber();
    expect(player.smart).toBe(15);
  });

  it("clamps smart value", () => {
    player.setSmart(0);
    expect(player.smart).toBe(1); // Min

    player.setSmart(100);
    expect(player.smart).toBe(30); // Max
  });

  it("switches model", () => {
    expect(player.model).toBe(0);
    player.switchModel();
    expect(player.model).toBe(1);

    // Wraps around
    for (let i = 0; i < 5; i++) {
      player.switchModel();
    }
    expect(player.model).toBe(1);
  });

  it("bumps player to ground", () => {
    player.y = 50; // In the air
    player.bump();

    // After bounds applied, should be at ground
    const groundY =
      FIELD.HEIGHT - FIELD.GROUND_MARGIN - DIMENSIONS.PLAYER_HEIGHT;
    expect(player.y).toBe(groundY);
  });

  it("gets facing direction", () => {
    expect(player.getFacingDirection()).toBe(0); // Team 0 faces right

    player.vx = 5;
    expect(player.getFacingDirection()).toBe(0); // Moving right

    player.vx = -5;
    expect(player.getFacingDirection()).toBe(1); // Moving left
  });
});

describe("Collision System", () => {
  it("detects distance collision", () => {
    expect(checkDistanceCollision(100, 100, 110, 110, 20)).toBe(true);
    expect(checkDistanceCollision(100, 100, 200, 200, 20)).toBe(false);
  });

  it("detects player-player collision", () => {
    const bounds = createBounds();
    const p1 = new Person({ x: 100, y: 100, team: 0, bounds });
    const p2 = new Person({ x: 110, y: 100, team: 1, bounds });

    const events = checkPlayerCollisions([p1, p2]);
    expect(events.length).toBe(0); // Same height, no bump

    // p2 is lower, should be bumped
    p2.y = 110;
    const events2 = checkPlayerCollisions([p1, p2]);
    expect(events2.length).toBe(1);
    expect(events2[0].type).toBe("player-player");
    expect(events2[0].bumpedPlayerIndex).toBe(1);
  });

  it("detects player catching ball", () => {
    const bounds = createBounds();
    const player = new Person({ x: 100, y: 100, team: 0, bounds });
    const ball = new Ball({ type: "red", x: 110, y: 110, bounds });

    const events = checkPlayerBallCollisions([player], [ball]);
    expect(events.length).toBe(1);
    expect(events[0].type).toBe("player-catch-ball");
    expect(ball.caught).toBe(true);
    expect(ball.caughtByIndex).toBe(0);
  });

  it("detects black ball bumping player", () => {
    const bounds = createBounds();
    const player = new Person({ x: 100, y: 50, team: 0, bounds });
    const ball = new Ball({ type: "black", x: 108, y: 58, bounds });

    const events = checkPlayerBallCollisions([player], [ball]);
    expect(events.length).toBe(1);
    expect(events[0].type).toBe("player-black-ball");
  });
});

describe("Scoring System", () => {
  it("checks win condition", () => {
    const config = createConfig({ winScore: 50 });

    let score: Score = { left: 40, right: 30 };
    expect(checkWinCondition(score, config)).toBe(null);

    score = { left: 50, right: 30 };
    expect(checkWinCondition(score, config)).toBe(0);

    score = { left: 30, right: 50 };
    expect(checkWinCondition(score, config)).toBe(1);
  });

  it("creates empty score", () => {
    const score = createScore();
    expect(score.left).toBe(0);
    expect(score.right).toBe(0);
  });
});

describe("Input System", () => {
  it("creates empty input", () => {
    const input = createEmptyInput();
    expect(input.up).toBe(false);
    expect(input.down).toBe(false);
    expect(input.left).toBe(false);
    expect(input.right).toBe(false);
    expect(input.pass).toBe(false);
  });

  it("creates input with values", () => {
    const input = createInput(true, false, true, false, true);
    expect(input.up).toBe(true);
    expect(input.down).toBe(false);
    expect(input.left).toBe(true);
    expect(input.right).toBe(false);
    expect(input.pass).toBe(true);
  });

  it("detects active input", () => {
    expect(hasActiveInput(createEmptyInput())).toBe(false);
    expect(hasActiveInput(createInput(true, false, false, false))).toBe(true);
  });

  it("merges inputs", () => {
    const a = createInput(true, false, true, false);
    const b = createInput(false, true, false, true);
    const merged = mergeInputs(a, b);

    expect(merged.up).toBe(true);
    expect(merged.down).toBe(true);
    expect(merged.left).toBe(true);
    expect(merged.right).toBe(true);
  });
});

describe("Physics State", () => {
  it("creates initial physics state", () => {
    const state = createPhysicsState();
    expect(state.accumulator).toBe(0);
    expect(state.lastTime).toBe(0);
    expect(state.interpolation).toBe(0);
  });

  it("calculates physics steps", () => {
    const state = createPhysicsState();

    // First call initializes
    let steps = calculatePhysicsSteps(state, 0);
    expect(steps).toBe(0);

    // After one frame time (use slightly more to ensure step triggers)
    steps = calculatePhysicsSteps(state, PHYSICS.FIXED_TIMESTEP + 1);
    expect(steps).toBe(1);

    // After enough time for two more steps
    const twoStepsLater = state.lastTime + PHYSICS.FIXED_TIMESTEP * 2 + 1;
    steps = calculatePhysicsSteps(state, twoStepsLater);
    expect(steps).toBe(2);
  });

  it("caps delta time to prevent spiral of death", () => {
    const state = createPhysicsState();
    calculatePhysicsSteps(state, 0); // Initialize

    // Huge time jump
    const steps = calculatePhysicsSteps(state, 1000);

    // Should be capped to MAX_DELTA worth of steps
    const maxSteps = Math.floor(PHYSICS.MAX_DELTA / PHYSICS.FIXED_TIMESTEP);
    expect(steps).toBeLessThanOrEqual(maxSteps);
  });
});

describe("Game", () => {
  let game: Game;

  beforeEach(() => {
    game = new Game();
  });

  it("initializes in menu state", () => {
    expect(game.state).toBe("menu");
  });

  it("creates players and balls", () => {
    expect(game.getPlayers().length).toBe(2);
    expect(game.getBalls().length).toBe(3); // 1 red + 2 black by default
  });

  it("starts game and enters countdown", () => {
    game.start();
    expect(game.state).toBe("countdown");
  });

  it("transitions through states correctly", () => {
    const events: string[] = [];
    game.on((e) => {
      if (e.type === "stateChange") {
        events.push(`${e.from}->${e.to}`);
      }
    });

    game.start();
    expect(events).toContain("menu->countdown");
  });

  it("tracks score", () => {
    const score = game.getScore();
    expect(score.left).toBe(0);
    expect(score.right).toBe(0);
  });

  it("gets snapshot", () => {
    const snapshot = game.getSnapshot();

    expect(snapshot.state).toBe("menu");
    expect(snapshot.tick).toBe(0);
    expect(snapshot.players.length).toBe(2);
    expect(snapshot.balls.length).toBe(3);
    expect(snapshot.winner).toBe(null);
  });

  it("can pause and resume", () => {
    game.start();

    // Simulate countdown completion
    for (let i = 0; i < 4000; i += 100) {
      game.update(i, new Map());
    }

    expect(game.state).toBe("playing");

    game.pause();
    expect(game.state).toBe("paused");

    game.resume();
    expect(game.state).toBe("playing");
  });

  it("sets player as robot", () => {
    expect(game.getPlayers()[0].isRobot).toBe(false);
    game.setPlayerRobot(0, true);
    expect(game.getPlayers()[0].isRobot).toBe(true);
  });

  it("returns to menu", () => {
    game.start();
    game.returnToMenu();
    expect(game.state).toBe("menu");
  });
});

describe("Config", () => {
  it("creates default config", () => {
    expect(DEFAULT_CONFIG.gravity).toBe(PHYSICS.GRAVITY);
    expect(DEFAULT_CONFIG.maxSpeed).toBe(PHYSICS.MAX_SPEED);
    expect(DEFAULT_CONFIG.winScore).toBe(50);
  });

  it("creates config with overrides", () => {
    const config = createConfig({ winScore: 100, maxSpeed: 10 });
    expect(config.winScore).toBe(100);
    expect(config.maxSpeed).toBe(10);
    expect(config.gravity).toBe(PHYSICS.GRAVITY); // Default unchanged
  });

  it("syncs AI smart value with difficulty", () => {
    const config = createConfig({ aiDifficulty: "expert" });
    expect(config.aiSmartValue).toBe(1); // Expert = 1
  });
});
