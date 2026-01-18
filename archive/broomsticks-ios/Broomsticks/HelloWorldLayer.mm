//
//  HelloWorldLayer.m
//  Broomsticks
//
//  Created by Cynthia Rajlich on 8/19/11.
//  Copyright __MyCompanyName__ 2011. All rights reserved.
//


// Import the interfaces
#import "HelloWorldLayer.h"
#import "SimpleAudioEngine.h"
#include "Person.h"
#include "Ball.h"

// HelloWorldLayer implementation
@implementation HelloWorldLayer

int teamBasket[2] = {0,0};
int flashScore[2] = {0,0};
int bumpSound = 0, winSound = 0, scoreSound = 0, grabSound = 0;

static CCSprite *playerSprites[4];
static CCSprite *ballSprites[256];
static CCSprite *basketSprites[2];
static CCSprite *yellowSprite;
static CCLabelTTF *scoreLabel[2];
static int messageTimer = 0;
static int messageStart = 0;
static CCLabelTTF *messageLabel = NULL;
static CCLabelTTF *bottomLabel = NULL;

static int bottomH = 20;
static int paused = 0;

static int frames = 0;

static CCLabelTTF *pickPlayersLabel = NULL;
static CCLabelTTF *oppSkillLabel = NULL;
static CCLabelTTF *youLabel = NULL;

#include "brModel.h"
static brModel *model = NULL;

+(CCScene *) scene
{
	// 'scene' is an autorelease object.
	CCScene *scene = [CCScene node];
	
	// 'layer' is an autorelease object.
	HelloWorldLayer *layer = [HelloWorldLayer node];
	
	// add layer as a child to scene
	[scene addChild: layer];
	
	// return the scene
	return scene;
}

// SAVE!
#if 0 // tap around player to change direction
if (location.x < playerObj->getX() - 40)
playerObj->left();
else if (location.x > playerObj->getX() + 40)
playerObj->right();
else if (location.y > size.height - playerObj->getY())
playerObj->up();
else
playerObj->down();
#endif

void updateOppSkillLabel() {
    CGSize size = [[CCDirector sharedDirector] winSize];

    int p1x = model->getPlayer(1)->getX();
    int p1y = size.height - model->getPlayer(1)->getY();
    int mod = model->getPlayer(1)->getModel();
    
    // update skill label
    oppSkillLabel.position = ccp(p1x + 20, p1y + 8);
    if (mod == 0) [oppSkillLabel setString:@"Easy Opponent"];
    if (mod == 1) [oppSkillLabel setString:@"Medium Opponent"];
    if (mod == 2) [oppSkillLabel setString:@"Very Easy Opponent"];
    if (mod == 3) [oppSkillLabel setString:@"Hard Opponent"];
    if (mod == 4) [oppSkillLabel setString:@"Very Hard Opponent"];
}

void updateYouLabel() {
    CGSize size = [[CCDirector sharedDirector] winSize];
    
    int p0x = model->getPlayer(0)->getX();
    int p0y = size.height - model->getPlayer(0)->getY();
    
    youLabel.position = ccp(p0x + 20, p0y+ 8);
}

void updateScoreLabels() {
    NSString *str1 = [NSString stringWithFormat:@"%d", model->getTeamScore(0)];
    NSString *str2 = [NSString stringWithFormat:@"%d", model->getTeamScore(1)];
    [scoreLabel[0] setString: str1];
    [scoreLabel[1] setString: str2];
}

