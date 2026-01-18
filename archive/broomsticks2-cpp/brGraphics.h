
#ifndef BR_GRAPHICS_H
#define BR_GRAPHICS_H

#ifdef WIN32
#include "SDL.h"
#else
#include <SDL/SDL.h>
#endif

class brGraphics {
private:
  SDL_Surface *screen, *intro, *chars, *players, *sky, *items, *field, *front;
  SDL_Surface *post;
  int width, height, top;
  Uint8 bpp;
  void initSDL(int fs);
  SDL_Surface *readPPM(char *filename);
  SDL_Surface *scaleSurface(SDL_Surface *src, int w, int h);
public:
  Uint32 white, black, red, green, blue, yellow, gold, gray;
  brGraphics(int w, int h, int fullscreen=1, int bpp=32);
  void loadImages(char *playersImg, char *itemsImg, char *skyImg, char *frontImg, char *postImg);
  void drawIntro();
  void drawBg();
  void clearBottom() { fillRect(black, 0, height-20, width, height); }
  void drawField(int h1, int h2);
  void drawScores(int left, int right, int h=0);
  void text(int x, int y, char *str);
  void drawRect(Uint32 color, int x1, int y1, int x2, int y2);
  void fillRect(Uint32 color, int x1, int y1, int x2, int y2);
  void drawSurf(SDL_Surface *surf, int x, int y);
  void eraseBox(int x, int y, int w, int h);
  void drawPlayer(int team, int model, int v, int h, int x, int y);
  void drawItem(int model, int which, int x, int y);
  void swap() { SDL_Flip(screen); }
  int getWidth() { return width; }
  int getHeight() { return height; }
  int getMidW() { return width/2; }
  int getMidH() { return height/2; }
};

#endif
