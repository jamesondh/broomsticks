# Broomsticks Project

## Overview

This is a preservation and port project for Broomsticks, a game originally created by Paul Rajlich. The project has two main goals:

1. **Preservation** - Archive the original source code and assets
2. **Modernization** - Port the game to HTML5 with multiplayer and mobile support

## Repository Structure

```
broomsticks/
├── archive/                # Original source code preservation
│   ├── broomsticks1-java/  # Java applet (2000-2003)
│   ├── broomsticks2-cpp/   # C++/SDL version (2003-2004)
│   ├── broomsticks-ios/    # iOS/Cocos2D port (2011)
│   └── guestbook/          # Original guestbook data
├── docs/                   # Technical documentation
├── web/                    # Modern HTML5 port (Vite/React)
│   ├── src/
│   │   ├── game/           # Vanilla JS game engine
│   │   ├── components/     # React components (guestbook)
│   │   └── App.tsx         # Minimal router
│   ├── public/
│   │   ├── game/           # Game assets (images, sounds)
│   │   └── guestbook/      # Guestbook data
│   └── ...
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
bun run build:guestbook  # Regenerate modernized guestbook JSON
```

## Tech Stack (Web)

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Game Engine | Vanilla JS | Faithful to original, simple |
| Rendering | Canvas 2D | Matches Java's Graphics2D |
| UI/Routing | React (minimal) | Just for navigation |
| Multiplayer | PartyKit (planned) | Simple WebSocket rooms |
| Mobile | Capacitor (planned) | iOS/Android from web code |
| Build | Vite + Bun | Fast, modern tooling |
| Guestbook Search | Fuse.js | Fuzzy search |

## HTML5 Port Progress

The port follows a simplified 5-phase implementation plan (see `docs/html5-simplified-port-mvp-plan.md`).

### Why the Simplified Approach?

The original 8-phase plan used PixiJS/TypeScript (~5,000+ lines). The simplified plan uses the faithful vanilla Canvas port (~1,400 lines) now in `src/game/` which:
- Captures the original Java feel with 30ms physics timestep
- Uses double-buffered Canvas rendering (like Java's Graphics2D)
- Has exact collision thresholds and physics constants
- Already includes AI, gold ball, configurable settings, and sound

### Current Architecture

```
web/src/
├── game/                     # Vanilla JS game
│   ├── Game.js               # Main game class (~1,000 lines)
│   ├── FlyingObject.js       # Base physics class
│   ├── Person.js             # Player (human/AI)
│   ├── Ball.js               # Red/black balls
│   ├── GoldBall.js           # Gold ball with evasion AI
│   ├── BroomsticksGame.tsx   # React wrapper for game canvas
│   ├── game.css              # Game styles
│   └── index.ts              # Exports
│
├── components/               # React components
│   ├── GuestbookSearch.tsx   # Guestbook search UI
│   └── GuestbookHighlights.tsx
│
├── hooks/
│   └── useGuestbookSearch.ts # Guestbook search hook
│
├── App.tsx                   # Minimal router
└── main.tsx

web/public/game/
├── images/                   # Game sprites
└── snd/                      # Game sounds
```

### Phase Progress

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Core Game | ✅ Complete |
| 2 | Local Multiplayer (2-4 Players) | Pending |
| 3 | Online Multiplayer (PartyKit) | Pending |
| 4 | Mobile & Capacitor | Pending |
| 5 | Polish (Optional) | Pending |

### Phase 1 Complete

- ✅ 1.1 Game code moved from `public/advanced2/js/` to `src/game/`
- ✅ 1.1 Assets moved to `public/game/`
- ✅ 1.2 React wrapper created (`BroomsticksGame.tsx`) with auto-scaling
- ✅ 1.2 `App.tsx` routing simplified (game at `/`, guestbook at `/guestbook/*`)
- ✅ 1.3 Obsolete TypeScript engine code removed
- ✅ 1.4 Dependencies updated (removed PixiJS, Howler)
