# Broomsticks Gameplay Comparison

A detailed analysis comparing gameplay mechanics across the three archived versions to inform the HTML5 port.

## Overview

| Aspect | Java Applet (2000-2003) | C++/SDL (2003-2004) | iOS/Cocos2D (2011) |
|--------|------------------------|---------------------|-------------------|
| **Lines of Code** | ~6,894 | ~1,384 | ~1,014 |
| **Primary Input** | Keyboard | Keyboard | Touch |
| **Player Modes** | 1v1, 2v2 (DevF) | 1v1, 2v2 | 1v1 only |
| **Resolution** | 650×410 | 640×480 to 1280×1024 | 480×320 |

---

## 1. Game Rules & Scoring

### Win Condition
All three versions share the same win condition:
- **First to 50 points wins**
- **10 points per goal**
- 5 successful baskets required to win

### Scoring Mechanics

| Mechanic | Java | C++/SDL | iOS |
|----------|------|---------|-----|
| **Goal Detection** | Ball within 15px of basket y=200 | Ball within 20px of basket center | Ball within 20px of midH |
| **Left Basket X** | x < 17 | x < 17 | x = 17 |
| **Right Basket X** | x > 633 | x > width-17 | x = width-17 |
| **Score Flash** | Yes | Yes (gold highlight) | Yes (300ms) |

### Ball Types

| Ball Type | Java | C++/SDL | iOS |
|-----------|------|---------|-----|
| **Red (Catchable)** | 1 | 1 (configurable) | 1 |
| **Black (Obstacle)** | 2 | 2 (configurable) | 1 |
| **Gold (Special)** | DevF only | Supported | Framework only |

### Team Structure

| Mode | Java | C++/SDL | iOS |
|------|------|---------|-----|
| **1v1** | Yes (main) | Yes | Yes (only mode) |
| **2v2** | DevF variant | Yes (SPACEBAR toggle) | No |
| **Teams** | Blue vs Green | Red vs Black | Red vs Black |

---

## 2. Physics System

### Core Physics Constants

| Constant | Java | C++/SDL | iOS | Notes |
|----------|------|---------|-----|-------|
| **Gravity** | 0.1/frame | 0.1/frame | 0.1/frame | Identical across versions |
| **Terminal Velocity** | 2.0 | N/A (implied) | vy < 2 threshold | Java explicitly caps |
| **Acceleration** | 2.0 | 2.0 (configurable) | 2.0 | Consistent |
| **Max Speed** | 4.0 | 6.0 (configurable) | 6.0 | **Java is slower** |
| **Frame Target** | ~33 FPS | 25 FPS base | 25 FPS base | C++/iOS use time scaling |

### Movement Formula

**Java (Fixed Frame):**
```
x += velocityX * speedFactor
y += velocityY * speedFactor
velocityY += 0.1  // gravity
if (velocityY > 2.0) velocityY = 2.0  // cap
```

**C++/SDL & iOS (Time-Scaled):**
```
x += vx * etime/40.0f
y += vy * etime/40.0f
if (vy < 2) vy += 0.1 * etime/40.0f  // gravity
```

**Key Difference:** C++/SDL and iOS use delta-time scaling for smoother animation on variable frame rates. Java uses fixed-step physics.

### Boundary Behavior

| Boundary | Java | C++/SDL | iOS |
|----------|------|---------|-----|
| **Wall Bounce** | vx = -vx | vx = -vx | vx = -vx |
| **Ceiling Bounce** | vy = -vy; if vy==0, vy=0.1 | vy = -vy; if vy==0, vy=0.1 | vy = -vy |
| **Ground Landing** | vx=0, vy=0 (full stop) | vx=0, vy=0 (full stop) | vx=0, vy=0 (full stop) |
| **Field Bounds (X)** | 11-639 | 0 to width | 0 to maxX-w |
| **Field Bounds (Y)** | 31-399 | 20 to height-20 | 0 to maxY-h |

### Object Dimensions

