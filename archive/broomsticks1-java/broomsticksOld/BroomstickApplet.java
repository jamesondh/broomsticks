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

public class BroomstickApplet extends Applet implements Runnable {

  public Image[][][] img;
  public Image basket, basketH;
  public Image[] ballImg;
  Image offImage;
  Graphics offgc;
  MediaTracker tracker;
  public int currBasket;
  public Person player1, player2;
  public Ball ball1, ball2, redball, goldball;
  public boolean started;

  public Thread thread;
  
  public void init() {
    System.out.println("\n");
    System.out.println("---=== Broomsticks 1.01b by Paul Rajlich ===---");
    System.out.println("    copyright (c) 2000, all rights reserved\n");
    setBackground(Color.white);

    tracker = new MediaTracker(this);
    
    started = false;
    offImage = null;
    offgc = null;
    loadModels();

    basket = this.getImage(this.getCodeBase(), "images/basket.gif");
    basketH = this.getImage(this.getCodeBase(), "images/basketH.gif");
    tracker.addImage(basket, 0);
    tracker.addImage(basketH, 0);
    //getGraphics().drawImage(basket, 325, 200, this);
    //getGraphics().drawImage(basketH, 325, 200, this);

    player1 = new Person(this, 0, 100, 200);
    player2 = new Person(this, 1, 550, 200);
    player2.side = 1; // dir facing when not moving
    ball1 = new Ball(this, 0, 325, 200);
    ball2 = new Ball(this, 0, 325, 300);
    redball = new Ball(this, 1, 325, 100);
    thread = null;

    //tracker.checkID(0, true);
    //System.gc();
 
    currBasket = 0;
  }

  public void loadModels() {
    System.out.println("loading models...");
    img = new Image[4][2][2];
    for (int m=0; m<4; m++) {
      System.out.println("model " + m);
      for (int i=0; i<2; i++)
        for (int j=0; j<2; j++) {
          img[m][i][j] = this.getImage(this.getCodeBase(), "images/player"+m+i+j+".gif");
          tracker.addImage(img[m][i][j], 0);
          //getGraphics().drawImage(img[m][i][j], 325, 200, this);
        }
    }
    ballImg = new Image[2];
    for (int k=0; k<2; k++) {
      ballImg[k] = this.getImage(this.getCodeBase(), "images/ball"+k+".gif");
      tracker.addImage(ballImg[k], 0);
    }
    System.out.println("done");
  }

  public void start() {
    if (thread == null)
      thread = new Thread(this);
    thread.start();
  }

  public void stop() {
    // NOTE: do not stop thread. According to docs, this will stop it
    // immediately even if it is in the middle of some critical operation.
    // Rather, set it to null and that will cause its main loop to end
    // (see run). Garbage collector will then take care of it later.
    //thread.stop();
    thread = null;
    //offImage = null;
  }

  public void destroy() {
    thread = null;
    //offImage = null;
  }

  public String getAppletInfo() {
    return "Broomsticks Applet by Paul Rajlich";
  }

  public boolean mouseDown(Event e, int x, int y) {
    started = true;
    return true;
  }

  public boolean keyDown(Event e, int key) {

    // player 1
    if (key == e.LEFT)
      player2.left();
    if (key == e.RIGHT)
      player2.right();
    if (key == e.UP)
      player2.up();
    if (key == e.ENTER)
      player2.switchModel();
   
    // player 2
    if (key == 'e' || key == 'E')
      player1.up();
    if (key == 's' || key == 'S')
      player1.left();
    if (key == 'f' || key == 'F')
      player1.right();
    if (key == '1' || key == '!')
      player1.switchModel();

    return false;
  }

  public void update(Graphics g) {
    if (offgc == null) {
      offImage = createImage(628, 368);
      offgc = offImage.getGraphics();
      offgc.translate(-11, -31);
    }
 
    offgc.setColor(getBackground());
    offgc.fillRect(11, 31, 628, 368);

    drawScene(offgc);

    g.drawImage(offImage, 11, 31, this);
    //offImage.flush();
  }

  public void drawScene(Graphics g) {
    if (!tracker.checkAll(true)) {
      g.setColor(Color.black);
      g.drawString("Loading images, please wait...", 200, 190);
    }
    else if (!started) {
      g.setColor(Color.black);
      g.drawString("Click to start.", 200, 190);
    }
    else {
      if (currBasket == 2) 
        g.drawImage(basketH, 11, 190, this);
      else
        g.drawImage(basket, 11, 190, this);

      if (currBasket == 1)
        g.drawImage(basketH, 620, 190, this);
      else
        g.drawImage(basket, 620, 190, this);

      player1.draw(g);
      player2.draw(g);
      ball1.draw(g);
      ball2.draw(g);
      redball.draw(g);
    }
  }

  public void paint(Graphics g) {
    System.out.println("paint()");
    g.setColor(getBackground());
    g.fillRect(0, 0, 650, 400); // clear whole drawing area
    //update(g);
    drawScene(g);
    g.setColor(Color.black);
    g.drawString("Broomsticks by Paul Rajlich", 245, 20);
    g.drawString("Score: " + player1.score, 50, 20);
    g.drawString("Score: " + player2.score, 500, 20);
    g.drawRect(10, 30, 630, 370);
  }

