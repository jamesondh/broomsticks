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
import java.awt.image.*;
import java.applet.*;
import java.io.*;

public class BroomstickApplet extends Applet implements Runnable {

  public Image[][][] img;
  public Image basket, basketH;
  public Image[] ballImg;

  public Image playersImg;
  public Image itemsImg;
  public Image introImg;
  public Image bgImg, backImg;
  public Image fdImg, fieldImg;
  public boolean backToggle;

  Color blue, green, sky, yellow, gold;

  Image offImage;
  Graphics offgc;
  MediaTracker tracker;

  public FlyingObject[] flyers;
  public int teamScore[], currBasket;
  public boolean teamBasket[];
  int width, height, midW, midH;
  public boolean started, gameover, teams;
  int redBalls, blackBalls, goldBalls;
  public float speed;

  public Thread thread;
  
  public void init() {
    System.out.println("\n");
    System.out.println("---=== Broomsticks 1.5 by Paul Rajlich ===---");
    System.out.println("    copyright (c) 2000, all rights reserved\n");
    setBackground(Color.white);
    setFont(new Font("Helvetica", Font.PLAIN, 12));

    Dimension d = size();
    width = d.width;
    height = d.height;
    midW = width/2;
    midH = height/2;

    // idea: scale sky to size of field. Put goals and field in sky image?
    tracker = new MediaTracker(this);
    playersImg = this.getImage(this.getCodeBase(), "images/players.gif");
    itemsImg = this.getImage(this.getCodeBase(), "images/items.gif");
    introImg = this.getImage(this.getCodeBase(), "images/intro.gif");
    bgImg = this.getImage(this.getCodeBase(), "images/sky1.jpg");
    fdImg = this.getImage(this.getCodeBase(), "images/field.jpg");
    tracker.addImage(playersImg, 0);
    tracker.addImage(itemsImg, 0);
    tracker.addImage(introImg, 0);
    tracker.addImage(bgImg, 0);
    tracker.addImage(fdImg, 0);

    backToggle = false;

    started = false;
    gameover = false;
    offImage = null;
    offgc = null;

    green = new Color(0, 164, 0);
    blue = new Color(0, 128, 255);
    sky = new Color(216, 215, 255);
    yellow = new Color(128, 128, 0);
    gold = new Color(255, 255, 0);

    loadModels();

    redBalls = 1;
    blackBalls = 2;
    goldBalls = 1;
    speed = (float) 1.0;

    String str = this.getParameter("RED");
    if (str != null)
      redBalls = (Integer.valueOf(str)).intValue();
    str = this.getParameter("BLACK");
    if (str != null)
      blackBalls = (Integer.valueOf(str)).intValue();
    str = this.getParameter("GOLD");
    if (str != null)
      goldBalls = (Integer.valueOf(str)).intValue();
    str = this.getParameter("TEAMS");
    if (str != null) {
      int val = (Integer.valueOf(str)).intValue();
      if (val != 0)
        teams = true;
    }
    str = this.getParameter("SPEED");
    if (str != null)
      speed = (Float.valueOf(str)).floatValue();

    flyers = new FlyingObject[4+redBalls+blackBalls+goldBalls];

    flyers[0] = new Person(this, 0, 100, midH);
    flyers[1] = new Person(this, 1, width-100, midH);
    ((Person) flyers[1]).side = 1; // team (and dir facing when not moving)

    if (teams) {
      flyers[2] = new Person(this, 2, width-200, midH);
      flyers[3] = new Person(this, 3, 200, midH);
      ((Person) flyers[2]).side = 1;
    }
    else {
      flyers[2] = null;
      flyers[3] = null;
    }

    int i;
    for (i=0; i < redBalls; i++) {
      flyers[4+i] = new Ball(this, 2, midW, midH-20*i-20);
      flyers[4+i].catchable = true;
    }
    for (i=0; i < blackBalls; i++)
      flyers[4+redBalls+i] = new Ball(this, 1, midW, midH+20*i+20);
    for (i=0; i < goldBalls; i++) {
      flyers[4+redBalls+blackBalls+i] = new GoldBall(this, 0, midW, 50);
      flyers[4+redBalls+blackBalls+i].catchable = true;
    }

    thread = null;

    teamScore = new int[2];
    teamScore[0] = 0;
    teamScore[1] = 0;
    //currBasket = 2;
    teamBasket = new boolean[2];
    teamBasket[0] = false;
    teamBasket[1] = false;
  }

