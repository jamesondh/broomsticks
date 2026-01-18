//=========================================================================
//#
//#  BroomstickApplet.java                                ##     
//#                                                       ##
//#  Author: Paul Rajlich                                 ##
//#  Email: prajlich@ncsa.uiuc.edu                    ##  ##
//#  WWW: http://www.ncsa.uiuc.edu/People/prajlich     ####
//#
//#  Description: Broomstick Java Applet
//#
//=========================================================================
//# Copyright (C) 2000 Paul Rajlich, all rights reserved
//=========================================================================

import java.lang.*;
import java.util.*;
import java.awt.*;
import java.applet.*;
import java.io.*;

public class BroomstickApplet extends Applet {

  public Image[][][] img;
  public Image basket, basketH;
  public FlyingObject[] flyers;
  public int numFlyers;
  public int teamScore[], currBasket;

  public Panel drawPanel;
  public SimThread thread;
  
  public void init() {
    System.out.println("\n");
    System.out.println("---=== Broomsticks 1.1b by Paul Rajlich ===---");
    System.out.println("    copyright (c) 2000, all rights reserved\n");
    setBackground(Color.white);
    setLayout(new BorderLayout());

    drawPanel = new DrawPanel(this);
    drawPanel.resize(650,400);

    add("Center", drawPanel);

    loadModels();
    basket = this.getImage(this.getCodeBase(), "images/basket.gif");
    basketH = this.getImage(this.getCodeBase(), "images/basketH.gif");
    drawPanel.getGraphics().drawImage(basket, 325, 200, this);
    drawPanel.getGraphics().drawImage(basketH, 325, 200, this);

    numFlyers = 7;
    flyers = new FlyingObject[7];
    int i = 0;
    flyers[0] = new Person(this, 0, 100, 200);
    flyers[1] = new Person(this, 1, 550, 200);
    flyers[2] = new Person(this, 2, 450, 200);
    flyers[3] = new Person(this, 3, 200, 200);
    ((Person) flyers[1]).side = 1; // team (and dir facing when not moving)
    ((Person) flyers[2]).side = 1;
    flyers[4] = new Ball(this, 0, 325, 200);
    flyers[5] = new Ball(this, 0, 325, 300);
    flyers[6] = new Ball(this, 1, 325, 100);
    flyers[6].catchable = true;
    thread = null;

    teamScore = new int[2];
    teamScore[0] = 0;
    teamScore[1] = 0;
    currBasket = 2;
  }

  public void loadModels() {
    System.out.println("loading models...");
    img = new Image[4][2][2];
    for (int m=0; m<4; m++) {
      System.out.println("model " + m);
      for (int i=0; i<2; i++) {
        for (int j=0; j<2; j++) {
          img[m][i][j] = getImage(getCodeBase(), "images/player"+m+i+j+".gif");
          drawPanel.getGraphics().drawImage(img[m][i][j], 325, 200, this);
        }
      }
    }
    System.out.println("done");
  }

  public void start() {
    if (thread == null)
      thread = new SimThread(this);
    thread.start();
  }

  // NOTE: do not stop thread. According to docs, this will stop it
  // immediately even if it is in the middle of some critical operation.
  // Rather, set it to null and that will cause its main loop to end
  // (see SimThread). Garbage collector will then take care of it later.
  public void stop() {
    //thread.stop();
    thread = null;
  }

  public void destroy() {
    thread = null;
  }

  public String getAppletInfo() {
    return "Broomsticks Applet by Paul Rajlich";
  }

  public boolean keyDown(Event e, int key) {

    // player 1
    if (key == e.LEFT)
      flyers[1].left();
    if (key == e.RIGHT)
      flyers[1].right();
    if (key == e.UP)
      flyers[1].up();
    //if (key == e.ENTER)
    //  ((Person) flyers[1]).switchModel();

    // player 2
    if (key == e.HOME)
     flyers[2].up();
    if (key == e.DELETE)
     flyers[2].left();
    if (key == e.PGDN)
     flyers[2].right();
   
    // player 0
    if (key == 'e' || key == 'E')
      flyers[0].up();
    if (key == 's' || key == 'S')
      flyers[0].left();
    if (key == 'f' || key == 'F')
      flyers[0].right();
    //if (key == '1' || key == '!')
    //  ((Person) flyers[0]).switchModel();
   
    // player 3
    if (key == 'i' || key == 'I')
      flyers[3].up();
    if (key == 'j' || key == 'J')
      flyers[3].left();
    if (key == 'l' || key == 'L')
      flyers[3].right();

    return false;
  }
}

