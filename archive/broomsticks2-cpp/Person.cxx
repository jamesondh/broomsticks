#include <stdlib.h>
#include "Person.h"

Person::Person(brGraphics *g, Ball *target, int model, int initX, int initY) : FlyingObject(g, initX, initY) {
  this->model = model;
  this->target = target;
  isRobot = 0;
  smart = 15;
  w = 38;
  h = 38;
  side = 0;
  upKey = '-';
  downKey = '-';
  leftKey = '-';
  rightKey = '-';
  modelKey = '-';
  robotKey = '-';
  passKey = '-';
  infoX = 0;
  infoY = 0;
  passBall = 0;

  upKeyDown = 0;
  downKeyDown = 0;
  leftKeyDown = 0;
  rightKeyDown = 0;
}

void Person::setKeys(int up, int down, int left, int right, int model, int pass, int robot) {
  upKey = up;
  downKey = down;
  leftKey = left;
  rightKey = right;
  modelKey = model;
  passKey = pass;
  robotKey = robot;
}

void Person::handleKeyEvent(int key, int isDown) {

  if (!isDown) {
    if (key == upKey) upKeyDown = 0;
    if (key == downKey) downKeyDown = 0;
    if (key == leftKey) leftKeyDown = 0;
    if (key == rightKey) rightKeyDown = 0;
    return;
  }

  if (key == upKey) upKeyDown = SDL_GetTicks();
  if (key == downKey) downKeyDown = SDL_GetTicks();
  if (key == leftKey) leftKeyDown = SDL_GetTicks();
  if (key == rightKey) rightKeyDown = SDL_GetTicks();

  if (isRobot) {
    if (key == leftKey)
      dumber();
    if (key == rightKey)
      smarter();
    if (key == robotKey) {
      isRobot = 0;
      drawInfo();
      vx = 0;
    }
    if (key == passKey)
      passBall = 1;
  }
  else {
    if (key == upKey)
      up();
    if (key == downKey)
      down();
    if (key == leftKey)
      left();
    if (key == rightKey)
      right();
    if (key == robotKey) {
      isRobot = 1;
      drawInfo();
    }
    if (key == modelKey)
      switchModel();
    if (key == passKey)
      passBall = 1;
  }
}

extern int teamBasket[2];
//extern int etime;

void Person::move() {
  if (isRobot && target) {
    int now = SDL_GetTicks();
    // make decision every tenth of a second
    if (now - lastMoveTime >= 100) {
      lastMoveTime = now;
      int choices = smart/2+1;
      int choice = rand()%choices;
      if (choice == 0) {
        // we have the ball
        if (teamBasket[side]) {	    
          if (side == 0) {
            if (x < graphics->getWidth()-50)
              right();
  	    if (y > graphics->getMidH()-10)
              up();
    	  }
	  else {
            if (x > 50)
              left();
	    if (y > graphics->getMidH()-10)
              up();
  	  }
        }
        else { // get the ball
          if (target->getY() < y)
            up();
  	  if (abs((int) (target->getY() - y)) < 100) {
            if (target->getX() < x-10)
              left();
            else if (target->getX() > x+10)
	      right();
  	  }
	  if (target->getY() > y)
            down();
        }
      }
    }
  }
  if (!isRobot) {
    int now = SDL_GetTicks();
    if (upKeyDown && (now-upKeyDown > 300)) up();
    if (downKeyDown && (now-downKeyDown > 300)) down();
    if (leftKeyDown && (now-leftKeyDown > 300)) left();
    if (rightKeyDown && (now-rightKeyDown > 300)) right();
  }
  FlyingObject::move();
}

void Person::erase() {
  graphics->eraseBox((int) x, (int) y, 39, 39);
}

void Person::draw() {
  int h;
  if (vx > 0) h = 0;
  else if (vx < 0) h = 1;
  else h = side;
   
  graphics->drawPlayer(side, model, vy<0, h, (int) x, (int) y);
}

void Person::drawInfo() {
  graphics->fillRect(graphics->black, infoX, infoY, infoX+300, infoY+10);
  if (isRobot) {
    graphics->text(infoX, infoY, "skill:");
    graphics->fillRect(graphics->gray, infoX+85, infoY, infoX+85+35, infoY+10);
    graphics->fillRect(graphics->black, infoX+86, infoY+1, infoX+85+35-1, infoY+9);
    graphics->fillRect(graphics->red, infoX+86, infoY+1, infoX+85+35-smart, infoY+9);
    if (upKey == SDLK_UP)
      graphics->text(infoX+85+35+10, infoY, "LEFT RIGHT SHIFT CTRL");
    else if (upKey == SDLK_HOME)
      graphics->text(infoX+85+35+10, infoY, "DEL PDN PUP NMLK");
    else {
      char str[32];
      sprintf(str, "%c %c %c %c", leftKey, rightKey, passKey, robotKey);
      graphics->text(infoX+85+35+10, infoY, str);
    }
  }
  else {
    if (upKey == SDLK_UP)
      graphics->text(infoX, infoY, "arrow-keys ENTER SHIFT CTRL");
    else if (upKey == SDLK_HOME)
      graphics->text(infoX, infoY, "HOME END DEL PDN INS PUP NMLK");
    else {
      char str[32];
      sprintf(str, "%c %c %c %c %c %c %c", upKey, downKey, leftKey, rightKey, modelKey, passKey, robotKey);
      graphics->text(infoX, infoY, str);
    }
  }
}