| Object | Java | C++/SDL | iOS |
|--------|------|---------|-----|
| **Player Size** | 38×38 px | 38×38 px | 38×38 px |
| **Ball Size** | 17×17 px | 16×16 px | 16×16 px |
| **Collision Radius (P-P)** | 34 px (w-4) | ~38 px | 28 px (w-10) |
| **Catch Radius (P-Ball)** | 20 px | 20 px | 20 px |

---

## 3. Controls

### Java Applet Controls

**Player 1 (Blue/Left):**
| Action | Key |
|--------|-----|
| Jump/Up | E |
| Left | S |
| Right | F |
| Switch Model | 1 |
| Toggle AI | P |

**Player 2 (Green/Right):**
| Action | Key |
|--------|-----|
| Jump/Up | Arrow Up |
| Left | Arrow Left |
| Right | Arrow Right |
| Switch Model | Enter |
| Background | B |

### C++/SDL Controls

**Player 1 (Red/Left):**
| Action | Key |
|--------|-----|
| Up | E |
| Down | X |
| Left | S |
| Right | F |
| Model | 1 |
| Pass | 2 |
| AI Toggle | 4 |

**Player 2 (Black/Right):**
| Action | Key |
|--------|-----|
| Up/Down/Left/Right | Arrow Keys |
| Pass | Enter |
| AI Toggle | Right Shift |
| AI Difficulty | Right Ctrl |

**Player 3 & 4 (2v2 Mode):**
| P3 | P4 |
|----|-----|
| I/M/J/L movement | Home/End/Del/PgDn |
| 7 model, 8 pass | Insert pass |
| 0 AI toggle | PgUp AI toggle |

**Global:**
| Action | Key |
|--------|-----|
| Toggle 1v1/2v2 | Spacebar |
| Quit | ESC or Q |

### iOS Touch Controls

| Action | Gesture |
|--------|---------|
| Move Player | Touch anywhere on field |
| Pause/Resume | Touch bottom center (200-280px) |
| Cycle AI Difficulty | Touch player buttons during pause |

**Touch-to-Move Formula:**
```
setDest(touchX - w/2, screenHeight - touchY - h/2)
velocity = normalize(dest - pos) * maxSpeed
```

### Control Philosophy Comparison

| Aspect | Java | C++/SDL | iOS |
|--------|------|---------|-----|
| **Input Type** | Impulse per keypress | Continuous hold | Direct destination |
| **Movement Feel** | Tap-tap-tap | Hold to move | Point to go |
| **Precision** | High (discrete) | Medium | Low (touch imprecision) |
| **Learning Curve** | Steep | Medium | Easy |

---

## 4. Artificial Intelligence

### AI Difficulty System

All versions use the same "smart" parameter system:

| Smart Value | Difficulty | Decision Frequency |
|-------------|------------|-------------------|
| 1 | Expert/Very Hard | Every decision frame |
| 3 | Hard | Every 2-3 decisions |
| 6 | Medium | Every 4 decisions |
| 12-15 | Easy (Default) | Every 7-8 decisions |
| 30 | Very Easy | Every 16 decisions |

**Decision Formula:**
```
choices = smart/2 + 1
if (random() % choices == 0) {
    executeOptimalMove()
}
```

### AI Decision Interval

| Version | Interval | Notes |
|---------|----------|-------|
| Java | Every frame | Probability-based |
| C++/SDL | 100ms | Timer-based |
| iOS | 100ms | Timer-based |

### AI Behavior States

**State 1: Has Ball (Offensive)**
```
if (team == left) {
    if (x < goal_x) move_right()
    if (y > basket_height) move_up()
}
```

**State 2: Chasing Ball (Defensive)**
```
if (ball.y < player.y) move_up()
if (|ball.y - player.y| < 100) {
    if (ball.x < player.x - 10) move_left()
    if (ball.x > player.x + 10) move_right()
}
```

### AI Skill Adjustment