-(void) ccTouchesEnded:(NSSet *)touches withEvent:(UIEvent *)event {
    UITouch *touch = [touches anyObject];
    CGPoint location = [touch locationInView:[touch view]];
    location = [[CCDirector sharedDirector] convertToGL:location];
    
    CGSize size = [[CCDirector sharedDirector] winSize];
    
    if (paused) {
        int p0x = model->getPlayer(0)->getX();
        int p0y = size.height - model->getPlayer(0)->getY();
        int p1x = model->getPlayer(1)->getX();
        int p1y = size.height - model->getPlayer(1)->getY();
        if (location.x > p0x && location.x < p0x+40 && location.y > p0y-40 && location.y < p0y)
            model->getPlayer(0)->switchModel();
        if (location.x > p1x && location.x < p1x+40 && location.y > p1y-40 && location.y < p1y) {
            //model->getPlayer(1)->switchModel();
            int mod = model->getPlayer(1)->getModel();
            
            // rotate through models (easy -> hard) instead of switchModel()
            if (mod == 2) mod = 0;
            else if (mod == 0) mod = 1;
            else if (mod == 1) mod = 3;
            else if (mod == 3) mod = 4;
            else mod = 2;
            model->getPlayer(1)->setModel(mod);
            
            // update smart parameter
            if (mod == 0) model->getPlayer(1)->setSmart(12);
            if (mod == 1) model->getPlayer(1)->setSmart(6);
            if (mod == 2) model->getPlayer(1)->setSmart(18);
            if (mod == 3) model->getPlayer(1)->setSmart(3);
            if (mod == 4) model->getPlayer(1)->setSmart(1);
            
            // update skill label
            updateOppSkillLabel();
            updateYouLabel();
          }
    }
    
    // if touch at bottom middle, pause/unpause game
    if (!paused && location.x > 200 && location.x < (size.width-200) && location.y < bottomH) {
        messageLabel.position = ccp(size.width/2, size.height-100); //size.height/2+bottomH);
        [messageLabel setString:@"Paused"];
        [bottomLabel setString:@"Resume Game"];
        paused = 1;
        pickPlayersLabel.position = ccp(size.width/2, size.height-20);
        updateOppSkillLabel();
        updateYouLabel();
    }
    else if (paused && location.x > 200 && location.x < (size.width-200) && location.y < bottomH) {
        messageLabel.position = ccp(-1000, -1000); // offscreen
        [messageLabel setString:@""];
        [bottomLabel setString:@"Pause/Settings"];
        paused = 0;
        pickPlayersLabel.position = ccp(-1000, -1000); // offscreen
        oppSkillLabel.position = ccp(-1000, -1000); // offscreen
        youLabel.position = ccp(-1000, -1000); // offscreen
    }
    
    // player goes where you touch directly!
    // ignore if paused or message showing
    if (!paused && messageTimer <= 0) {
        int w = model->getPlayer(0)->getW();
        int h = model->getPlayer(0)->getH();
        model->getPlayer(0)->setDest(location.x-w/2, size.height - location.y-h/2);
    }
}

