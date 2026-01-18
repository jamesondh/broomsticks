
#ifndef BR_FLYING_OBJECT_H 
#define BR_FLYING_OBJECT_H

#include "brGraphics.h"

class FlyingObject {
protected:
  brGraphics *graphics;
  int initX, initY;
  float x, y;
  int w, h;
  int minx, miny, maxx, maxy;
  float vx, vy, accel, maxSpeed;
  int catchable, isGoldBall, dive, pass, smart;
  int lastMoveTime;
public:
  FlyingObject(brGraphics *graphics, int iX, int iY);
  virtual void draw(); // implemented in derived classes
  virtual void move();
  void reset();
  void bounds();
  void left();
  void right();
  void up();
  void down();
  int isCatchable() { return catchable; }
  void setCatchable(int val) { catchable = val; }
  int getX() { return (int) x; }
  int getY() { return (int) y; }
  int getW() { return (int) w; }
  int getH() { return (int) h; }
  void setX(float val) { x = val; }
  void setY(float val) { y = val; }
  void setPass(int val) { pass = val; }
  float getVX() { return vx; }
  float getVY() { return vy; }
  void setVX(float val) { vx = val; }
  void setVY(float val) { vy = val; }
  void setAccel(float val) { accel = val; }
  void setMaxSpeed(float val) { maxSpeed = val; }
};

#endif
  

