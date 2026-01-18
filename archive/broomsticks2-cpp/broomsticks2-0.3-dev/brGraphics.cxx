#include <iostream.h>
#include <stdlib.h>
#include "brGraphics.h"

brGraphics::brGraphics(int w, int h, int fs) {

  width = w;
  height = h;
  top = 20;

  initSDL(fs);

  int mode = 1;
  if (width == 800) mode = 2;
  if (width == 1024) mode = 3;
  if (width == 1280) mode = 4;
  char introStr[256], skyStr[256], frontStr[256], postStr[256];
  sprintf(introStr, "imgs/intro%d.bmp", mode);
  sprintf(skyStr, "imgs/sky%d.bmp", mode);
  sprintf(frontStr, "imgs/front%d.bmp", mode);
  sprintf(postStr, "imgs/post%d.bmp", mode);

  chars = SDL_LoadBMP("imgs/charsTex.bmp");
  players = SDL_LoadBMP("imgs/players.bmp");
  items = SDL_LoadBMP("imgs/items.bmp");
  intro = SDL_LoadBMP(introStr);
  sky = SDL_LoadBMP(skyStr);
  front = SDL_LoadBMP(frontStr);
  post = SDL_LoadBMP(postStr);
  //intro = SDL_LoadBMP("imgs/intro.bmp");
  //sky = SDL_LoadBMP("imgs/sky.bmp");
  //front = SDL_LoadBMP("imgs/front.bmp");

  white = SDL_MapRGB(screen->format, 0xFF, 0xFF, 0xFF);
  black = SDL_MapRGB(screen->format, 0x00, 0x00, 0x00);
  red   = SDL_MapRGB(screen->format, 0xFF, 0x00, 0x00);
  blue  = SDL_MapRGB(screen->format, 0xAA, 0xAA, 0xFF);
  green = SDL_MapRGB(screen->format, 0x55, 0xFF, 0x55);
  yellow = SDL_MapRGB(screen->format, 0x88, 0x88, 0x00);
  gold = SDL_MapRGB(screen->format, 0xFF, 0xFF, 0x00);
  gray = SDL_MapRGB(screen->format, 0x88, 0x88, 0x88);

  //if (chars) SDL_SetColorKey(chars, SDL_SRCCOLORKEY, black);
  if (players) SDL_SetColorKey(players, SDL_SRCCOLORKEY, white);
  if (front) SDL_SetColorKey(front, SDL_SRCCOLORKEY, white);
  if (items) SDL_SetColorKey(items, SDL_SRCCOLORKEY, white);
  if (post) SDL_SetColorKey(post, SDL_SRCCOLORKEY, white);
}

void brGraphics::initSDL(int fs) {
  Uint8 bpp = 0;
  Uint32 initFlags = SDL_INIT_VIDEO;

  Uint32 videoFlags = SDL_SWSURFACE; // | SDL_FULLSCREEN
  if (fs) videoFlags |= SDL_FULLSCREEN;

  if (SDL_Init(initFlags) < 0) {
    cerr << "Could not init SDL: " << SDL_GetError() << endl;
    exit(1);
  }

  if ((screen = SDL_SetVideoMode(width, height, bpp, videoFlags)) == NULL) {
    cerr << "Could not set " << width << "x" << height << "x" << bpp;
    cerr << " video mode: " << SDL_GetError() << endl;
    exit(2);
  }

  SDL_ShowCursor(0);
  //SDL_EnableKeyRepeat(100, 100);
}

void brGraphics::drawIntro() {
  if (intro) drawSurf(intro, 0, top);
  drawField(0, 0);
  swap();
}

void brGraphics::drawBg() {
  if (sky) drawSurf(sky, 0, top);
  if (front) drawSurf(front, 0, top);
  drawScores(0, 0, 0);
  swap();
}

void brGraphics::drawField(int highlightLeft, int highlightRight) {
 int hh = getMidH() - 15;
 int ll = height - (hh+39) - 31;

 Uint32 color = highlightLeft ? gold : yellow;

 drawItem(3, highlightLeft, 21, hh);
 if (post) {
   drawSurf(post, 28-10, hh+39);
 }
 else {
   fillRect(black, 28, hh+39, 28+4, hh+39+ll);
   fillRect(color, 29, hh+39, 29+2, hh+39+ll);
 }

 color = highlightRight ? gold : yellow;
 drawItem(3, highlightRight, width-41, hh);
 if (post) {
   drawSurf(post, width-34-10, hh+39);
 }
 else {
   fillRect(black, width-34, hh+39, width-34+4, hh+39+ll);
   fillRect(color, width-33, hh+39, width-33+2, hh+39+ll);
 }
}

