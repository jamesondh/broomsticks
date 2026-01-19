# Broomsticks Java Applet Variant Comparison

This document provides a comprehensive analysis of the 8 Java applet variants of Broomsticks (2000-2003), totaling approximately 6,894 lines of code across 9 primary source files.

## Table of Contents

- [Overview](#overview)
- [Variant Summaries](#variant-summaries)
- [Feature Comparison Matrix](#feature-comparison-matrix)
- [Code Evolution Path](#code-evolution-path)
- [Class Hierarchy](#class-hierarchy)
- [Key Mechanics & Features](#key-mechanics--features)
- [Asset Structure](#asset-structure)
- [Notable Implementation Details](#notable-implementation-details)

---

## Overview

The archive contains 8 distinct variants representing different stages of development with varying feature sets, gameplay mechanics, and configuration options. Each variant builds upon previous work, culminating in a feature-rich standalone application.

| Variant | Version | Lines | Status |
|---------|---------|-------|--------|
| broomsticksOld | 1.01b | 478 | Earliest public release |
| broomsticks-devOld | 1.1 | 584 | Team system introduction |
| broomsticks | 1.26b | 865 | Feature-rich public release |
| broomsticksNewDev | 1.26b | 863 | Minimal assets variant |
| broomsticksExpert | 1.28 | 887 | Final applet version |
| broomDemo | 1.26b | 870 | Limited feature demo |
| broomsticksDevF | 1.5 | 1,051 | Most feature-rich development |
| broomsticksAdvanced | — | 1,296 | Standalone app with UI |

---

## Variant Summaries

### 1. broomsticksOld (Version 1.01b)

**Status:** Earliest public release
**Location:** `archive/broomsticks1-java/broomsticksOld/`

**Key Characteristics:**
- 4 player models (`img[4][2][2]`)
- 2 ball types
- Basic 2-player only (hardcoded: player1, player2)
- No audio support
- No parameterized configuration
- Minimal assets
- Individual player scoring

**Features:**
- Player collision bumping
- Ball catching mechanics
- Scoring system (10 points per goal, 50 to win)
- Model switching per player
- Mouse and keyboard controls
- Click-based gameplay UI

---

### 2. broomsticks-devOld (Version 1.1)

**Status:** Development version with team system
**Location:** `archive/broomsticks1-java/broomsticks-devOld/`

**Key Characteristics:**
- 8 player models (`img[8][2][2]`)
- 2 ball types
- 4-player support (array-based: `flyers[7]`)
- Multiple AI players with model IDs
- Team-based scoring (`teamScore[2]`)
- 50 images, 12 sound files
- 4 savefile versions for development checkpoints
- `FlyingObject` base class introduced

**Features:**
- Team-based architecture with `side` attribute
- Multiple ball management (ball1, ball2, redball)
- Background toggle (sky images)
- Center field rendering
- Team baskets on opposite sides
- Support for 4 independent players or 2 teams of 2

**Class Hierarchy:**
```
FlyingObject (base class)
├── Person (extends FlyingObject)
└── Ball (extends FlyingObject)
```

---

### 3. broomsticks (Version 1.26b - Main Release)

**Status:** Feature-rich public release
**Location:** `archive/broomsticks1-java/broomsticks/`

**Key Characteristics:**
- 10 player models (`img[10][2][2]`)
- 2 ball types
- 2 hardcoded players with single robot AI
- 62 custom images (playersXxx.gif variants)
- Extensive guestbook/marketing integration
- Marketing UI (mini CD info, website links, guestbook)

**Features:**
- Robot AI with skill levels (`smart` attribute, range 1-35)
- Skill adjustment keys (S/F)
- Player/Robot toggle with P key
- Extensive tutorial/rules screens
- Multiple game mode screens
- Background images (sky1.jpg, field.jpg)
- Logging to CGI (broomLog)
- Commercial game branding

**Unique Aspects:**
- Heavy UI emphasis with marketing content
- Complex screen state management (`pickedGame`, `readRules`)
- Player switching mechanic (up to 5 models: 0-4)
- "Click rather than hold" design philosophy documented

---

### 4. broomsticksNewDev (Version 1.26b - Concurrent Dev)

**Status:** Minimal assets variant
**Location:** `archive/broomsticks1-java/broomsticksNewDev/`

**Key Characteristics:**
- 10 player models (`img[10][2][2]`)
- 2 ball types
- Same core logic as broomsticks (1.26b)
- Only 6 image files (minimal/clean)
- No audio
- No parameterized configuration

**Analysis:**
This appears to be a pruned or distribution-ready version with the same version string as broomsticks (1.26b). Likely used for distributing without heavy media assets. All core game logic is identical to the broomsticks variant.

---

### 5. broomsticksExpert (Version 1.28)

**Status:** Expert/finalized applet version
**Location:** `archive/broomsticks1-java/broomsticksExpert/`

**Key Characteristics:**
- 10 player models
- 2 ball types
- 2 hardcoded players (same as 1.26b)
- No local assets (loaded from URL only)
- No audio
- Copyright 2000, 2001

**Differences from 1.26b:**
- Minor UI/mechanic refinements
- Likely the final applet-only version
- No on-disk assets requirement
- Enhanced version numbering (1.28 vs 1.26b)

---

### 6. broomDemo (Version 1.26b - Demo Version)

**Status:** Limited feature demo
**Location:** `archive/broomsticks1-java/broomDemo/`

**Key Characteristics:**
- 10 player models
- 2 ball types
- 2 hardcoded players
- 6 minimal images
- Same logic as broomsticks (1.26b)
- Copyright 2000

**Analysis:**
Demo/trial version with minimal assets for lightweight distribution.

---

### 7. broomsticksDevF (Version 1.5 - Full Development)

**Status:** Most feature-rich development version
**Location:** `archive/broomsticks1-java/broomsticksDevF/`

**Key Characteristics:**
- 10 player models (`img[10][2][2]`)
- **3 ball types** (`ballImg[3]`) - includes gold ball!
- 2-4 players configurable
- **GoldBall class** (extends Ball)
- **Audio system** with 4 clips (score, grab, bump, win)
- **Parameterized configuration** (parseParam methods)
- 9 images, 25 sound files
- 2 savefile versions

**GoldBall Mechanics:**
- Smart AI-controlled ball
- Appears after duration timer
- Chases players intelligently
- Higher speed (3x base speed)
- Smaller size (8x8 vs 17x17)

**Sound System:**
- AudioClip support (score, grab, bump, win)
- Toggle-able via keyboard

**Configuration Parameters:**

| Parameter | Description |
|-----------|-------------|
| `RED` | Number of red balls |
| `BLACK` | Number of black balls |
| `GOLD` | Number of gold balls |
| `SPEED` | Ball speed multiplier |
| `TEAMS` | Enable/disable team mode |
| `WINSCORE` | Points to win |
| `DURATION` | Seconds until gold ball |
| `PLAYERS` | Player image theme |
| `ITEMS` | Items image theme |
| `FIELD` | Field background |
| `BACKGROUND` | Sky image |
| `GOLDSMART` | Gold ball AI |
| `SLEEP` | Frame timing |

**Class Features:**
- Ball class properties: `catchable`, `alive`, `model`, `speedFactor`, `smart`
- GoldBall extends Ball with custom `move()` and `down()` methods
- Person class: `setKeys()`, `handleKeyEvent()`, `drawInfo()`

---

### 8. broomsticksAdvanced (Advanced Demo)

**Status:** Advanced configurable demo
**Location:** `archive/broomsticks1-java/broomsticksAdvanced/`

**Key Characteristics:**
- `BroomstickApplet` (UI controller) + `BroomPanel` (game panel) architecture
- 10 player models
- **3 ball types** (gold ball support)
- **GoldBall class implementation**
- 2-4 configurable players
- Window-based standalone app (not applet-only)
- Advanced UI with Choice/TextField controls
- 23 custom images
- WindowListener implementation

**Dynamic Parameter Selection:**

| Category | Options |
|----------|---------|
| Players | 2 or 4 |
| Diving | Enabled/disabled |
| Acceleration | 1, 2, 3 |
| Max Speed | 4, 5, 6, 7 |
| Field Dimensions | Width/height |
| Ball Counts | Red/black/gold |
| Gold Ball Points | 0-999 |
| Win Score | 0-999 |
| Duration | Seconds |
| Player Themes | Harden, Zelda, DBZ, etc. |
| Item Sets | Multiple options |
| Field/Sky Backgrounds | Multiple options |
| Sound | Toggle on/off |

**UI Components:**
- Choice dropdowns for game mode
- TextField inputs for numeric values
- Start button to open game window
- Parameter disabling ("LIMIT FOR DEMO")
- Dynamic intro images per theme

**Architecture:**
```
BroomstickApplet (extends Applet, implements WindowListener)
├── Configuration UI
├── Window management
└── Creates BroomPanel

BroomPanel (extends Panel, implements Runnable)
├── Actual game logic
├── Separate game thread
└── Independent of UI applet
```

**Multi-player System:**
- Supports 2 or 4 players via teams flag
- 6 configurable key sets
- Player info display (`drawInfo`)
- Per-player key binding

**Physics Enhancements:**
- `accel` and `maxspeed` parameters
- GoldBall uses acceleration model
- Ball type-specific speed factors

**Gold Ball Timer:**
- `drawTime()` method with visual progress
- Duration-based spawn
- Alert when time expires

---

## Feature Comparison Matrix

| Feature | Old | devOld | 1.26b | NewDev | Expert | Demo | DevF | Advanced |
|---------|:---:|:------:|:-----:|:------:|:------:|:----:|:----:|:--------:|
| **Players** | 2 | 4 | 2 | 2 | 2 | 2 | 2-4 | 2-4 |
| **Player Models** | 4 | 8 | 10 | 10 | 10 | 10 | 10 | 10 |
| **Ball Types** | 2 | 2 | 2 | 2 | 2 | 2 | **3** | **3** |
| **GoldBall** | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |
| **Team Mode** | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |
| **Audio** | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗* |
| **Parameterized Config** | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |
| **Robot AI** | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Skill Adjust** | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Diving** | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓* |
| **Background Toggle** | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Custom Themes** | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ | ✓ | ✓ |
| **Standalone App** | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |
| **Assets Included** | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ |

*Disabled/limited in demo version

---

## Code Evolution Path

```
broomsticksOld (1.01b) - Simplest, 2-player
    │
    ▼
broomsticks-devOld (1.1) - Team system intro, 4 players
    │
    ▼
broomsticks (1.26b) - Polished, marketing UI, heavy assets
    ├── broomsticksNewDev (1.26b) - Pruned assets variant
    ├── broomDemo (1.26b) - Minimal assets demo
    └── broomsticksExpert (1.28) - Final applet
            │
            ▼
broomsticksDevF (1.5 Full) - Major feature expansion
    ├── GoldBall system
    ├── Audio system
    ├── Parameter configuration
    └── 3 ball types
            │
            ▼
broomsticksAdvanced - Standalone app with UI
    ├── Window-based architecture
    ├── Advanced parameter selection UI
    ├── Theme support
    └── Largest codebase (1,296 lines)
```

---

## Class Hierarchy

### Core Game Objects

```
FlyingObject
├── Person
│   ├── AI: isRobot, smart (1-35), side (team)
│   ├── Model switching (5 models: 0-4 in 1.26b)
│   ├── Skill levels: dumber(), smarter()
│   └── Key binding: setKeys()
│
└── Ball
    ├── Basic physics: velocity, speedFactor, bounds()
    ├── Properties: catchable, alive, model
    ├── AI: random movement patterns
    │
    └── GoldBall (DevF, Advanced only)
        ├── Smart movement toward nearest player
        ├── Higher speed (3x)
        ├── Smaller size (8x8)
        ├── Spawn after duration timer
        └── down() method for vertical control
```

### Applet Architecture

```
Basic Applets (Old, 1.26b, Expert, NewDev, broomDemo)
├── BroomstickApplet extends Applet
├── Single file implementation
└── Direct game logic in applet

DevF (Development Full)
├── BroomstickApplet extends Applet
├── Parameter parsing with overloading
└── Audio clip management

Advanced (Most Complex)
├── BroomstickApplet (UI + Window management)
│   ├── WindowListener implementation
│   ├── Choice/TextField controls
│   └── Dialog-based parameter selection
│
└── BroomPanel extends Panel
    ├── Actual game logic
    ├── Runnable thread
    └── Separate from UI
```

---

## Key Mechanics & Features

### Physics Engine

| Property | Value |
|----------|-------|
| Gravity | `velocityY += 0.1` per frame (capped at 2.0) |
| Max horizontal speed | 4 |
| Max vertical speed | 4 / -4 |
| Collision detection | Distance-based (20px for player-ball) |
| Bounds | Bounces off edges, sits on ground |

### AI System

The robot AI uses a "smart" attribute ranging from 1-35, where lower values indicate smarter behavior:

```java
choice = random.nextInt() % smart;
if (choice == 0) {
    // Execute AI move
}
```

**GoldBall AI:** Tracks all players within 100px and chases the closest one.

### Scoring

| Setting | Value |
|---------|-------|
| Points per goal | 10 |
| Default win score | 50 |
| Catch distance | < 20px proximity |
| Basket detection | Y-position based (~15px tolerance) |

### Graphics Rendering

- **Sprite extraction:** `CropImageFilter` extracts 39x39 regions
- **Player sprites:** 10 models × 2 vertical × 2 horizontal = 40 sprites
- **Ball sprites:** 2-3 types depending on variant
- **Basket sprites:** 2 versions (normal/highlighted)
- **Double buffering:** Off-screen `Graphics2D` rendering

### Audio (DevF, Advanced)

| Clip | Trigger |
|------|---------|
| score | Goal success |
| grab | Ball caught |
| bump | Collision |
| win | Game victory |

Supported formats: AU (Sun), WAV (Windows), AIFF (Mac)

---

## Asset Structure

### Player Sprite Themes

**Default themes:**
- Default player sprites

**Custom character themes:**
- Adam, Andrew, Ari, Ben, Brad, Daniel, Davis, George, Jeronimus, Kalle, Michael, Paul, Sol, Ted, Tyler, Xmas

**Special themes:**
- DBZted (Dragon Ball Z)
- Kirby
- Harden
- Zelda
- Ness
- JLA (Justice League)
- Marill

### Background/Field Images

| Type | Files |
|------|-------|
| Sky | sky1.jpg - sky4.jpg |
| Field | field.jpg |
| Custom BGs | bgJeronimus4, bgSol, Future2, etc. |

### Audio Assets

- **Total files:** 25 in DevF, 12 in devOld
- **Sound names:** Bluup, bump, bump2, bump3, button, click, grab, hit, pop, score, smash, whip, win, ding, victory, youwin

---

## Notable Implementation Details

### Variable Parameter System (DevF/Advanced)

Overloaded `parseParam()` methods support multiple types:

```java
String parseParam(String name, String defaultValue)
boolean parseParam(String name, boolean defaultValue)
int parseParam(String name, int defaultValue)
float parseParam(String name, float defaultValue)
```

All parameters have sensible defaults and are passed through HTML applet tags.

### Multi-threaded Design

- Game runs in separate thread
- Main thread handles UI/rendering
- Sleep timing: 30ms during game, 1000ms idle
- Thread-safe null checking for `stop()`

### Image Processing

| Filter | Purpose |
|--------|---------|
| `AreaAveragingScaleFilter` | Background scaling |
| `CropImageFilter` | Sprite extraction |
| `FilteredImageSource` | Efficient filtering |

### Known Limitations

1. **broomsticksExpert:** No local assets (URL-only loading)
2. **broomsticksAdvanced:** Audio disabled with comment "LIMIT FOR DEMO!!"
3. Gold ball spawn animation/effects not implemented
4. No particle systems or advanced graphics
5. Simple rectangular collision detection only

---

## Summary

The Broomsticks Java applet evolved from a minimal 478-line 2-player game (v1.01b) to a comprehensive 1,296-line standalone application with configurable parameters, multiple themes, gold ball mechanics, and team play support.

**Key evolutionary milestones:**

| Version | Milestone |
|---------|-----------|
| 1.01b | Minimal viable product |
| 1.1 | Team system, multi-player foundation |
| 1.26b | Marketing-focused public release |
| 1.28 | Final applet polish |
| 1.5 | Feature explosion (audio, gold balls, params) |
| Advanced | Full standalone application |

The codebase demonstrates a classic iterative development approach, with each version building upon previous work while maintaining backwards-compatible game mechanics.
