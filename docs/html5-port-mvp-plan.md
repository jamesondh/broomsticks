# Broomsticks HTML5 Port - Implementation Plan

A comprehensive phased implementation plan for porting Broomsticks to HTML5/TypeScript with PartyKit multiplayer.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Configuration System](#configuration-system)
- [Phase 1: Core Engine](#phase-1-core-engine)
- [Phase 2: Single Player](#phase-2-single-player)
- [Phase 3: Local Multiplayer](#phase-3-local-multiplayer)
- [Phase 4: Online Multiplayer (Room Codes)](#phase-4-online-multiplayer-room-codes)
- [Phase 5: 2v2 Mode & Passing](#phase-5-2v2-mode--passing)
- [Phase 6: GoldBall & Polish](#phase-6-goldball--polish)
- [Phase 7: Quick Play Matchmaking](#phase-7-quick-play-matchmaking)
- [Phase 8: Mobile & Capacitor](#phase-8-mobile--capacitor)
- [Asset Pipeline](#asset-pipeline)
- [Testing Strategy](#testing-strategy)
- [Deployment](#deployment)

---

## Overview

### Goals

1. **Preserve** the original Broomsticks gameplay feel
2. **Modernize** with responsive design, touch controls, and online multiplayer
3. **Configure** extensively — expose physics, rules, and visuals as adjustable parameters
4. **Scale** to mobile apps via Capacitor.js in the future

### Design Principles

- **Best of both versions**: Delta-time physics (C++), GoldBall (Java), passing (C++), sound (Java)
- **Highly configurable**: All gameplay constants exposed, shareable via URL params
- **Multiplayer-first architecture**: Deterministic physics, input-based netcode
- **Progressive enhancement**: Each phase produces a playable game

### Key Decisions

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| Rendering | PixiJS | Fast WebGL 2D, good mobile support |
| UI Framework | React | Already in project, good for menus/settings |
| Multiplayer | PartyKit | WebSocket rooms, hibernation, simple API |
| Mobile Controls | nipplejs | Virtual joystick, battle-tested |
| Physics | Fixed 60Hz timestep | Deterministic for netcode sync |
| State Architecture | Plain classes | Mirrors original, simple to port |

---

## Architecture

### Directory Structure

```
web/
├── src/
│   ├── engine/                 # Core game engine (framework-agnostic)
│   │   ├── config.ts           # Game configuration with defaults
│   │   ├── constants.ts        # Physics constants, dimensions
│   │   ├── types.ts            # TypeScript interfaces
│   │   ├── entities/
│   │   │   ├── FlyingObject.ts # Base class
│   │   │   ├── Person.ts       # Player (human or AI)
│   │   │   ├── Ball.ts         # Regular ball
│   │   │   └── GoldBall.ts     # Special ball (Phase 6)
│   │   ├── systems/
│   │   │   ├── Physics.ts      # Movement, gravity, bounds
│   │   │   ├── Collision.ts    # Detection and resolution
│   │   │   ├── Scoring.ts      # Goal detection, score tracking
│   │   │   ├── AI.ts           # Robot player behavior
│   │   │   └── Input.ts        # Input abstraction layer
│   │   └── Game.ts             # Main game loop, state machine
│   │
│   ├── renderer/               # PixiJS rendering layer
│   │   ├── GameRenderer.ts     # Main renderer, sprite management
│   │   ├── sprites/
│   │   │   ├── PlayerSprite.ts
│   │   │   ├── BallSprite.ts
│   │   │   └── FieldSprite.ts
│   │   ├── effects/
│   │   │   ├── ScoreFlash.ts
│   │   │   └── Particles.ts
│   │   └── ui/
│   │       ├── Scoreboard.ts
│   │       └── PlayerInfo.ts
│   │
│   ├── input/                  # Input handling
│   │   ├── KeyboardInput.ts    # Desktop keyboard
│   │   ├── GamepadInput.ts     # Controller support
│   │   ├── TouchInput.ts       # nipplejs integration
│   │   └── InputManager.ts     # Unified input interface
│   │
│   ├── audio/                  # Sound system
│   │   ├── AudioManager.ts     # Load, play, volume control
│   │   └── sounds.ts           # Sound effect definitions
│   │
│   ├── network/                # PartyKit multiplayer
│   │   ├── client.ts           # WebSocket client wrapper
│   │   ├── messages.ts         # Message type definitions
│   │   ├── prediction.ts       # Client-side prediction
│   │   ├── reconciliation.ts   # Server state reconciliation
│   │   └── lobby.ts            # Room management, matchmaking
│   │
│   ├── components/             # React UI components
│   │   ├── App.tsx             # Root component, routing
│   │   ├── screens/
│   │   │   ├── MainMenu.tsx
│   │   │   ├── GameScreen.tsx
│   │   │   ├── SettingsScreen.tsx
│   │   │   ├── LobbyScreen.tsx
│   │   │   └── ResultsScreen.tsx
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Slider.tsx
│   │   │   └── Modal.tsx
│   │   └── game/
│   │       ├── GameCanvas.tsx  # PixiJS mount point
│   │       └── TouchControls.tsx
│   │
│   ├── hooks/                  # React hooks
│   │   ├── useGame.ts          # Game instance management
│   │   ├── useInput.ts         # Input state
│   │   ├── useSettings.ts      # Config persistence
│   │   └── useMultiplayer.ts   # Network state
│   │
│   ├── utils/
│   │   ├── names.ts            # Random name generator
│   │   ├── roomCodes.ts        # Room code generation
│   │   └── stats.ts            # Local stats tracking
│   │
│   └── main.tsx                # Entry point
│
├── party/                      # PartyKit server
│   ├── index.ts                # Main party server
│   ├── game.ts                 # Server-side game simulation
│   ├── matchmaking.ts          # Quick Play queue
│   └── rooms.ts                # Room lifecycle management
│
├── public/
│   ├── sprites/                # Extracted from originals
│   │   ├── players/
│   │   ├── balls/
│   │   └── field/
│   └── audio/                  # From Java version
│       ├── score.wav
│       ├── catch.wav
│       ├── bump.wav
│       └── win.wav
│
└── partykit.json               # PartyKit configuration
```

### Game Loop Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     Fixed Timestep Loop                      │
│                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌────────┐  │
│  │  Input   │───▶│ Physics  │───▶│Collision │───▶│Scoring │  │
│  │ Collect  │    │  Update  │    │  Detect  │    │ Check  │  │
│  └──────────┘    └──────────┘    └──────────┘    └────────┘  │
│       │                                               │      │
│       │              60 Hz Fixed Step                 │      │
│       └───────────────────────────────────────────────┘      │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │              Render (requestAnimationFrame)          │    │
│  │   Interpolate positions between physics steps        │    │
│  └──────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

### Multiplayer Architecture

```
┌─────────────┐         ┌─────────────────┐         ┌─────────────┐
│   Client A  │         │  PartyKit Room  │         │   Client B  │
│             │         │   (Authority)   │         │             │
│ ┌─────────┐ │  Input  │ ┌─────────────┐ │  Input  │ ┌─────────┐ │
│ │  Input  │─┼────────▶│ │   Collect   │ │◀────────┼─│  Input  │ │
│ └─────────┘ │         │ │   Inputs    │ │         │ └─────────┘ │
│             │         │ └──────┬──────┘ │         │             │
│ ┌─────────┐ │         │        ▼        │         │ ┌─────────┐ │
│ │ Predict │ │         │ ┌─────────────┐ │         │ │ Predict │ │
│ │ Locally │ │         │ │  Simulate   │ │         │ │ Locally │ │
│ └─────────┘ │         │ │  (60 Hz)    │ │         │ └─────────┘ │
│             │  State  │ └──────┬──────┘ │  State  │             │
│ ┌─────────┐ │◀────────┼────────┴────────┼────────▶│ ┌─────────┐ │
│ │Reconcile│ │         │  Broadcast at   │         │ │Reconcile│ │
│ │  State  │ │         │  20 Hz (50ms)   │         │ │  State  │ │
│ └─────────┘ │         │                 │         │ └─────────┘ │
└─────────────┘         └─────────────────┘         └─────────────┘
```

---

## Technology Stack

### Runtime & Build

| Tool | Purpose |
|------|---------|
| Bun | Package manager, scripts, runtime |
| Vite | Build tool, dev server, HMR |
| TypeScript | Type safety, better DX |

### Frontend

| Library | Purpose | Version |
|---------|---------|---------|
| React | UI framework | 18.x |
| PixiJS | 2D WebGL rendering | 8.x |
| nipplejs | Virtual joystick | 0.10.x |
| Howler.js | Audio (Web Audio API wrapper) | 2.x |
| Zustand | Lightweight state management | 4.x |

### Multiplayer

| Service | Purpose |
|---------|---------|
| PartyKit | WebSocket rooms, server logic |
| Cloudflare Pages | Static hosting |

### Future (Phase 8)

| Tool | Purpose |
|------|---------|
| Capacitor.js | iOS/Android wrapper |
| @capacitor/haptics | Vibration feedback |
| @capacitor/preferences | Native storage |

---

## Configuration System

### Configuration Hierarchy

```
Defaults (constants.ts)
    ↓
localStorage (user preferences)
    ↓
URL params (shared/override)
    ↓
Room config (multiplayer host sets)
```

### Core Configuration Interface

```typescript
interface GameConfig {
  // Physics
  gravity: number;              // default: 0.1
  acceleration: number;         // default: 2.0
  maxSpeed: number;             // default: 6.0
  terminalVelocity: number;     // default: 2.0
  diveEnabled: boolean;         // default: true
  diveAcceleration: number;     // default: 3.0

  // Scoring
  winScore: number;             // default: 50
  pointsPerGoal: number;        // default: 10
  goalDetectionRadius: number;  // default: 20

  // Balls
  redBallCount: number;         // default: 1
  blackBallCount: number;       // default: 2
  goldBallEnabled: boolean;     // default: false (Phase 6)
  goldBallSpawnDelay: number;   // default: 30000 (ms)
  goldBallPoints: number;       // default: 150

  // Players
  playerCount: 2 | 4;           // default: 2
  passingEnabled: boolean;      // default: false (true in 2v2)

  // AI
  aiDifficulty: 'easy' | 'medium' | 'hard' | 'expert';
  aiSmartValue: number;         // derived from difficulty

  // Time
  timeLimit: number | null;     // default: null (no limit)

  // Visuals
  particlesEnabled: boolean;    // default: true
  screenShakeEnabled: boolean;  // default: true
  theme: string;                // default: 'classic'

  // Audio
  sfxEnabled: boolean;          // default: true
  sfxVolume: number;            // default: 0.7
}

// AI difficulty mapping
const AI_DIFFICULTY_MAP = {
  easy: 30,
  medium: 15,
  hard: 6,
  expert: 1
};
```

### URL Parameter Encoding

```typescript
// Example URL: ?g=0.1&s=6&w=50&r=1&b=2&ai=hard
const URL_PARAM_MAP = {
  g: 'gravity',
  a: 'acceleration',
  s: 'maxSpeed',
  w: 'winScore',
  r: 'redBallCount',
  b: 'blackBallCount',
  t: 'timeLimit',
  ai: 'aiDifficulty',
  p: 'playerCount',
  gold: 'goldBallEnabled'
};
```

### Mutator Presets

```typescript
const MUTATORS = {
  classic: {
    name: 'Classic',
    description: 'Original Broomsticks settings',
    config: { /* defaults */ }
  },
  chaos: {
    name: 'Chaos Mode',
    description: '3 gold balls, high speed, low gravity',
    config: {
      goldBallEnabled: true,
      goldBallCount: 3,
      maxSpeed: 10,
      gravity: 0.05
    }
  },
  precision: {
    name: 'Precision',
    description: 'Slow and methodical',
    config: {
      maxSpeed: 4,
      acceleration: 1,
      redBallCount: 1,
      blackBallCount: 0
    }
  },
  mayhem: {
    name: 'Mayhem',
    description: 'Maximum balls, maximum chaos',
    config: {
      redBallCount: 3,
      blackBallCount: 5,
      goldBallEnabled: true
    }
  }
};
```

---

## Phase 1: Core Engine

**Goal**: Implement the core game engine with physics, entities, and collision — no rendering yet.

### 1.1 Project Setup

- [x] Create `web/src/engine/` directory structure
- [x] Set up TypeScript config for strict mode
- [x] Add Vitest for unit testing
- [x] Create `constants.ts` with all physics/dimension constants

```typescript
// constants.ts
export const PHYSICS = {
  GRAVITY: 0.1,
  ACCELERATION: 2.0,
  MAX_SPEED: 6.0,
  TERMINAL_VELOCITY: 2.0,
  FIXED_TIMESTEP: 1000 / 60, // 16.67ms
  MAX_DELTA: 100 // prevent spiral of death
} as const;

export const DIMENSIONS = {
  PLAYER_WIDTH: 38,
  PLAYER_HEIGHT: 38,
  BALL_WIDTH: 16,
  BALL_HEIGHT: 16,
  GOLD_BALL_WIDTH: 8,
  GOLD_BALL_HEIGHT: 8,
  CATCH_RADIUS: 20,
  PLAYER_COLLISION_RADIUS: 28,
  GOAL_DETECTION_RADIUS: 20,
  BASKET_Y: 200,
  BASKET_LEFT_X: 17,
  BASKET_RIGHT_X_OFFSET: 17 // from right edge
} as const;
```

### 1.2 Entity Classes

- [x] Implement `FlyingObject` base class
  - Properties: x, y, vx, vy, width, height, minX, maxX, minY, maxY
  - Methods: move(dt), bounds(), left(), right(), up(), down()
- [x] Implement `Person` class extending `FlyingObject`
  - Properties: team, isRobot, smart, model, target, heldBall
  - Methods: handleInput(input), updateAI(balls, dt)
- [x] Implement `Ball` class extending `FlyingObject`
  - Properties: type ('red' | 'black' | 'gold'), caught, caughtBy, alive
  - Methods: autonomousMove(dt), resetCaught()

### 1.3 Physics System

- [x] Implement fixed-timestep game loop
  - Accumulator-based update
  - Interpolation factor for rendering
- [x] Implement gravity (applied when vy < terminalVelocity)
- [x] Implement boundary collision
  - Wall bounce: vx = -vx
  - Ceiling bounce: vy = -vy
  - Ground landing: vx = 0, vy = 0

```typescript
// Physics.ts
export function updatePhysics(entity: FlyingObject, dt: number, config: GameConfig): void {
  const scale = dt / PHYSICS.FIXED_TIMESTEP;

  entity.x += entity.vx * scale;
  entity.y += entity.vy * scale;

  // Gravity
  if (entity.vy < config.terminalVelocity) {
    entity.vy += config.gravity * scale;
  }

  // Bounds checking
  applyBounds(entity);
}
```

### 1.4 Collision System

- [x] Implement player-player collision (bump lower player)
- [x] Implement player-ball collision (catch/bump)
- [x] Implement ball catching mechanics
  - Red balls: catchable
  - Black balls: bump player
- [x] Implement ball position when held

### 1.5 Scoring System

- [x] Implement goal detection (ball within radius of basket)
- [x] Implement score tracking per team
- [x] Implement win condition check
- [x] Implement ball reset after goal

### 1.6 Input Abstraction

- [x] Define `PlayerInput` interface

```typescript
interface PlayerInput {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  pass: boolean;
  timestamp: number;
}
```

- [x] Implement input-to-action mapping
- [x] Support multiple input sources per player

### 1.7 Game State Machine

- [x] Implement game states: `menu`, `countdown`, `playing`, `paused`, `scored`, `gameOver`
- [x] Implement state transitions
- [x] Implement countdown timer (3-2-1-GO)

### 1.8 Unit Tests

- [x] Test FlyingObject movement and bounds
- [x] Test collision detection accuracy
- [x] Test goal detection edge cases
- [x] Test fixed-timestep consistency

**Deliverable**: A fully testable game engine that can be driven programmatically.

**Status**: ✅ **COMPLETE** - 54 unit tests passing, TypeScript strict mode enabled.

---

## Phase 2: Single Player

**Goal**: Playable single-player game with AI opponent, rendering, and audio.

### 2.1 Asset Extraction

- [ ] Extract player sprites from Java/C++ versions
  - 4 directional frames per model
  - Multiple models (at least 5)
- [ ] Extract ball sprites (red, black)
- [ ] Extract field/background images
- [ ] Extract basket/goal post sprites
- [ ] Copy audio files from Java version
  - score.wav, catch.wav, bump.wav, win.wav

### 2.2 PixiJS Renderer Setup

- [ ] Create `GameRenderer` class
- [ ] Set up PixiJS Application with proper resolution handling
- [ ] Implement dynamic canvas scaling (fit to container)
- [ ] Implement high-DPI support (devicePixelRatio)

### 2.3 Sprite Implementation

- [ ] Implement `PlayerSprite` class
  - Directional frame selection
  - Ground idle detection
  - Team color tinting (if using single sprite sheet)
- [ ] Implement `BallSprite` class
- [ ] Implement `FieldSprite` class (background, baskets)

### 2.4 UI Rendering (PixiJS)

- [ ] Implement scoreboard display
- [ ] Implement player info HUD (model, AI status)
- [ ] Implement countdown overlay
- [ ] Implement score flash effect
- [ ] Implement win screen overlay

### 2.5 AI Implementation

- [ ] Port AI logic from C++ version
- [ ] Implement 100ms decision interval (timer-based)
- [ ] Implement difficulty levels (easy/medium/hard/expert)
- [ ] Implement target ball selection

```typescript
// AI decision logic
function makeAIDecision(player: Person, balls: Ball[], config: GameConfig): PlayerInput {
  const choices = Math.floor(player.smart / 2) + 1;
  if (Math.random() * choices >= 1) {
    return { up: false, down: false, left: false, right: false, pass: false };
  }

  // Offensive: has ball, move toward goal
  if (player.heldBall) {
    return calculateOffensiveMove(player);
  }

  // Defensive: chase target ball
  return calculateDefensiveMove(player, player.target);
}
```

### 2.6 Keyboard Input

- [ ] Implement `KeyboardInput` class
- [ ] Default bindings: WASD (P1), Arrows (P2)
- [ ] Implement hybrid tap/hold with 150ms delay
- [ ] Track key state with timestamps

```typescript
class KeyboardInput {
  private keyDownTime: Map<string, number> = new Map();
  private readonly HOLD_DELAY = 150;

  isActive(key: string): boolean {
    const downTime = this.keyDownTime.get(key);
    if (!downTime) return false;

    const elapsed = performance.now() - downTime;
    // Immediate on first press, then continuous after delay
    return elapsed < 50 || elapsed > this.HOLD_DELAY;
  }
}
```

### 2.7 Audio System

- [ ] Implement `AudioManager` with Howler.js
- [ ] Load all sound effects
- [ ] Trigger sounds on events (score, catch, bump, win)
- [ ] Implement volume control
- [ ] Implement mute toggle

### 2.8 React Integration

- [ ] Create `GameCanvas` component (PixiJS mount)
- [ ] Create `MainMenu` screen
- [ ] Create `GameScreen` with canvas + HUD
- [ ] Create `ResultsScreen` (winner, stats, play again)
- [ ] Implement screen routing with state

### 2.9 Settings UI

- [ ] Create `SettingsScreen` component
- [ ] Implement difficulty selector
- [ ] Implement ball count sliders
- [ ] Implement win score input
- [ ] Implement SFX toggle and volume
- [ ] Persist settings to localStorage

### 2.10 Particle Effects

- [ ] Implement score explosion particles
- [ ] Implement catch sparkle effect
- [ ] Implement screen shake on bump (configurable)
- [ ] Add toggle in settings

**Deliverable**: Fully playable single-player game against AI.

---

## Phase 3: Local Multiplayer

**Goal**: Two players on same device with split keyboard controls.

### 3.1 Multi-Input Support

- [ ] Support two keyboard input instances
- [ ] Bind P1 to WASD, P2 to Arrow keys
- [ ] Show control hints on game screen

### 3.2 Key Rebinding

- [ ] Create key rebinding UI in settings
- [ ] Implement key capture modal
- [ ] Prevent duplicate bindings
- [ ] Persist bindings to localStorage

### 3.3 Gamepad Support

- [ ] Implement `GamepadInput` class using Gamepad API
- [ ] Map d-pad/left stick to movement
- [ ] Map A/B buttons to actions
- [ ] Support multiple gamepads (P1, P2)
- [ ] Show gamepad connection status

### 3.4 Local Stats

- [ ] Track wins, losses, goals scored
- [ ] Store in localStorage
- [ ] Display on main menu
- [ ] Add "Reset Stats" option

**Deliverable**: Two players can compete on same keyboard or with gamepads.

---

## Phase 4: Online Multiplayer (Room Codes)

**Goal**: 1v1 online multiplayer with private room codes via PartyKit.

### 4.1 PartyKit Server Setup

- [ ] Initialize PartyKit project in `party/`
- [ ] Create `partykit.json` configuration
- [ ] Implement basic room lifecycle (connect, disconnect)

### 4.2 Message Protocol

- [ ] Define message types

```typescript
// messages.ts
type ClientMessage =
  | { type: 'join'; name: string }
  | { type: 'ready' }
  | { type: 'input'; input: PlayerInput; tick: number }
  | { type: 'leave' };

type ServerMessage =
  | { type: 'joined'; playerId: string; roomCode: string }
  | { type: 'playerJoined'; name: string; playerId: string }
  | { type: 'playerLeft'; playerId: string }
  | { type: 'countdown'; seconds: number }
  | { type: 'gameStart'; config: GameConfig; seed: number }
  | { type: 'state'; state: GameState; tick: number }
  | { type: 'gameOver'; winner: string; stats: GameStats };
```

### 4.3 Server-Side Game Logic

- [ ] Port game engine to run on server
- [ ] Implement input collection from both clients
- [ ] Run authoritative simulation at 60Hz
- [ ] Broadcast state at 20Hz (every 3 ticks)

### 4.4 Room Code System

- [ ] Implement 4-character room code generation
- [ ] Ensure uniqueness across active rooms
- [ ] Implement room code validation

```typescript
// roomCodes.ts
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 0, 1

export function generateRoomCode(): string {
  return Array.from({ length: 4 }, () =>
    CHARS[Math.floor(Math.random() * CHARS.length)]
  ).join('');
}
```

### 4.5 Random Name Generator

- [ ] Create adjective + noun name generator
- [ ] Ensure family-friendly combinations
- [ ] Add number suffix for uniqueness

```typescript
// names.ts
const ADJECTIVES = ['Swift', 'Golden', 'Mystic', 'Cosmic', 'Blazing', ...];
const NOUNS = ['Broom', 'Seeker', 'Chaser', 'Keeper', 'Snitch', ...];

export function generatePlayerName(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 100);
  return `${adj}${noun}${num}`;
}
```

### 4.6 Client-Side Prediction

- [ ] Implement local input prediction
- [ ] Buffer inputs with tick numbers
- [ ] Implement state reconciliation on server update

```typescript
// prediction.ts
class PredictionBuffer {
  private inputs: Map<number, PlayerInput> = new Map();

  addInput(tick: number, input: PlayerInput): void {
    this.inputs.set(tick, input);
  }

  reconcile(serverTick: number, serverState: GameState): GameState {
    // Remove acknowledged inputs
    for (const [tick] of this.inputs) {
      if (tick <= serverTick) this.inputs.delete(tick);
    }

    // Replay unacknowledged inputs
    let state = serverState;
    for (const [tick, input] of this.inputs) {
      state = applyInput(state, input);
    }
    return state;
  }
}
```

### 4.7 Lobby UI

- [ ] Create `LobbyScreen` component
- [ ] Implement "Create Room" flow
  - Generate room code
  - Show waiting state with code to share
- [ ] Implement "Join Room" flow
  - Room code input
  - Validation and error handling
- [ ] Implement ready-up system
- [ ] Show opponent name when joined

### 4.8 Practice Mode While Waiting

- [ ] Allow solo ball hitting while waiting
- [ ] Clear practice state when opponent joins
- [ ] Visual indicator of practice mode

### 4.9 Reconnection Handling

- [ ] Detect disconnection (WebSocket close)
- [ ] Implement 10-second reconnect window
- [ ] Show reconnecting UI
- [ ] Replace with AI if timeout exceeded
- [ ] Notify remaining player

### 4.10 Room Persistence for Rematches

- [ ] Keep room alive after game ends
- [ ] Implement "Play Again" that reuses room
- [ ] Reset game state but keep players
- [ ] Room expires after 5 minutes of inactivity

### 4.11 Config Sync

- [ ] Host configures game settings in lobby
- [ ] Sync config to joining player
- [ ] Display config summary in lobby

**Deliverable**: Two players can create/join private rooms and play online.

---

## Phase 5: 2v2 Mode & Passing

**Goal**: Four-player team mode with ball passing mechanics.

### 5.1 Team System

- [ ] Extend game state for 4 players (2 per team)
- [ ] Implement team color assignments
- [ ] Update collision to skip teammates

### 5.2 Passing Mechanic

- [ ] Add pass button to input
- [ ] Calculate pass direction to teammate
- [ ] Implement pass velocity (8.0, normalized)
- [ ] Ball travels in straight line during pass
- [ ] Pass interrupted if ball hits ground/wall

```typescript
function executePass(player: Person, teammate: Person, ball: Ball): void {
  const dx = teammate.x - player.x;
  const dy = teammate.y - player.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  ball.vx = (dx / dist) * 8.0;
  ball.vy = (dy / dist) * 8.0;
  ball.isPass = true;
  ball.caughtBy = null;
  player.heldBall = null;
}
```

### 5.3 2v2 Input Bindings

- [ ] Add P3 bindings: IJKL + U (pass)
- [ ] Add P4 bindings: Numpad 8456 + Numpad 0 (pass)
- [ ] Support 4 gamepads

### 5.4 2v2 Online Support

- [ ] Extend room to support 4 players
- [ ] Team assignment (first 2 = team A, second 2 = team B)
- [ ] Or: allow teams to form (invite teammate)
- [ ] Wait for 4 players before start

### 5.5 AI Teammates

- [ ] AI can be assigned to unfilled slots
- [ ] AI uses passing when appropriate
- [ ] Different AI for defensive vs offensive positioning

### 5.6 UI Updates

- [ ] 4-player scoreboard layout
- [ ] Team-based score display
- [ ] Pass indicator (show pass target)

**Deliverable**: Full 2v2 mode with passing, local and online.

---

## Phase 6: GoldBall & Polish

**Goal**: Implement GoldBall special mechanic and overall polish.

### 6.1 GoldBall Entity

- [ ] Implement `GoldBall` class extending `Ball`
- [ ] Smaller size (8x8)
- [ ] Higher speed (2x maxSpeed, 2x accel)
- [ ] Worth 150 points

### 6.2 GoldBall AI

- [ ] Implement flee behavior
- [ ] Detect nearby players (within 100px)
- [ ] Move away from closest player
- [ ] More erratic movement pattern

```typescript
function goldBallAI(ball: GoldBall, players: Person[]): void {
  const nearbyPlayers = players.filter(p =>
    Math.abs(p.x - ball.x) < 100 && Math.abs(p.y - ball.y) < 100
  );

  if (nearbyPlayers.length > 0) {
    const closest = nearbyPlayers[0];
    if (closest.x < ball.x) ball.right();
    else ball.left();
    if (closest.y < ball.y) ball.down();
    else ball.up();
  }
}
```

### 6.3 GoldBall Spawning

- [ ] Timer-based spawn (configurable, default 30s)
- [ ] Visual timer bar indicator
- [ ] Spawn announcement effect
- [ ] Only one GoldBall at a time

### 6.4 GoldBall Sprite

- [ ] Extract/create gold ball sprite
- [ ] Add glow/shimmer effect
- [ ] Distinct visual from regular balls

### 6.5 Polish: Animations

- [ ] Implement player animation frames
- [ ] Direction-based frame selection
- [ ] Ground idle frame
- [ ] Configurable animation speed

### 6.6 Polish: Visual Effects

- [ ] Goal explosion particles
- [ ] GoldBall spawn effect
- [ ] GoldBall catch celebration
- [ ] Improved score flash

### 6.7 Polish: Audio

- [ ] Add GoldBall-specific sounds
- [ ] Ambient crowd noise (optional)
- [ ] Victory fanfare

### 6.8 Polish: UI

- [ ] Improved main menu design
- [ ] Loading screen
- [ ] Transitions between screens
- [ ] Tooltips for settings

**Deliverable**: Complete feature set with polished presentation.

---

## Phase 7: Quick Play Matchmaking

**Goal**: Automatic matchmaking for finding opponents.

### 7.1 Matchmaking Queue (Server)

- [ ] Implement queue data structure in PartyKit
- [ ] Player joins queue with preferences (1v1 vs 2v2)
- [ ] Match when 2 (or 4) players available
- [ ] Create room and notify matched players

```typescript
// matchmaking.ts (PartyKit)
interface QueueEntry {
  connectionId: string;
  name: string;
  mode: '1v1' | '2v2';
  joinedAt: number;
}

class MatchmakingQueue {
  private queue: QueueEntry[] = [];

  add(entry: QueueEntry): void {
    this.queue.push(entry);
    this.tryMatch();
  }

  private tryMatch(): void {
    const oneVOne = this.queue.filter(e => e.mode === '1v1');
    if (oneVOne.length >= 2) {
      const [p1, p2] = oneVOne.slice(0, 2);
      this.createMatch([p1, p2]);
    }
  }
}
```

### 7.2 Queue UI

- [ ] "Quick Play" button on main menu
- [ ] Mode selection (1v1 / 2v2)
- [ ] Queue status display (searching...)
- [ ] Estimated wait time (if available)
- [ ] Cancel button

### 7.3 Queue Timeout

- [ ] 30-second timeout
- [ ] Prompt: "No players found. Play vs AI?"
- [ ] Option to keep waiting
- [ ] Option to create private room instead

### 7.4 Queue Fairness

- [ ] FIFO matching (first in, first matched)
- [ ] Future: region preference (store in queue entry)
- [ ] Future: skill-based (track wins in localStorage, send to server)

### 7.5 Seamless Transition

- [ ] Match found notification
- [ ] Auto-join created room
- [ ] Show opponent name
- [ ] Quick countdown (3 seconds)

**Deliverable**: Players can find random opponents automatically.

---

## Phase 8: Mobile & Capacitor

**Goal**: Prepare for iOS/Android builds with Capacitor.

### 8.1 Touch Controls (nipplejs)

- [ ] Implement `TouchInput` class
- [ ] Left side: virtual joystick (movement)
- [ ] Right side: tap zones for actions
- [ ] Joystick sensitivity tuning

```typescript
// TouchInput.ts
import nipplejs from 'nipplejs';

class TouchInput {
  private joystick: nipplejs.JoystickManager;
  private direction: { x: number; y: number } = { x: 0, y: 0 };

  constructor(container: HTMLElement) {
    this.joystick = nipplejs.create({
      zone: container.querySelector('.joystick-zone'),
      mode: 'static',
      position: { left: '80px', bottom: '80px' },
      color: 'white',
      size: 120
    });

    this.joystick.on('move', (_, data) => {
      this.direction = data.vector;
    });

    this.joystick.on('end', () => {
      this.direction = { x: 0, y: 0 };
    });
  }

  getInput(): PlayerInput {
    const threshold = 0.3;
    return {
      up: this.direction.y < -threshold,
      down: this.direction.y > threshold,
      left: this.direction.x < -threshold,
      right: this.direction.x > threshold,
      pass: false
    };
  }
}
```

### 8.2 Responsive Layout

- [ ] Detect mobile viewport
- [ ] Adjust canvas size for mobile
- [ ] Position touch controls appropriately
- [ ] Handle orientation changes
- [ ] Safe area insets (notch, home indicator)

### 8.3 Touch Control UI

- [ ] Create `TouchControls` React component
- [ ] Show joystick zone overlay
- [ ] Show action button zones
- [ ] Visual feedback on touch

### 8.4 Platform Detection

- [ ] Detect platform (desktop/mobile/tablet)
- [ ] Auto-select appropriate input method
- [ ] Hide irrelevant UI (no gamepad prompts on mobile)

### 8.5 Capacitor Setup

- [ ] Add Capacitor to project
- [ ] Configure iOS project
- [ ] Configure Android project
- [ ] Test in simulators

### 8.6 Native Plugins

- [ ] Add @capacitor/haptics for vibration
- [ ] Vibrate on score, catch, bump
- [ ] Add @capacitor/preferences for native storage
- [ ] Migrate localStorage usage

### 8.7 App Store Preparation

- [ ] App icons (all sizes)
- [ ] Splash screens
- [ ] App Store screenshots
- [ ] Privacy policy (no data collected)

**Deliverable**: Web app works great on mobile, ready for Capacitor builds.

---

## Asset Pipeline

### Sprite Extraction

1. **Source**: `archive/broomsticks1-java/images/` and `archive/broomsticks2-cpp/imgs/`
2. **Process**:
   - Extract player sprite sheets
   - Upscale 2x with nearest-neighbor (preserve pixel art)
   - Convert to PNG with transparency
   - Organize by model number

### Audio Extraction

1. **Source**: `archive/broomsticks1-java/sounds/`
2. **Files needed**:
   - `score.wav` - Goal scored
   - `catch.wav` - Ball caught
   - `bump.wav` - Player collision
   - `win.wav` - Game won
3. **Process**:
   - Convert to MP3 and OGG (Howler.js compatibility)
   - Normalize volume levels

### Asset Loading

```typescript
// Preload all assets before game start
async function loadAssets(): Promise<void> {
  await Promise.all([
    PIXI.Assets.load([
      '/sprites/players/sheet.png',
      '/sprites/balls/red.png',
      '/sprites/balls/black.png',
      '/sprites/balls/gold.png',
      '/sprites/field/background.png',
      '/sprites/field/basket.png'
    ]),
    audioManager.loadAll([
      '/audio/score.mp3',
      '/audio/catch.mp3',
      '/audio/bump.mp3',
      '/audio/win.mp3'
    ])
  ]);
}
```

---

## Testing Strategy

### Unit Tests (Vitest)

```typescript
// Physics tests
describe('Physics', () => {
  it('applies gravity correctly', () => {
    const entity = new FlyingObject({ x: 100, y: 100, vx: 0, vy: 0 });
    updatePhysics(entity, PHYSICS.FIXED_TIMESTEP, defaultConfig);
    expect(entity.vy).toBeCloseTo(0.1);
  });

  it('caps terminal velocity', () => {
    const entity = new FlyingObject({ x: 100, y: 100, vx: 0, vy: 1.95 });
    updatePhysics(entity, PHYSICS.FIXED_TIMESTEP, defaultConfig);
    expect(entity.vy).toBeLessThanOrEqual(2.0);
  });

  it('bounces off walls', () => {
    const entity = new FlyingObject({ x: 0, y: 100, vx: -5, vy: 0 });
    entity.minX = 0;
    applyBounds(entity);
    expect(entity.vx).toBe(5);
  });
});

// Collision tests
describe('Collision', () => {
  it('detects player-ball collision', () => {
    const player = new Person({ x: 100, y: 100 });
    const ball = new Ball({ x: 110, y: 110 });
    expect(checkCollision(player, ball, 20)).toBe(true);
  });

  it('does not detect distant objects', () => {
    const player = new Person({ x: 100, y: 100 });
    const ball = new Ball({ x: 200, y: 200 });
    expect(checkCollision(player, ball, 20)).toBe(false);
  });
});

// Scoring tests
describe('Scoring', () => {
  it('detects goal on left basket', () => {
    const ball = new Ball({ x: 15, y: 200 });
    expect(checkGoal(ball, 640, 480)).toBe('left');
  });
});
```

### Integration Tests

```typescript
// Game flow tests
describe('Game Flow', () => {
  it('transitions through states correctly', async () => {
    const game = new Game(defaultConfig);
    expect(game.state).toBe('menu');

    game.start();
    expect(game.state).toBe('countdown');

    await waitFor(() => game.state === 'playing');
    expect(game.state).toBe('playing');
  });

  it('ends game when win score reached', () => {
    const game = new Game({ ...defaultConfig, winScore: 10 });
    game.start();
    game.score('left', 10);
    expect(game.state).toBe('gameOver');
    expect(game.winner).toBe('left');
  });
});
```

### Multiplayer Tests

```typescript
// Mock PartyKit for testing
describe('Multiplayer', () => {
  it('synchronizes state between clients', async () => {
    const room = new MockPartyRoom();
    const client1 = new GameClient(room);
    const client2 = new GameClient(room);

    await client1.join('Player1');
    await client2.join('Player2');

    client1.sendInput({ up: true, ... });
    await room.tick();

    expect(client1.state.players[0].vy).toBeLessThan(0);
    expect(client2.state.players[0].vy).toBeLessThan(0);
  });
});
```

---

## Deployment

### Cloudflare Pages (Frontend)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: cd web && bun install

      - name: Build
        run: cd web && bun run build

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: broomsticks
          directory: web/dist
```

### PartyKit (Multiplayer Server)

```bash
# Deploy PartyKit
cd web/party
npx partykit deploy
```

```json
// partykit.json
{
  "name": "broomsticks",
  "main": "party/index.ts",
  "compatibilityDate": "2024-01-01"
}
```

### Environment Variables

```bash
# .env (local development)
VITE_PARTYKIT_HOST=localhost:1999

# Production (set in Cloudflare Pages)
VITE_PARTYKIT_HOST=broomsticks.partykit.dev
```

---

## Timeline Summary

| Phase | Description | Dependencies |
|-------|-------------|--------------|
| 1 | Core Engine | None |
| 2 | Single Player | Phase 1 |
| 3 | Local Multiplayer | Phase 2 |
| 4 | Online Multiplayer | Phase 3 |
| 5 | 2v2 Mode & Passing | Phase 4 |
| 6 | GoldBall & Polish | Phase 5 |
| 7 | Quick Play | Phase 4 |
| 8 | Mobile & Capacitor | Phase 2+ |

**Note**: Phase 7 (Quick Play) can be developed in parallel with Phases 5-6 since it primarily extends Phase 4's networking.

---

## Appendix: Reference Constants

```typescript
// All constants in one place for easy tuning

export const CONFIG_DEFAULTS: GameConfig = {
  // Physics
  gravity: 0.1,
  acceleration: 2.0,
  maxSpeed: 6.0,
  terminalVelocity: 2.0,
  diveEnabled: true,
  diveAcceleration: 3.0,

  // Scoring
  winScore: 50,
  pointsPerGoal: 10,
  goalDetectionRadius: 20,

  // Balls
  redBallCount: 1,
  blackBallCount: 2,
  goldBallEnabled: false,
  goldBallSpawnDelay: 30000,
  goldBallPoints: 150,

  // Players
  playerCount: 2,
  passingEnabled: false,

  // AI
  aiDifficulty: 'medium',
  aiSmartValue: 15,

  // Time
  timeLimit: null,

  // Visuals
  particlesEnabled: true,
  screenShakeEnabled: true,
  theme: 'classic',

  // Audio
  sfxEnabled: true,
  sfxVolume: 0.7
};

export const AI_DIFFICULTY_MAP = {
  easy: 30,
  medium: 15,
  hard: 6,
  expert: 1
} as const;

export const DIMENSIONS = {
  PLAYER_WIDTH: 38,
  PLAYER_HEIGHT: 38,
  BALL_WIDTH: 16,
  BALL_HEIGHT: 16,
  GOLD_BALL_WIDTH: 8,
  GOLD_BALL_HEIGHT: 8,
  CATCH_RADIUS: 20,
  PLAYER_COLLISION_RADIUS: 28,
  GOAL_DETECTION_RADIUS: 20,
  BASKET_Y: 200
} as const;

export const PHYSICS = {
  FIXED_TIMESTEP: 1000 / 60,
  MAX_DELTA: 100,
  HOLD_DELAY: 150
} as const;

export const NETWORK = {
  STATE_BROADCAST_RATE: 50, // ms (20 Hz)
  RECONNECT_TIMEOUT: 10000, // ms
  MATCHMAKING_TIMEOUT: 30000 // ms
} as const;
```
