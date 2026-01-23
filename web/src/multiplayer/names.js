// names.js - Random player name generator for online multiplayer

const ADJECTIVES = [
    'Swift',
    'Golden',
    'Mystic',
    'Cosmic',
    'Blazing',
    'Shadow',
    'Crystal',
    'Thunder',
    'Nimble',
    'Fierce',
    'Wild',
    'Silent',
    'Lucky',
    'Bold',
    'Brave'
];

const NOUNS = [
    'Broom',
    'Seeker',
    'Chaser',
    'Keeper',
    'Flyer',
    'Wizard',
    'Rider',
    'Storm',
    'Wing',
    'Star',
    'Phoenix',
    'Falcon',
    'Hawk',
    'Eagle',
    'Raven'
];

/**
 * Generate a random player name in the format "AdjectiveNoun##"
 * Examples: "SwiftBroom42", "GoldenSeeker7", "MysticFlyer99"
 *
 * @returns {string} Random player name
 */
export function generatePlayerName() {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    const num = Math.floor(Math.random() * 100);
    return `${adj}${noun}${num}`;
}