// should it be derived from Canvas?
class DrawPanel extends Panel {
  BroomstickApplet applet;
  Image offImage;

  DrawPanel(BroomstickApplet app) {
    super();
    applet = app;
    offImage = null;
  }

  public void update(Graphics g) {
    if (offImage == null)
      offImage = createImage(628, 368);

    Graphics offgc = offImage.getGraphics();

    offgc.setColor(getBackground());
    offgc.translate(-11, -31);
    offgc.fillRect(11, 31, 628, 368);
  
    if (applet.currBasket == 1) 
      offgc.drawImage(applet.basketH, 11, 190, applet);
    else
      offgc.drawImage(applet.basket, 11, 190, applet);

    if (applet.currBasket == 0)
      offgc.drawImage(applet.basketH, 620, 190, applet);
    else
      offgc.drawImage(applet.basket, 620, 190, applet);

    for (int i=0; i<applet.numFlyers; i++)
      applet.flyers[i].draw(offgc);

    g.drawImage(offImage, 11, 31, applet);
    //offImage.flush();
  }

  public void paint(Graphics g) {
    System.out.println("DrawPanel paint()");
    g.setColor(getBackground());
    g.fillRect(0, 0, 650, 450); // clear drawing area
    update(g);
    g.setColor(Color.black);
    g.drawString("Broomsticks by Paul Rajlich", 245, 20);
    g.drawString("Score: " + applet.teamScore[0], 50, 20);
    g.drawString("Score: " + applet.teamScore[1], 500, 20);
    g.drawRect(10, 30, 630, 370);
  }
}


class SimThread extends Thread {
  BroomstickApplet applet;
  
  SimThread(BroomstickApplet a) {
    applet = a;
  }

  public void run() {
    System.out.println("Applet thread started...\n");
 
    while (Thread.currentThread() == this) {
      long oldTime = System.currentTimeMillis();
      checkCollisions();
      checkCaught();
      moveFlyers();
      draw();
      long elapsedTime = System.currentTimeMillis() - oldTime;
      //System.out.println("etime: " + elapsedTime);
      if (elapsedTime < 30)
      try {
        sleep(30-elapsedTime);
      } catch (InterruptedException e) {
      }
    }
  }

  public void moveFlyers() {
    for (int i=0; i<applet.numFlyers; i++)
      applet.flyers[i].move();
  }

  public void draw() {
    applet.drawPanel.update(applet.drawPanel.getGraphics());
  } 

  public void checkCaught() {

    applet.currBasket = 2;

    // check all pairs
    for (int i=0; i<applet.numFlyers; i++) {
      for (int j=0; j<applet.numFlyers; j++) {
        FlyingObject f1 = applet.flyers[i];
        FlyingObject f2 = applet.flyers[j];
        // player and catchable ball 
        if (f1.bumpable && f2.catchable) {
          int dx = f1.x+8 - f2.x;
          int dy = f1.y+8 - f2.y;
          if (Math.abs(dx) < 20 && Math.abs(dy) < 20) {
            if (f1.velocityX > 0)
              f2.x = f1.x + 18;
            else
              f2.x = f1.x + 8;
            f2.y = f1.y + 15;
            int side = ((Person) f1).side;
            applet.currBasket = side;
            if ((side == 0 && (f1.x > 633-f1.w))||(side == 1 && (f1.x < 17))) {
              //((Person) f1).score += 10;
              dy = f1.y - 190;
              if (Math.abs(dy) < 15) {
                applet.teamScore[((Person) f1).side] += 10;
                applet.drawPanel.paint(applet.drawPanel.getGraphics());
                applet.play(applet.getCodeBase(), "snd/score.au");
                f2.x = 325;
              }
            }
          }
        }
      }
    }
  }

