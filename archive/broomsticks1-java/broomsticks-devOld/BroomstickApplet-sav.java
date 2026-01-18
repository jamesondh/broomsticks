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

// NOTES: try a border on a non-transp image. That way, no need to erase!

import java.lang.*;
import java.util.*;
import java.awt.*;
import java.applet.*;
import java.io.*;

public class BroomstickApplet extends Applet {

  public Person player1;
  public Person player2;

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
    add("South", controls);

    player1 = new Person(this, 0, 50, 200);
    player2 = new Person(this, 1, 450, 200);
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
   
    applet.player1.erase();
    applet.player2.erase();
    applet.player1.draw();
    applet.player2.draw();
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
      try {
        sleep(100);
      } catch (InterruptedException e) {
      }
    }
  }

 public void checkCollisions() {
   Person p1 = applet.player1;
   Person p2 = applet.player2;
   int dx = p1.x - p2.x;
   int dy = p1.y - p2.y;
   if (Math.abs(dx) < p1.w)
     if (Math.abs(dy) < p1.h)
       if (p1.y < p2.y) {
         p2.erase(); 
         p1.draw();
         p2.y = 1000; // will be clamped
       }
       else if (p2.y < p1.y) {
         p1.erase();
         p2.draw();
         p1.y = 1000;
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

  //FlyThread thread;

  FlyingObject(BroomstickApplet theApplet, int initX, int initY) {
    x = initX;
    y = initY;

    applet = theApplet;
    g = applet.drawPanel.getGraphics();
    velocityX = 0;
    velocityY = 0;

    init();
  }

  public void init() {
    w = 39;
    h = 36;
    System.out.println("Person init()");
    //thread = new PersonThread(this);
    //thread.start();
  }
}

class Person extends Object {
  public int x, y;
  public int w, h;
  int model;
  Image[][] img;     
  BroomstickApplet applet;
  Graphics g;
  public float velocityX;
  public float velocityY;

  PersonThread thread;

  public static final int RIGHT = 0;
  public static final int LEFT = 1;
  public static final int UP = 0;
  public static final int DOWN = 1;
  
  Person(BroomstickApplet theApplet, int theModel, int initX, int initY) {
    x = initX;
    y = initY;
    model = theModel;

    applet = theApplet;
    g = applet.drawPanel.getGraphics();
    velocityX = 0;
    velocityY = 0;
  
    init();
  } 

  public void init() {
    img = new Image[2][2];
    for (int i=0; i<2; i++)
      for (int j=0; j<2; j++)
        img[i][j] = applet.getImage(applet.getCodeBase(), "images/player"+model+i+j+".gif");
    //w = img[0][0].getWidth(applet);
    //h = img[0][0].getHeight(applet);
    w = 39;
    h = 36;
    System.out.println("Person init()");
    thread = new PersonThread(this);
    thread.start();
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

  public void bounds() {
    if (x < 11)
      x = 639-w;
    if (x > 639-w)
      x = 11;
    if (y < 31)
      y = 31;
    if (y > 399-h) {
      y = 399-h;
      velocityY = 0;
      velocityX = 0;
    }
  }

  public void left() {
    //System.out.println("left");
    velocityX -= 1;
    if (velocityX < -4)
      velocityX = -4;
  }
 
  public void right() {
    //System.out.println("right");
    velocityX += 1;
    if (velocityX > 4)
      velocityX = 4;
  }

  public void up() {
    //System.out.println("up");
    velocityY -= 1;
    if (velocityY < -4)
      velocityY = -4;
  }

  public void down() {
  }
}
    
  
class PersonThread extends Thread {
  Person person;
  
  PersonThread(Person p) {
    person = p;
  }

  public void run() {
    System.out.println("Person thread started...\n");
 
   while (Thread.currentThread() == this) {
      movePerson();
      try {
        sleep(20);
      } catch (InterruptedException e) {
      }
    }
  }

  public void movePerson() {
    person.erase();
    person.x += person.velocityX;
    person.y += person.velocityY;
    person.velocityY += 0.1; // gravity
    if (person.velocityY > 2)
      person.velocityY = 2;
    person.bounds();
    person.draw();
  }
}
   
 
class Ball extends Object { 
  public int x, y;
  public int w, h;
  int model;
  Image img;     
  BroomstickApplet applet;
  Graphics g;

  BallThread thread;

  Ball(BroomstickApplet theApplet, int theModel, int initX, int initY) {
    x = initX;
    y = initY;
    model = theModel;

    applet = theApplet;
    g = applet.drawPanel.getGraphics();
   
    init();
  }
  
  public void init() {
    img = applet.getImage(applet.getCodeBase(), "images/ball"+model+".gif");
    //w = img[0][0].getWidth(applet);
    //h = img[0][0].getHeight(applet);
    w = 20;
    h = 20;
    System.out.println("Ball init()");
    thread = new BallThread(this);
  }

  public void bounds() {
    if (x < 11)
      x = 639-w;
    if (x > 639-w)
      x = 11;
    if (y < 31)
      y = 31;
    if (y > 399-h)
      y = 399-h;
  }

  public void draw() {
    g.drawImage(img, x, y, applet);
  }

  public void erase() {
    g.setColor(applet.drawPanel.getBackground());
    g.fillRect(x, y, w, h);
  }
}
 
class BallThread extends Thread {
  Ball ball;
  
  BallThread(Ball b) {
    ball = b;
  }

  public void run() {
    System.out.println("Person thread started...\n");
 
   while (Thread.currentThread() == this) {
      moveBall();
      try {
        sleep(20);
      } catch (InterruptedException e) {
      }
    }
  }

  public void moveBall() {
  }
}  