  public void run() {
    System.out.println("Applet thread started...\n");
    //paint(getGraphics());
    //repaint();
    //try {
    //  tracker.waitForAll();
    //} catch (InterruptedException e) { return; }

    Thread.currentThread().setPriority(Thread.MIN_PRIORITY);
 
    while (Thread.currentThread() == thread) {
      long oldTime = System.currentTimeMillis();
      if (started) {
        checkCollisions();
        checkCaught();
        moveFlyers();
      }
      //repaint(20);
      repaint();
      //update(getGraphics());
      long elapsedTime = System.currentTimeMillis() - oldTime;
      //System.out.println("etime: " + elapsedTime);
      if (elapsedTime < 30)
      try {
        Thread.sleep(30-elapsedTime);
      } catch (InterruptedException e) { break; }
    }
    System.out.println("thread done.");
  }

  public void moveFlyers() {
    player1.move();
    player2.move();
    ball1.move();
    ball2.move();
    redball.move();
  }
 
  public void checkCaught() {
    Person p1 = player1;
    Person p2 = player2;
    Ball rb = redball;

    currBasket = 0;

    int dx = p1.x+8 - rb.x;
    int dy = p1.y+8 - rb.y;
    if (Math.abs(dx) < 20 && Math.abs(dy) < 20) {
      if (p1.velocityX > 0)
        rb.x = p1.x + 18;
      else
        rb.x = p1.x + 8;
      rb.y = p1.y + 15;
      currBasket = 1;
      if (p1.x > 633-p1.w) {
        dy = rb.y - 190;
        if (Math.abs(dy) < 15) {
          //System.out.println("score!");
          p1.score += 10;
          paint(getGraphics());
          //play(getCodeBase(), "snd/Bluup.au");
          rb.x = 325;
        }
      }
    }
    dx = p2.x+8 - rb.x;
    dy = p2.y+8 - rb.y;
    if (Math.abs(dx) < 20 && Math.abs(dy) < 20) {
      if (p2.velocityX > 0)
        rb.x = p2.x + 18;
      else
        rb.x = p2.x + 8;
      rb.y = p2.y + 15;
      currBasket = 2;
      if (p2.x < 17) {
        dy = rb.y - 190;
        if (Math.abs(dy) < 15) {
          //System.out.println("score!");
          p2.score += 10;
          paint(getGraphics());
          //play(getCodeBase(), "snd/Bluup.au");
          rb.x = 325; 
        }
      }
    }
  }

  public void checkCollisions() {

    Person p1 = player1;
    Person p2 = player2;
    Ball b1 = ball1;
    Ball b2 = ball2;

    int dx = p1.x - p2.x;
    int dy = p1.y - p2.y;
    if (Math.abs(dx) < p1.w && Math.abs(dy) < p1.h)
      if (p1.y < p2.y)
        p2.y = 1000; // will be clamped
      else if (p2.y < p1.y)
        p1.y = 1000;

    dx = p1.x+8 - b1.x;
    dy = p1.y+8 - b1.y;
    if (Math.abs(dx) < 20 && Math.abs(dy) < 20)
      p1.y = 1000;

    dx = p2.x+8 - b1.x;
    dy = p2.y+8 - b1.y;
    if (Math.abs(dx) < 20 && Math.abs(dy) < 20)
      p2.y = 1000;

    dx = p1.x+8 - b2.x;
    dy = p1.y+8 - b2.y;
    if (Math.abs(dx) < 20 && Math.abs(dy) < 20)
      p1.y = 1000;

    dx = p2.x+8 - b2.x;
    dy = p2.y+8 - b2.y;
    if (Math.abs(dx) < 20 && Math.abs(dy) < 20)
      p2.y = 1000;
  }
}

class FlyingObject extends Object {
  public int x, y;
  public int w, h;
  BroomstickApplet applet;
  public float velocityX;
  public float velocityY;

  FlyingObject(BroomstickApplet theApplet, int initX, int initY) {
    x = initX;
    y = initY;

    applet = theApplet;
    velocityX = 0;
    velocityY = 0;
  }

  public void move() {
    x += velocityX;
    y += velocityY;
    velocityY += 0.1; // gravity
    if (velocityY > 2)
      velocityY = 2;
    bounds();
  }

  // implemented in derived classes
  public void draw(Graphics g) {
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
  public int model, score, side;

  Person(BroomstickApplet theApplet, int theModel, int initX, int initY) {
    super(theApplet, initX, initY);
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
    score = 0;
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
    super(theApplet, initX, initY);
    model = theModel;
    init();
  }
  
  public void init() {
    System.out.println("Ball init()");
    //img = applet.getImage(applet.getCodeBase(), "images/ball"+model+".gif");
    //applet.tracker.addImage(img, 0);
    //applet.getGraphics().drawImage(img, x, y, applet);
    //w = img[0][0].getWidth(applet);
    //h = img[0][0].getHeight(applet);
    w = 17;
    h = 17;
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
    g.drawImage(applet.ballImg[model], x, y, applet);
  }
}