  public void checkCollisions() {
    // check all pairs
    for (int i=0; i<applet.numFlyers; i++) {
      for (int j=0; j<applet.numFlyers; j++) {
        FlyingObject f1 = applet.flyers[i];
        FlyingObject f2 = applet.flyers[j];
        // two players
        if (i != j && f1.bumpable && f2.bumpable) {
          int dx = f1.x - f2.x;
          int dy = f1.y - f2.y;
          if (Math.abs(dx) < f1.w && Math.abs(dy) < f1.h) 
            // lower one gets bumped (lower is higher y value)
            if (f1.y < f2.y)
              f2.y = 1000; // will be clamped
            else if (f2.y > f1.y)
              f1.y = 1000;
        }
        // one player, one non-catchable ball
        else if (i != j && (f1.bumpable && !f2.catchable)) {
          int dx = f1.x+8 - f2.x;
          int dy = f1.y+8 - f2.y;
          if (Math.abs(dx) < 20 && Math.abs(dy) < 20)
            f1.y = 1000;
        }
        // if anybody was bumped - no, will play continuously if "stuck"
        //if (f1.y == 1000 || f2.y == 1000)
        //  applet.play(applet.getCodeBase(), "snd/bump.au");
      }
    }
  }
}

class FlyingObject extends Object {
  public int x, y;
  public int w, h;
  BroomstickApplet applet;
  Graphics g;
  public float velocityX;
  public float velocityY;
  public boolean catchable, bumpable;

  FlyingObject(BroomstickApplet app, int iX, int iY, boolean c, boolean b) {
    x = iX;
    y = iY;

    applet = app;
    g = applet.drawPanel.getGraphics();
    velocityX = 0;
    velocityY = 0;

    catchable = c;
    bumpable = b;
  }

  public void draw(Graphics g) {
    // implemented in derived classes
  }

  public void move() {
    x += velocityX;
    y += velocityY;
    velocityY += 0.1; // gravity
    if (velocityY > 2)
      velocityY = 2;
    bounds();
  }

  public void bounds() {
    if (x < 11) {
      x = 11;
      velocityX = -velocityX;
    }
    if (x > 639-w) {
      x = 639-w;
      velocityX = -velocityX;
    }
    if (y < 31) {
      y = 31;
      velocityY = -velocityY;
      if (velocityY == 0)
        velocityY += 0.1;
    }
    if (y > 399-h) {
      y = 399-h;
      velocityY = 0;
      velocityX = 0;
    }
  }

  public void left() {
    velocityX -= 2;
    if (velocityX < -4)
      velocityX = -4;
  }
 
  public void right() {
    velocityX += 2;
    if (velocityX > 4)
      velocityX = 4;
  }

  public void up() {
    velocityY -= 2;
    if (velocityY < -4)
      velocityY = -4;
  }
}

class Person extends FlyingObject {
  public int model, side;

  Person(BroomstickApplet theApplet, int theModel, int initX, int initY) {
    super(theApplet, initX, initY, false, true);
    model = theModel;
    init();
  } 

  public void init() {
    System.out.println("Person init()");
    //w = img[0][0].getWidth(applet);
    //h = img[0][0].getHeight(applet);
    //System.out.println("size: " + w + "x" + h);
    w = 39;
    h = 36;
    side = 0;
  }

  public void switchModel() {
    model++;
    if (model > 3)
      model = 0;
  }

  public void draw(Graphics g) {
    int h, v;
    if (velocityX > 0)
      h = 0;
    else if (velocityX < 0)
      h = 1;
    else
      h = side;

    if (velocityY >= 0)
      v = 0;
    else
      v = 1;

    g.drawImage(applet.img[model][v][h], x, y, applet);
  }
}
    
 
class Ball extends FlyingObject { 
  int model;
  Image img;     
  static Random random=new Random(); // one instance for all flying objects

  Ball(BroomstickApplet theApplet, int theModel, int initX, int initY) {
    super(theApplet, initX, initY, false, false);
    model = theModel;
    init();
  }
  
  public void init() {
    System.out.println("Ball init()");
    img = applet.getImage(applet.getCodeBase(), "images/ball"+model+".gif");
    g.drawImage(img, x, y, applet);
    w = 16;
    h = 16;
  }

  public void move() {
    int choice = random.nextInt()%20;
    if (choice == 0)
      up();
    if (choice == 1)
      right();
    if (choice == 2)
      left();
    super.move();
  }

  public void draw(Graphics g) {
    g.drawImage(img, x, y, applet);
  }
}

