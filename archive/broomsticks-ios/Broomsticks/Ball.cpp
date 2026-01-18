#include <stdlib.h>
#include "Ball.h"

Ball::Ball(int model, int iX, int iY, int maxX, int maxY) : FlyingObject(iX, iY, maxX, maxY) {
  this->model = model;
  alive = 1;
  caught = 0;
  lastCaught = 0;
  w = 16;
  h = 16;
  lastMoveTime = 0;
}

void Ball::move(int etime, int now) {
  if (!pass) {
    //int now = SDL_GetTicks();
    // make decision every tenth of a second
    if (now - lastMoveTime >= 100) {
      lastMoveTime = now;
      int choices = 10;
      int choice = rand()%choices;
      if (choice == 0) up();
      if (choice == 1) right();
      if (choice == 2) left();
    }
    //if (y > graphics->getHeight()-90) up();
      if (y > maxy-90) up();
  }
  FlyingObject::move(etime, now);
}

void Ball::erase() {
  //graphics->eraseBox((int) x, (int) y, 16, 16);
}

void Ball::draw() {
  //graphics->drawItem(model, 0, (int) x, (int) y);
}