| Version | Increase Difficulty | Decrease Difficulty |
|---------|---------------------|---------------------|
| Java | S key (smart -= 5) | F key (smart += 5) |
| C++/SDL | Left arrow (smart -= 5) | Right arrow (smart += 5) |
| iOS | Touch buttons during pause | Touch buttons during pause |

---

## 5. Ball Behavior

### Autonomous Ball Movement

All versions implement random ball "AI" when balls are not held:

| Behavior | Java | C++/SDL | iOS |
|----------|------|---------|-----|
| **Decision Interval** | 20% chance/frame | 100ms | 100ms |
| **Up Chance** | 5% | 10% | 10% |
| **Right Chance** | 5% | 10% | 10% |
| **Left Chance** | 5% | 10% | 10% |
| **Idle Chance** | 85% | 70% | 70% |
| **Auto-bounce Height** | y > 330 | y > height-90 | y > maxY-90 |

### Passing Mechanics (2v2 Mode)

Only Java (DevF) and C++/SDL support passing:

| Mechanic | Java | C++/SDL |
|----------|------|---------|
| **Pass Velocity** | 8.0 | 8.0 |
| **Pass Direction** | Normalized to teammate | Normalized to teammate |
| **Pass Offset** | 6× velocity + random | 6× velocity + random(0-4) |

---

## 6. Collision System

### Collision Detection Method

All versions use axis-aligned bounding box (AABB) collision with Manhattan distance:
```
collision = abs(dx) < radius && abs(dy) < radius
```

### Collision Effects

| Collision Type | Effect |
|----------------|--------|
| **Player-Player** | Lower player bumps upper player down (y=10000, then bounds clamp) |
| **Player-Catchable Ball** | Ball snaps to player, team gains possession |
| **Player-Black Ball** | Player bumped down |
| **Ball-Wall** | Velocity reversal |
| **Ball-Ground** | Full stop (vx=0, vy=0), pass flag cleared |

### Ball Catching Position

When a player catches the ball:
```
if (player.vx > 0) {
    ball.x = player.x + 18  // Ball held on right side
} else {
    ball.x = player.x + 8   // Ball held on left side
}
ball.y = player.y + 15
```

---

## 7. Visual & Audio

### Character Models

| Version | Player Models | Team Colors |
|---------|---------------|-------------|
| Java (Old) | 4 models (0-3) | Blue vs Green |
| Java (Main) | 10 models (0-9) | Blue vs Green |
| C++/SDL | Sprite sheet based | Red vs Black |
| iOS | 5 difficulty models | Red vs Black |

### Animation

| Aspect | Java | C++/SDL | iOS |
|--------|------|---------|-----|
| **Directional Frames** | 4 (left/right × up/down) | Yes | Yes |
| **Ground Idle** | Frame 0 | Frame 0 when y > ground-15 | Frame 0 |
| **Animation Speed** | Fixed | 250ms (configurable) | Calculated |

### Audio

| Sound | Java | C++/SDL | iOS |
|-------|------|---------|-----|
| **Score** | DevF only | Not found | Yes |
| **Grab/Catch** | DevF only | Not found | Yes |
| **Bump** | DevF only | Not found | Yes |
| **Win** | DevF only | Not found | Yes |

---

## 8. Configuration & Customization

### Java (DevF Full Version)

```
Parameters via HTML applet tags:
- GOLDSMART: Gold ball AI difficulty
- Acceleration: 1, 2, or 3
- Max Speed: 4, 5, 6, or 7
- Ball counts: Configurable
- Team sizes: 2-4 players
```

### C++/SDL (settings.txt)

```
mode 1              # Resolution (1-4)
fullscreen 1        # Display mode
red 1               # Red ball count
black 2             # Black ball count
winscore 50         # Win threshold
accel 2             # Acceleration
maxspeed 6          # Speed cap
maxfps 1000         # Frame cap
animfps 4           # Animation speed
```

### iOS

Hardcoded values, no configuration file. Difficulty adjusted via pause screen only.

---

