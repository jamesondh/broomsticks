// SeededRandom.js - Hash-based deterministic random for network sync
// Uses pure functions instead of mutable PRNG state to avoid desync from "extra calls"

/**
 * Hash function based on mulberry32, used as a pure hash (not sequential PRNG)
 * @param {number} seed - Combined seed value
 * @returns {number} Random float between 0 and 1
 */
function hash(seed) {
    let t = (seed + 0x6D2B79F5) | 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/**
 * Generate a deterministic random value for a specific tick and entity
 * @param {number} tick - The game tick (authoritative)
 * @param {number} entityId - Unique entity identifier (e.g., ball index)
 * @returns {number} Random float between 0 and 1
 */
export function randomFor(tick, entityId) {
    // Combine tick and entityId into a unique seed
    // Use golden ratio bits to spread out the hash space
    const seed = tick * 2654435761 + entityId * 2246822519;
    return hash(seed);
}

/**
 * Generate a deterministic random integer for a specific tick and entity
 * @param {number} tick - The game tick (authoritative)
 * @param {number} entityId - Unique entity identifier
 * @param {number} min - Minimum value (inclusive)
 * @param {number} max - Maximum value (exclusive)
 * @returns {number} Random integer in [min, max)
 */
export function randomIntFor(tick, entityId, min, max) {
    return Math.floor(randomFor(tick, entityId) * (max - min)) + min;
}
