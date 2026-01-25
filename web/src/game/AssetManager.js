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
        this.menuBackImage = null;    // Always sky1.jpg for menu
        this.bgImages = [];           // All preloaded backgrounds for cycling

        // Volume icons
        this.volumeFullIcon = null;
        this.volumeHalfIcon = null;
        this.volumeMuteIcon = null;

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

        // All background image paths (matching SETTINGS_OPTIONS.bgImg order)
        const bgPaths = [
            null,  // Solid (index 0)
            '/game/images/sky1.jpg',
            '/game/images/sky3.jpg',
            '/game/images/sky-cpp.jpg',
            '/game/images/castle.jpg',
            '/game/images/diagon-alley.jpg',
            '/game/images/leeds-castle.jpg',
            '/game/images/winter.jpg'
        ];

        // Load main sprite sheets, menu background, and volume icons
        const [playersImg, itemsImg, introImg, menuBackImg, fieldImg, volumeFull, volumeHalf, volumeMute] = await Promise.all([
            loadImage(playerImgPath),
            loadImage('/game/images/items.gif'),
            loadImage(introPath),
            loadImage('/game/images/sky1.jpg'),  // Always load sky1.jpg for menu
            loadImage('/game/images/field.jpg'),
            loadImage('/images/sound-full-volume.png'),
            loadImage('/images/sound-half-volume.png'),
            loadImage('/images/sound-mute.png')
        ]);

        this.introImage = introImg;
        this.menuBackImage = menuBackImg;
        this.fieldImage = fieldImg;
        this.volumeFullIcon = volumeFull;
        this.volumeHalfIcon = volumeHalf;
        this.volumeMuteIcon = volumeMute;

        // Preload ALL backgrounds for in-game cycling
        this.bgImages = await Promise.all(
            bgPaths.map(path => path ? loadImage(path) : Promise.resolve(null))
        );

        // Set backImage based on current settings (for backward compatibility)
        this.backImage = bgImgPath ? await loadImage(bgImgPath) : null;

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

        // Apply volume and preload sounds
        const volume = this.settings.volume ?? 1.0;
        for (const sound of Object.values(this.sounds)) {
            sound.volume = volume;
            sound.load();
        }
    }

    setVolume(volume) {
        for (const sound of Object.values(this.sounds)) {
            sound.volume = volume;
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