## 9. Recommendations for HTML5 Port

### Physics System
1. **Use time-scaled physics** (C++/iOS approach) for smooth animation on variable refresh rates
2. **Adopt max speed of 6** (C++/iOS) rather than 4 (Java) for faster, more exciting gameplay
3. **Keep gravity at 0.1** - consistent across all versions and feels natural
4. **Implement delta-time capping** (100ms max) to prevent physics explosions on tab-switch

### Controls
1. **Support multiple input methods:**
   - Keyboard (WASD + Arrow keys) for desktop
   - Touch-to-move for mobile (iOS approach)
   - Gamepad support (modern addition)
2. **Consider hybrid control:** Keyboard for precision, touch for casual play
3. **Add key rebinding** - the original key layouts (E/S/F) are non-standard

### Game Modes
1. **Implement 1v1 first** (core experience across all versions)
2. **Add 2v2 as stretch goal** (C++/SDL has best implementation)
3. **Consider online multiplayer** (original was local only)

### AI System
1. **Use 100ms decision interval** (C++/iOS) rather than per-frame (Java)
2. **Keep smart parameter range 1-30** with default of 15
3. **Expose difficulty selection clearly** in UI (iOS approach)
4. **Consider multiple AI personalities** beyond just reaction speed

### Visual/Audio
1. **Support high-DPI displays** (none of originals did)
2. **Add sound effects** (only DevF Java and iOS had audio)
3. **Use sprite sheets** (C++/SDL approach) for efficient rendering
4. **Support dynamic resolution** rather than fixed dimensions

### Configuration
1. **Use localStorage** for settings persistence (like C++/SDL's settings.txt)
2. **Expose key physics constants** for game balancing
3. **Allow ball count configuration** (1-3 of each type)

### Unique Opportunities
1. **Replay system** - original versions had no replay capability
2. **Online leaderboards** - track high scores against AI
3. **Custom player skins** - extend the model system
4. **Tutorial mode** - original games had minimal onboarding

---

## 10. Core Constants for Port

Based on analysis, these are the recommended baseline constants:

```typescript
// Physics
const GRAVITY = 0.1;
const ACCELERATION = 2.0;
const MAX_SPEED = 6.0;
const TERMINAL_VELOCITY = 2.0;
const BASE_FRAME_TIME = 40; // 25 FPS baseline for scaling

// Scoring
const WIN_SCORE = 50;
const POINTS_PER_GOAL = 10;
const GOAL_DETECTION_RADIUS = 20;

// Dimensions
const PLAYER_SIZE = 38;
const BALL_SIZE = 16;
const CATCH_RADIUS = 20;
const PLAYER_COLLISION_RADIUS = 28;

// AI
const AI_DECISION_INTERVAL = 100; // ms
const AI_SMART_MIN = 1;
const AI_SMART_MAX = 30;
const AI_SMART_DEFAULT = 15;
const AI_SMART_STEP = 5;

// Ball AI
const BALL_DECISION_INTERVAL = 100; // ms
const BALL_MOVE_UP_CHANCE = 0.1;
const BALL_MOVE_HORIZONTAL_CHANCE = 0.1;
const BALL_AUTO_BOUNCE_HEIGHT = 90; // from bottom
```

---

## Appendix: Source File Reference

### Java
- `FlyingObject.java` - Base physics class
- `Person.java` - Player logic and AI
- `Ball.java` - Ball behavior
- `broomsticks.java` - Main game loop

### C++/SDL
- `FlyingObject.cpp/h` - Base physics
- `Person.cpp/h` - Player and AI
- `Ball.cpp/h` - Ball logic
- `Game.cpp/h` - Main loop and rendering

### iOS
- `FlyingObject.cpp/h` - Physics (C++ core)
- `Person.cpp/h` - Player AI (C++ core)
- `Ball.cpp/h` - Ball behavior (C++ core)
- `HelloWorldLayer.mm` - Cocos2D rendering and touch handling
- `brModel.cpp/h` - Game state management
