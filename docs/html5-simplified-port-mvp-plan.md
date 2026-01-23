# Broomsticks HTML5 Port - Simplified MVP Plan

A streamlined implementation plan based on a faithful port of Broomsticks 1 using vanilla Canvas, with multiplayer and mobile support.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Phase 1: Core Game (advanced2 Integration)](#phase-1-core-game-advanced2-integration)
- [Phase 2: Local Multiplayer (2-4 Players)](#phase-2-local-multiplayer-2-4-players)
  - [2.1 Menu Restructure](#21-menu-restructure)
  - [2.2 AI Difficulty](#22-ai-difficulty)
  - [2.3 Pause Functionality](#23-pause-functionality)
  - [2.4 Input Improvements](#24-input-improvements)
  - [2.5 4-Player Mode](#25-4-player-mode)
  - [2.6 Gamepad Support](#26-gamepad-support-optional)
- [Phase 3: Online Multiplayer](#phase-3-online-multiplayer)
  - [3.6 Online Menu UI](#36-online-menu-ui)
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
- [x] Game plays identically to original (manual testing)
- [x] Bundle size reduced (no PixiJS/Howler)

---

## Phase 2: Local Multiplayer (2-4 Players)

**Goal**: Support 2-player and 4-player local games with streamlined menu flow.

### 2.1 Menu Restructure

#### Problem

Current flow has 4 screens before gameplay:
```
MODE_SELECT → SETTINGS → RULES → READY (controls) → PLAYING
```
This creates too much friction, especially for returning players.

#### New Flow (2 clicks to play)

**Main Menu**
```
┌─────────────────────────────────┐
│         BROOMSTICKS             │
│                                 │
│     [ Single Player ]           │
│     [ Local Multiplayer ]       │
│     [ Online ]  →  submenu      │
│                                 │
│            [?] Help             │
│                                 │
│   Guestbook  •  GitHub          │
└─────────────────────────────────┘
```

**Help Menu** (from ? icon)
- Rules of the Game
- Controls Reference

**Single Player Pre-game**
```
┌─────────────────────────────────┐
│       SINGLE PLAYER             │
│                                 │
│  Difficulty: [Easy|Med|Hard]    │
│                                 │
│  ▶ Settings (collapsed)         │
│    • Ball counts, win score     │
│    • Gold ball, sprites, etc.   │
│                                 │
│         [ START ]               │
│                                 │
│         [← Back]                │
└─────────────────────────────────┘
```

**Local Multiplayer Pre-game**
```
┌─────────────────────────────────┐
│      LOCAL MULTIPLAYER          │
│                                 │
│  Players: [2] [4]               │
│                                 │
│  ▶ Settings (collapsed)         │
│                                 │
│         [ START ]               │
│                                 │
│         [← Back]                │
└─────────────────────────────────┘
```

#### Game States (Revised)

Replace current states with:

```javascript
export const GameState = {
    LOADING: 'loading',
    MAIN_MENU: 'main_menu',           // was MODE_SELECT
    HELP_MENU: 'help_menu',           // NEW: Rules/Controls access
    RULES: 'rules',                   // moved here, optional
    CONTROLS: 'controls',             // was READY, now optional
    PRE_GAME: 'pre_game',             // NEW: replaces SETTINGS
    ONLINE_MENU: 'online_menu',       // NEW: Quick Match / Private Room
    MATCHMAKING: 'matchmaking',       // NEW: searching overlay
    PRIVATE_ROOM_MENU: 'private_room_menu',  // NEW: Create/Join
    LOBBY: 'lobby',                   // NEW: private room lobby
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'game_over'
};
```

#### Flow Summary

| Mode | Flow | Clicks to Play |
|------|------|----------------|
| Single Player | Main Menu → Pre-game → Start | 2 |
| Local Multiplayer | Main Menu → Pre-game → Start | 2 |
| Quick Match | Main Menu → Online → Quick Match → (auto) | 2 |
| Private Room (host) | Main Menu → Online → Private → Create → Start | 4 |
| Private Room (join) | Main Menu → Online → Private → Join → Enter code | 4 |
| View Rules | Main Menu → Help → Rules | 2 |
| View Controls | Main Menu → Help → Controls | 2 |

#### Menu Implementation Tasks

- [x] Update `GameConstants.js`:
  - Add new game states
  - Add `GameMode` enum: `SINGLE`, `LOCAL`, `ONLINE`
  - Add `AIDifficulty` enum: `EASY`, `MEDIUM`, `HARD`
  - Add `AI_DIFFICULTY_SETTINGS` for Easy/Medium/Hard
  - Add `PREGAME_SETTINGS_LAYOUT` for expanded settings grid
- [x] Update `Game.js`:
  - Add `gameMode` property
  - Add `aiDifficulty` property
  - Add `playerCount` property (2 or 4 for local)
  - Update state transitions for new flow
  - Add `settingsExpanded` flag for collapsible settings
  - Add `setGameMode()`, `setDifficulty()`, `setPlayerCount()`, `toggleSettingsExpanded()`
  - Add `applyDifficulty()` and `startFromPreGame()`
- [x] Refactor `GameRenderer.js`:
  - `drawMainMenu()` - New main menu with mode buttons + help icon
  - `drawHelpMenu()` - Rules/Controls selection
  - `drawPreGame()` - Unified pre-game screen with inline settings
  - `drawExpandedSettings()` - 4-column settings grid
  - `drawOnlineMenu()` - Quick Match / Private Room submenu (UI only, Phase 3 networking)
  - `drawMatchmaking()` - Searching overlay with cancel
  - `drawPrivateRoomMenu()` - Create/Join selection
  - `drawLobby()` - Mock room lobby
  - Update `drawRulesScreen()` and add `drawControlsScreen()` (was READY)
  - Add helper methods: `drawButton()`, `drawToggleButton()`, `drawBackButton()`
- [x] Refactor `InputHandler.js`:
  - Update `handleClick()` for new state handlers
  - Add `handleMainMenuClick()`
  - Add `handleHelpMenuClick()`
  - Add `handleRulesClick()`, `handleControlsClick()`
  - Add `handlePreGameClick()`
  - Add `handleExpandedSettingsClick()` for 4-column grid
  - Add `handleOnlineMenuClick()`, `handleMatchmakingClick()`, `handlePrivateRoomMenuClick()`, `handleLobbyClick()`

### 2.2 AI Difficulty

- [x] Add difficulty settings via `AI_DIFFICULTY_SETTINGS`:
  - **Easy**: smart=30, reactionDelay=8
  - **Medium**: smart=20, reactionDelay=4 (default)
  - **Hard**: smart=10, reactionDelay=0
- [x] Expose difficulty selection on Single Player pre-game screen

### 2.3 Pause Functionality

- [x] Escape or P key to pause
- [x] Simple pause overlay with Resume/Quit options
- [x] Pause state in Game.js state machine

### 2.4 Input Improvements

- [x] Add WASD as primary P1 controls
- [x] Current bindings:
  - P1: E/S/F/D (up/left/down/right)
  - P2: Arrow keys
- [x] New bindings for 4-player:
  - P3: I/J/K/L + U (pass)
  - P4: Numpad 8/4/5/6 + 0 (pass)

### 2.5 4-Player Mode

- [ ] Mode select: 1v1 or 2v2 (local)
- [ ] 2 players per team (Red vs Black)
- [ ] Team scoring (both players contribute to team score)
- [ ] Player positioning: 2 on each side of field
- [ ] Teammate collision handling (pass-through or bump)

### 2.6 Gamepad Support (Optional)

- [ ] Gamepad API for up to 4 controllers
- [ ] D-pad/left stick for movement
- [ ] A button for jump, B for pass
- [ ] Show gamepad connection status

### Verification

- [x] Main menu displays with Single Player, Local Multiplayer, Online, Help
- [x] Single player flow: Main Menu → Pre-game → Start (2 clicks)
- [x] Local multiplayer flow: Main Menu → Pre-game → Start (2 clicks)
- [x] Settings expand/collapse on pre-game screen
- [x] Help menu shows Rules and Controls
- [x] AI difficulty affects gameplay (Easy/Medium/Hard via smart/reactionDelay)
- [x] Back buttons return to previous screen
- [x] Online menu structure displays (UI only, networking in Phase 3):
  - Quick Match shows searching overlay with Cancel
  - Private Room → Create/Join submenu
  - Lobby shows mock room code
- [ ] WASD controls work for P1
- [x] Pause/resume works (returns to MAIN_MENU)
- [ ] 4-player local game works with 4 keyboard zones
- [ ] (Optional) Gamepad controls work

---

## Phase 3: Online Multiplayer

**Goal**: WebSocket-based rooms with 4-character codes, supporting 1v1 and 2v2.

### 3.1 PartyKit Server

Created `partykit/` directory with:
- `partykit.json` - Server configuration
- `server.ts` - Room management server
- `package.json` - Dependencies (partykit ^0.0.111)
- `tsconfig.json` - TypeScript configuration

Implementation:
- [x] Room lifecycle (create, join, leave)
- [x] 4-character room codes (e.g., "ABCD")
- [x] Support 2-player (1v1) rooms
- [x] Game state synchronization
- [ ] Support 4-player (2v2) rooms

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

- [x] **Host/Client model**: First player is host
- [x] **Host responsibilities**:
  - Runs game physics at 30ms timestep
  - Broadcasts state at 20Hz (50ms)
  - Authoritative for all game logic
- [x] **Client responsibilities**:
  - Sends inputs to host
  - Receives and renders state
  - No prediction initially (add later if needed)

### 3.4 Modify Game.js for Network

Created `web/src/multiplayer/` module:
- `NetworkManager.js` - WebSocket client, host broadcasts at 20Hz
- `StateSerializer.js` - Compact state serialization/deserialization
- `names.js` - Random player name generator (Adjective + Noun + Number)
- `index.js` - Module exports

Modified game files:
- `GameConstants.js` - Added `NetworkMode` enum, `JOIN_ROOM` state
- `Game.js` - Network properties, createRoom/joinRoom methods, modified gameLoop
- `GameRenderer.js` - drawJoinRoom() with blinking cursor, updated drawLobby()
- `InputHandler.js` - Room code keyboard input (A-Z, 2-9, Backspace, Enter)

Implementation:
- [x] Add `NetworkMode` flag
- [x] Abstract input source (local keyboard vs network)
- [x] Support receiving remote player inputs
- [x] Serialize/deserialize game state

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

### 3.6 Online Menu UI

The online menu structure is defined in Phase 2's menu restructure. Phase 3 connects actual networking to these screens.

**Online Menu** (UI created in Phase 2)
```
┌─────────────────────────────────┐
│          ONLINE                 │
│                                 │
│     [ Quick Match ]             │  ← Matchmaking (1v1, fixed settings)
│     [ Private Room ]            │  ← Create/Join with codes
│                                 │
│         [← Back]                │
└─────────────────────────────────┘
```

#### Quick Match (Matchmaking)

- [ ] **1v1 only** - keeps queue population healthy
- [ ] **Fixed competitive settings** - 2 red balls, no gold, first to 30
- [ ] Simple overlay while searching:
```
┌─────────────────────────────────┐
│                                 │
│    Searching for opponent...    │
│                                 │
│          [ Cancel ]             │
│                                 │
└─────────────────────────────────┘
```
- [ ] When matched → brief "Found!" → auto-start game

#### Private Room Submenu
```
┌─────────────────────────────────┐
│       PRIVATE ROOM              │
│                                 │
│     [ Create Room ]             │
│     [ Join Room ]               │
│                                 │
│         [← Back]                │
└─────────────────────────────────┘
```

#### Private Room Lobby (Host)
```
┌─────────────────────────────────┐
│      ROOM: ABCD                 │
│    (share code with friend)     │
│                                 │
│  Players (auto-assigned teams): │
│  🔴 Red Team    │ ⚫ Black Team │
│  • You (host)   │ • (waiting)   │
│                                 │
│  Mode: [1v1] [2v2]              │
│                                 │
│  ▶ Settings (full control)      │
│    • Ball counts, win score     │
│    • Gold ball, etc.            │
│                                 │
│  [ START ] (when all joined)    │
│         [← Leave]               │
└─────────────────────────────────┘
```

#### Join Room Screen
```
┌─────────────────────────────────┐
│        JOIN ROOM                │
│                                 │
│  Enter code: [____]             │
│                                 │
│         [ JOIN ]                │
│         [← Back]                │
└─────────────────────────────────┘
```

#### Private Room Lobby (Guest)
```
┌─────────────────────────────────┐
│      ROOM: ABCD                 │
│                                 │
│  Players:                       │
│  🔴 Red Team    │ ⚫ Black Team │
│  • HostName     │ • You         │
│                                 │
│  Mode: 1v1                      │
│  Settings: (view only)          │
│                                 │
│  Waiting for host to start...   │
│         [← Leave]               │
└─────────────────────────────────┘
```

#### Online Mode Comparison

| Feature | Quick Match | Private Room |
|---------|-------------|--------------|
| Settings | Fixed competitive (2 red, no gold, 30 pts) | Host has full control |
| Mode | 1v1 only | 1v1 or 2v2 |
| Team assignment | Auto-balanced | Auto-balanced |
| Room code | Hidden (auto-matched) | Visible (share with friends) |

#### Lobby Implementation Tasks

- [x] Create `LobbyPage.tsx` or integrate into `GameRenderer.js`:
  - `drawMatchmaking()` - searching overlay with cancel
  - `drawPrivateRoomMenu()` - Create/Join selection
  - `drawLobby()` - room code, player list, settings (host/guest variants)
  - `drawJoinRoom()` - code entry screen
- [x] Connect PartyKit WebSocket to lobby state
- [ ] Team auto-assignment on join (deferred to 2v2)
- [ ] Ready-up system (deferred)
- [x] Start game when all players ready

### 3.7 4-Player Online (2v2)

- [ ] Room supports up to 4 players
- [ ] Team assignment on join
- [ ] Team chat/ready status
- [ ] AI fills empty slots if players leave
- [ ] Wait for minimum players before start

### Verification

- [x] Can create room and get code
- [x] Second player can join with code
- [x] Game syncs between both players (host-authoritative)
- [ ] 2v2: 4 players can join same room (future)
- [ ] Team selection works (future)
- [ ] 4-player scoreboard displays correctly (future)

### Deployment

To deploy the PartyKit server:

```bash
cd partykit
npx partykit login    # Create account if needed
npx partykit deploy   # Deploy server
```

The server URL will be: `wss://broomsticks.{username}.partykit.dev/party/{roomCode}`

Update `VITE_PARTYKIT_HOST` in `.env` or the default in `NetworkManager.js`.

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
