#include "FlyingObject.h"

FlyingObject::FlyingObject(int iX, int iY, int maxX, int maxY) {
  //graphics = g;
  x = iX;
  y = iY;
  initX = iX;
  initY = iY;

  vx = 0.0f;
  vy = 0.0f;

  catchable = 0;
  isGoldBall = 0;
  pass = 0;

  accel = 2;
  maxSpeed = 6;
  dive = 1;

  w = 10;
  h = 10;

  minx = 0;
    miny = 0; // was 20;
    maxx = maxX;
    maxy = maxY;
  //maxx = g->getWidth();
  //maxy = g->getHeight()-20;

  lastMoveTime = 0;
}

void FlyingObject::reset() {
  x = initX;
  y = initY;
  vx = 0;
  vy = 0;
}

void FlyingObject::draw() {
  // implemented in derived classes
}

//extern int etime;

void FlyingObject::move(int etime, int now) {
  x += vx * etime/40.0f; // v based on 25 fps (40 ms)
  y += vy * etime/40.0f; 
  if (vy < 2) vy += 0.1 * etime/40.0f;
  bounds();
}

void FlyingObject::bounds() {
  int hit = 0;
  if (x < minx) {
    x = minx;
    vx = -vx;
    hit = 1;
  }
  if (x > maxx-w) {
    x = maxx-w;
    vx = -vx;
    hit = 1;
  }
  if (y < miny) {
    y = miny;
    vy = -vy;
    if (vy == 0)
        vy += 0.1;
    hit = 1;
  }
  if (y > maxy-h /* -10 */) {
      y = maxy-h; //-10;
    vy = 0;
    vx = 0;
    hit = 1;
  }
  if (hit)
    pass = 0;
}

void FlyingObject::left() {
  vx -= accel;
  if (vx < -maxSpeed) vx = -maxSpeed;
}

void FlyingObject::right() {
  vx += accel;
  if (vx > maxSpeed) vx = maxSpeed;
}

void FlyingObject::up() {
  vy -= accel;
  if (vy < -maxSpeed) vy = -maxSpeed;
}

void FlyingObject::down() {
    if (!dive) return;
  vy += accel;
  if (vy > maxSpeed) vy = maxSpeed;
}

