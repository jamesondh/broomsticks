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
│   ├── broomsticks1-java/  # Java applet (~6,900 lines, 8 variants)
│   ├── broomsticks2-cpp/   # C++/SDL (~1,400 lines)
│   ├── broomsticks-ios/    # iOS/Cocos2D (~1,000 lines)
│   └── guestbook/          # Original guestbook HTML
├── build/                  # Build artifacts (macOS builds)
├── docs/                   # Technical documentation
└── web/                    # Modern HTML5 port (Vite/React)
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
| [HTML5 Port Plan](docs/html5-simplified-port-mvp-plan.md) | 5-phase implementation plan for the web port |
| [Gameplay Comparison](docs/gameplay-comparison.md) | Mechanics comparison across all three versions |
| [Java Variant Comparison](docs/broomsticks1-java-variant-comparison.md) | Analysis of the 8 Java applet variants |
| [Java vs C++ Comparison](docs/broomsticks-1-vs-2-comparison.md) | Technical comparison between versions |
| [Broomsticks 1 macOS Build Guide](docs/broomsticks1-java-macos-build.md) | Building the Java applet on modern macOS |
| [Broomsticks 2 macOS Build Guide](docs/broomsticks2-cpp-macos-build.md) | Building the C++ version on modern macOS |

## Legacy Static Ports

Early experimental HTML5 ports are preserved in `web/public/`:

| Port | Source | Path |
|------|--------|------|
| **Broomsticks 2** | `archive/broomsticks2-cpp/` | `/2/` |
| **Demo** | `archive/broomsticks1-java/broomDemo/` | `/demo/` |
| **Advanced** | `archive/broomsticks1-java/broomsticksAdvanced/` | `/advanced/` |

The main app (`web/src/game/`) is a heavily modified version of the Advanced port with modular architecture, React integration, and enhanced features.

## Current Status

- **Source code archived** - All three original versions preserved
- **Guestbook modernized** - Fuzzy search, deleted post visibility
- **HTML5 port** - Playable at [broomsticks.xyz](https://broomsticks.xyz)

### HTML5 Port Progress

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Core Game | ✅ Complete |
| 2 | Local Multiplayer (2-4 Players) | 🔄 In Progress |
| 3 | Online Multiplayer (PartyKit) | 🔄 In Progress |
| 4 | Mobile & Capacitor | Pending |
| 5 | Polish (Optional) | Pending |

**Completed:**
- ✅ Core game engine (modular vanilla JS)
- ✅ React wrapper with auto-scaling
- ✅ Settings overlay (balls, gold ball, win score)
- ✅ Pause menu (Escape/P key)
- ✅ Game state machine (menu, playing, paused, game over)
- ✅ Online multiplayer infrastructure (1v1 private rooms)
  - PartyKit WebSocket server with room codes
  - Host-authoritative network model (30ms physics, 20Hz broadcast)
  - Room code input UI with 4-character codes
  - NetworkManager, StateSerializer, random player names

**Up next:** Deploy PartyKit server, 4-player local mode, Quick Match

See [Implementation Plan](docs/html5-simplified-port-mvp-plan.md) for details.

## Development

```bash
cd web
bun install      # Install dependencies
bun run dev      # Start dev server
bun run build    # Build for production
bun run preview  # Preview production build
bun run test     # Run unit tests
```

### PartyKit Server (Online Multiplayer)

```bash
cd partykit
bun install               # Install dependencies
npx partykit dev          # Start local dev server
npx partykit login        # Login/create account
npx partykit deploy       # Deploy to production
```

The server will be available at: `wss://broomsticks.{username}.partykit.dev/party/{roomCode}`

## Credits

- **Original Author:** Paul Rajlich
- **iOS Port:** Cynthia Rajlich
- **Preservation & Web Port:** Jameson Hodge

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
