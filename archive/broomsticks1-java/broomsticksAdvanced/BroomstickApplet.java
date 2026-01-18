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
//# Copyright (C) 2000, 2001   Paul Rajlich, all rights reserved
//=========================================================================

import java.lang.*;
import java.util.*;
import java.awt.*;
import java.awt.event.WindowListener;
import java.awt.event.WindowEvent;
import java.awt.image.*;
import java.applet.*;
import java.io.*;

public class BroomstickApplet extends Applet implements WindowListener {
//public class BroomstickApplet extends Applet {

  public Frame window;
  public BroomPanel gamePanel;

  public Choice players, dive, speed, playerImg, itemImg, fieldImg, bgImg;
  public Choice accel, maxspeed, sound;
  public TextField red, black, gold, goldval, winscore, duration, width, height;

  public TextField newText(Panel parent, String label, String par, String def) {
    String val = getParameter(par);
    if (val == null)
      val = def;
    TextField text = new TextField(val, 4);
    parent.add(new Label(label));
    parent.add(text);
    return text;
  }

  public Choice newChoice(Panel parent, String label, String param, String c1, String c2, String c3, String c4, String c5, String c6) {
    Choice choose = new Choice();
    if (c1 != null) choose.addItem(c1);
    if (c2 != null) choose.addItem(c2);
    if (c3 != null) choose.addItem(c3);
    if (c4 != null) choose.addItem(c4);
    if (c5 != null) choose.addItem(c5);
    if (c6 != null) choose.addItem(c6);
    parent.add(new Label(label));
    parent.add(choose);
    String val = getParameter(param);
    if (val != null) {
      if (val.equals(c1) || val.equals(c2) || val.equals(c3) || val.equals(c4) || val.equals(c5) || val.equals(c6))
        choose.select(val);
      else {
        choose.addItem(val);
        choose.select(val);
      }
    }
    return choose;
  }

  public void init() {

    System.out.println("\n");
    System.out.println("--== Broomsticks Advanced Demo by Paul Rajlich ==--");
    System.out.println("    copyright (c) 2001, all rights reserved\n");

    setBackground(new Color(229, 229, 229));
    setLayout(new BorderLayout());

    Panel c = new Panel();
    c.setLayout(new GridLayout(0, 2)); // 2 cols

    players  = newChoice(c, "Number of players: ", "PLAYERS", "2", "4", null, null, null, null);
    dive     = newChoice(c, "Allow diving: ", "DIVING", "yes", "no", null, null, null, null);
    accel    = newChoice(c, "Acceleration: ", "ACCEL", "1", "2", "3", null, null, null);
    maxspeed = newChoice(c, "Max speed: ", "MAXSPEED", "4", "5", "6", "7", null, null);

    width    = newText(c, "Field width: ", "GAMEWIDTH", "640");
    height   = newText(c, "Field height: ", "GAMEHEIGHT", "450");
    red      = newText(c, "Red balls: ", "RED", "1");
    black    = newText(c, "Black balls: ", "BLACK", "2");
    gold     = newText(c, "Gold balls: ", "GOLD", "1");
    goldval  = newText(c, "Gold points: ", "GOLDPOINTS", "150");
    winscore = newText(c, "Score to win: ", "WINSCORE", "50");
    duration = newText(c, "Seconds to gold ball: ", "DURATION", "60");

    playerImg= newChoice(c, "Players image: ", "PLAYERSIMG", "images/players.gif", "images/harden.gif", "images/playersJeronimus3.gif", "images/ZeldaPLAYERS-ted.gif","images/playersSol.gif","images/playersBen.gif");
    itemImg  = newChoice(c, "Items image: ", "ITEMSIMG", "images/items.gif",null,null,null,null,null);
    fieldImg = newChoice(c, "Field image: ", "FIELDIMG", "images/field.jpg","none",null,null,null,null);
    bgImg    = newChoice(c, "Sky image: ", "SKYIMG", "images/sky1.jpg", "images/sky2.jpg", "images/sky3.jpg", "images/castle1.0.jpg",null,null);
    sound    = newChoice(c, "Sound: ", "SOUND", "on", "off", null, null,null,null);

    // LIMIT FOR DEMO!!
    players.select("2");    players.disable();
    //dive.select("off");     dive.disable();
    accel.select("2");      accel.disable();
    //maxspeed.select("6");   maxspeed.disable();
    //width.setText("640");   width.disable();
    //height.setText("450");  height.disable();
    //red.setText("1");       red.disable();
    //black.setText("2");     black.disable();
    gold.setText("0");      gold.disable();
    goldval.setText("150"); goldval.disable();
    //winscore.setText("50"); winscore.disable();
    duration.setText("60"); duration.disable();

    //playerImg.select("images/players.gif"); playerImg.disable();
    itemImg.select("images/items.gif");     itemImg.disable();
    fieldImg.select("images/field.jpg");    fieldImg.disable();
    //bgImg.select("images/sky1.jpg");        bgImg.disable();
    //fieldImg.select("none");
    //bgImg.select("images/castle1.0.jpg");
    sound.select("off");                    sound.disable();

    Button start = new Button("Press here to start");
    start.setBackground(new Color(0, 255, 0));
    c.add(start);
    c.add(new Label(""));

    add("Center", c);
    //add("South", start);

    //pack();
    repaint();

    gamePanel = null;
    window = null;
  }

