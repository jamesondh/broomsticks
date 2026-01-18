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

  public Person player1, player2;
  public Ball ball1, ball2, redball, goldball;

  Panel drawPanel;
  Panel centerP;
  Choice p1Control, p1Type, p2Control, p2Type;

  public AppletThread thread;
  
  char p1Left, p1Right, p1Up;
  char p2Left, p2Right, p2Up;

  public void init() {
    setLayout(new BorderLayout());
    drawPanel = new DrawPanel(this);
    drawPanel.resize(650,400);

    p1Control = new Choice();
    p1Control.addItem("player 1");
    p1Control.addItem("computer 1");
    p2Control = new Choice();
    p2Control.addItem("player 2");
    p2Control.addItem("computer 2");

    Panel controls = new Panel();
    controls.setLayout(new GridLayout(0,2));
    controls.add(p1Control);
    controls.add(p2Control);
 
    add("Center", drawPanel);
    //add("South", controls);

    player1 = new Person(this, 0, 50, 200);
    player2 = new Person(this, 1, 450, 200);
    ball1 = new Ball(this, 0, 250, 200);
    ball2 = new Ball(this, 0, 250, 300);
    redball = new Ball(this, 1, 250, 100);
    thread = null;
  }

  public void start() {
    if (thread == null)
      thread = new AppletThread(this);
    thread.start();
  }

  public void stop() {
    thread.stop();
    thread = null;
  }

  public void destroy() {
    thread = null;
  }

  public String getAppletInfo() {
    return "Broomsticks Applet by Paul Rajlich";
  }

  public void clear() {
    Graphics g = this.drawPanel.getGraphics();
  
    g.setColor(this.drawPanel.getBackground());
    g.fillRect(0, 0, size().width-1, size().height-1);
  }

  //public void update(Graphics g) {
  //}

  public boolean keyDown(Event e, int key) {

    // player 1
    if (key == e.LEFT || key == 'l' || key == 'L')
      player1.left();
    if (key == e.RIGHT || key == '\'' || key == '"')
      player1.right();
    if (key == e.UP || key == 'p' || key == 'P')
      player1.up();
    
    if (key == 'e' || key == 'E')
      player2.up();
    if (key == 's' || key == 'S')
      player2.left();
    if (key == 'f' || key == 'F')
      player2.right();
 
    return false;
  }
}

class DrawPanel extends Panel {
  BroomstickApplet applet;

  DrawPanel(BroomstickApplet app) {
    super();
    applet = app;
  }
  public void update(Graphics g) {
    // nothing... applet will update it.
    //paint(g);
    g.setColor(Color.black);
    g.drawString("Broomsticks by Paul Rajlich", 245, 20);
    g.drawRect(10, 30, 630, 370);
    g.setColor(getBackground());
    g.fillRect(11, 31, 628, 368); // clear drawing area
   
    //applet.player1.erase();
    //applet.player2.erase();
    applet.player1.draw();
    applet.player2.draw();
    applet.ball1.draw();
    applet.ball2.draw();
    applet.redball.draw();
  }

  public void paint(Graphics g) {
    //applet.drawP(g);
    update(g);
  }
}

class AppletThread extends Thread {
  BroomstickApplet applet;
  
  AppletThread(BroomstickApplet a) {
    applet = a;
  }

  public void run() {
    System.out.println("Applet thread started...\n");
 
   while (Thread.currentThread() == this) {
      checkCollisions();
      checkCaught();
      draw();
      try {
        sleep(20);
      } catch (InterruptedException e) {
      }
    }
  }
 
  public void draw() {
    applet.drawPanel.update(applet.drawPanel.getGraphics());
  } 

  public void checkCaught() {
    Person p1 = applet.player1;
    Person p2 = applet.player2;
    Ball rb = applet.redball;
    int dx = p1.x - rb.x;
    int dy = p1.y - rb.y;
    if (Math.abs(dx) < p1.w && Math.abs(dy) < p1.h) {
      rb.x = p1.x + p1.w/2;
      rb.y = p1.y + p1.h/2;
    }
    dx = p2.x - rb.x;
    dy = p2.y - rb.y;
    if (Math.abs(dx) < p1.w && Math.abs(dy) < p1.h) {
      rb.x = p2.x + p2.w/2;
      rb.y = p2.y + p2.h/2;
    }
  }

