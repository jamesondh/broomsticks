# Broomsticks Project

## Overview

Preservation and port project for Broomsticks, originally created by Paul Rajlich.

1. **Preservation** - Archive the original source code and assets
2. **Modernization** - Port to HTML5 with multiplayer and mobile support

## Repository Structure

```
broomsticks/
├── archive/                # Original source code preservation
│   ├── broomsticks1-java/  # Java applet (2000-2003)
│   ├── broomsticks2-cpp/   # C++/SDL version (2003-2004)
│   ├── broomsticks-ios/    # iOS/Cocos2D port (2011)
│   └── guestbook/          # Original guestbook data
├── build/                  # Build artifacts (macOS builds)
├── docs/                   # Technical documentation
├── web/                    # Modern HTML5 port (Vite/React)
├── AGENTS.md               # This file (CLAUDE.md symlinks here)
├── README.md
└── LICENSE
```

## Archived Source Code

### Broomsticks 1 (Java Applet)
- **Location:** `archive/broomsticks1-java/`
- **Tech:** Java Applet, AWT Graphics2D
- **Size:** ~6,894 lines across 8 development variants
- **Variants:** devOld, Old, main, NewDev, DevF, Advanced, Expert, Demo
- **Assets:** GIF sprites, WAV/AIFF/AU audio

### Broomsticks 2 (C++/SDL)
- **Location:** `archive/broomsticks2-cpp/`
- **Tech:** C++, SDL, OpenGL
- **Size:** ~1,384 lines
- **Platforms:** Windows (Visual Studio), Linux/Unix (Makefile)
- **Assets:** BMP/PPM images

### Broomsticks iOS
- **Location:** `archive/broomsticks-ios/`
- **Tech:** Objective-C/C++, Cocos2D
- **Size:** ~1,014 lines
- **Author:** Cynthia Rajlich (August 2011)

### Shared Architecture
All versions share the same core game model:
- `Person` class - Player characters (controllable/AI)
- `Ball` class - Game balls with physics
- `FlyingObject` base class - Movable object inheritance
- Team-based scoring (Red vs Black)

## Documentation

Technical documentation lives in `docs/`:

- `html5-simplified-port-mvp-plan.md` - 5-phase implementation plan for the web port (current)
- `html5-port-mvp-plan.md` - Original 8-phase plan (deprecated)
- `gameplay-comparison.md` - Mechanics comparison across all three versions
- `broomsticks1-java-variant-comparison.md` - Analysis of the 8 Java applet variants
- `broomsticks-1-vs-2-comparison.md` - Technical comparison between Java and C++ versions
- `broomsticks1-java-macos-build.md` - Building the Java applet on modern macOS
- `broomsticks2-cpp-macos-build.md` - Building the C++ version on modern macOS

## Web Development

The modern web port is located in `web/`.

```bash
cd web
bun install              # Install dependencies
bun run dev              # Start dev server
bun run build            # Build for production
bun run preview          # Preview production build
bun run lint             # Run ESLint
bun run test             # Run tests
bun run build:guestbook  # Regenerate guestbook JSON from archived HTML
```

## Tech Stack (Web)

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Game Engine | Vanilla JS | Faithful to original, simple |
| Rendering | Canvas 2D | Matches Java's Graphics2D |
| UI/Routing | React (minimal) | Just for navigation |
| Multiplayer | PartyKit | WebSocket rooms with host-authoritative model |
| Mobile | Capacitor (planned) | iOS/Android from web code |
| Build | Vite + Bun | Fast, modern tooling |
| Guestbook Search | Fuse.js | Fuzzy search |

## HTML5 Port Progress

The port follows a simplified 5-phase implementation plan (see `docs/html5-simplified-port-mvp-plan.md`).

### Why Vanilla JS?

