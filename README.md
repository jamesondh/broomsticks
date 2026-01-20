# Broomsticks

**Live at [broomsticks.xyz](https://broomsticks.xyz)**

A preservation and modernization project for **Broomsticks**, originally created by **Paul Rajlich**.

## About

Broomsticks is a classic multiplayer game where players on flying broomsticks compete to collect balls and score points. Originally released as a Java applet in the early 2000s, it was later ported to C++/SDL and iOS.

This repository preserves all original source code and aims to bring the game to modern web browsers.

## Repository Structure

```
broomsticks/
├── archive/                # Original source code
│   ├── broomsticks1-java/  # Java applet (~6,900 lines)
│   ├── broomsticks2-cpp/   # C++/SDL (~1,400 lines)
│   ├── broomsticks-ios/    # iOS/Cocos2D (~1,000 lines)
│   └── guestbook/          # Original guestbook data
├── docs/                   # Technical documentation
└── web/                    # Modern HTML5 port
```

## Archived Versions

| Version | Year | Technology | Notes |
|---------|------|------------|-------|
| **Broomsticks** | 2000-2003 | Java Applet | 8 development variants (Normal, Advanced, Expert, Demo) |
| **Broomsticks2** | 2003-2004 | C++/SDL | Cross-platform (Windows, Linux) |
| **Broomsticks iOS** | 2011 | Objective-C/Cocos2D | Mobile port by Cynthia Rajlich |

All versions share the same core architecture: `Person`, `Ball`, and `FlyingObject` classes with team-based gameplay (Red vs Black).

## Documentation

| Document | Description |
|----------|-------------|
| [HTML5 Port Plan](docs/html5-port-mvp-plan.md) | 8-phase implementation plan for the web port |
| [Gameplay Comparison](docs/gameplay-comparison.md) | Mechanics comparison across all three versions |
| [Java Variant Comparison](docs/broomsticks1-java-variant-comparison.md) | Analysis of the 8 Java applet variants |
| [Java vs C++ Comparison](docs/broomsticks-1-vs-2-comparison.md) | Technical comparison between versions |
| [Broomsticks 1 macOS Build Guide](docs/broomsticks1-java-macos-build.md) | Building the Java applet on modern macOS |
| [Broomsticks 2 macOS Build Guide](docs/broomsticks2-cpp-macos-build.md) | Building the C++ version on modern macOS |

## Current Status

- **Source code archived** - All three original versions preserved
- **Guestbook modernized** - Fuzzy search, deleted post visibility
- **HTML5 port** - Phase 1 complete, Phase 2 nearly complete (full game playable with settings)

### HTML5 Port Progress

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Core Engine | ✅ Complete |
| 2 | Single Player | 🔄 In Progress (2.1-2.9 done, 2.10 remaining) |
| 3 | Local Multiplayer | Pending |
| 4 | Online Multiplayer | Pending |
| 5 | 2v2 Mode & Passing | Pending |
| 6 | GoldBall & Polish | Pending |
| 7 | Quick Play Matchmaking | Pending |
| 8 | Mobile & Capacitor | Pending |

**Phase 2 Progress:**
- ✅ 2.1 Asset Extraction
- ✅ 2.2 PixiJS Renderer Setup
- ✅ 2.3 Sprite Implementation (PlayerSprite, BallSprite, FieldSprite)
- ✅ 2.4 UI Rendering (Scoreboard, Countdown, ScoreFlash, WinScreen)
- ✅ 2.5 AI Implementation (offensive/defensive modes, difficulty levels)
- ✅ 2.6 Keyboard Input (WASD/Arrow keys, InputManager abstraction)
- ✅ 2.7 Audio System (Howler.js, score/catch/bump/win sounds with mute toggle)
- ✅ 2.8 React Integration (MainMenu, GameScreen, SettingsScreen, ResultsScreen)
- ✅ 2.9 Settings UI (difficulty, ball counts, win score, audio with localStorage)
- ⏳ 2.10 Particle Effects

See [Implementation Plan](docs/html5-port-mvp-plan.md) for details.

## Development

```bash
cd web
bun install      # Install dependencies
bun run dev      # Start dev server
bun run build    # Build for production
bun run preview  # Preview production build
bun run test     # Run unit tests
```

## Credits

- **Original Author:** Paul Rajlich
- **iOS Port:** Cynthia Rajlich
- **Preservation & Web Port:** Jameson Hodge

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
