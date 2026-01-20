# Building Broomsticks1 Java for macOS

This document describes how to build and run the original Broomsticks1 Java applet on modern macOS systems (including Apple Silicon).

## Overview

Broomsticks1 was originally written as a Java Applet (circa 2000-2001) designed to run in web browsers. Since Java applets are no longer supported in modern browsers, we use a standalone wrapper to run the applet as a desktop application.

## Prerequisites

Install Java 11 (Temurin) via Homebrew:

```bash
brew install --cask temurin@11
```

Java 11 is required because it's the last LTS version with the `java.applet` API. Newer versions (17+) have removed applet support entirely.

## Setup

The build process creates two files that are gitignored to preserve the original archive:

1. **AppletRunner.java** - A wrapper that emulates the applet container
2. **snd/** - Sound files copied from another variant (broomsticksDevF)

### 1. Copy Sound Files

The broomsticksAdvanced variant references sound files that exist in broomsticksDevF:

```bash
cd archive/broomsticks1-java/broomsticksAdvanced
mkdir -p snd
cp ../broomsticksDevF/snd/*.au snd/
```

### 2. Create AppletRunner.java

Create `archive/broomsticks1-java/broomsticksAdvanced/AppletRunner.java`:

```java
import java.applet.*;
import java.awt.*;
import java.awt.event.*;
import java.io.*;
import java.net.*;
import java.util.*;

/**
 * Simple wrapper to run a Java Applet as a standalone application.
 * This emulates the applet container environment.
 */
public class AppletRunner extends Frame implements AppletStub, AppletContext {

    private Applet applet;
    private Map<String, String> params = new HashMap<>();
    private URL codeBase;
    private URL documentBase;

    public AppletRunner(String appletClassName) throws Exception {
        super("Broomsticks Advanced Demo");

        // Set up codebase
        File currentDir = new File(".");
        codeBase = currentDir.toURI().toURL();
        documentBase = codeBase;

        // Set default parameters from applet.html
        params.put("PLAYERS", "2");
        params.put("DIVING", "yes");
        params.put("ACCEL", "2");
        params.put("MAXSPEED", "6");
        params.put("GAMEWIDTH", "650");
        params.put("GAMEHEIGHT", "450");
        params.put("RED", "1");
        params.put("BLACK", "2");
        params.put("GOLD", "1");
        params.put("WINSCORE", "50");
        params.put("DURATION", "60");
        params.put("PLAYERSIMG", "images/players.gif");
        params.put("ITEMSIMG", "images/items.gif");
        params.put("FIELDIMG", "images/field.jpg");
        params.put("SKYIMG", "images/sky1.jpg");
        params.put("SOUND", "on");

        // Load the applet class
        Class<?> appletClass = Class.forName(appletClassName);
        applet = (Applet) appletClass.getDeclaredConstructor().newInstance();
        applet.setStub(this);

        // Set up the frame
        setLayout(new BorderLayout());
        add(applet, BorderLayout.CENTER);

        // Window close handling
        addWindowListener(new WindowAdapter() {
            public void windowClosing(WindowEvent e) {
                applet.stop();
                applet.destroy();
                System.exit(0);
            }
        });

        // Initialize and start the applet
        applet.init();
        setSize(420, 520);
        setLocationRelativeTo(null);
        setVisible(true);
        applet.start();
    }

    // AppletStub implementation
    public boolean isActive() { return true; }
    public URL getDocumentBase() { return documentBase; }
    public URL getCodeBase() { return codeBase; }
    public String getParameter(String name) { return params.get(name); }
    public AppletContext getAppletContext() { return this; }
    public void appletResize(int width, int height) {
        setSize(width + getInsets().left + getInsets().right,
                height + getInsets().top + getInsets().bottom);
    }

    // AppletContext implementation
    public AudioClip getAudioClip(URL url) {
        return Applet.newAudioClip(url);
    }

    public Image getImage(URL url) {
        return Toolkit.getDefaultToolkit().getImage(url);
    }

    public Applet getApplet(String name) { return null; }
    public Enumeration<Applet> getApplets() { return Collections.enumeration(Collections.emptyList()); }
    public void showDocument(URL url) {}
    public void showDocument(URL url, String target) {}
    public void showStatus(String status) { System.out.println("Status: " + status); }
    public void setStream(String key, InputStream stream) {}
    public InputStream getStream(String key) { return null; }
    public Iterator<String> getStreamKeys() { return Collections.emptyIterator(); }

    public static void main(String[] args) {
        try {
            new AppletRunner("BroomstickApplet");
        } catch (Exception e) {
            e.printStackTrace();
            System.exit(1);
        }
    }
}
```

### 3. Compile

```bash
cd archive/broomsticks1-java/broomsticksAdvanced
export JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-11.jdk/Contents/Home
$JAVA_HOME/bin/javac -source 1.8 -target 1.8 BroomstickApplet.java AppletRunner.java
```

You'll see deprecation warnings - this is expected for 20+ year old code.

## Run

```bash
cd archive/broomsticks1-java/broomsticksAdvanced
/Library/Java/JavaVirtualMachines/temurin-11.jdk/Contents/Home/bin/java AppletRunner
```

A window titled "Broomsticks Advanced Demo" will appear with game options.

## Controls

### Setup Screen
- Configure game options on the left panel
- Click the green "Press here to start" button
- Click inside the game area to begin

### In-Game

| Player | Up | Down | Left | Right | Switch Ball |
|--------|-----|------|------|-------|-------------|
| Blue (left) | E | X | S | F | 1 |
| Green (right) | ↑ | ↓ | ← | → | Enter |

| Key | Action |
|-----|--------|
| P | Toggle single-player (AI) mode |
| B | Change background |

### Gameplay
- Catch the red ball and fly it into your opponent's basket (opposite side) to score 10 points
- First player to reach the win score (default 50) wins
- In single-player mode, use S/F to adjust AI difficulty

## Other Variants

The same approach works for other Java variants. Just change the directory and adjust `AppletRunner.java` parameters as needed:

| Variant | Directory | Notes |
|---------|-----------|-------|
| Advanced | `broomsticksAdvanced/` | Demo with most options |
| Expert | `broomsticksExpert/` | Full version |
| DevF | `broomsticksDevF/` | Development version (has snd/) |
| devOld | `broomsticks-devOld/` | Early development (has snd/) |

## Technical Notes

### Why Java 11?

- Java 11 is the last LTS version with `java.applet.Applet` and `java.applet.AppletContext`
- Java 17+ removed the applet API entirely
- Java 8 also works but is no longer maintained

### AppletRunner Details

The `AppletRunner` class:
- Implements `AppletStub` to provide the applet lifecycle methods
- Implements `AppletContext` to provide `getAudioClip()` and `getImage()`
- Reads parameters from a hardcoded map (matching `applet.html`)
- Wraps the applet in an AWT `Frame` for standalone execution

### Files Created (gitignored)

These files are created during setup but gitignored to preserve the original archive:

```
archive/broomsticks1-java/broomsticksAdvanced/
├── AppletRunner.java    # Wrapper (gitignored)
├── AppletRunner.class   # Compiled wrapper (gitignored via *.class)
└── snd/                 # Copied sound files (gitignored)
    ├── bump.au
    ├── grab.au
    ├── score.au
    └── win.au
```

## Tested On

- macOS Sequoia (Apple Silicon M1/M2/M3)
- Temurin JDK 11.0.25+ (via Homebrew)
