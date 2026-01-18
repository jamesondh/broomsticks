//#include <iostream.h>
//#include <stdio.h>
#include <stdlib.h>
#include <math.h>
//#include <string.h>
//#ifdef WIN32
//#include "SDL.h"
//#else
//#include <SDL/SDL.h>
//#endif

//#include "brGraphics.h"
#include "brModel.h"
#include "Person.h"
#include "Ball.h"

//#include <time.h>

extern int teamBasket[2];
extern int flashScore[2];

brModel::brModel(int w, int h) {
    
    fullscreen = 1;
    bpp = 32;
    gold = 0;
    goldval = 150;
    numPlayers = 2;
    winScore = 50;
    accel = 2;
    maxSpeed = 6;
    //maxfps = 1000;
    //animdelay = 25;
    teamScore[0] = 0;
    teamScore[1] = 0;
    //teamBasket[0] = 0;
    //teamBasket[1] = 0;
    timer = 0;
    started = 0;
    done = 0;
    
    red = 1;
    black = 2;
    width = w;
    height = h;
    
  midW = width/2;
  midH = height/2;  

  numBalls = red+ black + gold;
  balls = new Ball*[numBalls];
  for (int r=0; r<red; r++) {
    balls[r] = new Ball(2, midW, midH-20, width, height);
    balls[r]->setCatchable(1);
    balls[r]->setAccel(accel);
    balls[r]->setMaxSpeed(maxSpeed);
  }
  for (int b=0; b<black; b++) {
    balls[red+b] = new Ball(1, midW, midH+20, width, height);
    balls[red+b]->setAccel(accel);
    balls[red+b]->setMaxSpeed(maxSpeed);
  }

  players[0] = new Person(balls[0], 4, 100, midH, width, height);
  //players[0]->setKeys('e', 'x', 's', 'f', '1', '2', '4');

  players[1] = new Person(balls[0], 1, width-100, midH, width, height);
  //players[1]->setKeys(SDLK_UP, SDLK_DOWN, SDLK_LEFT, SDLK_RIGHT, SDLK_RETURN, SDLK_RSHIFT, SDLK_RCTRL);
  players[1]->setSide(1);

  players[2] = new Person(balls[0], 2, 200, midH, width, height);
  //players[2]->setKeys('i', 'm', 'j', 'l', '7', '8', '0');
  players[2]->setSide(0);

  players[3] = new Person(balls[0], 2, width-200, midH, width, height);
  //players[3]->setKeys(SDLK_HOME, SDLK_END, SDLK_DELETE, SDLK_PAGEDOWN, SDLK_INSERT, SDLK_PAGEUP, SDLK_NUMLOCK);
  players[3]->setSide(1);

  for (int i=0; i<4; i++) {
    players[i]->setAccel(accel);
    players[i]->setMaxSpeed(maxSpeed);
  }

#if 0
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
#endif
}

#if 0
void brModel::setNumPlayers(int num) {
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
#endif

void brModel::moveFlyers(int etime, int now) {
  for (int i=0; i<numPlayers; i++) players[i]->move(etime, now); 
  for (int j=0; j<numBalls; j++) balls[j]->move(etime, now);
}

extern int winSound, grabSound, scoreSound, bumpSound;

void brModel::checkCaught() {
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

              // constant sound! - PAUL!
              if (!b->getLastCaught()) grabSound = 1;
              b->setCaught();
              if ((p->getSide() == 0 && (p->getX() > (width-17-p->getW()))) ||
                  (p->getSide() == 1 && (p->getX() < 17))) {
                  //dy = (int) (b->getY() - graphics->getMidH());
                  dy = (int) (b->getY() - midH);
                  if (abs(dy) < 20) {
                      teamScore[p->getSide()] += 10;
                      flashScore[p->getSide()] = 300; // 0.3 seconds
                      //cerr << "score! " << teamScore[0] << " to " << teamScore[1] << endl;
                      //    graphics->drawScores(teamScore[0], teamScore[1], p->getSide()+1);
                      timer=15;
                      b->setX(midW);
                      scoreSound = 1;
                      // PAUL! - call gameOver() later!
                      if (teamScore[p->getSide()] >= winScore) winSound = 1; // gameOver();
                  }
              }
          }
      }
    }
    p->setPassBall(0);
  }
}

void brModel::checkCollisions() {
  int i, j;
  // check all pairs of players
  for (i=0; i<numPlayers; i++) {
    for (j=0; j<numPlayers; j++) {
      if (i != j) {
          Person *p1 = players[i];
          Person *p2 = players[j];
          int dx = (int) (p1->getX() - p2->getX());	
          int dy = (int) (p1->getY() - p2->getY());
          if (abs(dx) < p1->getW()-10 && abs(dy) < p1->getH()-10) { // PAUL - added the -10s
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
          if (abs(dx) < 20 && abs(dy) < 20) 
              p->bump();
      }
    }
  }
}

void brModel::gameOver() {
    //winSound = 1;
  started = 0;
  for (int i=0; i<4; i++) players[i]->reset();
  for (int j=0; j<numBalls; j++) balls[j]->reset();
    teamScore[0] = 0;
    teamScore[1] = 0;
  //graphics->drawIntro();
}

#if 0
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
#endif


