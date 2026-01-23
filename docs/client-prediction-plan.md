# Client Prediction Implementation Plan

This document outlines a phased approach to implementing client-side prediction for the Broomsticks multiplayer mode. Each phase is designed to be independently testable, with clear expected behaviors documented to allow for course-correction.

## Table of Contents

1. [Background: Current Problems](#background-current-problems)
2. [Architecture Overview](#architecture-overview)
3. [Phase 1: Settings Sync](#phase-1-settings-sync)
4. [Phase 2: Simulation Tick Counter](#phase-2-simulation-tick-counter)
5. [Phase 3: Tick-Based Gold Timer](#phase-3-tick-based-gold-timer)
6. [Phase 4: Deterministic Randomness](#phase-4-deterministic-randomness)
7. [Phase 5: Tick-Stamped Input Events](#phase-5-tick-stamped-input-events)
8. [Phase 6: Client-Side Simulation](#phase-6-client-side-simulation)
9. [Phase 7: Rollback Reconciliation](#phase-7-rollback-reconciliation)
10. [Phase 8: Render Interpolation](#phase-8-render-interpolation)

---

## Background: Current Problems

### Why it jitters today

1. **Client skips physics entirely** (`Game.js:239-242`)
   - When `networkMode === NetworkMode.CLIENT`, the game loop skips `moveFlyers()`, `checkCollisions()`, etc.
   - Positions only update when `applyNetworkState()` is called via the `onStateReceived` callback

2. **State arrives at 20Hz** (`NetworkManager.js:9`)
   - `STATE_BROADCAST_INTERVAL = 50ms` means snapshots arrive ~every 3 frames at 60fps
   - Between snapshots, objects appear frozen, causing visible stepping

3. **Position rounding loses precision** (`StateSerializer.js:12-15`)
   - Positions are rounded to 0.1: `Math.round(player.x * 10) / 10`
   - This adds quantization error on every snapshot

4. **No determinism** - Multiple sources of non-determinism make prediction impossible:
   - `Ball.js:24`: `Math.floor(Math.random() * 40) - 20`
   - `GoldBall.js:31`: `Math.floor(Math.random() * this.smart)`
   - `Person.js:37`: `Math.floor(Math.random() * this.smart * 2) - this.smart`
   - `PhysicsManager.js:183`: `Date.now() - startTime` for gold timer

5. **Settings not synced** (`Game.js:415-426`)
   - `onGameStart()` calls `initGameObjects()` on both machines
   - But host never sends settings - clients could have different `accel`, `maxSpeed`, `redBalls`, etc.
   - This causes immediate divergence even with perfect prediction

### Files involved

| File | Role | Lines of Interest |
|------|------|-------------------|
| `Game.js` | Main game class, state machine | 239-270 (game loop), 459-478 (applyNetworkState) |
| `NetworkManager.js` | WebSocket client | 9 (broadcast interval), 170-179 (state broadcast) |
| `StateSerializer.js` | State serialization | 11-36 (serialize), 45-82 (apply) |
| `Ball.js` | Ball physics | 24 (Math.random) |
| `GoldBall.js` | Gold ball AI | 31 (Math.random) |
| `Person.js` | Player/AI | 37 (Math.random for AI) |
| `PhysicsManager.js` | Collision/scoring | 183 (Date.now for gold timer) |
| `InputHandler.js` | Keyboard input | 75-78 (client input), 176-192 (sendInput) |
| `FlyingObject.js` | Base physics | 21-34 (move method) |
| `GameConstants.js` | Config | 19 (UPDATE_INTERVAL = 30ms) |
| `partykit/server.ts` | Server | 224-233 (state relay), 235-247 (input relay) |

---

## Architecture Overview

### Target architecture: Host-authoritative with client prediction + rollback

```
┌─────────────────────────────────────────────────────────────────┐
│                           HOST                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │ Local Input  │─▶│  Simulation  │─▶│ State Broadcast (20Hz) │ │
│  └──────────────┘  │  (30ms tick) │  └────────────────────────┘ │
│         ▲          └──────────────┘              │               │
│         │                 ▲                      │               │
│  ┌──────────────┐         │                      │               │
│  │ Remote Input │─────────┘                      │               │
│  │ (from client)│                                │               │
│  └──────────────┘                                │               │
└──────────────────────────────────────────────────│───────────────┘
                                                   │
                                                   ▼
┌──────────────────────────────────────────────────│───────────────┐
│                          CLIENT                  │               │
│  ┌──────────────┐  ┌──────────────┐         ┌────▼─────────────┐ │
│  │ Local Input  │─▶│  Simulation  │◀────────│ Authoritative    │ │
│  └──────────────┘  │  (predicted) │         │ Snapshots        │ │
│         │          └──────────────┘         └──────────────────┘ │
│         │                 │                         │            │
│         │                 ▼                         │            │
│         │          ┌──────────────┐                 │            │
│         │          │   Rollback   │◀────────────────┘            │
│         │          │   & Resim    │                              │
│         │          └──────────────┘                              │
│         │                 │                                      │
│         └────────────────▶│                                      │
│                           ▼                                      │
│                    ┌──────────────┐                              │
│                    │   Renderer   │                              │
│                    │ (interpolate)│                              │
│                    └──────────────┘                              │
└──────────────────────────────────────────────────────────────────┘
```

### Key principles

1. **Client runs full simulation** - Same physics as host, every tick
2. **Deterministic simulation** - Given same inputs + seed, produces same output
3. **Snapshots become corrections** - Not the primary driver of motion
4. **Minimal rollback** - With good determinism, corrections should be rare/small

---

## Phase 1: Settings Sync

### Goal
Ensure host and client start with identical game configuration.

### Current behavior
- Host calls `initGameObjects()` with local `this.settings`
- Client calls `initGameObjects()` with its own local `this.settings`
- No settings are transmitted in the `gameStart` message
- If settings differ, immediate desync

### Changes required

#### 1.1 Define settings payload type
Add to `partykit/server.ts` `GameConfig` interface:

```typescript
interface GameConfig {
  hostId: string;
  settings: {
    dive: boolean;
    accel: number;
    maxSpeed: number;
    redBalls: number;
    blackBalls: number;
    goldBalls: number;
    goldPoints: number;
    duration: number;
    winScore: number;
    // Note: playerImg and bgImg are visual-only, not needed for sync
  };
}
```

#### 1.2 Host sends settings in gameStart request
In `NetworkManager.js`, modify `requestGameStart()`:

```javascript
requestGameStart() {
    if (this.isHost) {
        const settings = {
            dive: this.game.settings.dive,
            accel: this.game.settings.accel,
            maxSpeed: this.game.settings.maxSpeed,
            redBalls: this.game.settings.redBalls,
            blackBalls: this.game.settings.blackBalls,
            goldBalls: this.game.settings.goldBalls,
            goldPoints: this.game.settings.goldPoints,
            duration: this.game.settings.duration,
            winScore: this.game.settings.winScore
        };
        this.send({ type: 'gameStart', settings });
    }
}
```

#### 1.3 Server includes settings in broadcast
In `partykit/server.ts`, modify `handleGameStart()`:

```typescript
handleGameStart(conn: Party.Connection, settings?: GameSettings) {
    // ... existing validation ...

    this.broadcast(JSON.stringify({
        type: "gameStart",
        config: {
            hostId: this.hostId,
            settings: settings  // Pass through from host
        }
    } as ServerMessage));
}
```

#### 1.4 Client applies settings before init
In `Game.js`, modify `onGameStart()`:

```javascript
onGameStart(config) {
    console.log('[Game] Game starting, host:', config.hostId);

    // Apply host settings (client only)
    if (this.networkMode === NetworkMode.CLIENT && config.settings) {
        // Merge simulation-affecting settings
        this.settings.dive = config.settings.dive;
        this.settings.accel = config.settings.accel;
        this.settings.maxSpeed = config.settings.maxSpeed;
        this.settings.redBalls = config.settings.redBalls;
        this.settings.blackBalls = config.settings.blackBalls;
        this.settings.goldBalls = config.settings.goldBalls;
        this.settings.goldPoints = config.settings.goldPoints;
        this.settings.duration = config.settings.duration;
        this.settings.winScore = config.settings.winScore;
    }

    // Initialize game objects (now with synced settings)
    this.initGameObjects();

    // ... rest unchanged ...
}
```

### Expected behavior after Phase 1

| Test Case | Expected Result |
|-----------|-----------------|
| Host has redBalls=2, client has redBalls=1 | Client should have 2 red balls after game start |
| Host has accel=3, client has accel=1 | Client player should accelerate at rate 3 |
| Host has goldBalls=1, duration=30 | Client should spawn gold ball after 30s |
| Console log on client | Should show "Applying host settings: {dive: true, accel: 2, ...}" |

### How to verify
1. Open two browser windows
2. In host window: change settings (e.g., redBalls=2, blackBalls=3)
3. In client window: have different settings
4. Host creates room, client joins
5. Host starts game
6. **Verify**: Both windows show same number of balls
7. **Verify**: Console shows settings were received and applied

### What could go wrong
- **Settings not received**: Check network message contains `settings` object
- **Settings applied too late**: Ensure settings are applied BEFORE `initGameObjects()`
- **Wrong player physics**: Check `FlyingObject` constructor reads from `game.settings`

---

## Phase 2: Simulation Tick Counter

### Goal
Add a `simTick` counter that increments exactly once per physics step, and include it in state snapshots.

### Current behavior
- No tick counter exists
- Game loop uses `elapsed >= UPDATE_INTERVAL` to decide when to step
- No way to correlate snapshots to specific simulation moments

### Changes required

#### 2.1 Add simTick to Game class
In `Game.js` constructor:

```javascript
// Simulation tick counter (for network sync)
this.simTick = 0;
```

#### 2.2 Increment on each physics step
In `Game.js` `gameLoop()`, inside the physics block:

```javascript
if (elapsed >= this.updateInterval) {
    // Increment tick counter (host and eventually client)
    this.simTick++;

    // Host: apply remote player input before physics
    if (this.networkMode === NetworkMode.HOST) {
        this.applyRemoteInput();
    }

    this.physics.checkCollisions();
    // ... rest unchanged ...
}
```

#### 2.3 Reset simTick on game start
In `Game.js` `startGame()`:

```javascript
startGame() {
    this.state = GameState.PLAYING;
    this.player1.score = 0;
    this.player2.score = 0;
    this.startTime = Date.now();
    this.goldSpawned = false;
    this.simTick = 0;  // Reset tick counter
}
```

#### 2.4 Include simTick in serialized state
In `StateSerializer.js` `serialize()`:

```javascript
return {
    tick: game.simTick,  // Add tick
    players,
    balls,
    currBasket: game.currBasket,
    timer: game.timer,
    goldSpawned: game.goldSpawned,
    gameState: game.state
};
```

#### 2.5 Apply simTick from state (preparation for later phases)
In `StateSerializer.js` `apply()`:

```javascript
// Store received tick for reconciliation (Phase 7)
// For now, just log it
if (state.tick !== undefined) {
    console.log(`[State] Received tick ${state.tick}, local tick ${game.simTick}`);
}
```

### Expected behavior after Phase 2

| Test Case | Expected Result |
|-----------|-----------------|
| Host plays for 3 seconds | simTick should be ~100 (3000ms / 30ms) |
| Client console | Should log "Received tick N" with incrementing N |
| Game pause | simTick should stop incrementing |
| Game resume | simTick should continue from where it left off |

### How to verify
1. Add temporary debug: `if (this.simTick % 100 === 0) console.log('Tick:', this.simTick);`
2. Start online game
3. **Verify**: Host console shows tick incrementing ~33/sec
4. **Verify**: Client console shows received ticks in state messages
5. **Verify**: Ticks are roughly synchronized (within network latency)

### What could go wrong
- **Tick not incrementing**: Check `elapsed >= this.updateInterval` condition
- **Tick incrementing on client**: Client still skips physics, so client simTick stays 0 (expected for now)
- **Double increment**: Ensure increment happens exactly once per physics step

---

## Phase 3: Tick-Based Gold Timer

### Goal
Replace `Date.now()` gold spawn timer with tick-based timing for online mode.

### Current behavior
- `PhysicsManager.checkGoldBallTimer()` uses `Date.now() - startTime`
- This is wall-clock time, not simulation time
- Pause/resume and lag can cause desync

### Changes required

#### 3.1 Calculate spawn tick on game start
In `Game.js` `startGame()`:

```javascript
startGame() {
    this.state = GameState.PLAYING;
    this.player1.score = 0;
    this.player2.score = 0;
    this.startTime = Date.now();
    this.goldSpawned = false;
    this.simTick = 0;

    // Calculate gold spawn tick (for online mode)
    // duration is in seconds, UPDATE_INTERVAL is 30ms
    this.goldSpawnTick = Math.floor((this.settings.duration * 1000) / UPDATE_INTERVAL);
}
```

#### 3.2 Add goldSpawnTick to settings sync
In `NetworkManager.js` `requestGameStart()`, add:

```javascript
const settings = {
    // ... existing settings ...
    goldSpawnTick: Math.floor((this.game.settings.duration * 1000) / 30)
};
```

In `Game.js` `onGameStart()`:

```javascript
if (config.settings) {
    // ... existing settings ...
    this.goldSpawnTick = config.settings.goldSpawnTick;
}
```

#### 3.3 Modify PhysicsManager to use tick-based timer online
In `PhysicsManager.js` `checkGoldBallTimer()`:

```javascript
checkGoldBallTimer() {
    const { settings, balls, goldSpawned } = this.game;

    if (settings.goldBalls === 0 || goldSpawned) return;

    let shouldSpawn = false;

    // Online mode: use tick-based timing
    if (this.game.networkMode !== 'offline') {
        shouldSpawn = this.game.simTick >= this.game.goldSpawnTick;
    } else {
        // Offline mode: keep wall-clock timing for original feel
        const elapsed = Date.now() - this.game.startTime;
        const duration = settings.duration * 1000;
        shouldSpawn = elapsed >= duration;
    }

    if (shouldSpawn) {
        for (const ball of balls) {
            if (ball.isGoldBall && !ball.alive) {
                ball.alive = true;
            }
        }
        this.game.goldSpawned = true;
    }
}
```

#### 3.4 Import NetworkMode in PhysicsManager
At top of `PhysicsManager.js`:

```javascript
import { COLLISION_THRESHOLD, GROUND_Y, LEFT_BASKET_X, RIGHT_BASKET_X, BASKET_Y } from './GameConstants.js';
import { NetworkMode } from './GameConstants.js';
```

Then use `NetworkMode.OFFLINE` instead of string `'offline'`.

### Expected behavior after Phase 3

| Test Case | Expected Result |
|-----------|-----------------|
| Online, duration=60 | Gold spawns at tick 2000 (60*1000/30) |
| Online, duration=30 | Gold spawns at tick 1000 |
| Offline, duration=30 | Gold spawns after 30 real seconds (unchanged) |
| Online game paused | Gold spawn tick is fixed; pausing delays real spawn |

### How to verify
1. Set `goldBalls=1`, `duration=5` (5 seconds)
2. Start online game
3. Add debug: `console.log('Tick:', this.simTick, 'SpawnTick:', this.goldSpawnTick);`
4. **Verify**: Gold ball appears when simTick reaches ~167 (5000/30)
5. Start offline game
6. **Verify**: Gold ball still appears after ~5 real seconds

### What could go wrong
- **Gold never spawns online**: Check `goldSpawnTick` is set and synced
- **Gold spawns immediately**: Check `goldSpawnTick` isn't 0 or undefined
- **Offline broken**: Ensure offline branch uses original Date.now logic

---

## Phase 4: Deterministic Randomness

### Goal
Replace `Math.random()` with a deterministic, tick-based PRNG for online mode.

### Current behavior
- `Ball.move()`: Random wiggle using `Math.random()`
- `GoldBall.move()`: Evasion AI uses `Math.random()`
- `Person.move()`: AI uses `Math.random()` (offline only, but good to unify)

### Design: Tick-based hash function

We need a pure function: `rand(seed, tick, entityId, channel) -> number`

This approach is **order-independent** - the result depends only on the inputs, not on what order entities are processed. This is crucial for rollback/resim.

```javascript
// DeterministicRandom.js
export function hashRand(seed, tick, entityId, channel) {
    // Simple hash combining all inputs
    // Using a variant of xorshift for speed
    let h = seed;
    h ^= tick * 374761393;
    h ^= entityId * 668265263;
    h ^= channel * 1103515245;
    h = ((h ^ (h >>> 15)) * 2246822519) >>> 0;
    h = ((h ^ (h >>> 13)) * 3266489917) >>> 0;
    h = (h ^ (h >>> 16)) >>> 0;
    return h;
}

// Returns integer in range [0, max)
export function randInt(seed, tick, entityId, channel, max) {
    const h = hashRand(seed, tick, entityId, channel);
    return h % max;
}

// Returns integer in range [min, max]
export function randRange(seed, tick, entityId, channel, min, max) {
    return min + randInt(seed, tick, entityId, channel, max - min + 1);
}
```

### Changes required

#### 4.1 Create DeterministicRandom.js
Create new file `web/src/game/DeterministicRandom.js`:

```javascript
// DeterministicRandom.js - Deterministic tick-based PRNG for online multiplayer
// Uses order-independent hashing so rollback/resim produces same results

/**
 * Hash function combining seed, tick, entity ID, and channel into a pseudo-random uint32.
 * Order-independent: same inputs always produce same output regardless of call order.
 */
export function hashRand(seed, tick, entityId, channel) {
    let h = seed >>> 0;
    h = (h ^ (tick * 374761393)) >>> 0;
    h = (h ^ (entityId * 668265263)) >>> 0;
    h = (h ^ (channel * 1103515245)) >>> 0;
    h = (((h ^ (h >>> 15)) >>> 0) * 2246822519) >>> 0;
    h = (((h ^ (h >>> 13)) >>> 0) * 3266489917) >>> 0;
    h = (h ^ (h >>> 16)) >>> 0;
    return h;
}

/**
 * Returns deterministic integer in range [0, max).
 * @param {number} seed - Game seed
 * @param {number} tick - Current simulation tick
 * @param {number} entityId - Unique entity identifier (e.g., ball index)
 * @param {number} channel - Distinguishes multiple random calls per entity per tick
 * @param {number} max - Exclusive upper bound
 */
export function randInt(seed, tick, entityId, channel, max) {
    const h = hashRand(seed, tick, entityId, channel);
    return h % max;
}

/**
 * Returns deterministic integer in range [min, max].
 */
export function randRange(seed, tick, entityId, channel, min, max) {
    return min + randInt(seed, tick, entityId, channel, max - min + 1);
}
```

#### 4.2 Add seed to game and sync it
In `Game.js` constructor:

```javascript
// Deterministic random seed (for online multiplayer)
this.randomSeed = 0;
```

In `Game.js` `startGame()`:

```javascript
startGame() {
    // ... existing code ...

    // Generate seed for online games (host only)
    if (this.networkMode === NetworkMode.HOST) {
        this.randomSeed = Math.floor(Math.random() * 0xFFFFFFFF);
    }
}
```

In `NetworkManager.js` `requestGameStart()`:

```javascript
const settings = {
    // ... existing settings ...
    seed: this.game.randomSeed || Math.floor(Math.random() * 0xFFFFFFFF)
};
```

In `Game.js` `onGameStart()`:

```javascript
if (config.settings) {
    // ... existing settings ...
    this.randomSeed = config.settings.seed;
}
```

#### 4.3 Assign entity IDs to balls
In `Game.js` `initGameObjects()`:

```javascript
// Create red balls (catchable) - model 2
for (let i = 0; i < redBalls; i++) {
    const ball = new Ball(this, 2, midW, midH - 50 + i * 30);
    ball.catchable = true;
    ball.entityId = i;  // Unique ID for deterministic random
    this.balls.push(ball);
    this.redBalls.push(ball);
}

// Create black balls (obstacles, 1.5x speedFactor) - model 1
for (let i = 0; i < blackBalls; i++) {
    const ball = new Ball(this, 1, midW, midH + 50 + i * 30);
    ball.speedFactor = 1.5;
    ball.entityId = redBalls + i;  // Continue unique IDs
    this.balls.push(ball);
}

// Create gold balls (special, initially hidden) - model 0
for (let i = 0; i < goldBalls; i++) {
    const ball = new GoldBall(this, midW, 100 + i * 30);
    ball.entityId = redBalls + blackBalls + i;  // Continue unique IDs
    this.balls.push(ball);
}
```

#### 4.4 Modify Ball.move() to use deterministic random online
In `Ball.js`:

```javascript
import { FlyingObject } from './FlyingObject.js';
import { randRange } from './DeterministicRandom.js';
import { NetworkMode } from './GameConstants.js';

export class Ball extends FlyingObject {
    constructor(game, model, x, y) {
        super(game, x, y);
        this.model = model;
        this.w = 16;
        this.h = 16;
        this.alive = true;
        this.catchable = false;
        this.isGoldBall = false;
        this.entityId = 0;  // Set by Game.initGameObjects()
    }

    move() {
        if (!this.alive) return;

        let rand;
        if (this.game.networkMode !== NetworkMode.OFFLINE) {
            // Online: deterministic random
            // Channel 0 for ball wiggle
            rand = randRange(
                this.game.randomSeed,
                this.game.simTick,
                this.entityId,
                0,  // channel
                -20,
                19
            );
        } else {
            // Offline: original behavior
            rand = Math.floor(Math.random() * 40) - 20;
        }

        if (rand === 0) {
            this.up();
        }
        if (rand === 1) {
            this.right();
        }
        if (rand === 2) {
            this.left();
        }

        // Fly up if too close to ground
        if (this.y > 309) {
            this.up();
        }

        super.move();
    }

    // ... draw() unchanged ...
}
```

#### 4.5 Modify GoldBall.move() similarly
In `GoldBall.js`:

```javascript
import { Ball } from './Ball.js';
import { randInt } from './DeterministicRandom.js';
import { NetworkMode } from './GameConstants.js';

export class GoldBall extends Ball {
    // ... constructor unchanged ...

    move() {
        if (!this.alive) return;

        // Evasion AI: flee from players within 100px
        for (let i = 0; i < this.game.players.length; i++) {
            const player = this.game.players[i];
            const dx = this.x - player.x;
            const dy = this.y - player.y;

            if (Math.abs(dx) < 100 && Math.abs(dy) < 100) {
                let choice;
                if (this.game.networkMode !== NetworkMode.OFFLINE) {
                    // Online: deterministic random
                    // Channel 1 + playerIndex for evasion
                    choice = randInt(
                        this.game.randomSeed,
                        this.game.simTick,
                        this.entityId,
                        1 + i,  // channel per player
                        this.smart
                    );
                } else {
                    // Offline: original behavior
                    choice = Math.floor(Math.random() * this.smart);
                }

                if (choice === 0) {
                    if (player.x < this.x) this.right();
                    if (player.x > this.x) this.left();
                    if (player.y > this.y) this.up();
                    if (player.y < this.y) this.down();
                }
            }
        }

        // Call parent Ball.move()
        super.move();
    }

    // ... down() unchanged ...
}
```

### Expected behavior after Phase 4

| Test Case | Expected Result |
|-----------|-----------------|
| Two browsers, same seed, same tick | Ball movements should be identical |
| Replay game with same seed | Balls follow exact same path (if inputs identical) |
| Offline game | Ball movement unchanged (still uses Math.random) |
| Different seeds | Different ball movements |

### How to verify
1. Add debug logging: `console.log('Ball', this.entityId, 'tick', game.simTick, 'rand', rand);`
2. Start online game
3. **Verify**: Host and client logs show same rand values for same ball/tick
4. Start offline game
5. **Verify**: Game plays normally (no visible change)

### What could go wrong
- **Balls don't move online**: Check `simTick` is incrementing
- **Balls move differently**: Check seed is synced, entityIds match
- **Hash produces NaN**: Ensure all inputs are valid numbers
- **Offline broken**: Ensure offline branch is taken correctly

---

## Phase 5: Tick-Stamped Input Events

### Goal
Convert input to tick-stamped events and relay host inputs to client.

### Current behavior
- Client sends input state: `{ left: true, right: false, ... }`
- Host receives and applies immediately in `applyRemoteInput()`
- Client never receives host's inputs
- No tick association

### Changes required

#### 5.1 Define InputEvent structure
Create `web/src/multiplayer/InputEvent.js`:

```javascript
// InputEvent.js - Tick-stamped input events for network sync

/**
 * Creates an input event with tick timestamp.
 * @param {number} tick - Simulation tick when input occurred
 * @param {Object} actions - Input actions {left, right, up, down, switch}
 * @param {number} playerId - 0 for player1/host, 1 for player2/client
 */
export function createInputEvent(tick, actions, playerId) {
    return {
        tick,
        playerId,
        actions: {
            left: actions.left || false,
            right: actions.right || false,
            up: actions.up || false,
            down: actions.down || false,
            switch: actions.switch || false
        }
    };
}
```

#### 5.2 Modify NetworkManager to send tick-stamped inputs
In `NetworkManager.js`:

```javascript
// Client: send input with tick
sendInput(input, tick) {
    if (this.isHost) return;
    this.send({
        type: 'input',
        input: input,
        tick: tick
    });
}

// Host: send own input to clients
sendHostInput(input, tick) {
    if (!this.isHost) return;
    this.send({
        type: 'hostInput',
        input: input,
        tick: tick
    });
}
```

#### 5.3 Modify InputHandler to include tick
In `InputHandler.js` `handleOnlineClientInput()`:

```javascript
handleOnlineClientInput(key, code) {
    if (!this.game.networkManager) return;

    const input = {
        left: code === 'ArrowLeft',
        right: code === 'ArrowRight',
        up: code === 'ArrowUp',
        down: code === 'ArrowDown',
        switch: key === 'Enter'
    };

    if (input.left || input.right || input.up || input.down || input.switch) {
        // Include current tick (client's predicted tick)
        this.game.networkManager.sendInput(input, this.game.simTick);
    }
}
```

#### 5.4 Host sends its own inputs
In `InputHandler.js`, add to the player 1 controls section:

```javascript
// Player 1 controls (WASD - only if not AI)
if (!player1.isRobot) {
    let hostInput = null;

    if (key === 'w' || key === 'W') { player1.up(); hostInput = { up: true }; }
    if (key === 'a' || key === 'A') { player1.left(); hostInput = { left: true }; }
    if (key === 's' || key === 'S') { player1.down(); hostInput = { down: true }; }
    if (key === 'd' || key === 'D') { player1.right(); hostInput = { right: true }; }
    if (key === '1') { player1.switchModel(); hostInput = { switch: true }; }

    // Send host input to client (for prediction)
    if (hostInput && networkMode === NetworkMode.HOST && this.game.networkManager) {
        this.game.networkManager.sendHostInput(hostInput, this.game.simTick);
    }
}
```

#### 5.5 Server relays host inputs to clients
In `partykit/server.ts`, add message type:

```typescript
type ClientMessage =
  | { type: "join"; name: string }
  | { type: "ready" }
  | { type: "input"; input: InputState; tick: number }
  | { type: "hostInput"; input: InputState; tick: number }  // Add this
  | { type: "gameStart"; settings?: GameSettings }
  | { type: "state"; state: GameState }
  | { type: "leave" };
```

Add handler:

```typescript
case "hostInput":
    this.handleHostInput(sender, msg.input, msg.tick);
    break;

// ...

handleHostInput(conn: Party.Connection, input: InputState, tick: number) {
    // Only host can send host inputs
    if (conn.id !== this.hostId) return;

    // Forward to all clients (excluding host)
    this.broadcast(
        JSON.stringify({
            type: "hostInput",
            playerId: conn.id,
            input: input,
            tick: tick
        }),
        [conn.id]
    );
}
```

#### 5.6 Client receives and buffers host inputs
In `NetworkManager.js`:

```javascript
constructor(game) {
    // ... existing code ...

    // Buffered input events for prediction (Phase 6+)
    this.hostInputBuffer = [];  // Host inputs received by client
    this.localInputBuffer = []; // Local inputs sent by client
}

handleMessage(msg) {
    switch (msg.type) {
        // ... existing cases ...

        case 'hostInput':
            // Client receives host input
            if (!this.isHost) {
                this.hostInputBuffer.push({
                    tick: msg.tick,
                    input: msg.input
                });
                // Keep buffer size reasonable (last 60 ticks = ~2 seconds)
                if (this.hostInputBuffer.length > 60) {
                    this.hostInputBuffer.shift();
                }
            }
            break;
    }
}
```

#### 5.7 Include tick and input ack in snapshots
In `StateSerializer.js` `serialize()`:

```javascript
return {
    tick: game.simTick,
    lastProcessedInputTick: game.lastProcessedInputTick || 0,  // Add this
    players,
    balls,
    // ... rest unchanged
};
```

In `Game.js`, track processed input tick:

```javascript
// In constructor
this.lastProcessedInputTick = 0;

// In applyRemoteInput()
applyRemoteInput() {
    if (this.networkMode !== NetworkMode.HOST || !this.networkManager) return;

    const input = this.networkManager.getRemoteInput();

    // Track the tick of the last processed input
    if (input.tick !== undefined) {
        this.lastProcessedInputTick = input.tick;
    }

    // Apply input to player 2
    if (input.left) this.player2.left();
    // ... rest unchanged
}
```

### Expected behavior after Phase 5

| Test Case | Expected Result |
|-----------|-----------------|
| Client presses arrow key | Input message includes `tick` field |
| Host presses WASD | `hostInput` message sent to client |
| Client console | Shows received host inputs with ticks |
| Snapshot from host | Includes `tick` and `lastProcessedInputTick` |

### How to verify
1. Add logging in NetworkManager: `console.log('Received hostInput:', msg);`
2. Start online game
3. Host presses WASD
4. **Verify**: Client console shows `hostInput` messages with ticks
5. Client presses arrows
6. **Verify**: Host receives inputs with ticks
7. **Verify**: Snapshots include tick information

### What could go wrong
- **No hostInput messages**: Check server relay, check host is sending
- **Wrong ticks**: Ensure simTick is incrementing correctly
- **Buffer overflow**: Check buffer trimming logic

---

## Phase 6: Client-Side Simulation

### Goal
Enable full physics simulation on client (stop skipping physics).

### Current behavior
- `Game.js:239-242`: Client skips all physics, only renders
- `applyNetworkState()` overwrites all positions

### Changes required

#### 6.1 Enable physics on client
In `Game.js` `gameLoop()`, modify the playing state logic:

```javascript
if (this.state === GameState.PLAYING) {
    if (elapsed >= this.updateInterval) {
        // Increment tick counter
        this.simTick++;

        if (this.networkMode === NetworkMode.HOST) {
            // Host: apply remote input, run physics
            this.applyRemoteInput();
        } else if (this.networkMode === NetworkMode.CLIENT) {
            // Client: apply local input, apply buffered host input, run physics
            this.applyLocalPredictedInput();
            this.applyBufferedHostInput();
        }
        // Both host and client run physics
        // (Offline unchanged)

        this.physics.checkCollisions();
        this.physics.checkCaught();
        this.physics.checkGoldBallTimer();
        this.moveFlyers();

        if (this.timer > 0) {
            this.timer--;
        }

        this.lastUpdateTime = timestamp;
    }
}
```

#### 6.2 Client applies its own input locally
Add to `Game.js`:

```javascript
applyLocalPredictedInput() {
    if (this.networkMode !== NetworkMode.CLIENT || !this.networkManager) return;

    // Get local input that was sent for this tick
    // For now, we apply input immediately when pressed (InputHandler already calls player.left() etc.)
    // This method is a placeholder for Phase 7 where we'll need input buffering
}
```

#### 6.3 Client applies host input from buffer
Add to `Game.js`:

```javascript
applyBufferedHostInput() {
    if (this.networkMode !== NetworkMode.CLIENT || !this.networkManager) return;

    const buffer = this.networkManager.hostInputBuffer;

    // Find inputs for current tick (or earlier if we're behind)
    while (buffer.length > 0 && buffer[0].tick <= this.simTick) {
        const event = buffer.shift();
        const input = event.input;

        // Apply to player 1 (host's player)
        if (input.left) this.player1.left();
        if (input.right) this.player1.right();
        if (input.up) this.player1.up();
        if (input.down) this.player1.down();
        if (input.switch) this.player1.switchModel();
    }
}
```

#### 6.4 Modify client input handling to apply locally
In `InputHandler.js` `handleOnlineClientInput()`:

```javascript
handleOnlineClientInput(key, code) {
    if (!this.game.networkManager) return;

    // Build input object
    const input = {
        left: code === 'ArrowLeft',
        right: code === 'ArrowRight',
        up: code === 'ArrowUp',
        down: code === 'ArrowDown',
        switch: key === 'Enter'
    };

    // Apply locally for immediate feedback (prediction)
    const player = this.game.player2;  // Client controls player 2
    if (input.left) player.left();
    if (input.right) player.right();
    if (input.up) player.up();
    if (input.down) player.down();
    if (input.switch) player.switchModel();

    // Send to host
    if (input.left || input.right || input.up || input.down || input.switch) {
        this.game.networkManager.sendInput(input, this.game.simTick);
    }
}
```

#### 6.5 Modify applyNetworkState to not overwrite (temporarily)
For Phase 6, we want to see if prediction works before adding reconciliation.

In `StateSerializer.js` `apply()`, add a flag to skip state application:

```javascript
export function apply(game, state, skipPositionUpdate = false) {
    if (!skipPositionUpdate) {
        // Update players
        state.players.forEach((playerState, index) => {
            // ... existing code
        });

        // Update balls
        state.balls.forEach((ballState, index) => {
            // ... existing code
        });
    }

    // Always update game state
    game.currBasket = state.currBasket;
    game.timer = state.timer;
    game.goldSpawned = state.goldSpawned;

    return { gameState: state.gameState, tick: state.tick };
}
```

In `Game.js` `applyNetworkState()`:

```javascript
applyNetworkState(state) {
    if (this.networkMode !== NetworkMode.CLIENT) return;

    // Phase 6: Skip position updates, let client predict
    // Phase 7 will add reconciliation
    const { gameState, tick } = apply(this, state, true);  // Skip position update

    // Track received tick for debugging
    console.log(`[Client] Received tick ${tick}, local tick ${this.simTick}`);

    // Handle game state changes
    if (gameState === GameState.PAUSED) {
        this.hostPaused = true;
        this.state = GameState.PAUSED;
    } else if (gameState === GameState.PLAYING) {
        this.hostPaused = false;
        this.state = GameState.PLAYING;
    } else if (gameState === GameState.GAME_OVER) {
        this.hostPaused = false;
        this.state = GameState.GAME_OVER;
    }
}
```

### Expected behavior after Phase 6

| Test Case | Expected Result |
|-----------|-----------------|
| Client presses arrow | Player moves immediately (no delay) |
| Client's view | Smooth local movement, no 50ms stepping |
| Host presses WASD | Host player moves on client (via hostInput) |
| Ball movement | Smooth on both sides (deterministic random) |

### How to verify
1. Start online game
2. **Verify**: Client player responds instantly to input
3. **Verify**: Client sees balls moving smoothly (not stepping every 50ms)
4. **Verify**: Host player moves on client when host presses keys
5. **Verify**: No obvious desync (players/balls in roughly same positions)

### What could go wrong
- **Client frozen**: Check simTick is incrementing on client
- **Only client player moves**: Check hostInputBuffer is receiving events
- **Massive desync**: Expected without reconciliation - Phase 7 fixes this
- **Double input application**: Ensure input is applied once per tick

### Known limitation (fixed in Phase 7)
Without reconciliation, client and host will gradually drift apart due to:
- Network latency (inputs applied at different ticks)
- Timing differences
- Any remaining non-determinism

---

## Phase 7: Rollback Reconciliation

### Goal
Implement state correction when authoritative snapshots diverge from prediction.

### Current behavior (after Phase 6)
- Client runs full simulation
- Snapshots received but position updates skipped
- No correction when prediction is wrong

### Design: History buffer + rollback + resimulation

```
Client state at tick 100:
  - History buffer: [tick 80, tick 81, ..., tick 100]
  - Input buffer: [inputs for tick 80-100]

Receives authoritative snapshot for tick 95:
  1. Compare predicted state at tick 95 with authoritative
  2. If different:
     a. Restore state to authoritative snapshot (tick 95)
     b. Replay ticks 96, 97, 98, 99, 100 using buffered inputs
     c. Result: client now at tick 100 but corrected
```

### Changes required

#### 7.1 Add state history buffer to Game
In `Game.js` constructor:

```javascript
// State history for rollback reconciliation (online client only)
this.stateHistory = [];      // Ring buffer of past states
this.maxHistoryLength = 90;  // ~3 seconds at 30 ticks/sec
```

#### 7.2 Save state each tick
Add to `Game.js`:

```javascript
saveStateToHistory() {
    if (this.networkMode !== NetworkMode.CLIENT) return;

    const snapshot = {
        tick: this.simTick,
        players: this.players.map(p => ({
            x: p.x,
            y: p.y,
            vx: p.velocityX,
            vy: p.velocityY,
            score: p.score,
            model: p.model
        })),
        balls: this.balls.map(b => ({
            x: b.x,
            y: b.y,
            vx: b.velocityX,
            vy: b.velocityY,
            alive: b.alive
        })),
        currBasket: this.currBasket,
        timer: this.timer,
        goldSpawned: this.goldSpawned
    };

    this.stateHistory.push(snapshot);

    // Trim old history
    while (this.stateHistory.length > this.maxHistoryLength) {
        this.stateHistory.shift();
    }
}
```

Call it in `gameLoop()` after physics:

```javascript
this.moveFlyers();

// Save state to history (for reconciliation)
this.saveStateToHistory();

if (this.timer > 0) {
    this.timer--;
}
```

#### 7.3 Add input history buffer
In `NetworkManager.js`:

```javascript
constructor(game) {
    // ... existing code ...

    this.localInputHistory = [];   // Inputs we've sent, for resimulation
    this.hostInputHistory = [];    // Host inputs received, for resimulation
}

// When sending input
sendInput(input, tick) {
    if (this.isHost) return;

    // Save to history for resimulation
    this.localInputHistory.push({ tick, input });

    // Trim old history
    while (this.localInputHistory.length > 90) {
        this.localInputHistory.shift();
    }

    this.send({ type: 'input', input, tick });
}

// When receiving host input
// In handleMessage 'hostInput' case:
this.hostInputHistory.push({ tick: msg.tick, input: msg.input });
while (this.hostInputHistory.length > 90) {
    this.hostInputHistory.shift();
}
```

#### 7.4 Implement reconciliation
Add to `Game.js`:

```javascript
reconcileWithServer(authoritativeState) {
    if (this.networkMode !== NetworkMode.CLIENT) return;

    const serverTick = authoritativeState.tick;

    // Find our predicted state for this tick
    const predictedState = this.stateHistory.find(s => s.tick === serverTick);

    if (!predictedState) {
        // Don't have history for this tick - hard reset
        console.log(`[Reconcile] No history for tick ${serverTick}, hard reset`);
        this.hardResetToState(authoritativeState);
        return;
    }

    // Compare states
    const divergence = this.calculateDivergence(predictedState, authoritativeState);

    if (divergence < 1.0) {
        // States are close enough, no correction needed
        return;
    }

    console.log(`[Reconcile] Divergence ${divergence.toFixed(2)} at tick ${serverTick}, rolling back`);

    // Restore to authoritative state
    this.restoreState(authoritativeState);

    // Resimulate from serverTick+1 to current tick
    const targetTick = this.simTick;
    this.simTick = serverTick;

    while (this.simTick < targetTick) {
        this.simTick++;
        this.applyInputsForTick(this.simTick);
        this.physics.checkCollisions();
        this.physics.checkCaught();
        this.physics.checkGoldBallTimer();
        this.moveFlyers();
    }

    // Clear old history (now invalid)
    this.stateHistory = this.stateHistory.filter(s => s.tick > serverTick);
}

calculateDivergence(predicted, authoritative) {
    let maxDiff = 0;

    // Check players
    for (let i = 0; i < predicted.players.length; i++) {
        const p = predicted.players[i];
        const a = authoritative.players[i];
        if (!a) continue;

        maxDiff = Math.max(maxDiff,
            Math.abs(p.x - a.x),
            Math.abs(p.y - a.y)
        );
    }

    // Check balls
    for (let i = 0; i < predicted.balls.length; i++) {
        const p = predicted.balls[i];
        const a = authoritative.balls[i];
        if (!a) continue;

        maxDiff = Math.max(maxDiff,
            Math.abs(p.x - a.x),
            Math.abs(p.y - a.y)
        );
    }

    return maxDiff;
}

restoreState(state) {
    state.players.forEach((ps, i) => {
        const p = this.players[i];
        if (p) {
            p.x = ps.x;
            p.y = ps.y;
            p.velocityX = ps.vx;
            p.velocityY = ps.vy;
            p.score = ps.score;
            p.model = ps.model;
        }
    });

    state.balls.forEach((bs, i) => {
        const b = this.balls[i];
        if (b) {
            b.x = bs.x;
            b.y = bs.y;
            b.velocityX = bs.vx;
            b.velocityY = bs.vy;
            b.alive = bs.alive;
        }
    });

    this.currBasket = state.currBasket;
    this.timer = state.timer;
    this.goldSpawned = state.goldSpawned;
}

hardResetToState(state) {
    this.restoreState(state);
    this.simTick = state.tick;
    this.stateHistory = [];
}

applyInputsForTick(tick) {
    if (!this.networkManager) return;

    // Apply local inputs for this tick
    const localInputs = this.networkManager.localInputHistory.filter(e => e.tick === tick);
    for (const event of localInputs) {
        if (event.input.left) this.player2.left();
        if (event.input.right) this.player2.right();
        if (event.input.up) this.player2.up();
        if (event.input.down) this.player2.down();
        if (event.input.switch) this.player2.switchModel();
    }

    // Apply host inputs for this tick
    const hostInputs = this.networkManager.hostInputHistory.filter(e => e.tick === tick);
    for (const event of hostInputs) {
        if (event.input.left) this.player1.left();
        if (event.input.right) this.player1.right();
        if (event.input.up) this.player1.up();
        if (event.input.down) this.player1.down();
        if (event.input.switch) this.player1.switchModel();
    }
}
```

#### 7.5 Call reconciliation when receiving snapshots
In `Game.js` `applyNetworkState()`:

```javascript
applyNetworkState(state) {
    if (this.networkMode !== NetworkMode.CLIENT) return;

    const { gameState, tick } = apply(this, state, true);  // Parse but don't apply

    // Reconcile with authoritative state
    this.reconcileWithServer({
        tick: tick,
        players: state.players,
        balls: state.balls,
        currBasket: state.currBasket,
        timer: state.timer,
        goldSpawned: state.goldSpawned
    });

    // Handle game state changes
    if (gameState === GameState.PAUSED) {
        this.hostPaused = true;
        this.state = GameState.PAUSED;
    } else if (gameState === GameState.PLAYING) {
        this.hostPaused = false;
        this.state = GameState.PLAYING;
    } else if (gameState === GameState.GAME_OVER) {
        this.hostPaused = false;
        this.state = GameState.GAME_OVER;
    }
}
```

#### 7.6 Improve snapshot precision
In `StateSerializer.js`, stop rounding for reconciliation:

```javascript
export function serialize(game) {
    const players = game.players.map(player => ({
        x: Math.round(player.x),       // Integer precision
        y: Math.round(player.y),
        vx: Math.round(player.velocityX * 100),  // Fixed-point velocity
        vy: Math.round(player.velocityY * 100),
        score: player.score,
        model: player.model
    }));

    const balls = game.balls.map(ball => ({
        x: Math.round(ball.x),
        y: Math.round(ball.y),
        vx: Math.round(ball.velocityX * 100),
        vy: Math.round(ball.velocityY * 100),
        alive: ball.alive !== false
    }));

    return {
        tick: game.simTick,
        lastProcessedInputTick: game.lastProcessedInputTick || 0,
        players,
        balls,
        currBasket: game.currBasket,
        timer: game.timer,
        goldSpawned: game.goldSpawned,
        gameState: game.state
    };
}

export function apply(game, state, skipPositionUpdate = false) {
    if (!skipPositionUpdate) {
        state.players.forEach((playerState, index) => {
            const player = game.players[index];
            if (player) {
                player.x = playerState.x;
                player.y = playerState.y;
                player.velocityX = playerState.vx / 100;  // Decode fixed-point
                player.velocityY = playerState.vy / 100;
                player.score = playerState.score;
                if (player.model !== playerState.model) {
                    player.model = playerState.model;
                }
            }
        });

        state.balls.forEach((ballState, index) => {
            const ball = game.balls[index];
            if (ball) {
                ball.x = ballState.x;
                ball.y = ballState.y;
                ball.velocityX = ballState.vx / 100;
                ball.velocityY = ballState.vy / 100;
                if (ball.isGoldBall) {
                    ball.alive = ballState.alive;
                }
            }
        });
    }

    game.currBasket = state.currBasket;
    game.timer = state.timer;
    game.goldSpawned = state.goldSpawned;

    return { gameState: state.gameState, tick: state.tick };
}
```

### Expected behavior after Phase 7

| Test Case | Expected Result |
|-----------|-----------------|
| Normal play | Smooth movement, rare/small corrections |
| High latency | More frequent but small corrections |
| Console log | "Divergence X at tick Y" messages when correcting |
| Score changes | Immediately reflected when server confirms |
| Edge cases | No "warping" across screen |

### How to verify
1. Start online game
2. Play normally for 30+ seconds
3. **Verify**: Movement feels smooth
4. **Verify**: Console shows occasional "Divergence" messages but values are small (<5 pixels)
5. Add artificial latency (Chrome DevTools > Network > Throttling)
6. **Verify**: Still playable, no major warping

### What could go wrong
- **Constant corrections**: Check determinism (seed sync, tick-based random)
- **Large corrections**: Check input history is complete
- **Performance issues**: Resimulation shouldn't take long, but profile if slow
- **State oscillation**: Ensure history is cleared after reconciliation

---

## Phase 8: Render Interpolation

### Goal
Smooth rendering between physics ticks (eliminate 30ms stepping).

### Current behavior
- Physics runs at 30ms intervals
- Rendering uses current physics positions
- Movement appears "chunky" at 60fps

### Design: Interpolate between previous and current tick

```
Physics: tick N at t=0ms, tick N+1 at t=30ms
Render at t=15ms: lerp(posN, posN+1, 0.5)
Render at t=25ms: lerp(posN, posN+1, 0.833)
```

### Changes required

#### 8.1 Store previous positions
In `FlyingObject.js`:

```javascript
constructor(game, x, y) {
    this.game = game;
    this.x = x;
    this.y = y;
    this.prevX = x;      // Previous tick position
    this.prevY = y;
    // ... rest unchanged
}

move() {
    // Save previous position before moving
    this.prevX = this.x;
    this.prevY = this.y;

    this.x = Math.floor(this.x + this.velocityX * this.speedFactor);
    this.y = Math.floor(this.y + this.velocityY * this.speedFactor);

    // ... rest unchanged
}
```

#### 8.2 Track interpolation alpha in game loop
In `Game.js` `gameLoop()`:

```javascript
gameLoop(timestamp) {
    if (!this.running) return;

    if (this.lastUpdateTime === 0) {
        this.lastUpdateTime = timestamp;
    }

    const elapsed = timestamp - this.lastUpdateTime;

    // Calculate interpolation alpha for smooth rendering
    // Alpha = how far we are into the next physics tick (0.0 to 1.0)
    this.renderAlpha = Math.min(elapsed / this.updateInterval, 1.0);

    if (this.state === GameState.PLAYING) {
        if (elapsed >= this.updateInterval) {
            // ... physics step ...

            // Reset alpha after physics step
            this.lastUpdateTime = timestamp;
            this.renderAlpha = 0;
        }
    } else {
        this.lastUpdateTime = timestamp;
    }

    this.renderer.render();
    requestAnimationFrame(this.gameLoop);
}
```

#### 8.3 Interpolate in rendering
In `GameRenderer.js`, add interpolation helper:

```javascript
// Helper to get interpolated position
getInterpolatedPos(obj, alpha) {
    if (this.game.networkMode === 'offline') {
        // Skip interpolation offline for original chunky feel
        return { x: obj.x, y: obj.y };
    }

    const x = obj.prevX + (obj.x - obj.prevX) * alpha;
    const y = obj.prevY + (obj.y - obj.prevY) * alpha;
    return { x, y };
}
```

Modify `drawGameplay()` to use interpolated positions:

```javascript
drawGameplay(ctx) {
    const alpha = this.game.renderAlpha || 0;

    // Draw players with interpolation
    for (const player of this.game.players) {
        const pos = this.getInterpolatedPos(player, alpha);
        this.drawPlayerAt(ctx, player, pos.x, pos.y);
    }

    // Draw balls with interpolation
    for (const ball of this.game.balls) {
        if (!ball.alive) continue;
        const pos = this.getInterpolatedPos(ball, alpha);
        this.drawBallAt(ctx, ball, pos.x, pos.y);
    }

    // ... rest of gameplay rendering
}

drawPlayerAt(ctx, player, x, y) {
    // Draw at specified position instead of player.x/y
    const drawX = x - 11;
    const drawY = y - 31;
    // ... draw sprite at drawX, drawY
}

drawBallAt(ctx, ball, x, y) {
    const drawX = x - 11;
    const drawY = y - 31;
    // ... draw sprite at drawX, drawY
}
```

#### 8.4 Handle boundary teleports
When objects hit boundaries and teleport (e.g., falling off screen), we shouldn't interpolate:

```javascript
getInterpolatedPos(obj, alpha) {
    if (this.game.networkMode === 'offline') {
        return { x: obj.x, y: obj.y };
    }

    // Don't interpolate large jumps (teleports, respawns)
    const dx = Math.abs(obj.x - obj.prevX);
    const dy = Math.abs(obj.y - obj.prevY);
    if (dx > 50 || dy > 50) {
        return { x: obj.x, y: obj.y };
    }

    const x = obj.prevX + (obj.x - obj.prevX) * alpha;
    const y = obj.prevY + (obj.y - obj.prevY) * alpha;
    return { x, y };
}
```

### Expected behavior after Phase 8

| Test Case | Expected Result |
|-----------|-----------------|
| Online play at 60fps | Silky smooth movement |
| Offline play | Unchanged (original chunky feel) |
| Boundary collision | No weird interpolation artifacts |
| Fast movement | Smooth, no ghosting |

### How to verify
1. Start online game
2. **Verify**: Movement appears smooth (no 30ms stepping visible)
3. Start offline game
4. **Verify**: Movement has original "chunky" feel
5. Move player into wall
6. **Verify**: No interpolation glitches at boundaries

### What could go wrong
- **Ghosting/trails**: Check prevX/prevY are updated correctly
- **Jitter**: Check alpha calculation
- **Offline changed**: Ensure offline branch skips interpolation

---

## Summary: Phase Checklist

| Phase | Description | Visible Change | Files Modified |
|-------|-------------|----------------|----------------|
| 1 | Settings Sync | Ball counts match | Game.js, NetworkManager.js, server.ts |
| 2 | Simulation Tick | None (internal) | Game.js, StateSerializer.js |
| 3 | Tick-Based Gold Timer | None (online timing) | Game.js, PhysicsManager.js |
| 4 | Deterministic Random | Ball paths match | Ball.js, GoldBall.js, new DeterministicRandom.js |
| 5 | Tick-Stamped Inputs | None (protocol) | InputHandler.js, NetworkManager.js, server.ts |
| 6 | Client Simulation | Instant input response | Game.js, InputHandler.js |
| 7 | Rollback Reconciliation | Smooth corrections | Game.js, StateSerializer.js |
| 8 | Render Interpolation | Silky smooth | FlyingObject.js, Game.js, GameRenderer.js |

## Testing Strategy

After each phase:
1. Test offline mode still works identically
2. Test online mode with two browser windows
3. Check console for errors/warnings
4. Compare expected behavior table
5. If something breaks, revert and investigate before proceeding

## Rollback Plan

Each phase should be in a separate commit. If a phase introduces regressions:
1. `git revert` the phase commit
2. Investigate the issue
3. Fix and re-apply

## Future Enhancements (Post-MVP)

- **Input compression**: Batch multiple inputs per message
- **Snapshot delta encoding**: Only send changed values
- **Adaptive tick rate**: Reduce update rate on slow connections
- **Lag compensation**: Rewind server state for hit detection
