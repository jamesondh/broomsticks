# Broomsticks 1 (Java Advanced) vs Broomsticks 2 (C++/SDL) Comparison

This document provides a detailed technical comparison between the Java Advanced variant of Broomsticks 1 (~2001) and Broomsticks 2 C++/SDL port (~2003-2004).

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Architecture Comparison](#architecture-comparison)
- [Class Hierarchy](#class-hierarchy)
- [Physics Engine](#physics-engine)
- [Graphics System](#graphics-system)
- [Input Handling](#input-handling)
- [Configuration System](#configuration-system)
- [AI System](#ai-system)
- [Game Features](#game-features)
- [Platform Support](#platform-support)
- [Code Metrics](#code-metrics)
- [Notable Differences](#notable-differences)
- [Evolution Analysis](#evolution-analysis)

---

## Overview

| Aspect | Java Advanced | Broomsticks 2 (C++) |
|--------|---------------|---------------------|
| **Language** | Java | C++ |
| **Graphics API** | AWT/Graphics2D | SDL 1.x / Software rendering |
| **Time Period** | ~2001 | ~2003-2004 |
| **Lines of Code** | 1,296 | ~1,384 |
| **Primary Target** | Web applet + Standalone | Native desktop (Windows/Linux) |
| **Author** | Paul Rajlich | Paul Rajlich |

---

## Technology Stack

### Java Advanced

```
Java Runtime Environment
├── AWT (Abstract Window Toolkit)
│   ├── Graphics2D for rendering
│   ├── Image/ImageFilter for sprite handling
│   └── MediaTracker for asset loading
├── Applet framework
│   ├── AudioClip for sound
│   └── Parameter parsing from HTML
└── Event model (AWT 1.0 style)
```

### Broomsticks 2 (C++)

```
Native C++ Application
├── SDL 1.x (Simple DirectMedia Layer)
│   ├── SDL_Surface for rendering
│   ├── SDL_LoadBMP for image loading
│   ├── SDL_BlitSurface for sprite drawing
│   └── SDL_Event for input
├── File-based configuration (settings.txt)
└── Cross-platform build (Makefile + Visual Studio)
```

---

## Architecture Comparison

### Java Advanced Architecture

```
BroomstickApplet (UI Controller)
├── Applet lifecycle (init, start, stop, destroy)
├── WindowListener implementation
├── Configuration UI (Choice/TextField components)
│   ├── Players (2/4)
│   ├── Dive, Accel, MaxSpeed
│   ├── Ball counts (red/black/gold)
│   ├── Image themes (players, items, field, sky)
│   └── Sound toggle
└── Creates BroomPanel on game start

BroomPanel (Game Logic)
├── Extends Panel, implements Runnable
├── Separate game thread
├── Double-buffered rendering (offImage/offgc)
├── MediaTracker-based asset loading
├── Game loop with configurable sleep time
└── Contains all game objects (players[], balls[])
```

### Broomsticks 2 Architecture

```
br2.cxx (Main Entry Point)
├── main() - initialization and game loop
├── loadConfig() - file-based settings
├── handleEvent() - SDL event processing
├── moveFlyers(), checkCollisions(), checkCaught()
└── Static globals for game state

brGraphics (Graphics Layer)
├── SDL initialization
├── Image loading and scaling
├── Sprite drawing (players, items)
├── Text rendering (custom bitmap font)
└── Double-buffered via SDL_Flip()

Game Objects (Separate files)
├── FlyingObject.cxx/.h (base class)
├── Person.cxx/.h (player)
└── Ball.cxx/.h (ball)
```

### Key Architectural Differences

| Aspect | Java Advanced | Broomsticks 2 |
|--------|---------------|---------------|
| **Entry Point** | Applet.init() | main() |
| **Game Loop** | Thread.run() | while(!done) in main() |
| **State Management** | Instance variables in BroomPanel | Static globals |
| **Modularity** | Single file (1,296 lines) | Multiple files (5 source files) |
| **Config UI** | Built-in AWT components | External settings.txt file |

---

## Class Hierarchy

### Java Advanced

```java
Object
└── FlyingObject (inner class)
    ├── x, y, velocityX, velocityY
    ├── accel, maxSpeed, dive
    ├── catchable, isGoldBall
    ├── move(), bounds(), left(), right(), up(), down()
    │
    ├── Person extends FlyingObject
    │   ├── model, side, isRobot
    │   ├── target (Ball reference)
    │   ├── Key bindings (up/down/left/right/model/robot)
    │   ├── handleKeyEvent(), move() with AI
    │   ├── smarter(), dumber(), toggleRobot()
    │   └── draw(), drawInfo()
    │
    ├── Ball extends FlyingObject
    │   ├── model, alive
    │   ├── Random movement in move()
    │   └── draw()
    │
    └── GoldBall extends Ball
        ├── Smart AI (chases players)
        ├── Higher speed (2x maxSpeed, 2x accel)
        ├── Smaller size (8x8 vs 16x16)
        └── Custom down() method
```

### Broomsticks 2 (C++)

```cpp
FlyingObject (base class)
├── brGraphics *graphics
├── float x, y, vx, vy, accel, maxSpeed
├── int w, h, minx, miny, maxx, maxy
├── int catchable, isGoldBall, dive, pass, smart
├── virtual draw(), move()
├── reset(), bounds()
└── left(), right(), up(), down()

Person : public FlyingObject
├── int model, side, isRobot
├── Ball *target
├── Key bindings + KeyDown state tracking
├── int passBall (passing mechanic)
├── virtual erase(), draw(), move()
├── handleKeyEvent(), toggleRobot()
├── smarter(), dumber(), switchModel()
└── bump(), drawInfo()

Ball : public FlyingObject
├── int model, caught, lastCaught, alive
├── virtual erase(), draw(), move()
├── resetCaught(), setCaught()
└── Random AI movement
```

### Key Class Differences

| Feature | Java Advanced | Broomsticks 2 |
|---------|---------------|---------------|
| **GoldBall** | Separate class | Not implemented |
| **Passing** | Not implemented | Full passing system |
| **Key State Tracking** | None (event-driven) | KeyDown timestamps |
| **Continuous Input** | Click-based | Hold-to-move support |
| **Erase Method** | None (full redraw) | Per-object erase |

---

## Physics Engine

### Common Physics (Both Versions)

| Property | Value | Notes |
|----------|-------|-------|
| Gravity | `velocityY += 0.1` | Applied each frame when vy < 2 |
| Ground behavior | vy = 0, vx = 0 | Full stop on ground |
| Ceiling bounce | vy = -vy | Reflects velocity |
| Wall bounce | vx = -vx | Reflects velocity |
| Collision distance | 20 pixels | For player-ball catch |
| Player size | 38x38 pixels | Consistent across versions |
| Ball size | 16x16 pixels | Regular balls |

### Java Advanced Physics

```java
// Fixed frame rate physics
public void move() {
    x += velocityX;
    y += velocityY;
    if (velocityY < 2)
        velocityY += 0.1; // gravity
    bounds();
}

// Configurable parameters
float accel = 1-3 (Choice)
float maxspeed = 4-7 (Choice)
boolean dive = yes/no (Choice)
```

### Broomsticks 2 Physics

```cpp
// Delta-time based physics
extern int etime; // milliseconds since last frame

void FlyingObject::move() {
    x += vx * etime/40.0f; // normalized to 25 fps
    y += vy * etime/40.0f;
    if (vy < 2) vy += 0.1 * etime/40.0f;
    bounds();
}

// Capped delta time
if (etime > 100) etime = 100; // prevent physics explosion
```

### Physics Comparison

| Aspect | Java Advanced | Broomsticks 2 |
|--------|---------------|---------------|
| **Time Model** | Fixed frame rate | Delta-time based |
| **Frame Target** | 30ms sleep (~33 fps) | Configurable maxfps |
| **Delta Cap** | None | 100ms max |
| **Physics Scale** | Direct velocity | Normalized to 25 fps |

---

## Graphics System

### Java Advanced Graphics

```java
// Double buffering setup
Image offImage = createImage(width-22, height-52);
Graphics offgc = offImage.getGraphics();
offgc.translate(-11, -31);

// Sprite loading via ImageFilter
ImageFilter crop = new CropImageFilter(x, y, 39, 39);
ImageProducer producer = new FilteredImageSource(img.getSource(), crop);
Image sprite = createImage(producer);

// Background scaling
ImageFilter scale = new AreaAveragingScaleFilter(width-22, height-52);
ImageProducer bgSrc = new FilteredImageSource(bgImg.getSource(), scale);
Image backImg = createImage(bgSrc);

// Drawing
g.drawImage(sprite, x, y, this);
```

### Broomsticks 2 Graphics

```cpp
// SDL surface management
SDL_Surface *screen, *players, *items, *sky, *front;

// Color keying for transparency
SDL_SetColorKey(players, SDL_SRCCOLORKEY, white);

// Custom bilinear scaling
SDL_Surface* scaleSurface(SDL_Surface *src, int w, int h) {
    // 4-neighbor interpolation
    float wx = sfx - sx;
    float wy = sfy - sy;
    for (c=0; c<3; c++) {
        data[idx+c] = (Uint8) ((1-wx)*(1-wy)*rgb[0][c] +
                               wx*(1-wy)*rgb[1][c] +
                               (1-wx)*wy*rgb[2][c] +
                               wx*wy*rgb[3][c]);
    }
}

// Sprite blitting
SDL_Rect srcRect = {x, y, w, h};
SDL_Rect dstRect = {dx, dy};
SDL_BlitSurface(players, &srcRect, screen, &dstRect);

// Player animations
int anims = (players->h - 41)/200;
int frame = (now/animdelay)%anims;
```

### Graphics Comparison

| Feature | Java Advanced | Broomsticks 2 |
|---------|---------------|---------------|
| **Rendering** | Software (AWT) | Software (SDL) |
| **Transparency** | GIF alpha | Color key (white) |
| **Scaling** | AreaAveragingScaleFilter | Custom bilinear |
| **Animations** | None | Frame-based (configurable fps) |
| **Resolution** | 640x450 default | 640x480 to 1280x1024 |
| **Fullscreen** | No | Yes (SDL_FULLSCREEN) |
| **Double Buffer** | Manual offscreen image | SDL_Flip() |
| **Text** | Graphics.drawString() | Custom bitmap font |
| **Erase Strategy** | Full background redraw | Per-object sky blit |

---

## Input Handling

### Java Advanced Input

```java
// AWT 1.0 event model (deprecated but functional)
public boolean keyDown(Event e, int key) {
    for (int i=0; i<players.length; i++)
        players[i].handleKeyEvent(e, key);
    return false;
}

// Person key handling (immediate response)
public void handleKeyEvent(Event e, int key) {
    if (key == upKey) up();
    if (key == downKey) down();
    // ...
}

// Design philosophy: "Click rather than hold"
```

### Broomsticks 2 Input

```cpp
// SDL event polling
while (SDL_PollEvent(&event)) {
    handleEvent(event);
}

// Key state tracking with timestamps
void Person::handleKeyEvent(int key, int isDown) {
    if (!isDown) {
        if (key == upKey) upKeyDown = 0;
        // ...
        return;
    }
    if (key == upKey) upKeyDown = SDL_GetTicks();
    // ...
}

// Continuous movement in move()
void Person::move() {
    if (!isRobot) {
        int now = SDL_GetTicks();
        // Hold-to-move after 300ms delay
        if (upKeyDown && (now-upKeyDown > 300)) up();
        if (downKeyDown && (now-downKeyDown > 300)) down();
        // ...
    }
}
```

### Input Comparison

| Feature | Java Advanced | Broomsticks 2 |
|---------|---------------|---------------|
| **Model** | Click-based | Hybrid (click + hold) |
| **Event API** | AWT Event | SDL_Event |
| **State Tracking** | None | Timestamp-based |
| **Hold Delay** | N/A | 300ms before continuous |
| **Key Constants** | Event.UP, Event.DOWN | SDLK_UP, SDLK_DOWN |

---

## Configuration System

### Java Advanced Configuration

```java
// UI-based configuration via AWT components
Choice players  = newChoice("2", "4");
Choice dive     = newChoice("yes", "no");
Choice accel    = newChoice("1", "2", "3");
Choice maxspeed = newChoice("4", "5", "6", "7");
TextField red   = newText("1");
TextField black = newText("2");
TextField gold  = newText("1");
// ... 17 configurable parameters

// Demo limitations
players.select("2"); players.disable();
gold.setText("0");   gold.disable();
sound.select("off"); sound.disable();
```

### Broomsticks 2 Configuration

```cpp
// File-based configuration (settings.txt)
void loadConfig(char *filename) {
    FILE *fp = fopen(filename, "r");
    while (!feof(fp)) {
        fscanf(fp, "%s", key);
        if (!strcmp(key, "mode")) { ... }      // Resolution
        if (!strcmp(key, "fullscreen")) { ... } // Display mode
        if (!strcmp(key, "red")) { ... }        // Ball count
        if (!strcmp(key, "accel")) { ... }      // Physics
        if (!strcmp(key, "players")) { ... }    // Image path
        // ...
    }
}
```

**settings.txt format:**
```
fullscreen 1
mode 1          # 640x480
red 1
black 2
accel 2
maxSpeed 6
winscore 50
players imgs/players.bmp
sky imgs/sky.bmp
```

### Configuration Comparison

| Parameter | Java Advanced | Broomsticks 2 |
|-----------|---------------|---------------|
| **Player count** | 2, 4 (UI) | 2, 4 (runtime) |
| **Resolution** | 640x450 fixed | 640x480 to 1280x1024 |
| **Fullscreen** | No | Yes |
| **Ball counts** | red, black, gold | red, black (gold TODO) |
| **Physics** | accel 1-3, maxspeed 4-7 | accel, maxSpeed (float) |
| **FPS control** | 30ms sleep | maxfps, animfps |
| **Themes** | Players, items, field, sky | Players, items, sky, front, post |
| **Sound** | on/off | Not implemented |
| **Win score** | Configurable | Configurable |
| **Gold duration** | Seconds | Not implemented |

---

## AI System

### Common AI Behavior

Both versions use the same core AI algorithm for robot players:

```
if (team has ball) {
    move toward opponent's goal
    stay at basket height
} else {
    chase the target ball
    prioritize vertical positioning
    move horizontally when close
}
```

### Java Advanced AI

```java
// Smart attribute: 1 (smartest) to 30 (dumbest)
// Lower values = more frequent AI decisions
int choice = random.nextInt() % smart;
if (choice == 0) {
    // Execute AI logic
}

// GoldBall AI (chases players)
for (int i=0; i<bFrame.players.length; i++) {
    Person p = bFrame.players[i];
    int dx = (int) (x - p.x);
    int dy = (int) (y - p.y);
    if (Math.abs(dx) < 100 && Math.abs(dy) < 100) {
        // Flee from player
        if (p.x < x) right();
        if (p.x > x) left();
        // ...
    }
}
```

### Broomsticks 2 AI

```cpp
// AI decision rate: every 100ms
if (now - lastMoveTime >= 100) {
    lastMoveTime = now;
    int choices = smart/2 + 1;  // Different formula
    int choice = rand() % choices;
    if (choice == 0) {
        // Execute AI logic
    }
}
```

### AI Comparison

| Aspect | Java Advanced | Broomsticks 2 |
|--------|---------------|---------------|
| **Decision Rate** | Every frame | Every 100ms |
| **Smart Formula** | `rand() % smart` | `rand() % (smart/2+1)` |
| **Smart Range** | 1-30 | 1-30 |
| **GoldBall AI** | Yes (flee from players) | Not implemented |
| **Target Selection** | First ball (balls[0]) | First ball (balls[0]) |

---

## Game Features

### Feature Comparison Matrix

| Feature | Java Advanced | Broomsticks 2 |
|---------|:-------------:|:--------------:|
| **Players** | 2 or 4 | 2 or 4 |
| **Player Models** | 10 | 5+ (configurable) |
| **Red Balls** | Configurable | Configurable |
| **Black Balls** | Configurable | Configurable |
| **Gold Ball** | Yes | No (TODO) |
| **Team Mode** | Yes | Yes |
| **Robot AI** | Yes | Yes |
| **Skill Adjust** | Yes | Yes |
| **Model Switching** | Yes | Yes |
| **Diving** | Configurable | Yes |
| **Background Toggle** | Yes | No |
| **Sound Effects** | Yes (disabled in demo) | No (TODO) |
| **Ball Passing** | No | Yes |
| **Animations** | No | Yes |
| **Multiple Resolutions** | No | Yes |
| **Fullscreen** | No | Yes |
| **Demo Expiration** | No | Yes (date-based) |
| **Score Display** | Yes | Yes |
| **Player Info HUD** | Yes | Yes |

### Unique to Java Advanced

1. **GoldBall System**
   - Spawns after configurable duration
   - AI-controlled (flees from players)
   - Worth 150 points (configurable)
   - Smaller and faster (8x8, 2x speed)
   - Timer bar visualization

2. **Theme Selection UI**
   - Multiple player themes (Harden, Zelda, DBZ, etc.)
   - Dynamic intro image per theme
   - Sky background selection

3. **Sound System**
   - AudioClip support (score, grab, bump, win)
   - Toggle via UI (disabled in demo)

### Unique to Broomsticks 2

1. **Ball Passing**
   ```cpp
   if (numPlayers > 2 && p->getPassBall()) {
       b->setPass(1);
       Person *teammate;
       // Calculate direction to teammate
       float diffx = teammate->getX() - p->getX();
       float diffy = teammate->getY() - p->getY();
       float dist = sqrt(diffx*diffx + diffy*diffy);
       b->setVX(diffx/dist * 8.0f);
       b->setVY(diffy/dist * 8.0f);
   }
   ```

2. **Sprite Animations**
   - Multiple animation frames per character
   - Configurable animation delay
   - Ground detection (no animation when grounded)

3. **Delta-Time Physics**
   - Frame-rate independent movement
   - Smoother gameplay on varying hardware

4. **Resolution Support**
   - 640x480, 800x600, 1024x768, 1280x1024
   - Dynamic scaling of backgrounds
   - Bilinear interpolation

5. **Demo Expiration System**
   ```cpp
   time_t timeval = time(NULL);
   struct tm *ts = localtime(&timeval);
   // Date-based expiration logic
   daysLeft = 100; // Currently disabled
   ```

---

## Platform Support

### Java Advanced

| Platform | Support |
|----------|---------|
| Windows | Yes (JRE required) |
| macOS | Yes (JRE required) |
| Linux | Yes (JRE required) |
| Web Browser | Yes (Applet) |
| Standalone | Yes (via Frame) |

### Broomsticks 2

| Platform | Support | Build System |
|----------|---------|--------------|
| Windows | Yes | Visual Studio 6.0 (.dsw) |
| Linux/Unix | Yes | Makefile + g++ |
| macOS | Possible | Makefile (untested) |

**Build Requirements:**
- SDL 1.x development libraries
- C++ compiler (g++ or MSVC)
- BMP image files

---

## Code Metrics

### Line Count Comparison

| Component | Java Advanced | Broomsticks 2 |
|-----------|---------------|---------------|
| Main/Entry | 206 (BroomstickApplet) | 453 (br2.cxx) |
| Game Panel | 684 (BroomPanel) | - |
| Graphics | - | 284 (brGraphics.cxx) |
| FlyingObject | 109 | 102 |
| Person | 191 | 182 |
| Ball | 35 | 38 |
| GoldBall | 47 | - |
| Headers | - | ~125 |
| **Total** | **1,296** | **~1,384** |

### Structural Comparison

| Metric | Java Advanced | Broomsticks 2 |
|--------|---------------|---------------|
| **Files** | 1 | 9 (5 source, 4 headers) |
| **Classes** | 6 (all inner) | 4 |
| **Functions** | ~50 | ~60 |
| **Global State** | Minimal | Extensive |
| **Memory Management** | Automatic (GC) | Manual (new/delete) |

---

## Notable Differences

### 1. Single File vs Modular

**Java Advanced:** All 1,296 lines in one file with inner classes
```java
public class BroomstickApplet extends Applet {
    class BroomPanel extends Panel { ... }
    class FlyingObject { ... }
    class Person extends FlyingObject { ... }
    class Ball extends FlyingObject { ... }
    class GoldBall extends Ball { ... }
}
```

**Broomsticks 2:** Separate header and implementation files
```
FlyingObject.h / FlyingObject.cxx
Person.h / Person.cxx
Ball.h / Ball.cxx
brGraphics.h / brGraphics.cxx
br2.cxx
```

### 2. Rendering Strategy

**Java Advanced:** Full background redraw each frame
```java
public void update(Graphics g) {
    offgc.drawImage(backImg[1], 11, 31, this);  // Full background
    drawBaskets(offgc);
    drawScene(offgc);
    g.drawImage(offImage, 11, 31, this);        // Swap
}
```

**Broomsticks 2:** Per-object erase and redraw
```cpp
void erase() {
    for (int i=0; i<numPlayers; i++) players[i]->erase();
    for (int j=0; j<numBalls; j++) balls[j]->erase();
}

void Person::erase() {
    graphics->eraseBox((int) x, (int) y, 39, 39);  // Blit sky section
}
```

### 3. Configuration Philosophy

**Java Advanced:** GUI-driven, user-friendly
- Visual parameter selection
- Immediate feedback
- Demo restrictions in code

**Broomsticks 2:** Text file, power-user oriented
- Edit settings.txt before launch
- No runtime configuration UI
- More parameters exposed (bpp, maxfps, animfps)

---

## Evolution Analysis

### What Carried Over

1. **Core Game Model**
   - FlyingObject → Person/Ball hierarchy
   - Team-based scoring system
   - Same basket positioning logic
   - Identical collision detection approach

2. **AI Algorithm**
   - Same decision-making logic
   - Same smart attribute concept
   - Same target tracking behavior

3. **Physics**
   - Same gravity constant (0.1)
   - Same velocity caps
   - Same bounds behavior

### What Improved

1. **Performance**
   - Delta-time physics for smoother gameplay
   - Per-object erasing reduces redraw cost
   - Fullscreen support eliminates window overhead

2. **Flexibility**
   - Resolution independence
   - External configuration file
   - Modular code structure

3. **Features**
   - Ball passing for team play
   - Sprite animations
   - FPS display for debugging

### What Was Lost/Deferred

1. **GoldBall system** - Listed in TODO
2. **Sound effects** - Listed in TODO
3. **Theme selection UI** - Replaced by config file
4. **In-game help screens** - Removed

### Development Timeline

```
Java 1.01b (2000)
    │
    ▼
Java devOld 1.1 (2000-2001)
    │  Team system introduced
    ▼
Java 1.26b (2001)
    │  Robot AI, marketing UI
    ▼
Java Expert 1.28 (2001)
    │  Final applet polish
    ▼
Java DevF 1.5 (2001-2002)
    │  Gold ball, audio, parameters
    ▼
Java Advanced (2001-2002)
    │  Standalone app, full config UI
    │
    ════════════════════════════════════
    │  PLATFORM REWRITE
    ▼
Broomsticks 2 C++/SDL (2003-2004)
    │  Native performance
    │  New features (passing, animations)
    │  Some features deferred (gold, sound)
    ▼
broomsticks2-0.3-dev
    │
    ▼
broomsticks2-0.4-dev
    │
    ▼
broomsticks2-0.5-dev (final archived)
```

---

## Summary

Broomsticks 2 represents a native port of the Java Advanced variant, trading the web-deployable Java applet for improved performance and platform integration via SDL. While the core gameplay mechanics were preserved faithfully, the C++ version introduced frame-rate independent physics and sprite animations while deferring features like the GoldBall system and sound effects.

**Key Takeaways:**

| Aspect | Winner | Reason |
|--------|--------|--------|
| **Portability** | Java | Runs anywhere with JRE |
| **Performance** | C++ | Native code, fullscreen |
| **Configuration** | Java | Visual UI vs text file |
| **Features** | Java | GoldBall, sound, themes |
| **Code Quality** | C++ | Modular, maintainable |
| **Physics** | C++ | Delta-time model |
| **Animation** | C++ | Multi-frame sprites |
| **Team Play** | C++ | Ball passing system |

The transition from Java to C++/SDL marked a shift from web-centric distribution to native desktop gaming, reflecting the broader industry trends of the early 2000s as browser-based Java applets began to decline in favor of native applications.
