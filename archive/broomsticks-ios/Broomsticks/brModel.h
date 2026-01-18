//
//  brModel.h
//  Broomsticks
//
//  Created by Cynthia Rajlich on 8/24/11.
//  Copyright 2011 __MyCompanyName__. All rights reserved.
//

#ifndef BR_MODEL_H
#define BR_MODEL_H

#include "Person.h"
#include "Ball.h"

class brModel {
private:
    Person *players[4];
    Ball **balls;
    int width, height, fullscreen, bpp, midW, midH;
    int red, black, gold, goldval;
    int numPlayers;
    int numBalls;
    int winScore;
    float accel, maxSpeed;
    //int maxfps=1000;
    //int animdelay = 250;

    //char *playersImg=NULL, *itemsImg=NULL, *skyImg=NULL, *frontImg=NULL, *postImg=NULL;

    //int etime = 0;
    //int teamBasket[2];

    int teamScore[2];
    int timer;
    //int daysLeft = 1;
    int started;
    int done;

public:
    brModel(int w, int h);
    //void setNumPlayers(int num);

    //void erase();
    //void draw();
    void moveFlyers(int etime, int now);
    void checkCollisions();
    void checkCaught();
    void gameOver();
    int getNumPlayers() { return numPlayers; }
    int getNumBalls() { return numBalls; }
    Person *getPlayer(int i) { return players[i]; }
    Ball *getBall(int i) { return balls[i]; }
    //void handleEvent(SDL_Event event);
    //void loadConfig(char *filename);
    //void printConfig();
    
    int getTeamScore(int i) { return teamScore[i]; }
};

#endif