  public void checkCollisions() {
    Person p1 = applet.player1;
    Person p2 = applet.player2;
    Ball b1 = applet.ball1;
    Ball b2 = applet.ball2;
    int dx = p1.x - p2.x;
    int dy = p1.y - p2.y;
    if (Math.abs(dx) < p1.w && Math.abs(dy) < p1.h)
      if (p1.y < p2.y) {
        //p2.erase(); 
        //p1.draw();
        p2.y = 1000; // will be clamped
      }
      else if (p2.y < p1.y) {
        //p1.erase();
        //p2.draw();
        p1.y = 1000;
      }
    dx = p1.x - b1.x;
    dy = p1.y - b1.y;
    if (Math.abs(dx) < p1.w && Math.abs(dy) < p1.h) {
      //p1.erase();
      p1.y = 1000;
    }
    dx = p2.x - b1.x;
    dy = p2.y - b1.y;
    if (Math.abs(dx) < p2.w && Math.abs(dy) < p2.h) {
      //p2.erase();
      p2.y = 1000;
    }
    dx = p1.x - b2.x;
    dy = p1.y - b2.y;
    if (Math.abs(dx) < p1.w && Math.abs(dy) < p1.h) {
      //p1.erase();
      p1.y = 1000;
    }
    dx = p2.x - b2.x;
    dy = p2.y - b2.y;
    if (Math.abs(dx) < p2.w && Math.abs(dy) < p2.h) {
      //p2.erase();
      p2.y = 1000;
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

  FlyThread thread;

  FlyingObject(BroomstickApplet theApplet, int initX, int initY) {
    x = initX;
    y = initY;

    applet = theApplet;
    g = applet.drawPanel.getGraphics();
    velocityX = 0;
    velocityY = 0;
  
    thread = null;
  }

  protected void startThread(FlyingObject o) {
    thread = new FlyThread(o);
    thread.start();
  }

  public void draw() {
  }

  public void erase() {
  }

  public void bounds() {
    if (x < 11)
      x = 639-w;
    if (x > 639-w)
      x = 11;
    if (y < 31) {
      y = 31;
      velocityY = -velocityY;
    }
    if (y > 399-h) {
      y = 399-h;
      velocityY = 0;
      velocityX = 0;
    }
  }

  public void left() {
    //System.out.println("left");
    velocityX -= 2;
    if (velocityX < -4)
      velocityX = -4;
  }
 
  public void right() {
    //System.out.println("right");
    velocityX += 2;
    if (velocityX > 4)
      velocityX = 4;
  }

  public void up() {
    //System.out.println("up");
    velocityY -= 2;
    if (velocityY < -4)
      velocityY = -4;
  }
}

class Person extends FlyingObject {
  int model;
  Image[][] img;     

  public static final int RIGHT = 0;
  public static final int LEFT = 1;
  public static final int UP = 0;
  public static final int DOWN = 1;
  
  Person(BroomstickApplet theApplet, int theModel, int initX, int initY) {
    super(theApplet, initX, initY);
    model = theModel;
    init();
  } 

  public void init() {
    System.out.println("Person init()");
    img = new Image[2][2];
    for (int i=0; i<2; i++)
      for (int j=0; j<2; j++)
        img[i][j] = applet.getImage(applet.getCodeBase(), "images/player"+model+i+j+".gif");
    //w = img[0][0].getWidth(applet);
    //h = img[0][0].getHeight(applet);
    //System.out.println("size: " + w + "x" + h);
    w = 39;
    h = 36;
    startThread(this);
  }

  public void draw() {
    //System.out.println("Person draw");
    int h, v;
    if (velocityX >= 0)
      h = 0;
    else
      h = 1;
    if (velocityY >= 0)
      v = 0;
    else
      v = 1;

    g.drawImage(img[v][h], x, y, applet);
  }

  public void erase() {
    g.setColor(applet.drawPanel.getBackground());
    g.fillRect(x, y, w, h);
  }
}
    
  
class FlyThread extends Thread {
  FlyingObject flyer;
  
  FlyThread(FlyingObject f) {
    flyer = f;
  }

  public void run() {
    System.out.println("Flyer thread started...\n");
 
   while (Thread.currentThread() == this) {
      moveFlyer();
      try {
        sleep(20);
      } catch (InterruptedException e) {
      }
    }
  }

  public void moveFlyer() {
    //flyer.erase();
    flyer.x += flyer.velocityX;
    flyer.y += flyer.velocityY;
    flyer.velocityY += 0.1; // gravity
    if (flyer.velocityY > 2)
      flyer.velocityY = 2;
    flyer.bounds();
    //flyer.draw();
  }
}
   
 
class Ball extends FlyingObject { 
  int model;
  Image img;     

  RandomThread rthread;

  Ball(BroomstickApplet theApplet, int theModel, int initX, int initY) {
    super(theApplet, initX, initY);
    model = theModel;
   
    init();
  }
  
  public void init() {
    System.out.println("Ball init()");
    img = applet.getImage(applet.getCodeBase(), "images/ball"+model+".gif");
    //w = img[0][0].getWidth(applet);
    //h = img[0][0].getHeight(applet);
    w = 20;
    h = 20;
    startThread(this);
    rthread = new RandomThread(this);
    rthread.start();
  }

  public void draw() {
    g.drawImage(img, x, y, applet);
  }

  public void erase() {
    g.setColor(applet.drawPanel.getBackground());
    g.fillRect(x, y, w, h);
  }
}

class RandomThread extends Thread {
  FlyingObject flyer;
  Random random;
  
  RandomThread(FlyingObject f) {
    flyer = f;
    random = new Random();
  }

  public void run() {
    System.out.println("Random thread started...\n");
 
   while (Thread.currentThread() == this) {
      doRandom();
      try {
        sleep(300);
      } catch (InterruptedException e) {
      }
    }
  }

  public void doRandom() {
    int choice;
    if (flyer.y > 200)
      choice = random.nextInt()%5;
    else
      choice = random.nextInt()%3;
    if (choice == 0)
      flyer.left();
    if (choice == 1)
      flyer.right();
    else
      flyer.up();  
  }
} 
