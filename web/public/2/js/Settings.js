// Settings.js - Game settings with localStorage persistence

const STORAGE_KEY = 'broomsticks2-settings';

const DEFAULT_SETTINGS = {
    redBalls: 1,
    blackBalls: 2,
    accel: 2.0,
    maxSpeed: 6,
    winScore: 50,
    sky: 'sky',           // 'sky', 'sky1', 'sky2', 'sky3', 'sky4'
    animFps: 4,           // Animation frames per second (C++ default: ~4fps = 250ms)
    maxFps: 60            // Max game FPS (15-60)
};

export class Settings {
    constructor() {
        this.values = { ...DEFAULT_SETTINGS };
        this.load();
    }

    load() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                this.values = { ...DEFAULT_SETTINGS, ...parsed };
            }
        } catch (e) {
            console.warn('Failed to load settings:', e);
            this.values = { ...DEFAULT_SETTINGS };
        }
    }

    save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.values));
        } catch (e) {
            console.warn('Failed to save settings:', e);
        }
    }

    get(key) {
        return this.values[key];
    }

    set(key, value) {
        this.values[key] = value;
        this.save();
    }

    getAll() {
        return { ...this.values };
    }

    reset() {
        this.values = { ...DEFAULT_SETTINGS };
        this.save();
    }
}
