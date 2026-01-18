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

- Bun (runtime/package manager)
- Vite + React + TypeScript
- Fuse.js for fuzzy search (guestbook)