  public boolean action(Event ev, Object arg) {
    String label = (String) arg;
    if (label.equals("Press here to start"))
      openGame();
    return false;
  }

  public void openGame() {

    if (window != null) {
      if (gamePanel != null)
        gamePanel.stop();
      window.dispose();
    }

    window = new Frame();
    window.setTitle("Broomsticks Advanced Demo by Paul Rajlich");
    window.setVisible(true);
    window.setResizable(false);
    window.addWindowListener(this);
    //window.show();

    gamePanel = new BroomPanel(this);
    gamePanel.start();
    gamePanel.repaint();

    int winW = gamePanel.getParam(this.width);
    int winH = gamePanel.getParam(this.height);
    window.setSize(winW, winH);
    window.setLocation(100, 100);
    window.setLayout(new BorderLayout());
    window.add("Center", gamePanel);
    window.show();
  }

  public void windowClosing(WindowEvent e) {
    System.out.println("applet: window closing");
    if (gamePanel != null)
      gamePanel.stop();
    window.dispose();
  }
  public void windowClosed(WindowEvent e) {
    System.out.println("applet: window closed");
  }
  public void windowOpened(WindowEvent e)      { }
  public void windowIconified(WindowEvent e)   { }
  public void windowDeiconified(WindowEvent e) { }
  public void windowActivated(WindowEvent e)   { }
  public void windowDeactivated(WindowEvent e) { }

  public void start() {
    System.out.println("applet: start");
  }

  public void stop() {
    System.out.println("applet: stop");
    //if (gamePanel != null)
    //  gamePanel.stop();
    //window.dispose();
  }
 
  public void destroy() {
    System.out.println("applet: destroy");
    if (gamePanel != null)
      gamePanel.stop();
    window.dispose();
  }

  public String getAppletInfo() {
    return "Broomsticks Applet by Paul Rajlich";
  }
}

class BroomPanel extends Panel implements Runnable {

  public AudioClip scoreClip, grabClip, bumpClip, winClip;
  public BroomstickApplet applet;

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

  public Frame f;

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
  int redBalls, blackBalls, goldBalls, goldval;
  public float accel, maxspeed;
  int timer;
  int sleepMS;

  public boolean soundToggle, dive;

  public Thread thread;
  
