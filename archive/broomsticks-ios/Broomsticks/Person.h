
#ifndef BR_PERSON_H
#define BR_PERSON_H

//#include "brGraphics.h"
#include "FlyingObject.h"
#include "Ball.h"

extern int bumpSound;

class Person : public FlyingObject {
private:
  int model, side, isRobot;
  Ball *target;
  int upKey, downKey, leftKey, rightKey, modelKey, robotKey, passKey;
  int upKeyDown, downKeyDown, leftKeyDown, rightKeyDown;
  int infoX, infoY;
  int passBall;
    int destX, destY, destOn;
public:
  //Person(brGraphics *g, Ball *target, int model, int initX, int initY);
    Person(Ball *target, int model, int initX, int initY, int maxX, int maxY);
  virtual void erase();
  virtual void draw();
  virtual void move(int etime, int now);
  void setSide(int val) { side = val; }
  void setInfo(int x, int y) { infoX = x; infoY = y; }
  void setKeys(int up, int down, int left, int right, int model, int pass, int robot);
  void handleKeyEvent(int key, int isDown);
  void toggleRobot() { isRobot = 1 - isRobot; vx = 0; }
    void setRobot(int i) { isRobot = i; }
  void smarter() { smart -=5; if (smart <= 1) smart = 1; drawInfo(); }
  void dumber() { smart +=5; if (smart >= 30) smart = 30; drawInfo(); }
    void setSmart(int i) { smart = i; if (smart <=1) smart = 1; drawInfo(); }
  void switchModel() { model++; if (model > 4) model=0; }
    void setModel(int i) { model = i; if (model > 4) model=0; }
    int getModel() { return model; }
  void drawInfo();
    void bump() { if (y < maxy-40) bumpSound = 1; erase(); y = 10000; } // will be clamped
  int getSide() { return side; }
  int getPassBall() { return passBall; }
  void setPassBall(int val) { passBall = val; }
    void setDest(int x, int y);
    
    //void reset() { destOn=0; super::reset(); }
};

#endif
  

