# Broomsticks Project

## Overview

This is a preservation and port project for Broomsticks, a game originally created by Paul Rajlich. The project has two main goals:

1. **Preservation** - Archive the original source code and assets
2. **Modernization** - Port the game to HTML5/TypeScript/React

## Project Status

- **Source code not yet received** - Paul Rajlich is sending the original source for:
  - Broomsticks (Java applet)
  - Broomsticks2 (C++/OpenGL/SDL)
  - Broomsticks iOS (Objective-C)
- **Guestbook work complete** - The guestbook has been modernized with fuzzy search, deleted post visibility, etc.

## Tech Stack

- Bun (runtime/package manager)
- Vite + React + TypeScript
- The guestbook uses Fuse.js for fuzzy search

## Development

```bash
bun install              # Install dependencies
bun run dev              # Start dev server
bun run build            # Build for production (runs guestbook script, tsc, vite build)
bun run preview          # Preview production build
bun run lint             # Run ESLint
bun run build:guestbook  # Regenerate modernized guestbook JSON from scripts/modernize-guestbook.ts
```