  public void loadModels() {
    System.out.println("loading models...");
    ImageFilter scale = new AreaAveragingScaleFilter(width-22, height-52);
    ImageProducer bgSrc = new FilteredImageSource(bgImg.getSource(), scale);
    backImg = createImage(bgSrc);
    tracker.addImage(backImg, 0);
    ImageFilter scale2 = new AreaAveragingScaleFilter(width-22, 25);
    ImageProducer fdSrc = new FilteredImageSource(fdImg.getSource(), scale2);
    fieldImg = createImage(fdSrc);
    tracker.addImage(fieldImg, 0);
    img = new Image[8][2][2];
    for (int m=0; m<8; m++) {
      System.out.println("model " + m);
      for (int i=0; i<2; i++)
        for (int j=0; j<2; j++) {
          ImageFilter crop;
          if (m < 4)
            crop = new CropImageFilter(i*80 + j*40 + 1, m*40 + 41,39,39);
          else
            crop = new CropImageFilter(i*80 + j*40 + 161,(m-4)*40 + 41,39,39);
          ImageProducer producer = new FilteredImageSource(playersImg.getSource(), crop);
          img[m][i][j] = createImage(producer);
          tracker.addImage(img[m][i][j], 0);
        }
    }
    ballImg = new Image[3];
    for (int k=0; k<3; k++) {
      ImageFilter crop = new CropImageFilter(1,k*40+1,39,39);
      ImageProducer producer = new FilteredImageSource(itemsImg.getSource(), crop);
      ballImg[k] = createImage(producer);
      tracker.addImage(ballImg[k], 0);
    }
    ImageFilter crop = new CropImageFilter(1,121,39,39);
    ImageProducer producer = new FilteredImageSource(itemsImg.getSource(), crop);
    basket = createImage(producer);
    tracker.addImage(basket, 0);
    ImageFilter cropH = new CropImageFilter(41,121,39,39);
    ImageProducer producerH = new FilteredImageSource(itemsImg.getSource(), cropH);
    basketH = createImage(producerH);
    tracker.addImage(basketH, 0);

    System.out.println("done");
  }

  public void start() {
    if (thread == null)
      thread = new Thread(this);
    thread.start();
  }

  // NOTE: do not stop thread. According to docs, this will stop it
  // immediately even if it is in the middle of some critical operation.
  // Rather, set it to null and that will cause its main loop to end
  // (see SimThread). Garbage collector will then take care of it later.
  public void stop() {
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
    gameover = false;
    teamScore[0] = 0;
    teamScore[1] = 0;
    paint(getGraphics());
    return true;
  }

  public boolean keyDown(Event e, int key) {

    // back toggle
    if (key == 'b' || key == 'B')
      if (backToggle)
        backToggle = false;
      else
        backToggle = true;

    // player 1
    if (key == e.LEFT)
      flyers[1].left();
    if (key == e.RIGHT)
      flyers[1].right();
    if (key == e.UP)
      flyers[1].up();
    if (key == e.ENTER)
      ((Person) flyers[1]).switchModel();

    // player 0
    if (key == 'e' || key == 'E')
      flyers[0].up();
    if (key == 's' || key == 'S')
      flyers[0].left();
    if (key == 'f' || key == 'F')
      flyers[0].right();
    if (key == '1' || key == '!')
      ((Person) flyers[0]).switchModel();

    if (teams) {
      // player 2
      if (key == e.HOME)
       flyers[2].up();
      if (key == e.DELETE)
       flyers[2].left();
      if (key == e.PGDN)
       flyers[2].right();

      // player 3
      if (key == 'i' || key == 'I')
        flyers[3].up();
      if (key == 'j' || key == 'J')
        flyers[3].left();
      if (key == 'l' || key == 'L')
        flyers[3].right();
    }
   
    return false;
  }

  public void update(Graphics g) {
    if (offgc == null) {
      offImage = createImage(width-22, height-52);
      offgc = offImage.getGraphics();
      offgc.translate(-11, -31);
    }

    if (backToggle || !started)
      offgc.drawImage(backImg, 11, 31, this);
    else {
      offgc.setColor(sky);
      offgc.fillRect(11, 31, width-22, height-52);
    }
    offgc.drawImage(fieldImg, 11, height-46, this);

    drawBaskets(offgc);
    drawScene(offgc);

    g.drawImage(offImage, 11, 31, this);
    //offImage.flush();
  }

