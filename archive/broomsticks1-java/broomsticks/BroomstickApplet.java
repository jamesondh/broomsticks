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
import java.net.*;

public class BroomstickApplet extends Applet implements Runnable {

  public Image[][][] img;
  public Image basket, basketH;
  public Image[] ballImg;

  public Image playersImg;
  public Image itemsImg;
  public Image introImg;
  public Image backImg;
  public Image fieldImg;
  public Image cdImg;
  public boolean backToggle;

  Color blue, green, sky, yellow, gold;

  Image offImage;
  Graphics offgc;
  MediaTracker tracker;

  public int currBasket;
  public Person player1, player2;
  public Ball ball1, ball2, redball, goldball;
  public boolean started, gameover, pickedGame, readRules;
  int timer;

  public Thread thread;
  
  public void init() {
    System.out.println("\n");
    System.out.println("---=== Broomsticks 1.26b by Paul Rajlich ===---");
    System.out.println("    copyright (c) 2000, all rights reserved\n");
    setBackground(Color.white);
    setFont(new Font("Helvetica", Font.PLAIN, 12));

    tracker = new MediaTracker(this);
    playersImg = this.getImage(this.getCodeBase(), "images/players.gif");
    itemsImg = this.getImage(this.getCodeBase(), "images/items.gif");
    introImg = this.getImage(this.getCodeBase(), "images/intro.gif"); 
    backImg = this.getImage(this.getCodeBase(), "images/sky1.jpg");
    fieldImg = this.getImage(this.getCodeBase(), "images/field.jpg");
    cdImg = this.getImage(this.getCodeBase(), "images/miniCDt.gif");
    Image hitImg = this.getImage(this.getCodeBase(), "cgi-bin/logs.cgi?log=broomLog");
    tracker.addImage(playersImg, 0);
    tracker.addImage(itemsImg, 0);
    tracker.addImage(introImg, 0);
    tracker.addImage(backImg, 0);
    tracker.addImage(fieldImg, 0);
    tracker.addImage(cdImg, 0);
    tracker.addImage(hitImg, 0);

    backToggle = false;
    
    started = false;
    gameover = false;
    pickedGame = false;
    readRules = false;
    offImage = null;
    offgc = null;
    timer = 0;

    green = new Color(0, 164, 0);
    blue = new Color(0, 128, 255);
    sky = new Color(215, 215, 255);
    yellow = new Color(128, 128, 0);
    gold = new Color(255, 255, 0);

    loadModels();

    ball1 = new Ball(this, 0, 325, 200);
    ball2 = new Ball(this, 0, 325, 300);
    ball1.speedFactor = (float) 1.5;
    ball2.speedFactor = (float) 1.5;
    redball = new Ball(this, 1, 325, 100);

    //player1 = new Person(this, 0, 100, 200);
    player1 = new Person(redball, this, 1, 100, 200);
    player2 = new Person(redball, this, 4, 520, 200);
    player2.side = 1; // dir facing when not moving
    thread = null;

    //tracker.checkID(0, true);
    //System.gc();
 
    currBasket = 0;
  }

