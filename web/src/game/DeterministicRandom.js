// DeterministicRandom.js - Hash-based PRNG for deterministic multiplayer simulation
// Uses MurmurHash3-inspired mixing to produce order-independent random values

/**
 * Hash function that mixes 4 uint32 values into a pseudo-random uint32.
 * Same inputs always produce the same output, regardless of call order.
 *
 * @param {number} seed - Game seed (same for all entities in a match)
 * @param {number} tick - Current simulation tick (same for all entities at a given moment)
 * @param {number} entityId - Unique entity identifier (different per ball)
 * @param {number} channel - Purpose channel (0=ball wiggle, 1+=evasion per player)
 * @returns {number} Deterministic uint32
 */
export function hashRand(seed, tick, entityId, channel) {
    // Combine inputs into a single 32-bit value using MurmurHash3-style mixing
    let h = seed >>> 0;

    // Mix in tick
    h ^= tick >>> 0;
    h = Math.imul(h ^ (h >>> 16), 0x85ebca6b) >>> 0;

    // Mix in entityId
    h ^= entityId >>> 0;
    h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;

    // Mix in channel
    h ^= channel >>> 0;
    h = Math.imul(h ^ (h >>> 16), 0x85ebca6b) >>> 0;

    // Final avalanche
    h ^= h >>> 16;

    return h >>> 0;
}

/**
 * Returns a deterministic integer in [0, max)
 *
 * @param {number} seed - Game seed
 * @param {number} tick - Current simulation tick
 * @param {number} entityId - Unique entity identifier
 * @param {number} channel - Purpose channel
 * @param {number} max - Exclusive upper bound
 * @returns {number} Integer in [0, max)
 */
export function randInt(seed, tick, entityId, channel, max) {
    const h = hashRand(seed, tick, entityId, channel);
    return h % max;
}

/**
 * Returns a deterministic integer in [min, max]
 *
 * @param {number} seed - Game seed
 * @param {number} tick - Current simulation tick
 * @param {number} entityId - Unique entity identifier
 * @param {number} channel - Purpose channel
 * @param {number} min - Inclusive lower bound
 * @param {number} max - Inclusive upper bound
 * @returns {number} Integer in [min, max]
 */
export function randRange(seed, tick, entityId, channel, min, max) {
    const h = hashRand(seed, tick, entityId, channel);
    const range = max - min + 1;
    return min + (h % range);
}
