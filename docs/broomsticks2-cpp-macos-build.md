# Building Broomsticks2 C++ for macOS

This document describes how to build and run the original Broomsticks2 C++ game on modern macOS systems.

## Overview

Broomsticks2 was originally written for Linux/Windows using SDL 1.2 and pre-standard C++ (circa 2003-2004). The build system uses `sdl12-compat` to provide SDL 1.2 compatibility while leaving the original source code untouched.

## Prerequisites

Install sdl12-compat via Homebrew:

```bash
brew install sdl12-compat
```

## Build

```bash
cd build/broomsticks2-macos
make
```

This compiles the original source files from `archive/broomsticks2-cpp/` without modifying them.

## Run

The game must be run from the original source directory to find its assets:

```bash
make run
```

Or manually:

```bash
cd archive/broomsticks2-cpp
../../build/broomsticks2-macos/br2
```

## Windowed Mode

The game defaults to fullscreen which may cause issues on modern macOS. To run in windowed mode:

1. Copy the windowed settings:
   ```bash
   cp build/broomsticks2-macos/settings-windowed.txt archive/broomsticks2-cpp/settings.txt
   ```

2. Run the game normally

To restore fullscreen, edit `archive/broomsticks2-cpp/settings.txt` and set `fullscreen 1`.

## Controls

| Key | Action |
|-----|--------|
| Arrow Keys | Move player |
| Enter | Pass ball |
| Shift | Toggle robot mode (AI takes over) |
| Ctrl | Change player model |
| Space | Pause game |
| ESC / Q | Quit |

## Configuration (settings.txt)

The game reads configuration from `settings.txt` in the working directory.

### Display Settings

| Setting | Values | Description |
|---------|--------|-------------|
| `fullscreen` | 0, 1 | Window (0) or fullscreen (1) |
| `mode` | 1-4 | Resolution: 1=640x480, 2=800x600, 3=1024x768, 4=1280x1024 |
| `bpp` | 16, 24, 32 | Bits per pixel (color depth) |
| `maxfps` | number | Maximum frames per second |
| `animfps` | number | Animation frames per second |

### Gameplay Settings

| Setting | Values | Description |
|---------|--------|-------------|
| `red` | number | Number of red balls |
| `black` | number | Number of black balls |
| `winscore` | number | Score needed to win |
| `accel` | float | Flight acceleration |
| `maxspeed` | float | Maximum flight speed |

### Custom Assets

| Setting | Value | Description |
|---------|-------|-------------|
| `sky` | path | Background image (default: `imgs/sky.bmp`) |
| `players` | path | Player sprites image |
| `items` | path | Items sprite sheet |
| `front` | path | Foreground image |
| `post` | path | Goal post image |

### Example: Custom Background

To use a different sky background, add to `settings.txt`:

```
sky imgs/sky2.bmp
```

Available sky images: `sky.bmp`, `sky1.bmp`, `sky2.bmp`, `sky3.bmp`, `sky4.bmp`

## Technical Notes

### Compatibility Shims

The build system addresses two compatibility issues without modifying original source:

1. **SDL 1.2 API**: `sdl12-compat` translates SDL 1.2 calls to SDL2 at runtime
2. **Pre-standard C++**: An `iostream.h` shim in the build directory redirects to modern `<iostream>` and adds `using namespace std`

### Directory Structure

```
broomsticks/
├── archive/broomsticks2-cpp/   # Original source (UNTOUCHED)
│   ├── br2.cxx                 # Main game loop
│   ├── brGraphics.cxx          # Graphics/rendering
│   ├── Person.cxx              # Player class
│   ├── Ball.cxx                # Ball physics
│   ├── FlyingObject.cxx        # Base class
│   ├── settings.txt            # Game configuration
│   └── imgs/                   # Game assets
└── build/broomsticks2-macos/   # macOS build files
    ├── Makefile                # Build configuration
    ├── iostream.h              # C++ compatibility shim
    ├── settings-windowed.txt   # Example windowed config
    ├── *.o                     # Compiled objects (generated)
    └── br2                     # Game binary (generated)
```

### Tested On

- macOS Sonoma (Apple Silicon)
- sdl12-compat 1.2.x (via Homebrew)
- clang++ with C++11 mode
