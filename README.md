# Broomsticks

**Live at [broomsticks.xyz](https://broomsticks.xyz)**

A preservation and modernization project for **Broomsticks**, originally created by **Paul Rajlich**.

## About

Broomsticks is a classic game that was originally released as:
- **Broomsticks** - Java applet
- **Broomsticks2** - C++/OpenGL/SDL
- **Broomsticks iOS** - Objective-C

This repository aims to preserve the original games and port them to modern web technologies (HTML5/TypeScript/React).

## Project Status

**Source code pending.** We are awaiting the original source code from Paul Rajlich. Once received, work will begin on the HTML5 port.

### Current Work
- Guestbook archive: Modernized with fuzzy search, showing deleted posts, and other improvements

### Planned
- HTML5 port of the original Broomsticks game
- Preservation of original source code

## Credits

- **Original Author:** Paul Rajlich - Creator of Broomsticks, Broomsticks2, and Broomsticks iOS
- **Preservation & Port:** Jameson Hodge

## Development

```bash
bun install              # Install dependencies
bun run dev              # Start dev server
bun run build            # Build for production (includes guestbook processing)
bun run preview          # Preview production build
bun run lint             # Run ESLint
bun run build:guestbook  # Regenerate modernized guestbook data
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
