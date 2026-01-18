#include <iostream.h>
#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#include <string.h>
#ifdef WIN32
#include "SDL.h"
#else
#include <SDL/SDL.h>
#endif

#include "brGraphics.h"
#include "Person.h"
#include "Ball.h"

#include <time.h>

static brGraphics *graphics = NULL;
static Person *players[4];
static Ball **balls;

static int width=640, height=480, fullscreen=1, midW, midH;
static int red=1, black=2, gold=0, goldval=150;
static int numPlayers=2;
static int numBalls;
static int winScore=50;
static float accel=2, maxSpeed=6;
static int maxfps=100;

int etime = 0;
int teamBasket[2] = {0, 0};

static int teamScore[2] = {0, 0};
static int timer = 0;
static int daysLeft = 1;
static int started = 0;
static int done = 0;

static void setNumPlayers(int num);

static void erase();
static void draw();
static void moveFlyers();
static void checkCollisions();
static void checkCaught();
static void gameOver();
static void handleEvent(SDL_Event event);
static void loadConfig(char *filename);
static void printConfig();

int main(int argc, char **argv) {

  loadConfig("settings.txt");
  printConfig();

  midW = width/2;
  midH = height/2;  

  //graphics = new brGraphics(640, 480);
  graphics = new brGraphics(width, height, fullscreen);

  time_t timeval = time(NULL);
  struct tm *ts = localtime(&timeval);
  int month = ts->tm_mon+1;
  int day = ts->tm_mday;
  int year = ts->tm_year+1900;
  daysLeft = 0;
  if (year == 2003 && month == 8 && day <= 31) daysLeft = 32-day;
  if (daysLeft <= 0) {
    graphics->text(100, 100, "  BROOMSTICKS2 DEMO EXPIRED!");
	graphics->text(100, 110, "-----------------------------");
	graphics->text(100, 130, "TO GET THE FULL VERSION, SEND $10 TO:");
	graphics->text(100, 150, "PAUL RAJLICH");
	graphics->text(100, 160, "1709 MAGNOLIA DRIVE");
	graphics->text(100, 170, "ST JOSEPH, IL 61873 USA");
	graphics->text(100, 190, "DON'T FORGET TO INCLUDE YOUR ADDRESS!");
	graphics->text(100, 230, "FOR MORE INFORMATION OR TO ORDER ONLINE GO TO");
	graphics->text(100, 250, "     www.broomsticks3d.com");
	graphics->text(100, 300, "TO QUIT, HIT THE ESC KEY");
	graphics->swap();
  }
  else {
    char str[256];
	sprintf(str, "THIS DEMO EXPIRES IN %d DAYS.", daysLeft);
    graphics->text(midW - 170, height-15, str);
  }

#if 0
  balls[0] = new Ball(graphics, 2, midW, midH-20);
  balls[0]->setCatchable(1);
  balls[1] = new Ball(graphics, 1, midW, midH+20);
  balls[2] = new Ball(graphics, 1, midW, midH+20);
#endif
  numBalls = red+ black + gold;
  balls = new Ball*[numBalls];
  for (int r=0; r<red; r++) {
    balls[r] = new Ball(graphics, 2, midW, midH-20);
    balls[r]->setCatchable(1);
    balls[r]->setAccel(accel);
    balls[r]->setMaxSpeed(maxSpeed);
  }
  for (int b=0; b<black; b++) {
    balls[red+b] = new Ball(graphics, 1, midW, midH+20);
    balls[red+b]->setAccel(accel);
    balls[red+b]->setMaxSpeed(maxSpeed);
  }

  players[0] = new Person(graphics, balls[0], 1, 100, midH);
  //players[0]->setKeys('e', 'x', 's', 'f', '1', 'p', '3');
  players[0]->setKeys('e', 'x', 's', 'f', '1', '2', '4');

  players[1] = new Person(graphics, balls[0], 4, width-100, midH);
  players[1]->setKeys(SDLK_UP, SDLK_DOWN, SDLK_LEFT, SDLK_RIGHT, SDLK_RETURN, SDLK_RSHIFT, SDLK_RCTRL);
  players[1]->setSide(1);

  players[2] = new Person(graphics, balls[0], 2, 200, midH);
  players[2]->setKeys('i', 'm', 'j', 'l', '7', '8', '0');
  players[2]->setSide(0);

  players[3] = new Person(graphics, balls[0], 2, width-200, midH);
  players[3]->setKeys(SDLK_HOME, SDLK_END, SDLK_DELETE, SDLK_PAGEDOWN, SDLK_INSERT, SDLK_PAGEUP, SDLK_NUMLOCK);
  players[3]->setSide(1);

  for (int i=0; i<4; i++) {
    players[i]->setAccel(accel);
    players[i]->setMaxSpeed(maxSpeed);
  }

  if (daysLeft) graphics->drawIntro();

  SDL_Event event;
  while (!done) {
    if (started) {
      if (started) erase();
      checkCollisions();
      checkCaught();
      moveFlyers();
      if (timer > 0) {
        timer--;
        if (timer == 1)
          graphics->drawScores(teamScore[0], teamScore[1]);
      }
      graphics->drawField(teamBasket[1], teamBasket[0]);
      if (started) draw();
    }
    while (SDL_PollEvent(&event))
      handleEvent(event);
  }

  SDL_Quit();
  return 0;
}