-(void) update:(ccTime)dt {
    
    totalTime += dt;
    int etime = dt*1000; // ms
    int now = totalTime*1000; // ms
    frames++;
    
    CGSize size = [[CCDirector sharedDirector] winSize];
    
    // If a score just happened and score is highlighted
    if (flashScore[0] > 0) {
        flashScore[0] -= etime;
        yellowSprite.position = ccp(40, 6);
        //scoreLabel[0].color = ccc3(0, 0, 0);
    }
    else if (flashScore[1] > 0) {
        flashScore[1] -= etime;
        yellowSprite.position = ccp(size.width-40, 6);
        //scoreLabel[1].color = ccc3(0, 0, 0);
    }
    else 
        yellowSprite.position = ccp(0, -20); // offscreen
    
    // If a message is showing
    if (messageTimer > 0) {
        messageLabel.position = ccp(size.width/2, size.height-100); // size.height/2+bottomH);
        messageTimer -= etime;
        if (messageTimer <= 0) {
            [messageLabel setString:@""];
            messageLabel.position = ccp(-1000, -1000); // offscreen
            updateScoreLabels();
            if (messageStart) {
                messageStart = 0;
                [messageLabel setString:@"Start!"];
                messageTimer = 1000;
            }
        }
    }
    
    // only update model if message is gone!
    //if (!pickPlayers && !paused && messageTimer < 0) {
    if (!paused && messageTimer <= 0) {
        // update model
        model->checkCollisions();
        model->checkCaught();
        model->moveFlyers(etime, now);
    }
 
    int x, y;
    
    // update Player sprites
    Person *player = NULL;
    for (int i=0; i<model->getNumPlayers(); i++) {
        player = model->getPlayer(i);
        x = player->getX()+player->getW()/2;
        y = size.height - player->getY() - player->getH()/2;
        playerSprites[i].position = ccp(x, y); // half width/height offset to origin
        
        // hide players during pickPlayers
        //if (pickPlayers) playerSprites[i].position = ccp(-1000, -1000);
    
        int anims = 4; // was 1
        int frame = (frames/10)%anims; // iterate through keyframes 6 times/second
        int vv = (player->getVY() < 0);
        int hh;
        if (player->getVX() > 0) hh = 0;
        else if (player->getVX() < 0) hh = 1;
        else hh = player->getSide();
        int rx = (1-player->getSide())*160 + vv*80 + hh*40 + 1;
        int ry = player->getModel()*40*anims + 40*frame + 41;
        playerSprites[i].textureRect = CGRectMake(rx, ry, player->getW(), player->getH());
    }
    
    // update Ball sprites
    Ball *ball = NULL;
    for (int i=0; i<model->getNumBalls(); i++) {
        ball = model->getBall(i);
        x = ball->getX()+ball->getW()/2;
        y = size.height - ball->getY() - ball->getH()/2;
        ballSprites[i].position = ccp(x, y);
        
        // hide balls during pickPlayers
        //if (pickPlayers) ballSprites[i].position = ccp(-1000, -1000);
    }
    
    // update baskets
    for (int i=0; i<2; i++) {
        basketSprites[1-i].textureRect = CGRectMake(teamBasket[i]*40, 120, 19, 170);
    }
    
    // play sounds
    if (bumpSound) {
        [[SimpleAudioEngine sharedEngine] playEffect:@"bump.caf"];
        bumpSound = 0;
    }
    if (scoreSound) {
        [[SimpleAudioEngine sharedEngine] playEffect:@"score.caf"];
        scoreSound = 0;
        updateScoreLabels();
    }
    if (winSound) {
        //[[SimpleAudioEngine sharedEngine] playEffect:@"win.caf"];
        winSound = 0;
        if (model->getTeamScore(0) > model->getTeamScore(1)) {
            [messageLabel setString:@"You Win!"];
            [[SimpleAudioEngine sharedEngine] playEffect:@"win.caf"];
        }
        else {
            [messageLabel setString:@"You Lose"];
            [[SimpleAudioEngine sharedEngine] playEffect:@"lose.caf"];
        }
        messageTimer = 7000;
        messageStart = 1;
        model->gameOver();
    }
    if (grabSound) {
        [[SimpleAudioEngine sharedEngine] playEffect:@"grab.caf"];
        grabSound = 0;
    }
    
 }

