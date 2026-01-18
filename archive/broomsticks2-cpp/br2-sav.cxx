#include <iostream.h>
#include <stdio.h>
#include <stdlib.h>
#include <SDL/SDL.h>

#include "Person.h"

static SDL_Surface *screen, *players, *sky, *field;
static int width = 640;
static int height = 480;
static int done = 0;

Person *player1, *player2;

static void initSDL(int, char **);
static void draw();
static void update();
static void handleEvent(SDL_Event event);

SDL_Surface *readPPM(char *filename);
void drawRect(Uint32 color, int x1, int y1, int x2, int y2);
void fillRect(Uint32 color, int x1, int y1, int x2, int y2);
void drawSurf(SDL_Surface *surf, int x, int y);
void drawPlayer(int team, int model, int v, int h, int x, int y);
void erasePlayer(int x, int y);

int main(int argc, char **argv) {

  initSDL(argc, argv);

  players = readPPM("imgs/players1.ppm");
  sky = readPPM("imgs/sky1.ppm");
  drawSurf(sky, 0, 0);
  field = readPPM("imgs/field1.ppm");
  Uint32 white = SDL_MapRGB(screen->format, 0xFF, 0xFF, 0xFF);
  SDL_SetColorKey(players, SDL_SRCCOLORKEY, white);

  player1 = new Person(NULL, NULL, 0, 100, 100);
  player1->setKeys(SDLK_UP, SDLK_DOWN, SDLK_LEFT, SDLK_RIGHT, SDLK_RETURN, 'r', 'p');
  player2 = new Person(NULL, NULL, 1, 500, 100);
  player2->setKeys('e', 'x', 's', 'f', '1', '2', '3');

  SDL_Event event;
  while (!done) {
    update();
    draw();
    while (SDL_PollEvent(&event))
      handleEvent(event);
  }

  SDL_Quit();
  return 0;
}

void update() {
  static int frames=0;
  static double lastTime = SDL_GetTicks();
  static double lastFPStime = SDL_GetTicks();
  double thisTime = SDL_GetTicks();
  double etime = (thisTime - lastTime); // ms
  lastTime = thisTime;
  if (thisTime - lastFPStime >= 1.0f) {
    cerr << "fps: " << frames*1000/(thisTime - lastFPStime) << endl;
    lastFPStime = thisTime;
    frames=0;
    cerr << "etime: " << etime << endl;
  }
  frames++;

  // PAUL!!!
  //if (etime < 30) SDL_Delay(30 - etime);
  
  player1->move();
  player2->move();
}

void draw() {
  Uint32 white = SDL_MapRGB(screen->format, 0xFF, 0xFF, 0xFF);
  Uint32 black = SDL_MapRGB(screen->format, 0x00, 0x00, 0x00);
  Uint32 blue  = SDL_MapRGB(screen->format, 0xAA, 0xAA, 0xFF);
  Uint32 green = SDL_MapRGB(screen->format, 0x55, 0xFF, 0x55);
  //fillRect(blue, 0, 0, width, height-50);
  //fillRect(green, 0, height-50, width, height);
  //fillRect(black, 0, height-50, width, height-49);
  //drawSurf(sky, 0, 0);
  //drawSurf(field, 0, height-25);
  player1->draw();
  player2->draw();
  SDL_Flip(screen);
}

static void handleEvent(SDL_Event event) {
  int key;
  if (event.type == SDL_QUIT) 
    done = 1;
  if (event.type == SDL_KEYDOWN) {
    key = event.key.keysym.sym;
    if (key == SDLK_ESCAPE || key == SDLK_q) done=1;
    player1->handleKeyEvent(key);
    player2->handleKeyEvent(key);
  }
}

void initSDL(int argc, char **argv) {
  Uint8 bpp = 0;
  Uint32 initFlags = SDL_INIT_VIDEO;
  Uint32 videoFlags = SDL_SWSURFACE | SDL_DOUBLEBUF; // | SDL_FULLSCREEN;

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
}

SDL_Surface *readPPM(char *filename) {
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
 
void drawRect(Uint32 color, int x1, int y1, int x2, int y2) {
  Uint32 black = SDL_MapRGB(screen->format, 0x00, 0x00, 0x00);
  SDL_Rect rect;
  rect.x = x1; rect.y = y1; rect.w = x2-x1; rect.h = y2-y1;
  SDL_FillRect(screen, &rect, color);
  rect.x++; rect.y++; rect.w-=2; rect.h-=2;
  SDL_FillRect(screen, &rect, black);
}

void fillRect(Uint32 color, int x1, int y1, int x2, int y2) {
  SDL_Rect rect;
  rect.x = x1; rect.y = y1; rect.w = x2-x1; rect.h = y2-y1;
  SDL_FillRect(screen, &rect, color);
}

void drawSurf(SDL_Surface *surf, int x, int y) {
  SDL_Rect pos;
  pos.x = x; pos.y = y;
  SDL_BlitSurface(surf, NULL, screen, &pos);
}

void erasePlayer(int x, int y) {
  SDL_Rect pos, box;
  pos.x = x-10; pos.y = y-10;
  box.x = x-10; box.y = y-10;
  box.w = 39+20; box.h = 39+20;
  SDL_BlitSurface(sky, &box, screen, &pos);
}

void drawPlayer(int team, int model, int v, int h, int x, int y) {
  SDL_Rect pos, playerBox;
  pos.x = x; pos.y = y;
  playerBox.x = team*160 + v*80 + h*40 + 1;
  playerBox.y = model*40 + 41;
  playerBox.w = 39;
  playerBox.h = 39;
  SDL_BlitSurface(players, &playerBox, screen, &pos);
}

