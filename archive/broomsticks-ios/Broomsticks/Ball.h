
#ifndef BALL_H
#define BALL_H

#include "FlyingObject.h"
//#include "brGraphics.h"

class Ball : public FlyingObject {
private:
  int model, caught, lastCaught, alive;
public:
  //Ball(brGraphics *g, int model, int initX, int initY);
    Ball(int model, int initX, int initY, int maxX, int maxY);

  virtual void erase();
  virtual void draw();
  virtual void move(int etime, int now);
  int isAlive() { return alive; }
  void resetCaught() { lastCaught = caught; caught = 0; }
  void setCaught() { caught = 1; }
    int getLastCaught() { return lastCaught; }
};

#endif