  void drawBaskets(Graphics g) {
    int hh = midH - 15;
    int ll = height - (hh+39) - 31;
    if (teamBasket[1]) {
      g.drawImage(basketH, 21, hh, this);
      g.setColor(Color.black);
      g.drawRect(28, hh+39, 3, ll);
      g.setColor(gold);
      g.fillRect(29, hh+39, 2, ll);
    }
    else {
      g.drawImage(basket, 21, hh, this);
      g.setColor(Color.black);
      g.drawRect(28, hh+39, 3, ll);
      g.setColor(yellow);
      g.fillRect(29, hh+39, 2, ll);
    }

    if (teamBasket[0]) {
      g.drawImage(basketH, width-41, hh, this);
      g.setColor(Color.black);
      g.drawRect(width-34, hh+39, 3, ll);
      g.setColor(gold);
      g.fillRect(width-33, hh+39, 2, ll);
    }
    else {
      g.drawImage(basket, width-41, hh, this);
      g.setColor(Color.black);
      g.drawRect(width-34, hh+39, 3, ll);
      g.setColor(yellow);
      g.fillRect(width-33, hh+39, 2, ll);
    }
  }
   

  public void drawScene(Graphics g) {
    if (!tracker.checkAll(true)) {
      g.setColor(Color.black);
      g.drawString("Loading images, please wait...", midW-75, 200);
      g.drawImage(introImg, midW-175, 90, this);
    }
    else if (!started) {
      g.setColor(Color.black);
      if (!gameover)
        g.drawString("Click here to start.", midW-50, 200);
      else
        g.drawString("Game over. Click here to play again.", midW-75, 200);

      g.drawString("If it runs choppy or slow, close and restart.", midW-125, 365);
      if (teams) {
        g.drawString("Blue Team", 100, 260);
        g.drawString("use E, S, F keys", 100, 280);
        g.drawString("use I, J, L keys", 100, 295);
      }
      else {
        g.drawString("Blue Player", 100, 260);
        g.drawString("use E, S, F keys", 100, 280);
        g.drawString("use 1 to switch player", 100, 295);
      }

      if (teams) {
        g.drawString("Green Team", width-250, 260);
        g.drawString("use arrow keys", width-250, 280);
        g.drawString("use Del, Home, PgDn", width-250, 295);
      }
      else {
        g.drawString("Green Player", width-250, 260);
        g.drawString("use arrow keys", width-250, 280);
        g.drawString("use ENTER to switch player", width-250, 295);
      }

      g.drawImage(introImg, midW-175, 90, this); // was 160
    }
    else {
      for (int i=0; i<flyers.length; i++)
        if (flyers[i] != null)
          flyers[i].draw(g);
    }
  }

  public void paint(Graphics g) {
   System.out.println("paint()");
    g.setColor(getBackground());
    g.fillRect(0, 0, width, height); // clear whole drawing area
    //update(g);
    drawScene(g);
    g.setColor(blue);
    g.fillRect(48, 8, 100, 15);
    g.setColor(green);
    g.fillRect(width-152, 8, 100, 15);
    g.setColor(Color.black);
    g.drawRect(48, 8, 100, 15);
    g.drawRect(width-152, 8, 100, 15);
    g.drawString("Broomsticks by Paul Rajlich", midW-75, 20);
    g.drawString("Score: " + teamScore[0], 50, 20);
    g.drawString("Score: " + teamScore[1], width-150, 20);
    g.drawRect(10, 30, width-21, height-51);
    g.drawString("E S F and 1", 50, height-5);
    g.drawString("arrow-keys and ENTER", width-150, height-5);
    g.drawString("b to turn on/off background", midW-75, height-5);
  }

 public void gameOver() {
    started = false;
    gameover = true;
/**
    player1.x = 100; player1.y = 200;
    player1.velocityX = 0; player1.velocityY = 0;
    player2.x = 520; player2.y = 200;
    player2.velocityX = 0; player2.velocityY = 0;
    ball1.x = 325; ball1.y = 200;
    ball2.x = 325; ball2.y = 300;
    redball.x = 325; redball.y = 100;
**/
  }

