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

  Image[][][] img;
  public Image basket, basketH;
  public int currBasket;
  public Person player1, player2;
  public Ball ball1, ball2, redball, goldball;

  Panel drawPanel;
  Choice p1Control, p2Control;

  public SimThread thread;
  
  public void init() {
    System.out.println("\n---=== Broomsticks 1.03b by Paul Rajlich ===---\n");
    setBackground(Color.white);
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

    loadModels();
    basket = this.getImage(this.getCodeBase(), "images/basket.gif");
    basketH = this.getImage(this.getCodeBase(), "images/basketH.gif");
    drawPanel.getGraphics().drawImage(basket, 325, 200, this);
    drawPanel.getGraphics().drawImage(basketH, 325, 200, this);

    player1 = new Person(this, 0, 100, 200);
    player2 = new Person(this, 1, 550, 200);
    player2.side = 1; // dir facing when not moving
    ball1 = new Ball(this, 0, 325, 200);
    ball2 = new Ball(this, 0, 325, 300);
    redball = new Ball(this, 1, 325, 100);
    thread = null;
 
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
          drawPanel.getGraphics().drawImage(img[m][i][j], 325, 200, this);
        }
    }
    System.out.println("done");
  }

  public void start() {
    if (thread == null)
      thread = new SimThread(this);
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
      //offImage = createImage(650, 450);

    Graphics offgc = offImage.getGraphics();
    offgc.setColor(getBackground());
    //offgc.fillRect(0, 0, 650, 450);

    //System.out.println("DrawPanel update()");
    //g.setColor(getBackground());
    //g.fillRect(0, 0, 650, 450); // clear drawing area

    //offgc.setColor(Color.black);
    //offgc.drawString("Broomsticks by Paul Rajlich", 245, 20);
    //offgc.drawString("Score: " + applet.player1.score, 50, 20);
    //offgc.drawString("Score: " + applet.player2.score, 500, 20);
    //offgc.drawRect(10, 30, 630, 370);

    offgc.translate(-11, -31);
    offgc.fillRect(11, 31, 628, 368);
  
    if (applet.currBasket == 2) 
      offgc.drawImage(applet.basketH, 11, 190, applet);
    else
      offgc.drawImage(applet.basket, 11, 190, applet);

    if (applet.currBasket == 1)
      offgc.drawImage(applet.basketH, 620, 190, applet);
    else
      offgc.drawImage(applet.basket, 620, 190, applet);

    applet.player1.draw(offgc);
    applet.player2.draw(offgc);
    applet.ball1.draw(offgc);
    applet.ball2.draw(offgc);
    applet.redball.draw(offgc);

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
    g.drawString("Score: " + applet.player1.score, 50, 20);
    g.drawString("Score: " + applet.player2.score, 500, 20);
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
      checkCollisions();
      checkCaught();
      moveFlyers();
      //erase();
      draw();
      try {
        sleep(20);
      } catch (InterruptedException e) {
      }
    }
  }

  public void moveFlyers() {
    applet.player1.move();
    applet.player2.move();
    applet.ball1.move();
    applet.ball2.move();
    applet.redball.move();
  }

  // NOTE: using double buffering now (no need to erase)
  public void erase() {
    applet.player1.erase();
    applet.player2.erase();
    applet.ball1.erase();
    applet.ball2.erase();
    applet.redball.erase();
  }
 
  public void draw() {
    //Graphics g = applet.drawPanel.getGraphics();
    //g.drawImage(basket, 11, 190, applet);
    //g.drawImage(basket, 620, 190, applet);
    //applet.player1.draw();
    //applet.player2.draw();
    //applet.ball1.draw();
    //applet.ball2.draw();
    //applet.redball.draw();
    applet.drawPanel.update(applet.drawPanel.getGraphics());
  } 

  public void checkCaught() {
    Person p1 = applet.player1;
    Person p2 = applet.player2;
    Ball rb = applet.redball;

    applet.currBasket = 0;

    int dx = p1.x+8 - rb.x;
    int dy = p1.y+8 - rb.y;
    if (Math.abs(dx) < 20 && Math.abs(dy) < 20) {
      if (p1.velocityX > 0)
        rb.x = p1.x + 18;
      else
        rb.x = p1.x + 8;
      rb.y = p1.y + 15;
      applet.currBasket = 1;
      if (p1.x > 633-p1.w) {
        dy = rb.y - 190;
        if (Math.abs(dy) < 15) {
          //System.out.println("score!");
          p1.score += 10;
          applet.drawPanel.paint(applet.drawPanel.getGraphics());
          //applet.play(applet.getCodeBase(), "snd/Bluup.au");
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
      applet.currBasket = 2;
      if (p2.x < 17) {
        dy = rb.y - 190;
        if (Math.abs(dy) < 15) {
          //System.out.println("score!");
          p2.score += 10;
          applet.drawPanel.paint(applet.drawPanel.getGraphics());
          //applet.play(applet.getCodeBase(), "snd/Bluup.au");
          rb.x = 325; 
        }
      }
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
  public int oldx, oldy;
  public int w, h;
  BroomstickApplet applet;
  Graphics g;
  public float velocityX;
  public float velocityY;

  FlyingObject(BroomstickApplet theApplet, int initX, int initY) {
    x = initX;
    y = initY;

    applet = theApplet;
    g = applet.drawPanel.getGraphics();
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

  public void draw() {
    // so we know where to erase next time
    oldx = x;
    oldy = y;
  }

  public void erase() {
    g.setColor(applet.drawPanel.getBackground());
    //if ((oldx != x) && (oldy != y))
      g.fillRect(oldx, oldy, w, h);
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
    super.draw();
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
    img = applet.getImage(applet.getCodeBase(), "images/ball"+model+".gif");
    g.drawImage(img, x, y, applet);
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
    g.drawImage(img, x, y, applet);
    super.draw();
  }
}

