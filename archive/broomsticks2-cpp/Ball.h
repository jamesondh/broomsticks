
#ifndef BALL_H
#define BALL_H

#include "FlyingObject.h"
#include "brGraphics.h"

class Ball : public FlyingObject {
private:
  int model, caught, lastCaught, alive;
public:
  Ball(brGraphics *g, int model, int initX, int initY);
  virtual void erase();
  virtual void draw();
  virtual void move();
  int isAlive() { return alive; }
  void resetCaught() { lastCaught = caught; caught = 0; }
  void setCaught() { caught = 1; }
};

#endif
