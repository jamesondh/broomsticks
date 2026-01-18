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
└── web/                    # Modern HTML5 port
```

## Archived Versions

| Version | Year | Technology | Notes |
|---------|------|------------|-------|
| **Broomsticks** | 2000-2003 | Java Applet | 8 development variants (Normal, Advanced, Expert, Demo) |
| **Broomsticks2** | 2003-2004 | C++/SDL | Cross-platform (Windows, Linux) |
| **Broomsticks iOS** | 2011 | Objective-C/Cocos2D | Mobile port by Cynthia Rajlich |

All versions share the same core architecture: `Person`, `Ball`, and `FlyingObject` classes with team-based gameplay (Red vs Black).

## Current Status

- **Source code archived** - All three original versions preserved
- **Guestbook modernized** - Fuzzy search, deleted post visibility
- **HTML5 port** - In progress

## Development

```bash
cd web
bun install      # Install dependencies
bun run dev      # Start dev server
bun run build    # Build for production
bun run preview  # Preview production build
```

## Credits

- **Original Author:** Paul Rajlich
- **iOS Port:** Cynthia Rajlich
- **Preservation & Web Port:** Jameson Hodge

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