// on "init" you need to initialize your instance
-(id) init
{
	// always call "super" init
	// Apple recommends to re-assign "self" with the "super" return value
	if( (self=[super initWithColor:ccc4(0,0,0,255)] )) {

		// ask director the the window size
		CGSize size = [[CCDirector sharedDirector] winSize]; 
        //int bottomH = 20; // declared up top now
        int w = size.width;
        int h = size.height-bottomH;
          
        // initialize background sprite
        CCSprite *bgSprite = [CCSprite spriteWithFile:@"sky480.png" rect:CGRectMake(0, 0, 480, 320)];
        bgSprite.position = ccp(w/2, size.height/2+bottomH-7);
        [self addChild: bgSprite];
        
        // init goals 
        for (int i=0 ;i<2; i++) {
            basketSprites[i] = [CCSprite spriteWithFile:@"items3.png" rect:CGRectMake(0, 120, 19, 170)];
            [self addChild:basketSprites[i]];
        }
        basketSprites[0].position = ccp(10, h/2+bottomH-65);
        basketSprites[1].position = ccp(w-10, h/2+bottomH-65);
        
        // test basket position (put ball at midH)
        //CCSprite *testSprite = [CCSprite spriteWithFile:@"items2.png" rect:CGRectMake(0, 40, 20, 20)];
        //testSprite.position = ccp(10, h/2+bottomH);
        //[self addChild:testSprite];
         
        if (!model) model = new brModel(w, h);
        model->getPlayer(1)->setRobot(1);
        Person *player;
        for (int i=0; i<model->getNumPlayers(); i++) {
            player = model->getPlayer(i);
            playerSprites[i] = [CCSprite spriteWithFile:@"players.png" rect:CGRectMake(2, 42, 38, 38)];
            [self addChild:playerSprites[i]];
        }
        Ball *ball;
        for (int i=0; i<model->getNumBalls(); i++) {
            ball = model->getBall(i);
            if (ball->isCatchable())
                ballSprites[i] = [CCSprite spriteWithFile:@"items3.png" rect:CGRectMake(0, 80, 20, 20)];
            else
                ballSprites[i] = [CCSprite spriteWithFile:@"items3.png" rect:CGRectMake(0, 40, 20, 20)];

            [self addChild:ballSprites[i]];
        }
        
        yellowSprite = [CCSprite spriteWithFile:@"yellow.png" rect:CGRectMake(0, 0, 80, 14)];
        yellowSprite.position = ccp(40, -20); //6);
        [self addChild:yellowSprite];
        
        for (int i=0; i<2; i++) {
            scoreLabel[i] = [CCLabelTTF labelWithString:@"0" fontName:@"Arial" fontSize:14];
            scoreLabel[i].color = ccc3(255, 255, 255);
            scoreLabel[i].position = ccp(i*(w-80)+40, 6);
            [self addChild:scoreLabel[i]];
        }
        
        messageLabel = [CCLabelTTF labelWithString:@"Start!" fontName:@"Arial" fontSize: 32];
        messageLabel.color = ccc3(0, 0, 0);
        messageLabel.position = ccp(w/2, size.height-100); // was h/2 + bottomH
        [self addChild:messageLabel];
        messageTimer = 1000; // 1s
           
        bottomLabel = [CCLabelTTF labelWithString:@"Pause/Settings" fontName:@"Arial" fontSize: 14];
        bottomLabel.color = ccc3(255, 255, 255);
        bottomLabel.position = ccp(w/2, 6);
        [self addChild:bottomLabel];
        
        [self schedule:@selector(update:)];
        self.isTouchEnabled = YES;
        
        [[SimpleAudioEngine sharedEngine] playEffect:@"win.caf"];
        
        pickPlayersLabel = [CCLabelTTF labelWithString:@"Settings: touch players to make changes" fontName:@"Arial" fontSize: 14];
        pickPlayersLabel.color = ccc3(0, 0, 0);
        pickPlayersLabel.position = ccp(-1000, -1000); //ccp(w/2, h/2+bottomH);
        [self addChild:pickPlayersLabel];
        
        oppSkillLabel = [CCLabelTTF labelWithString:@"Medium" fontName:@"Arial" fontSize: 14];
        oppSkillLabel.color = ccc3(0, 0, 0);
        oppSkillLabel.position = ccp(-1000, -1000); // offscreen
        [self addChild:oppSkillLabel];
        
        youLabel = [CCLabelTTF labelWithString:@"You" fontName:@"Arial" fontSize: 14];
        youLabel.color = ccc3(0, 0, 0);
        youLabel.position = ccp(-1000, -1000); // offscreen
        [self addChild:youLabel];

        //pickPlayers = 1;
	}
	return self;
}

// on "dealloc" you need to release all your retained objects
- (void) dealloc
{
	// in case you have something to dealloc, do it in this method
	// in this particular example nothing needs to be released.
	// cocos2d will automatically release all the children (Label)
	
	// don't forget to call "super dealloc"
	[super dealloc];
}
@end
