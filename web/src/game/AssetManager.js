// AssetManager.js - Image and sound loading for Broomsticks

import { SPRITE_SIZE } from './GameConstants.js';

export class AssetManager {
    constructor(settings) {
        this.settings = settings;

        // Image assets
        this.playerImages = null;     // [10][2][2] array
        this.ballImages = null;       // [3] array (gold, black, red)
        this.basketImage = null;
        this.basketHImage = null;
        this.introImage = null;
        this.backImage = null;
        this.fieldImage = null;

        // Sound assets
        this.sounds = {};
    }

    async loadAssets() {
        console.log('Loading assets...');

        const loadImage = (src) => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = () => {
                    console.warn(`Failed to load: ${src}`);
                    resolve(null);
                };
                img.src = src;
            });
        };

        // Use configured images
        const playerImgPath = this.settings.playerImg;
        const bgImgPath = this.settings.bgImg;
        const introPath = playerImgPath.includes('harden') ? '/game/images/introHarden.gif' : '/game/images/intro.gif';

        // Load main sprite sheets
        const [playersImg, itemsImg, introImg, backImg, fieldImg] = await Promise.all([
            loadImage(playerImgPath),
            loadImage('/game/images/items.gif'),
            loadImage(introPath),
            loadImage(bgImgPath),
            loadImage('/game/images/field.jpg')
        ]);

        this.introImage = introImg;
        this.backImage = backImg;
        this.fieldImage = fieldImg;

        // Extract player sprites from sprite sheet
        if (playersImg) {
            this.playerImages = this.extractPlayerSprites(playersImg);
        }

        // Extract ball and basket sprites from items
        if (itemsImg) {
            this.ballImages = this.extractBallSprites(itemsImg);
            this.extractBasketSprites(itemsImg);
        }

        console.log('Assets loaded');
    }

    loadSounds() {
        if (!this.settings.sound) return;

        this.sounds = {
            score: new Audio('/game/snd/score.mp3'),
            grab: new Audio('/game/snd/grab.mp3'),
            bump: new Audio('/game/snd/bump.mp3'),
            win: new Audio('/game/snd/win.mp3'),
            pop: new Audio('/game/snd/pop.mp3'),
            ding: new Audio('/game/snd/ding.mp3')
        };

        // Preload sounds
        for (const sound of Object.values(this.sounds)) {
            sound.load();
        }
    }

    playSound(name) {
        if (!this.settings.sound) return;
        const sound = this.sounds[name];
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(() => { }); // Ignore autoplay errors
        }
    }

    extractPlayerSprites(playersImg) {
        // [10 models][2 vertical states][2 horizontal directions]
        const sprites = [];

        for (let model = 0; model < 10; model++) {
            sprites[model] = [];
            for (let vState = 0; vState < 2; vState++) {
                sprites[model][vState] = [];
                for (let hDir = 0; hDir < 2; hDir++) {
                    const canvas = document.createElement('canvas');
                    canvas.width = SPRITE_SIZE;
                    canvas.height = SPRITE_SIZE;
                    const ctx = canvas.getContext('2d');

                    // Calculate source position from sprite sheet
                    // Models 0-4: columns 0-159
                    // Models 5-9: columns 160-319
                    let sx, sy;
                    if (model < 5) {
                        sx = vState * 80 + hDir * 40 + 1;
                        sy = model * 40 + 41;
                    } else {
                        sx = vState * 80 + hDir * 40 + 161;
                        sy = (model - 5) * 40 + 41;
                    }

                    ctx.drawImage(playersImg, sx, sy, SPRITE_SIZE, SPRITE_SIZE, 0, 0, SPRITE_SIZE, SPRITE_SIZE);
                    sprites[model][vState][hDir] = canvas;
                }
            }
        }

        return sprites;
    }

    extractBallSprites(itemsImg) {
        // Extract 3 balls: gold (model 0), black (model 1), red (model 2)
        const balls = [];

        for (let i = 0; i < 3; i++) {
            const canvas = document.createElement('canvas');
            canvas.width = SPRITE_SIZE;
            canvas.height = SPRITE_SIZE;
            const ctx = canvas.getContext('2d');

            // Ball sprites in items.gif:
            // Row 0 (y=1):   Gold ball   → model 0
            // Row 1 (y=41):  Black ball  → model 1
            // Row 2 (y=81):  Red ball    → model 2
            ctx.drawImage(itemsImg, 1, i * 40 + 1, SPRITE_SIZE, SPRITE_SIZE, 0, 0, SPRITE_SIZE, SPRITE_SIZE);
            balls[i] = canvas;
        }

        return balls;
    }

    extractBasketSprites(itemsImg) {
        // Regular basket at (1, 121)
        const basketCanvas = document.createElement('canvas');
        basketCanvas.width = SPRITE_SIZE;
        basketCanvas.height = SPRITE_SIZE;
        const basketCtx = basketCanvas.getContext('2d');
        basketCtx.drawImage(itemsImg, 1, 121, SPRITE_SIZE, SPRITE_SIZE, 0, 0, SPRITE_SIZE, SPRITE_SIZE);
        this.basketImage = basketCanvas;

        // Highlighted basket at (41, 121)
        const basketHCanvas = document.createElement('canvas');
        basketHCanvas.width = SPRITE_SIZE;
        basketHCanvas.height = SPRITE_SIZE;
        const basketHCtx = basketHCanvas.getContext('2d');
        basketHCtx.drawImage(itemsImg, 41, 121, SPRITE_SIZE, SPRITE_SIZE, 0, 0, SPRITE_SIZE, SPRITE_SIZE);
        this.basketHImage = basketHCanvas;
    }
}