void setNumPlayers(int num) {
  int i;
  for (i=0; i<4; i++) players[i]->erase();
  graphics->clearBottom();
  numPlayers = num;
  if (num == 2) {
    players[0]->setInfo(20, height-15);
    players[1]->setInfo(width-290, height-15);
    graphics->text(midW-100, 5, "SPACEBAR for 2-on-2");
  }
  else {
    players[0]->setInfo(20, height-20);
    players[1]->setInfo(width-290, height-20);
    graphics->text(midW-100, 5, "SPACEBAR for 1-on-1");
  }
  players[2]->setInfo(20, height-10);
  players[3]->setInfo(width-290, height-10);
  for (i=0; i<numPlayers; i++) players[i]->drawInfo();
}

void moveFlyers() {
  static int frames=0;
  static int lastTime = SDL_GetTicks();
  static int lastFPStime = SDL_GetTicks();
  int thisTime = SDL_GetTicks();
  etime = thisTime - lastTime; // ms
  if (etime > 100) etime = 100; // cap
  lastTime = thisTime;
  if (thisTime - lastFPStime >= 1000) {
    //cerr << "fps: " << frames*1000/(thisTime - lastFPStime);
    //cerr << " etime: " << etime << endl;
    char fpsStr[8];
    sprintf(fpsStr, "fps %d ", frames*1000/(thisTime - lastFPStime));
    graphics->text(width-70, 5, fpsStr);
    lastFPStime = thisTime;
    frames=0;
  }
  frames++;

  // regulate to 50 fps or so
  //if (etime < 30) SDL_Delay(30 - etime);
  
  // regulate to 40 fps or so
  //if (etime < 40) SDL_Delay(40 - etime);
  //etime = 15; // was 25;
  //cerr << " etime: " << etime << endl;
  
  if (etime < 1000/maxfps) SDL_Delay(1000/maxfps - etime); 
 
  for (int i=0; i<numPlayers; i++) players[i]->move(); 
  for (int j=0; j<numBalls; j++) balls[j]->move();
}

void checkCaught() {
  teamBasket[0] = 0;
  teamBasket[1] = 0;

  for (int k=0; k<3; k++) balls[k]->resetCaught();

  // check all pairs of players and balls
  for (int i=0; i<numPlayers; i++) {
    Person *p = players[i];
    for (int j=0; j<numBalls; j++) {
      Ball *b = balls[j];
      if (b->isAlive() && b->isCatchable()) {
        int dx = (int) (p->getX()+8 - b->getX());
	int dy = (int) (p->getY()+8 - b->getY());
	if (abs(dx) < 20 && abs(dy) < 20) {
          if (p->getVX() > 0)
            b->setX(p->getX()+18);
	  else
            b->setX(p->getX()+8);
	  b->setY(p->getY()+15);
	  teamBasket[p->getSide()] = 1;

	  // passing
	  if (numPlayers > 2 && p->getPassBall()) {
            b->setPass(1); 
	    Person *teammate;
	    if (i == 0) teammate = players[2];
	    if (i == 1) teammate = players[3];
	    if (i == 2) teammate = players[0];
	    if (i == 3) teammate = players[1];
	    float diffx = teammate->getX() - p->getX();
	    float diffy = teammate->getY() - p->getY();
	    float dist  = sqrt(diffx * diffx + diffy * diffy);
	    b->setVX(diffx/dist * 8.0f);
	    b->setVY(diffy/dist * 8.0f);
	    b->setX(b->getX() + 6*b->getVX() + rand()%5);
	    b->setY(b->getY() + 6*b->getVY() + rand()%5);
	  }

	  b->setCaught();
	  if ((p->getSide() == 0 && (p->getX() > (width-17-p->getW()))) ||
              (p->getSide() == 1 && (p->getX() < 17))) {
            dy = (int) (b->getY() - graphics->getMidH());
	    if (abs(dy) < 20) {
              teamScore[p->getSide()] += 10;
	      cerr << "score! " << teamScore[0] << " to " << teamScore[1] << endl;
              graphics->drawScores(teamScore[0], teamScore[1], p->getSide()+1);
	      timer=15;
	      b->setX(midW);
	      if (teamScore[p->getSide()] >= winScore) gameOver();
	    }
	  }
	}
      }
    }
    p->setPassBall(0);
  }
}