  public void run() {
    System.out.println("Applet thread started...\n");

    //paint(getGraphics());
    //repaint();
    //try {
    //  tracker.waitForAll();
    //} catch (InterruptedException e) { return; }

    //loadModels();

    Thread.currentThread().setPriority(Thread.MIN_PRIORITY);

    while (Thread.currentThread() == thread) {
      long oldTime = System.currentTimeMillis();
      if (started) {
        checkCollisions();
        checkCaught();
        moveFlyers();
      }
      repaint();
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
    for (int i=0; i<flyers.length; i++)
      if (flyers[i] != null)
        flyers[i].move();
  }

  public void checkCaught() {

    //currBasket = 2;
    teamBasket[0] = false;
    teamBasket[1] = false;

    // check all pairs
    for (int i=0; i<flyers.length; i++) {
      for (int j=0; j<flyers.length; j++) {
        FlyingObject f1 = flyers[i];
        FlyingObject f2 = flyers[j];
        // player and catchable ball 
        if (f1 != null && f2 != null && f1.bumpable && f2.catchable) {
          int dx = f1.x+8 - f2.x;
          int dy = f1.y+8 - f2.y;
          if (Math.abs(dx) < 20 && Math.abs(dy) < 20) {
            if (f1.velocityX > 0)
              f2.x = f1.x + 18;
            else
              f2.x = f1.x + 8;
            f2.y = f1.y + 15;
            int side = ((Person) f1).side;
            //currBasket = side;
            teamBasket[side] = true;
            if ((side == 0 && (f1.x > (width-17-f1.w))) ||
                (side == 1 && (f1.x < 17))) {
              int h = height/2;
              //((Person) f1).score += 10;
              dy = f2.y - (h - 10);
              if (Math.abs(dy) < 15) {
                teamScore[side] += 10;
                paint(getGraphics());
                play(getCodeBase(), "snd/score.au");
                f2.x = width/2;
                if (teamScore[side] >= 50)
                  gameOver();
              }
            }
          }
        }
      }
    }
  }

  public void checkCollisions() {
    // check all pairs
    for (int i=0; i<flyers.length; i++) {
      for (int j=0; j<flyers.length; j++) {
        FlyingObject f1 = flyers[i];
        FlyingObject f2 = flyers[j];
        // two players
        if (i != j && f1 != null && f2 != null && f1.bumpable && f2.bumpable) {
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
        else if (i != j && f1 != null && f2 != null && f1.bumpable && !f2.catchable) {
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
  int right, bottom;
  BroomstickApplet applet;
  Graphics g;
  public float velocityX;
  public float velocityY;
  public boolean catchable, bumpable;
  public boolean isGoldBall;
  public float speedFactor;

  FlyingObject(BroomstickApplet app, int iX, int iY, boolean c, boolean b) {
    x = iX;
    y = iY;

    applet = app;
    g = applet.getGraphics();
    velocityX = 0;
    velocityY = 0;

    catchable = c;
    bumpable = b;
    isGoldBall = false;

    speedFactor = applet.speed;

    right = applet.width - 11;
    bottom = applet.height - 21;
  }

  public void draw(Graphics g) {
    // implemented in derived classes
  }

  public void move() {
    x += velocityX*speedFactor;
    y += velocityY*speedFactor;
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
    if (x > right-w) {
      x = right-w;
      velocityX = -velocityX;
    }
    if (y < 31) {
      y = 31;
      velocityY = -velocityY;
      if (velocityY == 0)
        velocityY += 0.1;
    }
    if (y > bottom-h-10) {
      y = bottom-h-10;
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
    w = 38;
    h = 38;
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

    if (side == 0)
      g.drawImage(applet.img[model][v][h], x, y, applet);
    else
      g.drawImage(applet.img[model+4][v][h], x, y, applet);
  }
}
    
 
class Ball extends FlyingObject { 
  int model;
  static Random random=new Random(); // one instance for all flying objects

  Ball(BroomstickApplet theApplet, int theModel, int initX, int initY) {
    super(theApplet, initX, initY, false, false);
    model = theModel;
    init();
  }
  
  public void init() {
    System.out.println("Ball init()");
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
    g.drawImage(applet.ballImg[model], x, y, applet);
  }
}

class GoldBall extends Ball {
  GoldBall(BroomstickApplet theApplet, int theModel, int initX, int initY) {
    super(theApplet, theModel, initX, initY);
    init();
  }
 
  public void init() {
    System.out.println("GoldBall init()");
    w = 8;
    h = 8;
    isGoldBall = true;
    speedFactor = 3 * applet.speed;
  }

  public void move() {
    // move based on pos and vel of players
    //for (int i=0; i<applet.flyers.length; i++) {
    super.move();
  }
}