  public void loadModels() {
    System.out.println("loading models...");
    img = new Image[10][2][2];
    for (int m=0; m<10; m++) {
      System.out.println("model " + m);
      for (int i=0; i<2; i++)
        for (int j=0; j<2; j++) {
          ImageFilter crop;
          if (m < 5)
            crop = new CropImageFilter(i*80 + j*40 + 1,m*40 + 41,39,39);
          else
            crop = new CropImageFilter(i*80 + j*40 + 161,(m-5)*40 + 41,39,39);
          ImageProducer producer = new FilteredImageSource(playersImg.getSource(), crop);
          img[m][i][j] = createImage(producer);
          tracker.addImage(img[m][i][j], 0);
        }
    }
    ballImg = new Image[2];
    for (int k=0; k<2; k++) {
      ImageFilter crop = new CropImageFilter(1,(k+1)*40+1,39,39);
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

  public void openVB() {
    try {
      //URL vb = new URL("http://www.visbox.com/broomsticks/");
      URL vb = new URL("http://brighton.ncsa.uiuc.edu/broomsticks/official.html");
      this.getAppletContext().showDocument(vb, "newVB");
    } catch (MalformedURLException me) {
      System.out.println("MalformedURLException: " + me);
    }
  }

  public boolean mouseDown(Event e, int x, int y) {
    if (!pickedGame) {
      if (x > 150 && x < 270 && y > 205 && y < 255) {
        player1.isRobot = true;
        pickedGame = true;
      }
      if (x > 400 && x < 520 && y > 205 && y < 255) {
        player1.isRobot = false;
        pickedGame = true;
      }
      if (x > 175 && x < 500 && y > 310 && y < 340)
        openVB();
    }
    else if (!readRules) {
      if (x > 215 && x < 445 && y > 165 && y < 185)
        readRules = true;
    }
    else if (!started) {
      if (gameover && x > 75 && x < 300 && y > 350 && y < 370)
        openVB();
      else if (x > 215 && x < 445 && y > 165 && y < 185) {
        //started = true;
        if (gameover) {
          pickedGame = false;
          readRules = false;
        }
        else
          started = true;
        gameover = false;
        player1.score = 0;
        player2.score = 0;
        paint(getGraphics());
      }
    }
    return true;
  }

  public boolean keyDown(Event e, int key) {

    // back toggle
    if (key == 'b' || key == 'B')
      if (backToggle)
        backToggle = false;
      else
        backToggle = true;

    // player 2
    if (key == e.LEFT)
      player2.left();
    if (key == e.RIGHT)
      player2.right();
    if (key == e.UP)
      player2.up();
    if (key == e.ENTER)
      player2.switchModel();
   
    // player 1
    if (!player1.isRobot) {
      if (key == 'e' || key == 'E')
        player1.up();
      if (key == 's' || key == 'S')
        player1.left();
      if (key == 'f' || key == 'F')
        player1.right();
      if (key == '1' || key == '!')
        player1.switchModel();
    }

    if (key == 'p' || key == 'P') {
      if (player1.isRobot) {
        player1.isRobot = false;
        player1.velocityX = 0;
      }
      else
        player1.isRobot = true;
      paint(getGraphics());
    }

    if (player1.isRobot && (key == 's' || key == 'S')) {
      player1.dumber();
      drawSkill(getGraphics());
    }

    if (player1.isRobot && (key == 'f' || key == 'F')) {
      player1.smarter();
      drawSkill(getGraphics());
    }

    return false;
  }

  public void update(Graphics g) {
    if (offgc == null) {
      offImage = createImage(628, 368);
      offgc = offImage.getGraphics();
      offgc.translate(-11, -31);
    }

    if (backToggle || !started) {
      offgc.drawImage(backImg, 11, 31, this);
      offgc.drawImage(fieldImg, 11, 374, this);
    }
    else { 
      offgc.setColor(sky);
      offgc.fillRect(11, 31, 628, 343);
      offgc.setColor(green);
      offgc.fillRect(11, 374, 628, 25);
      offgc.setColor(Color.black);
      offgc.drawLine(11, 374, 639, 374);
      offgc.drawLine(41, 374, 11, 399);
      offgc.drawLine(609, 374, 639, 399);
    }

    drawBaskets(offgc); 
    drawScene(offgc);

    g.drawImage(offImage, 11, 31, this);
    //offImage.flush();
  }

  void drawBaskets(Graphics g) {
      if (currBasket == 2) {
        g.drawImage(basketH, 21, 190, this);
        g.setColor(Color.black);
        g.drawRect(28, 229, 3, 160);
        g.setColor(gold);
        g.fillRect(29, 229, 2, 160);
      }
      else {
        g.drawImage(basket, 21, 190, this);
        g.setColor(Color.black);
        g.drawRect(28, 229, 3, 160);
        g.setColor(yellow);
        g.fillRect(29, 229, 2, 160);
      }

      if (currBasket == 1) {
        g.drawImage(basketH, 609, 190, this);
        g.setColor(Color.black);
        g.drawRect(616, 229, 3, 160);
        g.setColor(gold);
        g.fillRect(617, 229, 2, 160);
      }
      else {
        g.drawImage(basket, 609, 190, this);
        g.setColor(Color.black);
        g.drawRect(616, 229, 3, 160);
        g.setColor(yellow);
        g.fillRect(617, 229, 2, 160);
      }
  }

  public void drawScene(Graphics g) {
    if (!tracker.checkAll(true)) {
      g.setColor(Color.black);
      g.drawString("Loading images, please wait...", 250, 200);
      g.drawImage(introImg, 150, 90, this);
    }
    else if (!started && !pickedGame) {
      g.setColor(green);
      g.fillRect(150, 205, 120, 50);
      g.fillRect(400, 205, 120, 50);
      g.setColor(Color.black);
      g.drawRect(150, 205, 120, 50);
      g.drawRect(400, 205, 120, 50);
      g.drawString("Click here for", 170, 225);
      g.drawString("single player", 170, 240);
      g.drawString("Click here for", 420, 225);
      g.drawString("two player", 420, 240);
      g.setColor(green);
      g.fillRect(175, 310, 320, 30);
      g.setColor(Color.black);
      g.drawRect(175, 310, 320, 30);
      g.drawString("Visit my guestbook by clicking below!", 220, 300);
      g.drawString("Official Website: http://www.visbox.com/broomsticks/", 190, 330);
      g.drawString("Copyright (c) 2000 Paul Rajlich, all rights reserved.", 190, 365);
      g.drawImage(introImg, 150, 70, this); // was 160
    }
    else if (!started && !readRules) {
        g.setColor(green);
        g.fillRect(215, 165, 230, 20);
        g.setColor(Color.black);
        g.drawRect(215, 165, 230, 20);
        g.drawString("Click here to continue.", 260, 180);

        g.drawString("The rules of the game are:", 150, 240);
        g.drawString("1. When two players collide, the player that is lower is bumped.", 150, 260);
        g.drawString("2. When a player collides with a black ball, the player is bumped.", 150, 275);
        g.drawString("3. When a player gets close to the red ball, the player catches the ball.", 150, 290);
        g.drawString("4. When a player puts the red ball in the opponent's hoop, 10 points are scored.", 150, 305);
        g.drawString("5. First player to score 50 points wins.", 150, 320);

        g.drawString("Have fun! If you haven't played against a friend, you haven't played! :-)", 150, 350);

        g.drawImage(introImg, 150, 70, this); // was 160
    }
    else if (!started) {
      g.setColor(Color.black);
      if (!gameover) {
        g.setColor(green);
        g.fillRect(215, 165, 230, 20);
        g.setColor(Color.black);
        g.drawRect(215, 165, 230, 20);
        g.drawString("Click here to start.", 275, 180);

        g.drawString("It's easier to just click on the keys rather than hold them down.", 150, 330);
        g.drawString("Click on your up key several times to start flying.", 185, 345);
        //g.drawString("If it runs choppy or slow, close and restart.", 200, 365);
        if (!player1.isRobot) {
          g.drawString("Blue Player", 100, 240);
          g.drawString("use E, S, F keys", 100, 260);
          g.drawString("use 1 to switch player", 100, 275);
        }
        else {
          g.drawString("Computer Player", 100, 240);
          g.drawString("use S and F to adjust skill", 100, 260);
        }

        g.drawString("Green Player", 400, 240);
        g.drawString("use arrow keys", 400, 260);
        g.drawString("use ENTER to switch player", 400, 275);

        g.drawImage(introImg, 150, 70, this); // was 160
      }
      else {
        g.setColor(green);
        g.fillRect(215, 165, 230, 20);
        g.setColor(Color.black);
        g.drawRect(215, 165, 230, 20);
        g.drawString("Game over. Click here to play again.", 225, 180);

        g.drawString("Like this game? Get the full version!", 75, 220);
        g.drawString("Send a check or money order for $10 to:", 75, 235);
        g.drawString("Paul Rajlich", 100, 255);
        g.drawString("1709 Magnolia Drive", 100, 270);
        g.drawString("St. Joseph, IL 61873  USA", 100, 285);
        g.drawString("Don't forget to include your address.", 75, 305);
        g.drawString("For more info and screenshots, or if you want", 75, 325);
        g.drawString("to buy it online with a credit card, go here!:", 75, 340);
        g.setColor(green);
        g.fillRect(75, 350, 225, 20);
        g.setColor(Color.black);
        g.drawRect(75, 350, 225, 20);
        g.drawString("http://www.visbox.com/broomsticks/", 90, 365);
      

        g.drawString("The full version features:", 350, 220);
        g.drawString("- no need to download all the time!", 350, 240);
        g.drawString("- sounds!", 350, 255);
        g.drawString("- small and fast gold ball!", 350, 270);
        g.drawString("- 1-on-1 or 2-on-2 teams!", 350, 285);
        g.drawString("- multiple computer-controlled players!", 350, 300);
        g.drawString("- create your own characters!", 350, 315);
        g.drawString("- more backgrounds! Use your own!", 350, 330);
        g.drawString("- choose how many balls of each type!", 350, 345);
        g.drawString("- choose size and speed of the game!", 350, 360);

        g.drawString("The full version comes on this mini CD that is only the size", 15, 45);
        g.drawString("of a credit card! It works in any standard CD-ROM drive!", 15, 60);
        g.drawString("You can put it in your pocket and take it anywhere! :-)", 15, 75);
        g.drawImage(cdImg, 15, 80, this);
        g.drawImage(introImg, 150, 70, this);
      }
    }
    else {
      player1.draw(g);
      player2.draw(g);
      ball1.draw(g);
      ball2.draw(g);
      redball.draw(g);
    }
  }

  public void drawSkill(Graphics g) {
    g.setColor(getBackground());
    g.fillRect(60, 405, 34, 10);
    g.setColor(Color.red);
    g.fillRect(60, 405, 35-player1.smart, 10);
    g.setColor(Color.black);
    g.drawRect(60, 405, 34, 10);
  }

  public void drawScores(Graphics g) {
    drawScores(g, 0);
  }

  public void drawScores(Graphics g, int scored) {
    if (scored == 1)
      g.setColor(gold);
    else
      g.setColor(blue);
    g.fillRect(48, 8, 100, 15);
    if (scored == 2)
      g.setColor(gold);
    else
      g.setColor(green);
    g.fillRect(498, 8, 100, 15);
    g.setColor(Color.black);
    g.drawRect(48, 8, 100, 15);
    g.drawRect(498, 8, 100, 15);
    g.drawString("Score: " + player1.score, 50, 20);
    g.drawString("Score: " + player2.score, 500, 20);
  }

  public void paint(Graphics g) {
    System.out.println("paint()");
    g.setColor(getBackground());
    g.fillRect(0, 0, 650, 430); // clear whole drawing area
    drawScene(g);
    drawScores(g);
    g.drawString("Broomsticks by Paul Rajlich", 245, 20);
    g.drawRect(10, 30, 629, 369);
    if (started) {
      if (player1.isRobot) {
        //g.setColor(Color.red);
        //g.drawString("P for human control, S F", 50, 415);
        g.drawString("skill:", 30, 415);
        g.drawString("S and F", 100, 415);
        drawSkill(g);
        g.drawString("P for two-player, B to change background", 200, 415);
      }
      else {
        g.drawString("E S F and 1", 50, 415);
        //g.drawString("E S F 1 and P", 50, 415);
        g.drawString("P for single-player, B to change background", 200, 415);
      }
      g.drawString("arrow-keys and ENTER", 500, 415);
    }
  }

  public void gameOver() {
    started = false;
    gameover = true;
    player1.x = 100; player1.y = 200;
    player1.velocityX = 0; player1.velocityY = 0;
    player2.x = 520; player2.y = 200;
    player2.velocityX = 0; player2.velocityY = 0;
    ball1.x = 325; ball1.y = 200;
    ball2.x = 325; ball2.y = 300;
    redball.x = 325; redball.y = 100;
    paint(getGraphics());
  }

  public void run() {
    System.out.println("Applet thread started...\n");

    //Thread.currentThread().setPriority(Thread.MIN_PRIORITY);
    long sleepTime;
 
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
      }
      repaint();
      long elapsedTime = System.currentTimeMillis() - oldTime;
      //System.out.println("etime: " + elapsedTime);
      if (started)
        sleepTime = 30;
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
        dy = rb.y - 200; // was 190
        if (Math.abs(dy) < 15) {
          //System.out.println("score!");
          p1.score += 10;
          //paint(getGraphics());
          drawScores(getGraphics(), 1);
          timer = 15;
          //play(getCodeBase(), "snd/Bluup.au");
          rb.x = 325;
          //rb.y = 1000;
          if (p1.score >= 50)
            gameOver();
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
        dy = rb.y - 200;
        if (Math.abs(dy) < 15) {
          //System.out.println("score!");
          p2.score += 10;
          //paint(getGraphics());
          drawScores(getGraphics(), 2);
          timer = 15;
          //play(getCodeBase(), "snd/Bluup.au");
          rb.x = 325; 
          //rb.y = 1000;
          if (p2.score >= 50)
            gameOver();
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
    if (Math.abs(dx) < p1.w-4 && Math.abs(dy) < p1.h-4)
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
  public float speedFactor;
  static Random random=new Random(); // one instance for all flying objects

  FlyingObject(BroomstickApplet theApplet, int initX, int initY) {
    x = initX;
    y = initY;

    applet = theApplet;
    velocityX = 0;
    velocityY = 0;
    speedFactor = (float) 1.0;
  }

  public void move() {
    x += velocityX*speedFactor;
    y += velocityY*speedFactor;
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
    if (y > 399-h-10) {
      y = 399-h-10;
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
  public boolean isRobot;
  public int smart;
  Ball target;

  Person(Ball t, BroomstickApplet app, int theModel, int initX, int initY) {
    super(app, initX, initY);
    model = theModel;
    target = t;
    isRobot = false;
    smart = 15;
    init();
  } 

  public void init() {
    System.out.println("Person init()");
    //w = applet.img[0][0][0].getWidth(applet);
    //h = applet.img[0][0][0].getHeight(applet);
    //System.out.println("size: " + w + "x" + h);
    w = 38;
    h = 38;
    score = 0;
    side = 0;
  }

  public void smarter() {
    smart -= 5;
    if (smart <= 1)
      smart = 1;
  }
 
  public void dumber() {
    smart += 5;
    if (smart >= 30)
      smart = 30;
  }

  public void move() {

    if (isRobot) {
      int choice;
      choice = random.nextInt()%smart;

      if (choice == 0) { 
        // we have the ball
        if (applet.currBasket == 1) {
          if (this.x < 600)
            right();
          if (this.y > 200)
            up(); 
        }
        else {  // get the ball
          if (target.x < this.x-10)
            left();
          if (target.x > this.x+10)
            right();
          if (target.y < this.y)
            up();
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

    if (side == 0) {
      //if (isRobot)
      //  g.drawImage(applet.img[4][v][h], x, y, applet);
      //else
      g.drawImage(applet.img[model][v][h], x, y, applet);
    }
    else
      g.drawImage(applet.img[model+5][v][h], x, y, applet);
  }
}

class Ball extends FlyingObject {

  int model;
  Image img;     

  Ball(BroomstickApplet theApplet, int theModel, int initX, int initY) {
    super(theApplet, initX, initY);
    model = theModel;
    init();
  }
  
  public void init() {
    System.out.println("Ball init()");
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
    if (y > 330)
      up();
    super.move();
  }

  public void draw(Graphics g) {
    g.drawImage(applet.ballImg[model], x, y, applet);
  }
}