The original 8-phase plan used PixiJS/TypeScript (~5,000+ lines). The current approach uses a faithful vanilla Canvas port (~1,900 lines across modular files) which:
- Captures the original Java feel with 30ms physics timestep
- Uses double-buffered Canvas rendering (like Java's Graphics2D)
- Exact collision thresholds and physics constants from original
- Includes AI, gold ball, configurable settings, sound, and pause menu

### Current Architecture

```
web/src/
├── game/                     # Modular vanilla JS game engine
│   ├── Game.js               # Main game class, state machine, network integration
│   ├── GameRenderer.js       # All rendering (game, menus, overlays, lobby)
│   ├── GameConstants.js      # Configuration, constants, NetworkMode enum
│   ├── InputHandler.js       # Keyboard input, pause menu, room code input
│   ├── PhysicsManager.js     # Physics engine
│   ├── AssetManager.js       # Asset loading
│   ├── FlyingObject.js       # Base physics class
│   ├── Person.js             # Player (human/AI)
│   ├── Ball.js               # Red/black balls
│   ├── GoldBall.js           # Gold ball with evasion AI
│   ├── BroomsticksGame.tsx   # React wrapper for game canvas
│   ├── game.css              # Minimal game styles
│   └── index.ts              # Exports
│
├── multiplayer/              # Online multiplayer (Phase 3)
│   ├── NetworkManager.js     # WebSocket client for PartyKit
│   ├── StateSerializer.js    # Game state serialization for network
│   ├── names.js              # Random player name generator
│   └── index.js              # Module exports
│
├── components/               # React components
│   ├── GuestbookSearch.tsx   # Guestbook search UI
│   ├── GuestbookSearch.css
│   └── GuestbookHighlights.tsx
│
├── hooks/
│   └── useGuestbookSearch.ts # Guestbook search hook
│
├── data/                     # Static data
│   ├── archiveLinks.ts       # Links to archive versions
│   └── highlightedComments.ts
│
├── types/
│   └── guestbook.ts          # TypeScript types
│
├── styles/
│   ├── tokens.css            # Design tokens
│   └── index.css             # Global styles
│
├── App.tsx                   # Minimal router
└── main.tsx

partykit/                     # PartyKit multiplayer server
├── server.ts                 # Room management, message routing
├── partykit.json             # Server configuration
├── package.json              # Dependencies
└── tsconfig.json             # TypeScript config

web/public/
├── game/
│   ├── images/               # Game sprites (15+ variants)
│   └── snd/                  # Game sounds (AU/MP3)
├── guestbook/                # Guestbook data (JSON + archived HTML)
├── 2/                        # Legacy port of broomsticks2-cpp
├── advanced/                 # Legacy port of broomsticks1-java/broomsticksAdvanced
├── demo/                     # Legacy port of broomsticks1-java/broomDemo
└── fonts/                    # MS Sans Serif Extended
```

### Legacy Static Ports

Early experimental HTML5 ports preserved in `web/public/`:

| Port | Source | URL Path | Notes |
|------|--------|----------|-------|
| `2/` | `archive/broomsticks2-cpp/` | `/2/` | C++/SDL mechanics |
| `demo/` | `archive/broomsticks1-java/broomDemo/` | `/demo/` | Java Demo variant |
| `advanced/` | `archive/broomsticks1-java/broomsticksAdvanced/` | `/advanced/` | Java Advanced variant |

The main app (`web/src/game/`) is a heavily modified version of the Advanced port, refactored into modular architecture with React integration, pause menu, settings overlay, and other enhancements.

### Phase Progress

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Core Game | ✅ Complete |
| 2 | Local Multiplayer (2-4 Players) | 🔄 In Progress |
| 3 | Online Multiplayer (PartyKit) | 🔄 In Progress |
| 4 | Mobile & Capacitor | Pending |
| 5 | Polish (Optional) | Pending |

### Phase 1 Complete

- ✅ Game code moved to `src/game/` and modularized
- ✅ Assets in `public/game/`
- ✅ React wrapper with auto-scaling
- ✅ Routing: game at `/`, guestbook at `/guestbook/*`
- ✅ Removed PixiJS, Howler, obsolete TypeScript engine

### Phase 2 Progress

- ✅ Pause menu (Escape/P key) with Resume/Quit
- ✅ Game state machine (menu, playing, paused, game over)
- Pending: WASD controls, Quick Start, 4-player mode, gamepad

### Phase 3 Progress (Online Multiplayer)

- ✅ PartyKit server (`partykit/server.ts`) with room management
- ✅ NetworkManager WebSocket client with host/client modes
- ✅ StateSerializer for compact game state transmission
- ✅ Random player name generator
- ✅ Host-authoritative model (30ms physics, 20Hz state broadcast)
- ✅ 4-character room codes (avoiding confusing chars: I, O, 0, 1)
- ✅ JOIN_ROOM screen with code input and blinking cursor
- ✅ Lobby UI showing room code and player list
- ✅ Game.js network integration (createRoom, joinRoom, applyRemoteInput)
- Pending: PartyKit deployment, Quick Match, 2v2 mode