void checkCollisions() {
  int i, j;
  // check all pairs of players
  for (i=0; i<numPlayers; i++) {
    for (j=0; j<numPlayers; j++) {
      if (i != j) {
        Person *p1 = players[i];
        Person *p2 = players[j];
        int dx = (int) (p1->getX() - p2->getX());	
	int dy = (int) (p1->getY() - p2->getY());
	if (abs(dx) < p1->getW() && abs(dy) < p1->getH()) {
          if (p1->getY() < p2->getY()) p2->bump();
	  else if (p2->getY() > p1->getY()) p1->bump();
	}
      }
    }
  }
  // check all pairs of players and balls
  for (i=0; i<numPlayers; i++) {
    for (j=0; j<numBalls; j++) {
      Person *p = players[i];
      Ball *b = balls[j];
      if (b->isAlive() && !b->isCatchable()) {
        int dx = (int) (p->getX()+8 - b->getX());
	int dy = (int) (p->getY()+8 - b->getY());
	if (abs(dx) < 20 && abs(dy) < 20) {
          p->bump();
	}
      }
    }
  }
}

void gameOver() {
  started = 0;
  for (int i=0; i<4; i++) players[i]->reset();
  for (int j=0; j<numBalls; j++) balls[j]->reset();
  graphics->drawIntro();
}

void erase() {
  for (int i=0; i<numPlayers; i++) players[i]->erase();
  for (int j=0; j<numBalls; j++) balls[j]->erase();
}

void draw() {
  for (int i=0; i<numPlayers; i++) players[i]->draw();
  for (int j=0; j<numBalls; j++) balls[j]->draw();
  graphics->swap();
}


static void handleEvent(SDL_Event event) {
  int key;
  if (event.type == SDL_QUIT) 
    done = 1;
  if (event.type == SDL_KEYDOWN) {
    key = event.key.keysym.sym;
    if (!started && daysLeft && (key == SDLK_RETURN || key == ' ')) {
      started = 1;
      teamScore[0] = 0;
      teamScore[1] = 0;
      graphics->drawBg();
      setNumPlayers(2);
      return;
    }
    if (key == SDLK_ESCAPE || key == SDLK_q) done=1;
    if (key == ' ') {
      if (numPlayers == 2) 
        setNumPlayers(4);
      else
        setNumPlayers(2);
    }
    for (int i=0; i<numPlayers; i++) players[i]->handleKeyEvent(key, 1);
  }
  if (event.type == SDL_KEYUP) {
    key = event.key.keysym.sym;
    for (int i=0; i<numPlayers; i++) players[i]->handleKeyEvent(key, 0);
  }
}

void loadConfig(char *filename) {
  if (!filename) return;
  FILE *fp = fopen(filename, "r");
  if (!fp) {
    cerr << "cannot open " << filename << endl;
    return;
  }
  char key[256], val[256];
  while (!feof(fp)) {
    fscanf(fp, "%s", key);
    if (!strcasecmp(key, "mode")) {
      fscanf(fp, "%s", val);
      int mode = atoi(val);
      switch (mode) {
        case 1: width=640; height=480; break;
        case 2: width=800; height=600; break;
        case 3: width=1024; height=768; break;
        case 4: width=1280; height=1024; break;
      }
    }
    if (!strcasecmp(key, "fullscreen")) {
      fscanf(fp, "%s", val);
      fullscreen = atoi(val);
    }
    if (!strcasecmp(key, "red")) {
      fscanf(fp, "%s", val);
      red = atoi(val);
    }
    if (!strcasecmp(key, "black")) {
      fscanf(fp, "%s", val);
      black = atoi(val);
    }
    if (!strcasecmp(key, "winscore")) {
      fscanf(fp, "%s", val);
      winScore = atoi(val);
    }
    if (!strcasecmp(key, "accel")) {
      fscanf(fp, "%s", val);
      accel = atof(val);
    }
    if (!strcasecmp(key, "maxspeed")) {
      fscanf(fp, "%s", val);
      maxSpeed = atof(val);
    }
    if (!strcasecmp(key, "maxfps")) {
      fscanf(fp, "%s", val);
      maxfps = atoi(val);
    }
  }
}

void printConfig() {
  cerr << "Config" << endl;
  cerr << "------" << endl;
  cerr << "size: " << width << "x" << height << endl;
  cerr << "fullscreen: " << fullscreen << endl;
  cerr << "balls: " << red << " red " << black << " black" << endl;
  cerr << "winscore: " << winScore << endl;
  cerr << "accel: " << accel << " maxspeed: " << maxSpeed << endl;
}