void brGraphics::drawScores(int left, int right, int h) {
  Uint32 color = h==1 ? gold : black;
  fillRect(black, 48, 2, 148, 18);
  fillRect(color, 49, 3, 147, 17);
  color = h==2 ? gold : black;
  fillRect(black, width-152, 2, width-52, 18);
  fillRect(color, width-151, 3, width-51, 17);
  char leftStr[256];
  char rightStr[256];
  sprintf(leftStr, "%d", left);
  sprintf(rightStr, "%d", right);
  text(78, 4, leftStr);
  text(width-121, 4, rightStr);
}

SDL_Surface* brGraphics::readPPM(char *filename) {
  SDL_Surface *surface = NULL;
  char input[80];
  int w, h;
  FILE *fp = fopen(filename, "r");
  Uint8 *data = NULL;
  if (!fp) {
    fprintf(stderr, "%s not found!\n", filename);
    return NULL;
  }
  fscanf(fp, "%s %d %d %s%c", input, &w, &h, input, input);
  data = (Uint8 *) malloc(w*h*3);
  fread(data, w*h*3, 1, fp);
  fclose(fp); 
  surface = SDL_CreateRGBSurfaceFrom(data, w, h, 24, w*3,
                        0x000000ff, 0x0000ff00, 0x00ff0000, 0x00000000);
  surface->pixels = data;
  return surface;
}

void brGraphics::text(int x, int y, char *str) {
  SDL_Rect charbox, pos;
  charbox.w = 10; //14;
  charbox.h = 10; //14;
  pos.x = x;
  pos.y = y;
  for (int i=0; str[i] != '\0'; i++) {
    charbox.x = str[i]%16 * 12+1;
    charbox.y = str[i]/16 * 12+1;
    SDL_BlitSurface(chars, &charbox, screen, &pos);
    pos.x += 10; //14
  }
}
 
void brGraphics::drawRect(Uint32 color, int x1, int y1, int x2, int y2) {
  Uint32 black = SDL_MapRGB(screen->format, 0x00, 0x00, 0x00);
  SDL_Rect rect;
  rect.x = x1; rect.y = y1; rect.w = x2-x1; rect.h = y2-y1;
  SDL_FillRect(screen, &rect, color);
  rect.x++; rect.y++; rect.w-=2; rect.h-=2;
  SDL_FillRect(screen, &rect, black);
}

void brGraphics::fillRect(Uint32 color, int x1, int y1, int x2, int y2) {
  SDL_Rect rect;
  rect.x = x1; rect.y = y1; rect.w = x2-x1; rect.h = y2-y1;
  SDL_FillRect(screen, &rect, color);
}

void brGraphics::drawSurf(SDL_Surface *surf, int x, int y) {
  SDL_Rect pos;
  pos.x = x; pos.y = y;
  SDL_BlitSurface(surf, NULL, screen, &pos);
}

void brGraphics::eraseBox(int x, int y, int w, int h) {
  SDL_Rect pos, box;
  //pos.x = x-10; pos.y = y-10;
  //box.x = x-10; box.y = y-10-top;
  //box.w = w+20; box.h = h+20;
  pos.x = x; pos.y = y;
  box.x = x; box.y = y-top;
  box.w = w; box.h = h;
  SDL_BlitSurface(sky, &box, screen, &pos);
  SDL_BlitSurface(front, &box, screen, &pos);
}

void brGraphics::drawPlayer(int team, int model, int v, int h, int x, int y) {
  SDL_Rect pos, playerBox, box;
  pos.x = x; pos.y = y;
  playerBox.x = team*160 + v*80 + h*40 + 1;
  playerBox.y = model*40 + 41;
  playerBox.w = 39;
  playerBox.h = 39;
  SDL_BlitSurface(players, &playerBox, screen, &pos);
  pos.x = x-10; pos.y = y-10;
  box.x = x-10; box.y = y-10-top;
  box.w = 39+20; box.h = 39+20;
  if (front) SDL_BlitSurface(front, &box, screen, &pos);
}

void brGraphics::drawItem(int model, int which, int x, int y) {
  SDL_Rect pos, itemBox, box;
  pos.x = x; pos.y = y;
  itemBox.x = 1+which*40;
  itemBox.y = model*40 + 1;
  itemBox.w = 39;
  itemBox.h = 39;
  SDL_BlitSurface(items, &itemBox, screen, &pos);
  pos.x = x-10; pos.y = y-10;
  box.x = x-10; box.y = y-10-top;
  box.w = 39+20; box.h = 39+20;
  if (front) SDL_BlitSurface(front, &box, screen, &pos);
}

