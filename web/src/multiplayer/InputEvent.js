// InputEvent.js - Tick-stamped input event structure for network sync

/**
 * Create a tick-stamped input event.
 * Used for client-side prediction (Phase 6) and rollback reconciliation (Phase 7).
 *
 * @param {number} tick - The simulation tick when this input was generated
 * @param {Object} actions - Input actions (left, right, up, down, switch)
 * @param {string} [playerId] - Optional player ID for tracking
 * @returns {Object} Tick-stamped input event
 */
export function createInputEvent(tick, actions, playerId) {
    return {
        tick,
        playerId,
        actions: {
            left: actions.left || false,
            right: actions.right || false,
            up: actions.up || false,
            down: actions.down || false,
            switch: actions.switch || false
        }
    };
}
