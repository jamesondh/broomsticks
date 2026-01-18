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

  public AudioClip scoreClip, grabClip, bumpClip, winClip;

  public Image[][][] img;
  public Image basket, basketH;
  public Image[] ballImg;

  String playersStr, itemsStr, fieldStr, bgStr;

  public Image playersImg;
  public Image itemsImg;
  public Image introImg;
  public Image bgImg[], backImg[];
  public Image fdImg, fieldImg;
  public int backToggle;

  int duration, winScore;
  long startTime;

  Color blue, green, sky, yellow, gold;

  Image offImage;
  Graphics offgc;
  MediaTracker tracker;

  public Person[] players;
  public Ball[] balls;
  public int teamScore[];
  public boolean teamBasket[], prevTeamBasket[];
  int width, height, midW, midH;
  public boolean started, gameover, teams;
  int redBalls, blackBalls, goldBalls;
  public float speed;
  int timer;
  int sleepMS;

  public boolean soundToggle;

  public Thread thread;
  
  public void init() {
    System.out.println("\n");
    System.out.println("---=== Broomsticks Full 1.5 by Paul Rajlich ===---");
    System.out.println("    copyright (c) 2000, all rights reserved\n");
    setBackground(Color.white);
    setFont(new Font("Helvetica", Font.PLAIN, 12));

    Dimension d = size();
    width = d.width;
    height = d.height;
    midW = width/2;
    midH = height/2;

    soundToggle = true;
    backToggle = 0;
    started = false;
    gameover = false;
    offImage = null;
    offgc = null;
    timer = 0;

    green = new Color(0, 164, 0);
    blue = new Color(0, 128, 255);
    sky = new Color(216, 215, 255);
    yellow = new Color(128, 128, 0);
    gold = new Color(255, 255, 0);

    redBalls = parseParam("RED", 1);
    blackBalls = parseParam("BLACK", 2);
    goldBalls = parseParam("GOLD", 1);
    speed = parseParam("SPEED", (float) 1.0);
    teams = parseParam("TEAMS", true);
    winScore = parseParam("WINSCORE", 50);
    int seconds = parseParam("DURATION", 180);
    duration = seconds * 1000; // millis

    playersStr = parseParam("PLAYERS", "players.gif");
    itemsStr = parseParam("ITEMS", "items.gif");
    fieldStr = parseParam("FIELD", "field.jpg");
    bgStr = parseParam("BACKGROUND", "sky1.jpg");

    loadImages();
    loadSounds();

    balls = new Ball[redBalls + blackBalls + goldBalls];

    int i;
    for (i=0; i < redBalls; i++) {
      balls[i] = new Ball(this, 2, midW, midH-20*i-20);
      balls[i].catchable = true;
    }
    for (i=0; i < blackBalls; i++) {
      balls[redBalls+i] = new Ball(this, 1, midW, midH+20*i+20);
      balls[redBalls+i].speedFactor *= 1.5;
    }
    for (i=0; i < goldBalls; i++) {
      balls[redBalls+blackBalls+i] = new GoldBall(this, 0, midW, 50);
      balls[redBalls+blackBalls+i].catchable = true;
      balls[redBalls+blackBalls+i].alive = false;
      balls[redBalls+blackBalls+i].smart = parseParam("GOLDSMART", 1);
    }

    if (teams)
      players = new Person[4];
    else
      players = new Person[2];

    players[0] = new Person(balls[0], this, 1, 100, midH);
    players[0].setKeys('e', 's', 'f', '1', 't');
    players[0].setInfoXY(20, height-15);

    players[1] = new Person(balls[0], this, 4, width-100, midH);
    players[1].setKeys(Event.UP, Event.LEFT, Event.RIGHT, Event.ENTER, 0);
    players[1].setInfoXY(width-150, height-15);
    players[1].side = 1; // team (and dir facing when not moving)

    if (teams) {
      players[2] = new Person(balls[0], this, 2, width-200, midH);
      players[2].setKeys(Event.HOME, Event.DELETE, Event.PGDN, Event.INSERT, Event.PGUP);
      players[2].setInfoXY(midW, height-15);

      players[3] = new Person(balls[0], this, 3, 200, midH);
      players[3].setKeys('i', 'j', 'l', '7', 'p');
      players[3].setInfoXY(midW-150, height-15);
      players[2].side = 1;
    }

    teamScore = new int[2];
    teamScore[0] = 0;
    teamScore[1] = 0;

    teamBasket = new boolean[2];
    teamBasket[0] = false;
    teamBasket[1] = false;
    
    prevTeamBasket = new boolean[2];
    prevTeamBasket[0] = false;
    prevTeamBasket[1] = false;

    thread = null;

  }

  public String parseParam(String param, String defaultVal) {
    String str;
    str = this.getParameter(param);
    if (str != null)
      return str;
    return defaultVal;
  }
  
  public boolean parseParam(String param, boolean defaultVal) {
    String str;
    str = this.getParameter(param);
    if (str != null) {
      int val = (Integer.valueOf(str)).intValue();
      if (val != 0)
        return true;
    }
    return false;
  }

  public int parseParam(String param, int defaultVal) {
    String str;
    str = this.getParameter(param);
    if (str != null)
      return (Integer.valueOf(str)).intValue();
    return defaultVal;
  }

  public float parseParam(String param, float defaultVal) {
    String str;
    str = this.getParameter(param);
    if (str != null)
      return (Float.valueOf(str)).floatValue();
    return defaultVal;
  }

  public void loadSounds() {
    scoreClip = getAudioClip(getCodeBase(), "snd/score.au");
    grabClip = getAudioClip(getCodeBase(), "snd/grab.au");
    bumpClip = getAudioClip(getCodeBase(), "snd/bump.au");
    winClip = getAudioClip(getCodeBase(), "snd/win.au");
  }

  public void loadImages() {
    System.out.println("loading images...");

    tracker = new MediaTracker(this);
    playersImg = this.getImage(this.getCodeBase(), "images/"+playersStr);
    itemsImg = this.getImage(this.getCodeBase(), "images/"+itemsStr);
    introImg = this.getImage(this.getCodeBase(), "images/intro.gif");
    fdImg = this.getImage(this.getCodeBase(), "images/"+fieldStr);
    tracker.addImage(playersImg, 0);
    tracker.addImage(itemsImg, 0);
    tracker.addImage(introImg, 0);
    tracker.addImage(fdImg, 0);

    ImageFilter scale[] = new ImageFilter[5];
    ImageProducer bgSrc[] = new ImageProducer[5];
    bgImg = new Image[5];
    backImg = new Image[5];
    for (int i=1; i<5; i++) { 
      if (i == 1)
        bgImg[i] = this.getImage(this.getCodeBase(), "images/"+bgStr);
      else
        bgImg[i] = this.getImage(this.getCodeBase(), "images/sky"+i+".jpg");
      tracker.addImage(bgImg[i], 0);

      // sky  
      scale[i] = new AreaAveragingScaleFilter(width-22, height-52);
      bgSrc[i] = new FilteredImageSource(bgImg[i].getSource(), scale[i]);
      backImg[i] = createImage(bgSrc[i]);
      tracker.addImage(backImg[i], 0);
    }

    // field
    ImageFilter scale2 = new AreaAveragingScaleFilter(width-22, 25);
    ImageProducer fdSrc = new FilteredImageSource(fdImg.getSource(), scale2);
    fieldImg = createImage(fdSrc);
    tracker.addImage(fieldImg, 0);

    // players
    img = new Image[10][2][2];
    for (int m=0; m<10; m++) {
      System.out.println("model " + m);
      for (int i=0; i<2; i++)
        for (int j=0; j<2; j++) {
          ImageFilter crop;
          if (m < 5)
            crop = new CropImageFilter(i*80 + j*40 + 1, m*40 + 41,39,39);
          else
            crop = new CropImageFilter(i*80 + j*40 + 161,(m-5)*40 + 41,39,39);
          ImageProducer producer;
          producer = new FilteredImageSource(playersImg.getSource(), crop);
          img[m][i][j] = createImage(producer);
          tracker.addImage(img[m][i][j], 0);
        }
    }

    // balls
    ballImg = new Image[3];
    for (int k=0; k<3; k++) {
      ImageFilter crop = new CropImageFilter(1,k*40+1,39,39);
      ImageProducer producer;
      producer = new FilteredImageSource(itemsImg.getSource(), crop);
      ballImg[k] = createImage(producer);
      tracker.addImage(ballImg[k], 0);
    }

    // hoops
    ImageFilter crop = new CropImageFilter(1,121,39,39);
    ImageProducer producer;
    producer = new FilteredImageSource(itemsImg.getSource(), crop);
    basket = createImage(producer);
    tracker.addImage(basket, 0);

    ImageFilter cropH = new CropImageFilter(41,121,39,39);
    ImageProducer producerH;
    producerH = new FilteredImageSource(itemsImg.getSource(), cropH);
    basketH = createImage(producerH);
    tracker.addImage(basketH, 0);

    //System.out.println("done");
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
    startTime = System.currentTimeMillis();
    for (int i=0; i < goldBalls; i++)
      balls[redBalls+blackBalls+i].alive = false;
    paint(getGraphics());
    return true;
  }

  public boolean keyDown(Event e, int key) {

    // back toggle
    if (key == 'b') {
      backToggle++;
      if (backToggle > 4)
        backToggle = 0;
    }

    if (key == 'n') {
      if (soundToggle)
        soundToggle = false;
      else
        soundToggle = true;
      paint(getGraphics());
    }

    for (int i=0; i<players.length; i++)
      players[i].handleKeyEvent(e, key);

    return false;
  }

  public void update(Graphics g) {
    if (offgc == null) {
      offImage = createImage(width-22, height-52);
      offgc = offImage.getGraphics();
      offgc.translate(-11, -31);
    }

    // draw background into back buffer
    if (!started) {
      offgc.drawImage(backImg[1], 11, 31, this);
      offgc.drawImage(fieldImg, 11, height-46, this);
    }
    else if (backToggle > 0) { 
      offgc.drawImage(backImg[backToggle], 11, 31, this);
      offgc.drawImage(fieldImg, 11, height-46, this);
    }
    else {
      offgc.setColor(sky);
      offgc.fillRect(11, 31, width-22, height-52);
      offgc.setColor(green);
      offgc.fillRect(11, height-46, width-22, 25);
      offgc.setColor(Color.black);
      offgc.drawLine(11, height-46, width-11, height-46);
      offgc.drawLine(41, height-46, 11, height-21);
      offgc.drawLine(width-51, height-46, width-11, height-21);
    }

    // draw timeline
    if (goldBalls > 0)
      drawTime(offgc);
    //float percent = (System.currentTimeMillis() - startTime)/(float)duration;
    //int len = (int) ((width-22) * percent);
    //offgc.fillRect(11, midH, len, 10);

    // draw baskets and scene into back buffer
    drawBaskets(offgc);
    drawScene(offgc);

    // swap buffers
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

      g.drawString("It's easier to just click on the keys rather than hold them down.", midW-175, 330);
      g.drawString("Click on your up key several times to start flying.", midW-140, 345);
      g.drawString("If it runs choppy or slow, close and restart.", midW-125, 365);
      if (teams) {
        g.drawString("Blue Team", 100, 240);
        g.drawString("use E, S, F keys", 100, 260);
        g.drawString("use I, J, L keys", 100, 275);
      }
      else {
        g.drawString("Blue Player", 100, 240);
        g.drawString("use E, S, F keys", 100, 260);
        g.drawString("use 1 to switch player", 100, 275);
        g.setColor(Color.red);
        g.drawString("Press T for computer control", 100, 290);
        g.drawString("(use S and F to adjust skill)", 100, 305);
        g.setColor(Color.black);
      }

      if (teams) {
        g.drawString("Green Team", width-250, 240);
        g.drawString("use arrow-keys", width-250, 260);
        g.drawString("use Del, Home, PgDn", width-250, 275);
      }
      else {
        g.drawString("Green Player", width-250, 240);
        g.drawString("use arrow keys", width-250, 260);
        g.drawString("use ENTER to switch player", width-250, 275);
      }

      g.drawImage(introImg, midW-175, 90, this); // was 160
    }
    else {
      int i;
      for (i=0; i<players.length; i++)
        players[i].draw(g);
      for (i=0; i<balls.length; i++)
        if (balls[i].alive)
          balls[i].draw(g);
    }
  }

  public void drawTime(Graphics g) {

    float percent = (System.currentTimeMillis() - startTime)/(float)duration;
    if (percent > 1.0)
      return;

    int len = (int) (200 * percent);
    g.setColor(yellow);
    g.fillRect(midW-100, 30, 200-len, 15);
    g.setColor(Color.black);
    g.drawRect(midW-100, 30, 200, 15);
    g.drawString("time:", midW-20, 43);
    g.drawLine(midW+100-len, 30, midW+100-len, 45);
  }

  public void drawScores(Graphics g) {
    drawScores(g, 2);
  }

  public void drawScores(Graphics g, int scored) {
    if (scored == 0)
      g.setColor(gold);
    else
      g.setColor(blue);
    g.fillRect(48, 8, 100, 15);
    if (scored == 1)
      g.setColor(gold);
    else
      g.setColor(green);
    g.fillRect(width-152, 8, 100, 15);
    g.setColor(Color.black);
    g.drawRect(48, 8, 100, 15);
    g.drawRect(width-152, 8, 100, 15);
    g.drawString("Score: " + teamScore[0], 50, 20);
    g.drawString("Score: " + teamScore[1], width-150, 20);
  }

  public void paint(Graphics g) {
    System.out.println("paint()");
    g.setColor(getBackground());
    g.fillRect(0, 0, width, height); // clear whole drawing area
    drawScene(g);
    drawScores(g);
    g.drawString("Broomsticks by Paul Rajlich", midW-75, 20);
    g.drawRect(10, 30, width-21, height-51);

    for (int i=0; i<players.length; i++)
      players[i].drawInfo(g);

    if (!teams) {
      if (soundToggle)
        g.drawString("n for sound off, b to change background", midW-125, height-5);
      else
        g.drawString("n for sound on, b to change background", midW-125, height-5);
      // was midW-65
    }
  }

 public void gameOver() {
    started = false;
    gameover = true;
    int i;
    if (soundToggle)
      winClip.play();
    //for (i=0; i < player.length; i++)
    //  players[i].reset();
    //for (i=0; i < balls.length; i++)
    //  balls[i].reset();
  }

  public void run() {
    System.out.println("Applet thread started...\n");

    Thread.currentThread().setPriority(Thread.MIN_PRIORITY);
    long sleepTime;
    sleepMS = parseParam("SLEEP", 30);

    while (Thread.currentThread() == thread) {
      long oldTime = System.currentTimeMillis();
      if (started) {
        checkCollisions();
        checkCaught();
        moveFlyers();
        if (timer > 0) {
          timer--;
          if (timer == 1)
            drawScores(getGraphics());
        }
        // time for gold ball
        if (goldBalls > 0 && (oldTime - startTime > duration)) {
          for (int i=0; i < goldBalls; i++)
            balls[redBalls+blackBalls+i].alive = true;
        }
      }
      repaint();
      long elapsedTime = System.currentTimeMillis() - oldTime;
      //System.out.println("etime: " + elapsedTime);
      if (started)
        sleepTime = sleepMS;
      else
        sleepTime = 1000;
      if (elapsedTime < sleepTime)
      try {
        Thread.sleep(sleepTime-elapsedTime);
      } catch (InterruptedException e) { break; }
    }
    System.out.println("thread done.");
  }

  public void moveFlyers() {
    int i;
    for (i=0; i<players.length; i++)
      players[i].move();
    for (i=0; i<balls.length; i++)
      if (balls[i].alive)
        balls[i].move();
  }

  public void checkCaught() {

    teamBasket[0] = false;
    teamBasket[1] = false;

    // check all pairs of player and balls
    for (int i=0; i<players.length; i++) {
      for (int j=0; j<balls.length; j++) {
        Person p = players[i];
        Ball b = balls[j];
        // player and catchable ball 
        if (b.alive && b.catchable) {
          int dx = p.x+8 - b.x;
          int dy = p.y+8 - b.y;
          if (Math.abs(dx) < 20 && Math.abs(dy) < 20) {
            if (p.velocityX > 0)
              b.x = p.x + 18;
            else
              b.x = p.x + 8;
            b.y = p.y + 15;
            if (b.isGoldBall)
              gameOver();
            teamBasket[p.side] = true;
            if (soundToggle && !prevTeamBasket[p.side])
              grabClip.play();
            if ((p.side == 0 && (p.x > (width-17-p.w))) ||
                (p.side == 1 && (p.x < 17))) {
              dy = b.y - (midH - 10);
              if (Math.abs(dy) < 15) {
                teamScore[p.side] += 10;
                //paint(getGraphics());
                drawScores(getGraphics(), p.side);
                timer = 15;
                //play(getCodeBase(), "snd/score.au");
                if (soundToggle)
                  scoreClip.play();
                b.x = midW;
                if (goldBalls == 0 && teamScore[p.side] >= winScore)
                  gameOver();
              }
            }
          }
        }
      }
    }
    prevTeamBasket[0] = teamBasket[0];
    prevTeamBasket[1] = teamBasket[1];
  }

  public void checkCollisions() {
    // check all pairs of players
    int i, j;
    for (i=0; i<players.length; i++) {
      for (j=0; j<players.length; j++) {
        if (i != j) {
          Person p1 = players[i];
          Person p2 = players[j];
          int dx = p1.x - p2.x;
          int dy = p1.y - p2.y;
          if (Math.abs(dx) < p1.w && Math.abs(dy) < p1.h)  {
            if (soundToggle && (p1.y < p1.bottom-p1.h-50))
              bumpClip.play();
            // lower one gets bumped (lower is higher y value)
            if (p1.y < p2.y)
              p2.y = 1000; // will be clamped
            else if (p2.y > p1.y)
              p1.y = 1000;
          }
        }
      }
    }
    // check all pairs of players and balls
    for (i=0; i<players.length; i++) {
      for (j=0; j<balls.length; j++) {
        Person p = players[i];
        Ball b = balls[j];
        if (b.alive && !b.catchable) {
          int dx = p.x+8 - b.x;
          int dy = p.y+8 - b.y;
          if (Math.abs(dx) < 20 && Math.abs(dy) < 20) {
            if (soundToggle && (p.y < p.bottom-p.h-50))
              bumpClip.play();
            p.y = 1000;
          }
        }
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
  public boolean catchable;
  public boolean isGoldBall;
  public float speedFactor;
  static Random random=new Random(); // one instance for all flying objects
  public int smart;

  FlyingObject(BroomstickApplet app, int iX, int iY) {
    x = iX;
    y = iY;

    applet = app;
    g = applet.getGraphics();
    velocityX = 0;
    velocityY = 0;

    catchable = false;
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
  public boolean isRobot;
  Ball target;
  int upKey, leftKey, rightKey, modelKey, robotKey;
  int infoX, infoY;

  Person(Ball t, BroomstickApplet app, int theModel, int initX, int initY) {
    super(app, initX, initY);
    model = theModel;
    target = t;
    isRobot = false;
    smart = 15;
    init();
    upKey = 'z';
    leftKey = 'z';
    rightKey = 'z';
    modelKey = 'z';
    robotKey = 'z';
    infoX = 0; 
    infoY = 0;
  }

  public void setInfoXY(int x, int y) {
    infoX = x;
    infoY = y;
  }

  public void setKeys(int up, int left, int right, int m, int robot) {
    upKey = up;
    leftKey = left; 
    rightKey = right;
    modelKey = m;
    robotKey = robot;
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

  public void handleKeyEvent(Event e, int key) {
    if (isRobot) {
      if (key == leftKey)
        dumber();
      if (key == rightKey)
        smarter();
      if (key == robotKey) {
        isRobot = false; 
        velocityX = 0;
        drawInfo(applet.getGraphics());
      }
    }
    else {
      if (key == upKey)
        up();
      if (key == leftKey)
        left();
      if (key == rightKey)
        right();
      if (key == robotKey) {
         isRobot = true;
         drawInfo(applet.getGraphics());
      }
      if (key == modelKey)
        switchModel();
    }
  }

  public void toggleRobot() {
    if (isRobot) {
      isRobot = false;
      velocityX = 0;
    }
    else
      isRobot = true;
    applet.paint(applet.getGraphics());
  }

  public void smarter() {
    smart -= 5;
    if (smart <= 1)
      smart = 1;
    drawInfo(applet.getGraphics());
  }

  public void dumber() {
    smart += 5;
    if (smart >= 30)
      smart = 30;
    drawInfo(applet.getGraphics());
  }

  public void move() {

    if (isRobot) {
      int choice;
      choice = random.nextInt()%smart;

      if (choice == 0) {
        // we have the ball
        if (applet.teamBasket[side]) {
          if (side == 0) {
            if (this.x < applet.width-50)
              right();
            if (this.y > applet.midH-10)
              up();
          }
          else {
            if (this.x > 50)
              left();
            if (this.y > applet.midH-10)
              up();
          }
        }
        else {  // get the ball
          // idea: only have one of these happen
          if (target.y < this.y)
            up();
          if (target.x < this.x-10)
            left();
          if (target.x > this.x+10)
            right();
        }
      }
    }
    super.move();
  }

  public void switchModel() {
    model++;
    if (model > 4)
      model = 0;
  }

  public void drawInfo(Graphics g) {
    g.setColor(applet.getBackground());
    g.fillRect(infoX, infoY, 145, 15);
    if (!isRobot) {
      g.setColor(Color.black);
      if (upKey == Event.UP)
        g.drawString("arrow-keys and ENTER", infoX, infoY+10);
      else if (upKey == Event.HOME)
        g.drawString("Home Del PD Ins PU", infoX, infoY+10);
      else if (upKey == 'e')
        g.drawString("E S F 1 T", infoX, infoY+10);
      else
        g.drawString("I J L 7 P", infoX, infoY+10);

      //g.drawString((char) upKey + " " + (char) leftKey + " " + (char) rightKey
      //     + " " + (char) modelKey + " " + (char) robotKey, infoX, infoY+10);
    }
    else {
      g.setColor(Color.red);
      g.fillRect(infoX+30, infoY, 35-smart, 10);
      g.setColor(Color.black);
      g.drawRect(infoX+30, infoY, 34, 10);
      g.drawString("skill:", infoX, infoY+10);
      if (upKey == Event.HOME)
        g.drawString("Del PD PU", infoX+70, infoY+10);
      else if (upKey == 'e')
        g.drawString("S F T", infoX+70, infoY+10);
      else
        g.drawString("J L P", infoX+70, infoY+10);

      //  g.drawString((char) leftKey + " " + (char) rightKey + " "
      //             + (char) robotKey, infoX+70, infoY+10);
    }
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
      g.drawImage(applet.img[model+5][v][h], x, y, applet);
  }
}
    
 
class Ball extends FlyingObject { 
  int model;
  boolean alive;

  Ball(BroomstickApplet theApplet, int theModel, int initX, int initY) {
    super(theApplet, initX, initY);
    model = theModel;
    alive = true;
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
    if (y > applet.height-90)
      up();
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
    smart = 1;
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
    for (int i=0; i<applet.players.length; i++) {
      Person p = applet.players[i];
      int dx = x - p.x;
      int dy = y - p.y;
      if (Math.abs(dx) < 100 && Math.abs(dy) < 100) {
        int choice = random.nextInt()%smart;
        //int choice = 0;
        if (choice == 0) {
          if (p.x < x)
            right();
          if (p.x > x)
            left();
          if (p.y > y)
            up();
          if (p.y < y)
            down();
          }
      } 
    }
    super.move();
  }

  public void down() {
    velocityY += 2;
    if (velocityY > 4)
      velocityY = 4;
  }
}
