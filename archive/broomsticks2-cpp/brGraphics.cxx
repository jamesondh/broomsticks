#include <iostream.h>
#include <stdlib.h>
#include <string.h>
#include "brGraphics.h"

brGraphics::brGraphics(int w, int h, int fs, int bpp) {

  width = w;
  height = h;
  this->bpp = bpp;
  top = 20;

  initSDL(fs);

  white = SDL_MapRGB(screen->format, 0xFF, 0xFF, 0xFF);
  black = SDL_MapRGB(screen->format, 0x00, 0x00, 0x00);
  red   = SDL_MapRGB(screen->format, 0xFF, 0x00, 0x00);
  blue  = SDL_MapRGB(screen->format, 0xAA, 0xAA, 0xFF);
  green = SDL_MapRGB(screen->format, 0x55, 0xFF, 0x55);
  yellow = SDL_MapRGB(screen->format, 0x88, 0x88, 0x00);
  gold = SDL_MapRGB(screen->format, 0xFF, 0xFF, 0x00);
  gray = SDL_MapRGB(screen->format, 0x88, 0x88, 0x88);
}

void brGraphics::loadImages(char *playersImg, char *itemsImg, char *skyImg, char *frontImg, char *postImg) {

  if (!playersImg) playersImg = strdup("imgs/players.bmp");
  if (!itemsImg) itemsImg = strdup("imgs/items.bmp");
  if (!skyImg) skyImg = strdup("imgs/sky.bmp");
  if (!frontImg) frontImg = strdup("imgs/front.bmp");
  if (!postImg) postImg = strdup("imgs/post.bmp");

  chars = SDL_LoadBMP("imgs/charsTex.bmp");
  players = SDL_LoadBMP(playersImg);
  items = SDL_LoadBMP(itemsImg);
  intro = scaleSurface(SDL_LoadBMP("imgs/intro.bmp"), width, height-40);
  sky = scaleSurface(SDL_LoadBMP(skyImg), width, height-40);
  //sky = scaleSurface(readPPM(skyImg), width, height-40);
  front = scaleSurface(SDL_LoadBMP(frontImg), width, height-40);
  post = scaleSurface(SDL_LoadBMP(postImg), 20, height-480+185);

  if (players) SDL_SetColorKey(players, SDL_SRCCOLORKEY, white);
  if (front) SDL_SetColorKey(front, SDL_SRCCOLORKEY, white);
  if (items) SDL_SetColorKey(items, SDL_SRCCOLORKEY, white);
  if (post) SDL_SetColorKey(post, SDL_SRCCOLORKEY, white);
}

void brGraphics::initSDL(int fs) {
  //Uint8 bpp = 32; // 0
  Uint32 initFlags = SDL_INIT_VIDEO;

  Uint32 videoFlags = SDL_SWSURFACE;
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

SDL_Surface* brGraphics::scaleSurface(SDL_Surface *src, int w, int h) {
  if (src == NULL) return NULL;
  if (src->w == w && src->h == h) return src;
  SDL_Surface *surface = NULL;
  Uint8 *data = (Uint8 *) malloc(w*h*3);
  Uint8 *srcdata = (Uint8 *) src->pixels;
  int idx, sidx, sx, sy, sw, sh;
  float sfx, sfy, wx, wy;
  Uint8 rgb[4][3];
  int neighbors[4];

  sw = src->w;
  sh = src->h;

  for (int y=0; y<h; y++) {
    for (int x=0; x<w; x++) {

      idx = (y*w+x)*3;

      sfx = x * sw/(float) w;
      sfy = y * sh/(float) h;
      sx = (int) sfx;
      sy = (int) sfy;
      sidx = (sy*sw+sx)*3;

#if 1 // interpolate 4 closest pixels
      // weights
      float wx = sfx - sx;
      float wy = sfy - sy;

      neighbors[0] = sidx;
      neighbors[1] = sidx+3;
      neighbors[2] = sidx+sw*3;
      neighbors[3] = neighbors[2]+3;

      int c;
      for (int i=0; i<4; i++) {
        if (neighbors[i] >= sw * sh * 3)
          neighbors[i] = sidx;
	for (c=0; c<3; c++)
          rgb[i][c] = srcdata[neighbors[i]+2-c];
      }

      for (c=0; c<3; c++) {
        data[idx+c] = (Uint8) ((1-wx)*(1-wy)*rgb[0][c] + wx*(1-wy)*rgb[1][c]
		             + (1-wx)*wy*rgb[2][c]     + wx*wy*rgb[3][c]);
	if (data[idx+c] == 254) data[idx+c] = 255;
      }
#else
      data[idx+0] = srcdata[sidx+2];
      data[idx+1] = srcdata[sidx+1];
      data[idx+2] = srcdata[sidx+0];
#endif
    }
  } 

  surface = SDL_CreateRGBSurfaceFrom(data, w, h, 24, w*3,
                        0x000000ff, 0x0000ff00, 0x00ff0000, 0x00000000);
  surface->pixels = data;
  return surface;
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
  pos.x = x; pos.y = y;
  box.x = x; box.y = y-top;
  box.w = w; box.h = h;
  SDL_BlitSurface(sky, &box, screen, &pos);
  SDL_BlitSurface(front, &box, screen, &pos);
}

extern int animdelay;

void brGraphics::drawPlayer(int team, int model, int v, int h, int x, int y) {
  int anims = (players->h - 41)/200;
  int now = SDL_GetTicks();
  int frame = (now/animdelay)%anims;
  if (y > height-20-39-15) frame=0; // on ground
  SDL_Rect pos, playerBox, box;
  pos.x = x; pos.y = y;
  playerBox.x = team*160 + v*80 + h*40 + 1;
  playerBox.y = model*40*anims + 40*frame + 41;
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