  public BroomPanel(BroomstickApplet app) {

    applet = app;

    setBackground(Color.white);
    setFont(new Font("Helvetica", Font.PLAIN, 12));

    this.setSize(getParam(applet.width), getParam(applet.height));

    Dimension d = size();
    width = d.width-10;
    height = d.height-50; // was 20
    midW = width/2;
    midH = height/2;

    soundToggle = false;
    backToggle = 1; // was 0
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

    String numPlayersStr = applet.players.getSelectedItem();
    if (numPlayersStr.equals("4")) teams = true; else teams = false;

    String diveStr = applet.dive.getSelectedItem();
    if (diveStr.equals("yes")) dive = true; else dive = false;

    String soundStr = applet.sound.getSelectedItem();
    if (soundStr.equals("on")) soundToggle = true;

    accel = (float) getParam(applet.accel);
    maxspeed = (float) getParam(applet.maxspeed);

    redBalls = getParam(applet.red);
    blackBalls = getParam(applet.black);
    goldBalls = getParam(applet.gold);
    goldval = getParam(applet.goldval);
    winScore = getParam(applet.winscore);
    duration = getParam(applet.duration) * 1000; // millis

    playersStr = applet.playerImg.getSelectedItem();
    itemsStr = applet.itemImg.getSelectedItem();
    fieldStr = applet.fieldImg.getSelectedItem();
    bgStr = applet.bgImg.getSelectedItem();

    applet.window.setCursor(Frame.WAIT_CURSOR);
    loadImages();
    loadSounds();

    balls = new Ball[redBalls + blackBalls + goldBalls];

    int i;
    for (i=0; i < redBalls; i++) {
      //balls[i] = new Ball(this, 2, midW, midH-20*i-20);
      balls[i] = new Ball(this, 2, midW, midH-20);
      balls[i].catchable = true;
    }
    for (i=0; i < blackBalls; i++) {
      //balls[redBalls+i] = new Ball(this, 1, midW, midH+20*i+20);
      balls[redBalls+i] = new Ball(this, 1, midW, midH+20);
      //balls[redBalls+i].speedFactor *= 1.5;
      balls[redBalls+i].maxSpeed *= 1.5;
    }
    for (i=0; i < goldBalls; i++) {
      balls[redBalls+blackBalls+i] = new GoldBall(this, 0, midW, 50);
      balls[redBalls+blackBalls+i].catchable = true;
      balls[redBalls+blackBalls+i].alive = false;
      //balls[redBalls+blackBalls+i].smart = parseParam("GOLDSMART", 1);
      balls[redBalls+blackBalls+i].smart = 1;
    }

    if (teams)
      players = new Person[4];
    else
      players = new Person[2];

    players[0] = new Person(balls[0], this, 1, 100, midH);
    //players[0].setKeys('e', 'x', 's', 'f', '1', 't');
    players[0].setKeys('e', 'x', 's', 'f', '1', 'p');
    players[0].setInfoXY(20, height-15);

    players[1] = new Person(balls[0], this, 4, width-100, midH);
    players[1].setKeys(Event.UP, Event.DOWN, Event.LEFT, Event.RIGHT, Event.ENTER, 0);
    players[1].setInfoXY(width-150, height-15);
    players[1].side = 1; // team (and dir facing when not moving)

    if (teams) {
      players[2] = new Person(balls[0], this, 2, width-200, midH);
      players[2].setKeys(Event.HOME, Event.END, Event.DELETE, Event.PGDN, Event.INSERT, Event.PGUP);
      players[2].setInfoXY(midW, height-15);

      players[3] = new Person(balls[0], this, 3, 200, midH);
      players[3].setKeys('i', 'm', 'j', 'l', '7', 'p');
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

  //public void processWindowEvent(WindowEvent e) {
  //  if (e == WINDOW_CLOSING)
  //    this.dispose();
  //}

  public int getParam(TextField text) {
    return (Integer.valueOf(text.getText())).intValue();
  }

  public int getParam(Choice choice) {
    String str = choice.getSelectedItem();
    return (Integer.valueOf(str)).intValue();
  }

  public void loadSounds() {
    scoreClip = applet.getAudioClip(applet.getCodeBase(), "snd/score.au");
    grabClip = applet.getAudioClip(applet.getCodeBase(), "snd/grab.au");
    bumpClip = applet.getAudioClip(applet.getCodeBase(), "snd/bump.au");
    winClip = applet.getAudioClip(applet.getCodeBase(), "snd/win.au");
  }

  public void loadImages() {
    System.out.println("loading images...");

    tracker = new MediaTracker(applet);
    playersImg = applet.getImage(applet.getCodeBase(), playersStr);
    itemsImg = applet.getImage(applet.getCodeBase(), itemsStr);
    if (playersStr.equals("images/harden.gif"))
      introImg = applet.getImage(applet.getCodeBase(),"images/introHarden.gif");
    else
      introImg = applet.getImage(applet.getCodeBase(), "images/intro.gif");
    fdImg = applet.getImage(applet.getCodeBase(), fieldStr);
    Image hitImg = applet.getImage(applet.getCodeBase(), "cgi-bin/logs.cgi?log=broomLog");
    tracker.addImage(playersImg, 0);
    tracker.addImage(itemsImg, 0);
    tracker.addImage(introImg, 0);
    tracker.addImage(fdImg, 0);
    tracker.addImage(hitImg, 0);

    ImageFilter scale[] = new ImageFilter[5];
    ImageProducer bgSrc[] = new ImageProducer[5];
    bgImg = new Image[5];
    backImg = new Image[5];
    //for (int i=1; i<5; i++) { 
    for (int i=1; i<2; i++) { 
      if (i == 1)
        bgImg[i] = applet.getImage(applet.getCodeBase(), bgStr);
      else
        bgImg[i] = applet.getImage(applet.getCodeBase(), "images/sky"+i+".jpg");
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

  // NOTE: do not stop thread. According to docs, applet will stop it
  // immediately even if it is in the middle of some critical operation.
  // Rather, set it to null and that will cause its main loop to end
  // (see SimThread). Garbage collector will then take care of it later.
  public void stop() {
    //thread.stop();
    thread = null;
    //offImage = null;
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
    requestFocus();
    return true;
  }

  public boolean keyDown(Event e, int key) {

    // back toggle
    if (key == 'b') {
      backToggle++;
      //if (backToggle > 4)
      if (backToggle > 1)
        backToggle = 0;
    }

    // LIMIT FOR DEMO!!
    //if (key == 'n') {
    //  if (soundToggle)
    //    soundToggle = false;
    //  else
    //    soundToggle = true;
    //  paint(getGraphics());
    //}

    for (int i=0; i<players.length; i++)
      players[i].handleKeyEvent(e, key);

    return false;
  }

  public void update(Graphics g) {
    if (offgc == null) {
      System.out.println("w: " + width + " h: " + height);
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
      applet.window.setCursor(Frame.CROSSHAIR_CURSOR);
      g.setColor(Color.black);
      if (!gameover)
        g.drawString("Click here to start.", midW-50, 200);
      else
        g.drawString("Game over. Click here to play again.", midW-75, 200);

      g.drawString("It's easier to just click on the keys rather than hold them down.", midW-175, 330);
      g.drawString("Click on your up key several times to start flying.", midW-140, 345);
      //g.drawString("If it runs choppy or slow, close and restart.", midW-125, 365);
      if (teams) {
        g.drawString("Blue Team", 100, 240);
        g.drawString("use E, S, F keys", 100, 260);
        g.drawString("use I, J, L keys", 100, 275);
      }
      else {
        g.drawString("Blue Player", 100, 240);
        g.drawString("use E, S, F keys", 100, 260);
        g.drawString("use 1 to switch player", 100, 275);
        //g.setColor(Color.red);
        //g.drawString("Press T for computer control", 100, 290);
        //g.drawString("(use S and F to adjust skill)", 100, 305);
        //g.setColor(Color.black);
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

    //g.translate(5, 20);
    g.setColor(getBackground());
    g.fillRect(0, 0, width, height); // clear whole drawing area
    drawScene(g);
    drawScores(g);
    g.drawString("Broomsticks by Paul Rajlich", midW-75, 20);
    g.drawRect(10, 30, width-21, height-51);

    for (int i=0; i<players.length; i++)
      players[i].drawInfo(g);

    if (!teams) {
      // LIMIT FOR DEMO!!
      //if (soundToggle)
      //  g.drawString("n for sound off, b to change background", midW-125, height-5);
      //else
      //  g.drawString("n for sound on, b to change background", midW-125, height-5);
       
      if (players[0].isRobot)
        g.drawString("P for two-player, B to change background", midW-125, height-5);
      else
        g.drawString("P for single-player, B to change background", midW-125, height-5);
      // was midW-65
    }
  }

 public void gameOver() {
    started = false;
    gameover = true;
    int i;
    if (soundToggle)
      winClip.play();
    for (i=0; i < players.length; i++)
      players[i].reset();
    for (i=0; i < balls.length; i++)
      balls[i].reset();
  }

  public void run() {
    System.out.println("Game thread started...\n");

    //Thread.currentThread().setPriority(Thread.MIN_PRIORITY);
    long sleepTime;
    //sleepMS = parseParam("SLEEP", 30);
    sleepMS = 30;

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
      //update(this.getGraphics()); // PAUL!!

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
          int dx = (int) (p.x+8 - b.x);
          int dy = (int) (p.y+8 - b.y);
          if (Math.abs(dx) < 20 && Math.abs(dy) < 20) {
            if (p.velocityX > 0)
              b.x = p.x + 18;
            else
              b.x = p.x + 8;
            b.y = p.y + 15;
            if (b.isGoldBall) {
              teamScore[p.side] += goldval;
              drawScores(getGraphics(), p.side);
              gameOver();
            }
            teamBasket[p.side] = true;
            if (soundToggle && !prevTeamBasket[p.side])
              grabClip.play();
            if ((p.side == 0 && (p.x > (width-17-p.w))) ||
                (p.side == 1 && (p.x < 17))) {
              //dy = (int) (b.y - (midH - 10));
              dy = (int) (b.y - midH);
              //if (Math.abs(dy) < 15) {
              if (Math.abs(dy) < 20) {
                teamScore[p.side] += 10;
                //paint(getGraphics());
                drawScores(getGraphics(), p.side);
                timer = 15;
                //play(getCodeBase(), "snd/score.au");
                if (soundToggle)
                  scoreClip.play();
                b.x = midW;
                if (goldBalls == 0 && teamScore[p.side] >= winScore) {
                  gameOver();
                  drawScores(getGraphics(), p.side);
                }
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
          int dx = (int) (p1.x - p2.x);
          int dy = (int) (p1.y - p2.y);
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
          int dx = (int) (p.x+8 - b.x);
          int dy = (int) (p.y+8 - b.y);
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
  public int initX, initY;
  public float x, y;
  public int w, h;
  int right, bottom;
  BroomPanel bFrame;
  Graphics g;
  public float velocityX;
  public float velocityY;
  public boolean catchable;
  public boolean isGoldBall;
  public boolean dive;
  //public float speedFactor;
  public float accel, maxSpeed;
  static Random random=new Random(); // one instance for all flying objects
  public int smart;

  FlyingObject(BroomPanel f, int iX, int iY) {
    x = iX;
    y = iY;
    initX = iX;
    initY = iY;

    bFrame = f;
    g = bFrame.getGraphics();
    velocityX = 0;
    velocityY = 0;

    catchable = false;
    isGoldBall = false;

    //speedFactor = bFrame.speed;
    accel = bFrame.accel;
    maxSpeed = bFrame.maxspeed;
    dive = bFrame.dive;

    right = bFrame.width - 11;
    bottom = bFrame.height - 21;
  }

  public void reset() {
    x = initX;
    y = initY;
    velocityX = 0;
    velocityY = 0;
  }

  public void draw(Graphics g) {
    // implemented in derived classes
  }

  public void move() {
    x += velocityX; //*speedFactor;
    y += velocityY; //*speedFactor;
    //velocityY += 0.1; // gravity
    //if (velocityY > 2)
    //  velocityY = 2;
    if (velocityY < 2)
      velocityY += 0.1; // gravity
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
    velocityX -= accel;
    if (velocityX < -maxSpeed)
      velocityX = -maxSpeed;
  }
 
  public void right() {
    velocityX += accel;
    if (velocityX > maxSpeed)
      velocityX = maxSpeed;
  }

  public void up() {
    velocityY -= accel;
    if (velocityY < -maxSpeed)
      velocityY = -maxSpeed;
  }

  public void down() {
    if (!dive) return;
    velocityY += accel;
    if (velocityY > maxSpeed)
      velocityY = maxSpeed;
  }
}

class Person extends FlyingObject {
  public int model, side;
  public boolean isRobot;
  Ball target;
  int upKey, downKey, leftKey, rightKey, modelKey, robotKey;
  int infoX, infoY;

  Person(Ball t, BroomPanel app, int theModel, int initX, int initY) {
    super(app, initX, initY);
    model = theModel;
    target = t;
    isRobot = false;
    smart = 15;
    init();
    upKey = '-';
    downKey = '-';
    leftKey = '-';
    rightKey = '-';
    modelKey = '-';
    robotKey = '-';
    infoX = 0; 
    infoY = 0;
  }

  public void setInfoXY(int x, int y) {
    infoX = x;
    infoY = y;
  }

  public void setKeys(int up, int down, int left, int right, int m, int robot) {
    upKey = up;
    downKey = down;
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
        //drawInfo(bFrame.getGraphics());
        bFrame.paint(bFrame.getGraphics());
      }
    }
    else {
      if (key == upKey)
        up();
      if (key == downKey)
        down();
      if (key == leftKey)
        left();
      if (key == rightKey)
        right();
      if (key == robotKey) {
        isRobot = true;
        //drawInfo(bFrame.getGraphics());
        bFrame.paint(bFrame.getGraphics());
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
    bFrame.paint(bFrame.getGraphics());
  }

  public void smarter() {
    smart -= 5;
    if (smart <= 1)
      smart = 1;
    drawInfo(bFrame.getGraphics());
  }

  public void dumber() {
    smart += 5;
    if (smart >= 30)
      smart = 30;
    drawInfo(bFrame.getGraphics());
  }

  public void move() {

    if (isRobot) {
      int choice;
      choice = random.nextInt()%smart;

      if (choice == 0) {
        // we have the ball
        if (bFrame.teamBasket[side]) {
          if (side == 0) {
            if (this.x < bFrame.width-50)
              right();
            if (this.y > bFrame.midH-10)
              up();
            //else if (this.y < bFrame.midH-30)
            //  down();
          }
          else {
            if (this.x > 50)
              left();
            if (this.y > bFrame.midH-10)
              up();
            //else if (this.y < bFrame.midH-30)
            //  down();
          }
        }
        else {  // get the ball
          // idea: only have one of these happen
          if (target.y < this.y)
            up();
          if (Math.abs(target.y - this.y) < 100) {
            if (target.x < this.x-10) 
              left();
            else if (target.x > this.x+10)
              right();
          }
          if (target.y > this.y)
            down();
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
    g.setColor(bFrame.getBackground());
    g.fillRect(infoX, infoY, 145, 15);
    if (!isRobot) {
      g.setColor(Color.black);
      if (upKey == Event.UP)
        g.drawString("arrow-keys and ENTER", infoX, infoY+10);
      else if (upKey == Event.HOME)
        g.drawString("Home Del PD Ins PU", infoX, infoY+10);
      else if (upKey == 'e')
        //g.drawString("E X S F 1 T", infoX, infoY+10);
        g.drawString("E X S F 1", infoX, infoY+10);
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
        //g.drawString("S F T", infoX+70, infoY+10);
        g.drawString("S F", infoX+70, infoY+10);
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
      g.drawImage(bFrame.img[model][v][h], (int) x, (int) y, bFrame);
    else
      g.drawImage(bFrame.img[model+5][v][h], (int) x, (int) y, bFrame);
  }
}
    
 
class Ball extends FlyingObject { 
  int model;
  boolean alive;

  Ball(BroomPanel theApplet, int theModel, int initX, int initY) {
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
    if (y > bFrame.height-90)
      up();
    super.move();
  }

  public void draw(Graphics g) {
    g.drawImage(bFrame.ballImg[model], (int) x, (int) y, bFrame);
  }
}

class GoldBall extends Ball {
  GoldBall(BroomPanel theApplet, int theModel, int initX, int initY) {
    super(theApplet, theModel, initX, initY);
    init();
    smart = 1;
  }
 
  public void init() {
    System.out.println("GoldBall init()");
    w = 8;
    h = 8;
    isGoldBall = true;
    //speedFactor = 3 * bFrame.speed;
    maxSpeed = 2 * bFrame.maxspeed;
    accel = 2 * bFrame.accel;
  }

  public void move() {
    // move based on pos and vel of players
    for (int i=0; i<bFrame.players.length; i++) {
      Person p = bFrame.players[i];
      int dx = (int) (x - p.x);
      int dy = (int) (y - p.y);
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
    velocityY += accel;
    if (velocityY > maxSpeed)
      velocityY = maxSpeed;
  }
}
