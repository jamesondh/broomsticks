# macOS build for broomsticks2-cpp
# Uses sdl12-compat for SDL 1.2 compatibility
# Original source files remain untouched in archive/

SRC_DIR = ../../archive/broomsticks2-cpp
CXX = clang++

# SDL flags from sdl12-compat
SDL_CFLAGS = $(shell sdl-config --cflags)
SDL_LIBS = $(shell sdl-config --libs)

# Fix pre-standard C++ headers:
# - iostream.h shim in current dir redirects to modern <iostream>
# - Add 'using namespace std' for cerr/endl (via iostream.h shim)
CXXFLAGS = -std=c++11 \
           -Wno-deprecated \
           -Wno-c++11-compat-deprecated-writable-strings \
           -Wno-writable-strings \
           -I. \
           -I$(SRC_DIR) \
           -I/opt/homebrew/include \
           $(SDL_CFLAGS)

LDFLAGS = $(SDL_LIBS)

# Source files (excluding br2-sav.cxx which is a backup)
SRCS = br2.cxx brGraphics.cxx FlyingObject.cxx Person.cxx Ball.cxx
OBJS = $(SRCS:.cxx=.o)
TARGET = br2

.PHONY: all clean run

all: $(TARGET)

$(TARGET): $(OBJS)
	$(CXX) -o $@ $(OBJS) $(LDFLAGS)

%.o: $(SRC_DIR)/%.cxx
	$(CXX) $(CXXFLAGS) -c $< -o $@

clean:
	rm -f $(TARGET) $(OBJS)

# Run from the source directory so it can find assets
run: $(TARGET)
	cd $(SRC_DIR) && $(CURDIR)/$(TARGET)
