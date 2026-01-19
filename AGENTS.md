# Broomsticks Project

## Overview

This is a preservation and port project for Broomsticks, a game originally created by Paul Rajlich. The project has two main goals:

1. **Preservation** - Archive the original source code and assets
2. **Modernization** - Port the game to HTML5/TypeScript/React

## Repository Structure

```
broomsticks/
├── archive/                # Original source code preservation
│   ├── broomsticks1-java/  # Java applet (2000-2003)
│   ├── broomsticks2-cpp/   # C++/SDL version (2003-2004)
│   ├── broomsticks-ios/    # iOS/Cocos2D port (2011)
│   └── guestbook/          # Original guestbook data
├── docs/                   # Technical documentation
├── web/                    # Modern HTML5 port (Vite/React/TypeScript)
│   ├── src/
│   ├── public/
│   ├── scripts/
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

- `html5-port-mvp-plan.md` - 8-phase implementation plan for the web port
- `gameplay-comparison.md` - Mechanics comparison across all three versions
- `broomsticks1-java-variant-comparison.md` - Analysis of the 8 Java applet variants
- `broomsticks-1-vs-2-comparison.md` - Technical comparison between Java and C++ versions
- `broomsticks2-cpp-macos-build.md` - Building the C++ version on modern macOS
- `interesting-guestbook-comments.md` - Curated guestbook comments from 2001-2005

## Web Development

The modern web port is located in `web/`.

```bash
cd web
bun install              # Install dependencies
bun run dev              # Start dev server
bun run build            # Build for production
bun run preview          # Preview production build
bun run test             # Run unit tests (54 tests)
bun run lint             # Run ESLint
bun run build:guestbook  # Regenerate modernized guestbook JSON
```

## Tech Stack (Web)

- Bun (runtime/package manager)
- Vite + React + TypeScript
- bun test for unit testing
- Fuse.js for fuzzy search (guestbook)

## HTML5 Port Progress

The port follows an 8-phase implementation plan (see `docs/html5-port-mvp-plan.md`).

### Phase 1: Core Engine ✅ COMPLETE

The game engine is fully implemented in `web/src/engine/` with 54 unit tests passing:

```
web/src/engine/
├── constants.ts          # Physics, dimensions, AI, scoring constants
├── config.ts             # Game configuration with defaults
├── types.ts              # TypeScript interfaces
├── Game.ts               # Main game class with state machine
├── entities/
│   ├── FlyingObject.ts   # Base class for all moving entities
│   ├── Person.ts         # Player entity (human/AI)
│   └── Ball.ts           # Ball entity (red/black/gold types)
├── systems/
│   ├── Physics.ts        # Fixed timestep, gravity, bounds
│   ├── Collision.ts      # Player-player, player-ball detection
│   ├── Scoring.ts        # Goal detection, win conditions
│   └── Input.ts          # Input abstraction layer
└── engine.test.ts        # Comprehensive test suite
```

Key engine features:
- Fixed 60Hz timestep with accumulator pattern
- Delta-time physics ported from C++ version
- Entity inheritance matching original architecture
- Event system for state changes, goals, collisions
- Configurable AI with difficulty levels

### Phase 2: Single Player (In Progress)

**Completed:**
- ✅ 2.1 Asset Extraction - sprites, backgrounds, audio in `web/public/`
- ✅ 2.2 PixiJS Renderer Setup - `web/src/renderer/GameRenderer.ts` with scaling, high-DPI
- ✅ 2.3 Sprite Implementation - `web/src/renderer/sprites/`
- ✅ 2.4 UI Rendering (PixiJS) - `web/src/renderer/ui/`

```
web/src/renderer/
├── GameRenderer.ts       # Main renderer with game event binding
├── sprites/
│   ├── PlayerSprite.ts   # Player sprites with directional frames
│   ├── BallSprite.ts     # Ball sprites (red/black/gold)
│   └── FieldSprite.ts    # Background, baskets, poles
├── ui/
│   ├── Scoreboard.ts     # Score display with highlights
│   ├── CountdownOverlay.ts # 3-2-1-GO countdown
│   ├── ScoreFlash.ts     # +10 animation on goal
│   └── WinScreen.ts      # Game over overlay
└── index.ts
```

Visual test page: `web/src/components/GameTest.tsx` - run `bun run dev` to test

**Remaining:**
- 2.5 AI Implementation
- 2.6 Keyboard Input
- 2.7 Audio System
- 2.8 React Integration
- 2.9 Settings UI
- 2.10 Particle Effects
