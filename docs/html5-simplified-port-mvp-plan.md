# Broomsticks HTML5 Port - Simplified MVP Plan

A streamlined implementation plan based on a faithful port of Broomsticks 1 using vanilla Canvas, with multiplayer and mobile support.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Phase 1: Core Game (advanced2 Integration)](#phase-1-core-game-advanced2-integration)
- [Phase 2: Local Multiplayer (2-4 Players)](#phase-2-local-multiplayer-2-4-players)
- [Phase 3: Online Multiplayer](#phase-3-online-multiplayer)
- [Phase 4: Mobile & Capacitor](#phase-4-mobile--capacitor)
- [Phase 5: Polish (Optional)](#phase-5-polish-optional)

---

## Overview

### Goals

1. **Preserve** the original Broomsticks gameplay feel (advanced2 already does this)
2. **Simplify** by using the faithful vanilla Canvas port instead of PixiJS
3. **Add multiplayer** - local 4-player and online 1v1/2v2
4. **Support mobile** via touch controls and Capacitor

### Why advanced2?

The advanced2 port (now in `web/src/game/`) captures the original Java feel:
- 30ms physics timestep matching original applet
- Double-buffered Canvas rendering (like Java's Graphics2D)
- Exact collision thresholds and physics constants
- All original features: AI, gold ball, configurable settings, sound
- ~1,400 lines of vanilla JS vs ~5,000+ lines TypeScript/PixiJS

### Design Principles

- **Keep it simple** - vanilla Canvas, minimal framework usage
- **Faithful to original** - preserve the Java applet feel
- **React for routing only** - not for game rendering
- **Progressive enhancement** - each phase produces a playable game

---

## Architecture

### Directory Structure (Target)

```
web/
├── src/
│   ├── game/                    # Vanilla JS game (from advanced2)
│   │   ├── Game.js              # Main game class (~1,000 lines)
│   │   ├── FlyingObject.js      # Base physics class
│   │   ├── Person.js            # Player (human/AI)
│   │   ├── Ball.js              # Red/black balls
│   │   ├── GoldBall.js          # Gold ball with evasion AI
│   │   ├── BroomsticksGame.tsx  # React wrapper for game canvas
│   │   ├── game.css             # Game styles
│   │   ├── index.ts             # Exports
│   │   └── TouchControls.js     # Mobile touch input (Phase 4)
│   │
│   ├── multiplayer/             # Online multiplayer (Phase 3)
│   │   ├── PartyClient.ts       # WebSocket client
│   │   └── types.ts             # Message types
│   │
│   ├── pages/                   # React pages (Phase 3+)
│   │   └── LobbyPage.tsx        # Online multiplayer lobby
│   │
│   ├── components/              # Keep existing
│   │   ├── GuestbookSearch.tsx
│   │   └── GuestbookHighlights.tsx
│   │
│   ├── App.tsx                  # Minimal router
│   └── main.tsx
│
├── partykit/                    # PartyKit server (Phase 3)
│   ├── server.ts
│   └── partykit.json
│
├── public/
│   ├── game/                    # Game assets
│   │   ├── images/              # Game sprites
│   │   └── snd/                 # Game sounds
│   └── guestbook/               # Guestbook data
│
└── capacitor.config.ts          # Mobile config (Phase 4)
```

### Game Loop (advanced2)

```
┌──────────────────────────────────────────────────┐
│              Fixed 30ms Timestep                 │
│                                                  │
│  requestAnimationFrame                           │
│       ↓                                          │
│  accumulate elapsed time                         │
│       ↓                                          │
│  while (accumulated >= 30ms):                    │
│       ├── collect input                          │
│       ├── update physics (gravity, movement)     │
│       ├── check collisions                       │
│       ├── check scoring                          │
│       └── update AI                              │
│       ↓                                          │
│  render to offscreen canvas (628x368)            │
│       ↓                                          │
│  composite to main canvas with offset            │
│       ↓                                          │
│  draw UI (scores, borders)                       │
└──────────────────────────────────────────────────┘
```

---

## Phase 1: Core Game (advanced2 Integration)

**Goal**: Replace PixiJS implementation with advanced2, keep guestbook.

### 1.1 Move Game Code

- [x] Move `web/public/advanced2/js/*.js` to `web/src/game/`
- [x] Move assets to `web/public/game/images/` and `snd/`
- [x] Update import paths as needed

### 1.2 Create Minimal React Wrapper

- [x] Simplify `App.tsx` routing:
  - `/` - Landing page shows game directly
  - `/guestbook/*` - Existing guestbook functionality
- [x] Create `BroomsticksGame.tsx`:
  - Mounts canvas element
  - Instantiates Game class
  - Handles cleanup on unmount
  - Auto-scales to window size

### 1.3 Remove Obsolete Code

Deleted:
- [x] `src/engine/` (TypeScript game engine)
- [x] `src/renderer/` (PixiJS renderer)
- [x] `src/audio/` (Howler.js - advanced2 has built-in audio)
- [x] `src/components/screens/` (MainMenu, GameScreen, SettingsScreen, ResultsScreen)
- [x] `src/components/ui/` (Button, Slider)
- [x] `src/components/GameTest.tsx`
- [x] `src/hooks/useSettings.ts`

### 1.4 Update Dependencies

Removed from package.json:
- [x] `pixi.js`
- [x] `howler`
- [x] `@types/howler`

Kept:
- [x] `react`, `react-dom`
- [x] `fuse.js` (guestbook search)
- [x] Vite, TypeScript, ESLint

### Verification

- [x] `bun run dev` starts app
- [x] Can navigate between home and guestbook
- [ ] Game plays identically to original (manual testing)
- [x] Bundle size reduced (no PixiJS/Howler)

---

## Phase 2: Local Multiplayer (2-4 Players)

**Goal**: Support 2-player and 4-player local games.

### 2.1 Input Improvements

- [ ] Add WASD as alternative P1 controls
- [ ] Current bindings:
  - P1: E/S/F/D (up/left/down/right)
  - P2: Arrow keys
- [ ] New bindings for 4-player:
  - P3: I/J/K/L + U (pass)
  - P4: Numpad 8/4/5/6 + 0 (pass)

### 2.2 Pause Functionality

- [ ] Escape or P key to pause
- [ ] Simple pause overlay with Resume/Quit options
- [ ] Pause state in Game.js state machine

### 2.3 Quick Start Option

- [ ] "Quick Game" button that skips settings overlay
- [ ] Sensible defaults: 2 red balls, no gold, 30 to win
- [ ] Option to access full settings from quick game

### 2.4 4-Player Mode

- [ ] Mode select: 1v1 or 2v2 (local)
- [ ] 2 players per team (Red vs Black)
- [ ] Team scoring (both players contribute to team score)
- [ ] Player positioning: 2 on each side of field
- [ ] Teammate collision handling (pass-through or bump)

### 2.5 Gamepad Support (Optional)

- [ ] Gamepad API for up to 4 controllers
- [ ] D-pad/left stick for movement
- [ ] A button for jump, B for pass
- [ ] Show gamepad connection status

### Verification

- [ ] WASD controls work for P1
- [ ] Pause/resume works
- [ ] Quick game button works
- [ ] 4-player local game works with 4 keyboard zones
- [ ] (Optional) Gamepad controls work

---

## Phase 3: Online Multiplayer

**Goal**: WebSocket-based rooms with 4-character codes, supporting 1v1 and 2v2.

### 3.1 PartyKit Server

Create `partykit/server.ts`:
- [ ] Room lifecycle (create, join, leave)
- [ ] 4-character room codes (e.g., "ABCD")
- [ ] Support 2-player (1v1) and 4-player (2v2) rooms
- [ ] Game state synchronization

### 3.2 Message Protocol

```typescript
// Client → Server
type ClientMessage =
  | { type: 'join'; name: string; team?: 'red' | 'black' }
  | { type: 'ready' }
  | { type: 'input'; input: PlayerInput }
  | { type: 'leave' };

// Server → Client
type ServerMessage =
  | { type: 'joined'; playerId: string; roomCode: string }
  | { type: 'playerJoined'; name: string; team: string }
  | { type: 'playerLeft'; playerId: string }
  | { type: 'gameStart'; config: GameConfig }
  | { type: 'state'; state: GameState }
  | { type: 'gameOver'; winner: string };
```

### 3.3 Network Architecture (Keep Simple)

- [ ] **Host/Client model**: First player is host
- [ ] **Host responsibilities**:
  - Runs game physics at 30ms timestep
  - Broadcasts state at 20Hz (50ms)
  - Authoritative for all game logic
- [ ] **Client responsibilities**:
  - Sends inputs to host
  - Receives and renders state
  - No prediction initially (add later if needed)

### 3.4 Modify Game.js for Network

- [ ] Add `NetworkMode` flag
- [ ] Abstract input source (local keyboard vs network)
- [ ] Support receiving remote player inputs
- [ ] Serialize/deserialize game state

### 3.5 Room Code System

```javascript
// Avoid confusing characters: I, O, 0, 1
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateRoomCode() {
  return Array.from({ length: 4 }, () =>
    CHARS[Math.floor(Math.random() * CHARS.length)]
  ).join('');
}
```

### 3.6 Lobby UI

Create `LobbyPage.tsx`:
- [ ] Mode selection: 1v1 or 2v2
- [ ] "Create Room" → shows room code to share
- [ ] "Join Room" → code input field
- [ ] Team selection for 2v2 (Red or Black)
- [ ] Player list showing who's connected
- [ ] Ready-up system
- [ ] Start game when all players ready

### 3.7 4-Player Online (2v2)

- [ ] Room supports up to 4 players
- [ ] Team assignment on join
- [ ] Team chat/ready status
- [ ] AI fills empty slots if players leave
- [ ] Wait for minimum players before start

### Verification

- [ ] Can create room and get code
- [ ] Second player can join with code
- [ ] Game syncs between both players
- [ ] 2v2: 4 players can join same room
- [ ] Team selection works
- [ ] 4-player scoreboard displays correctly

---

## Phase 4: Mobile & Capacitor

**Goal**: Touch controls and native iOS/Android apps.

### 4.1 Touch Controls

Create `TouchControls.js`:
- [ ] Virtual joystick (left side) for movement
- [ ] Action area (right side) for jump/dive
- [ ] Semi-transparent, thumb-friendly sizing
- [ ] Multi-touch support

```javascript
class TouchControls {
  constructor(canvas) {
    this.joystickCenter = { x: 100, y: canvas.height - 100 };
    this.joystickRadius = 60;
    this.actionArea = { x: canvas.width - 150, y: canvas.height - 150 };
    // ...
  }

  handleTouchStart(e) { /* ... */ }
  handleTouchMove(e) { /* ... */ }
  handleTouchEnd(e) { /* ... */ }

  getInput() {
    return {
      up: this.direction.y < -0.3,
      down: this.direction.y > 0.3,
      left: this.direction.x < -0.3,
      right: this.direction.x > 0.3,
      pass: this.actionPressed
    };
  }
}
```

### 4.2 Mobile Detection

- [ ] Detect touch device via `'ontouchstart' in window`
- [ ] Auto-show touch controls on mobile
- [ ] Hide mouse cursor on touch devices
- [ ] Prevent pull-to-refresh and zoom gestures

### 4.3 Responsive Scaling

- [ ] Game already scales via `scaleGame()` function
- [ ] Ensure touch areas scale correctly
- [ ] Handle orientation changes (lock to landscape recommended)
- [ ] Support safe area insets (notch, home indicator)

### 4.4 Capacitor Setup

```bash
bunx cap init broomsticks com.broomsticks.app
bunx cap add ios
bunx cap add android
```

Configure `capacitor.config.ts`:
- [ ] App name and ID
- [ ] Webview settings
- [ ] Status bar configuration

### 4.5 Native Plugins

- [ ] `@capacitor/haptics` - Vibration on score/catch/bump
- [ ] `@capacitor/preferences` - Native storage (optional)
- [ ] `@capacitor/splash-screen` - Loading screen
- [ ] `@capacitor/status-bar` - Hide status bar in game

### 4.6 App Store Preparation

- [ ] App icons (all required sizes)
- [ ] Splash screens
- [ ] Screenshots for App Store/Play Store
- [ ] Privacy policy (no data collection)

### Verification

- [ ] Touch controls appear on mobile/tablet
- [ ] Joystick and action areas work correctly
- [ ] `bunx cap run ios` launches on simulator
- [ ] `bunx cap run android` launches on emulator
- [ ] Haptics fire on game events

---

## Phase 5: Polish (Optional)

### 5.1 Audio Improvements

- [ ] Volume slider in settings
- [ ] Mute button during gameplay
- [ ] Background music option

### 5.2 Statistics

- [ ] Win/loss record in localStorage
- [ ] Goals scored tracking
- [ ] Games played counter
- [ ] Display on main menu

### 5.3 Social Features

- [ ] Copy room code to clipboard
- [ ] Share link with room code embedded
- [ ] QR code for room joining (mobile)

### 5.4 PWA Support

- [ ] Service worker for offline single-player
- [ ] Add-to-home-screen prompt
- [ ] manifest.json with icons

### 5.5 Visual Enhancements

- [ ] Loading screen with progress
- [ ] Smooth screen transitions
- [ ] Optional particle effects on goals

---

## Technology Summary

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Game Engine | Vanilla JS (advanced2) | Faithful to original, simple |
| Rendering | Canvas 2D | Matches Java's Graphics2D |
| UI/Routing | React (minimal) | Just for navigation |
| Multiplayer | PartyKit | Simple WebSocket rooms |
| Mobile | Capacitor | iOS/Android from web code |
| Build | Vite + Bun | Fast, modern tooling |

---

## Timeline Summary

| Phase | Description | Builds On |
|-------|-------------|-----------|
| 1 | Core Game (advanced2) | - |
| 2 | Local Multiplayer (2-4 players) | Phase 1 |
| 3 | Online Multiplayer (1v1, 2v2) | Phase 2 |
| 4 | Mobile & Capacitor | Phase 1+ |
| 5 | Polish | Any phase |

Phase 4 (Mobile) can be developed in parallel with Phases 2-3 since it primarily adds touch input to the existing game.
