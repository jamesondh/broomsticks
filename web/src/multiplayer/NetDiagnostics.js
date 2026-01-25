// NetDiagnostics.js - Client prediction analytics for multiplayer debugging
// Enable via localStorage.broomsticks_netdiag=1 or ?netdiag=1

const REPORT_INTERVAL_MS = 30000;  // 30 second rollup
const RING_BUFFER_SIZE = 300;      // ~5 minutes of snapshots at 1/sec sampling
const PERCENTILES = [50, 95, 99];

/**
 * Ring buffer for fixed-size sample storage
 */
class RingBuffer {
    constructor(size) {
        this.buffer = new Array(size);
        this.size = size;
        this.head = 0;
        this.count = 0;
    }

    push(value) {
        this.buffer[this.head] = value;
        this.head = (this.head + 1) % this.size;
        if (this.count < this.size) this.count++;
    }

    getAll() {
        if (this.count === 0) return [];
        if (this.count < this.size) {
            return this.buffer.slice(0, this.count);
        }
        // Full buffer: return in order from oldest to newest
        return [...this.buffer.slice(this.head), ...this.buffer.slice(0, this.head)];
    }

    clear() {
        this.head = 0;
        this.count = 0;
    }
}

/**
 * Rolling statistics calculator
 */
class RollingStats {
    constructor() {
        this.samples = [];
        this.sum = 0;
        this.min = Infinity;
        this.max = -Infinity;
    }

    add(value) {
        this.samples.push(value);
        this.sum += value;
        this.min = Math.min(this.min, value);
        this.max = Math.max(this.max, value);
    }

    getStats() {
        const n = this.samples.length;
        if (n === 0) return { count: 0, avg: 0, min: 0, max: 0, p50: 0, p95: 0, p99: 0 };

        const sorted = [...this.samples].sort((a, b) => a - b);
        const avg = this.sum / n;

        return {
            count: n,
            avg: Math.round(avg * 100) / 100,
            min: this.min,
            max: this.max,
            p50: sorted[Math.floor(n * 0.5)] || 0,
            p95: sorted[Math.floor(n * 0.95)] || sorted[n - 1] || 0,
            p99: sorted[Math.floor(n * 0.99)] || sorted[n - 1] || 0
        };
    }

    clear() {
        this.samples = [];
        this.sum = 0;
        this.min = Infinity;
        this.max = -Infinity;
    }
}

/**
 * NetDiagnostics - Unified multiplayer performance analytics
 */
export class NetDiagnostics {
    constructor() {
        this.enabled = false;
        this.role = null;  // 'host' or 'client'
        this.roomCode = null;
        this.reportTimer = null;
        this.sessionStart = 0;

        // === Clock / Sync Health ===
        this.tickOffsetStats = new RollingStats();
        this.snapshotAgeStats = new RollingStats();
        this.ignoredSnapshots = 0;  // out-of-order/duplicate

        // === Snapshot Delivery (20Hz stream quality) ===
        this.lastSnapshotTime = 0;
        this.snapshotIntervalStats = new RollingStats();
        this.snapshotCount = 0;
        this.burstCount = 0;  // intervals > 100ms (2x expected 50ms)

        // === Input Round Trip / Acknowledgment ===
        this.pendingInputs = new Map();  // tick -> sendTimeMs
        this.ackDelayMsStats = new RollingStats();
        this.ackDelayTicksStats = new RollingStats();

        // === Prediction Quality ===
        this.divergenceStats = new RollingStats();
        this.divergenceByType = {
            players: new RollingStats(),
            balls: new RollingStats()
        };

        // === Rollback / Correction Cost ===
        this.rollbackCount = 0;
        this.hardResetCount = 0;
        this.resimTicksStats = new RollingStats();
        this.resimTimeMsStats = new RollingStats();

        // === Buffer Health ===
        this.bufferLengths = {
            hostInputBuffer: new RollingStats(),
            hostInputHistory: new RollingStats(),
            localInputBuffer: new RollingStats(),
            remoteInputQueue: new RollingStats(),
            stateHistory: new RollingStats()
        };
        this.bufferOverflowCounts = {
            hostInputBuffer: 0,
            hostInputHistory: 0,
            localInputBuffer: 0,
            remoteInputQueue: 0,
            stateHistory: 0
        };

        // === Local Performance ===
        this.physicsStepStats = new RollingStats();
        this.longFrameCount = 0;  // frames >= 2*UPDATE_INTERVAL
        this.frameSampleTick = 0;  // sample every N ticks

        // Ring buffer for detailed event history (optional export)
        this.eventHistory = new RingBuffer(RING_BUFFER_SIZE);

        // Check enable flag
        this.checkEnabled();
    }

    checkEnabled() {
        // Check URL param first
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('netdiag') === '1') {
            this.enabled = true;
            return;
        }

        // Check localStorage
        try {
            if (localStorage.getItem('broomsticks_netdiag') === '1') {
                this.enabled = true;
            }
        } catch (e) {
            // localStorage not available
        }
    }

    /**
     * Start diagnostics session
     */
    start(role, roomCode) {
        if (!this.enabled) return;

        this.role = role;
        this.roomCode = roomCode;
        this.sessionStart = Date.now();

        console.log(`[NetDiag] Started (${role}) room=${roomCode}`);

        // Start periodic reporting
        this.reportTimer = setInterval(() => this.emitReport(), REPORT_INTERVAL_MS);
    }

    /**
     * Stop diagnostics session
     */
    stop() {
        if (this.reportTimer) {
            clearInterval(this.reportTimer);
            this.reportTimer = null;
        }

        if (this.enabled && this.sessionStart > 0) {
            // Emit final report
            this.emitReport();
            console.log('[NetDiag] Stopped');
        }

        this.reset();
    }

    /**
     * Reset all stats for new session
     */
    reset() {
        this.role = null;
        this.roomCode = null;
        this.sessionStart = 0;

        // Clear all rolling stats
        this.tickOffsetStats.clear();
        this.snapshotAgeStats.clear();
        this.ignoredSnapshots = 0;

        this.lastSnapshotTime = 0;
        this.snapshotIntervalStats.clear();
        this.snapshotCount = 0;
        this.burstCount = 0;

        this.pendingInputs.clear();
        this.ackDelayMsStats.clear();
        this.ackDelayTicksStats.clear();

        this.divergenceStats.clear();
        this.divergenceByType.players.clear();
        this.divergenceByType.balls.clear();

        this.rollbackCount = 0;
        this.hardResetCount = 0;
        this.resimTicksStats.clear();
        this.resimTimeMsStats.clear();

        for (const key of Object.keys(this.bufferLengths)) {
            this.bufferLengths[key].clear();
            this.bufferOverflowCounts[key] = 0;
        }

        this.physicsStepStats.clear();
        this.longFrameCount = 0;

        this.eventHistory.clear();
    }

    // ===== Recording Methods =====

    /**
     * Record snapshot received (client only)
     */
    recordSnapshotReceived(snapshotTick, clientSimTick, lastProcessedInputTick) {
        if (!this.enabled || this.role !== 'client') return;

        const now = performance.now();
        this.snapshotCount++;

        // Tick offset: how far ahead is client vs server
        const tickOffset = clientSimTick - snapshotTick;
        this.tickOffsetStats.add(tickOffset);

        // Snapshot age
        this.snapshotAgeStats.add(tickOffset);

        // Inter-arrival time
        if (this.lastSnapshotTime > 0) {
            const interval = now - this.lastSnapshotTime;
            this.snapshotIntervalStats.add(interval);
            if (interval > 100) {
                this.burstCount++;
            }
        }
        this.lastSnapshotTime = now;

        // Process input acknowledgments
        this.processInputAcks(lastProcessedInputTick, snapshotTick);

        // Store event for history
        this.eventHistory.push({
            type: 'snapshot',
            time: Date.now(),
            snapshotTick,
            clientSimTick,
            tickOffset,
            lastProcessedInputTick
        });
    }

    /**
     * Record snapshot ignored (duplicate/out-of-order)
     */
    recordSnapshotIgnored(snapshotTick, lastAuthoritativeTick) {
        if (!this.enabled) return;
        this.ignoredSnapshots++;

        this.eventHistory.push({
            type: 'snapshot_ignored',
            time: Date.now(),
            snapshotTick,
            lastAuthoritativeTick
        });
    }

    /**
     * Record input sent (client only)
     */
    recordInputSent(tick) {
        if (!this.enabled || this.role !== 'client') return;

        this.pendingInputs.set(tick, performance.now());

        // Limit pending inputs map size
        if (this.pendingInputs.size > 300) {
            // Remove oldest entries
            const iterator = this.pendingInputs.keys();
            for (let i = 0; i < 100; i++) {
                this.pendingInputs.delete(iterator.next().value);
            }
        }
    }

    /**
     * Process input acknowledgments from lastProcessedInputTick
     */
    processInputAcks(lastProcessedInputTick, snapshotTick) {
        if (!this.enabled) return;

        const now = performance.now();

        // Find all inputs <= lastProcessedInputTick that are pending
        for (const [tick, sendTime] of this.pendingInputs.entries()) {
            if (tick <= lastProcessedInputTick) {
                const ackDelayMs = now - sendTime;
                const ackDelayTicks = snapshotTick - tick;

                this.ackDelayMsStats.add(ackDelayMs);
                this.ackDelayTicksStats.add(ackDelayTicks);

                this.pendingInputs.delete(tick);
            }
        }
    }

    /**
     * Record host input received (client only)
     */
    recordHostInputReceived(tick, bufferLength) {
        if (!this.enabled || this.role !== 'client') return;

        this.bufferLengths.hostInputBuffer.add(bufferLength);
    }

    /**
     * Record remote input received (host only)
     */
    recordRemoteInputReceived(tick, queueLength) {
        if (!this.enabled || this.role !== 'host') return;

        this.bufferLengths.remoteInputQueue.add(queueLength);
    }

    /**
     * Record divergence calculation result
     */
    recordDivergence(maxDivergence, playerDivergence, ballDivergence) {
        if (!this.enabled) return;

        this.divergenceStats.add(maxDivergence);
        if (playerDivergence !== undefined) {
            this.divergenceByType.players.add(playerDivergence);
        }
        if (ballDivergence !== undefined) {
            this.divergenceByType.balls.add(ballDivergence);
        }
    }

    /**
     * Record rollback event
     */
    recordRollback(fromTick, toTick, resimTicks, resimTimeMs) {
        if (!this.enabled) return;

        this.rollbackCount++;
        this.resimTicksStats.add(resimTicks);
        this.resimTimeMsStats.add(resimTimeMs);

        this.eventHistory.push({
            type: 'rollback',
            time: Date.now(),
            fromTick,
            toTick,
            resimTicks,
            resimTimeMs
        });
    }

    /**
     * Record hard reset event
     */
    recordHardReset(snapshotTick, clientTick, reason) {
        if (!this.enabled) return;

        this.hardResetCount++;

        this.eventHistory.push({
            type: 'hard_reset',
            time: Date.now(),
            snapshotTick,
            clientTick,
            reason
        });
    }

    /**
     * Record buffer lengths (sampled periodically)
     */
    recordBufferLengths(buffers) {
        if (!this.enabled) return;

        for (const [name, length] of Object.entries(buffers)) {
            if (this.bufferLengths[name]) {
                this.bufferLengths[name].add(length);
            }
        }
    }

    /**
     * Record buffer overflow/trim
     */
    recordBufferOverflow(bufferName) {
        if (!this.enabled) return;

        if (this.bufferOverflowCounts[bufferName] !== undefined) {
            this.bufferOverflowCounts[bufferName]++;
        }
    }

    /**
     * Record physics step duration
     */
    recordPhysicsStep(durationMs, elapsed, updateInterval) {
        if (!this.enabled) return;

        this.physicsStepStats.add(durationMs);

        // Detect long frames (>= 2x update interval)
        if (elapsed >= 2 * updateInterval) {
            this.longFrameCount++;
        }
    }

    // ===== Reporting =====

    /**
     * Emit consolidated report to console
     */
    emitReport() {
        if (!this.enabled || !this.sessionStart) return;

        const sessionDurationSec = (Date.now() - this.sessionStart) / 1000;
        const snapshotHz = this.snapshotCount / sessionDurationSec;
        const rollbacksPerMin = (this.rollbackCount / sessionDurationSec) * 60;
        const hardResetsPerMin = (this.hardResetCount / sessionDurationSec) * 60;

        const report = {
            // Context
            role: this.role,
            roomCode: this.roomCode,
            sessionDurationSec: Math.round(sessionDurationSec),

            // Sync
            tickOffset: this.tickOffsetStats.getStats(),
            snapshotAge: this.snapshotAgeStats.getStats(),
            ignoredSnapshots: this.ignoredSnapshots,

            // Network
            snapshotHz: Math.round(snapshotHz * 100) / 100,
            snapshotInterval: this.snapshotIntervalStats.getStats(),
            burstCount: this.burstCount,

            // Input
            ackDelayMs: this.ackDelayMsStats.getStats(),
            ackDelayTicks: this.ackDelayTicksStats.getStats(),

            // Prediction
            divergence: this.divergenceStats.getStats(),
            divergencePlayers: this.divergenceByType.players.getStats(),
            divergenceBalls: this.divergenceByType.balls.getStats(),

            // Corrections
            rollbacksPerMin: Math.round(rollbacksPerMin * 10) / 10,
            hardResetsPerMin: Math.round(hardResetsPerMin * 10) / 10,
            resimTicks: this.resimTicksStats.getStats(),
            resimTimeMs: this.resimTimeMsStats.getStats(),

            // Buffers
            buffers: {},
            bufferOverflows: this.bufferOverflowCounts,

            // Performance
            physicsStep: this.physicsStepStats.getStats(),
            longFrames: this.longFrameCount
        };

        // Add buffer stats
        for (const [name, stats] of Object.entries(this.bufferLengths)) {
            report.buffers[name] = stats.getStats();
        }

        // Format for console
        console.groupCollapsed(
            `[NetDiag] ${this.role} | ${this.roomCode} | ${Math.round(sessionDurationSec)}s`
        );

        console.log('=== Sync Health ===');
        console.log(`  tickOffset: avg=${report.tickOffset.avg} p95=${report.tickOffset.p95} max=${report.tickOffset.max}`);
        console.log(`  ignoredSnapshots: ${report.ignoredSnapshots}`);

        console.log('=== Network ===');
        console.log(`  snapshotHz: ${report.snapshotHz}`);
        console.log(`  interval: avg=${report.snapshotInterval.avg}ms p95=${report.snapshotInterval.p95}ms max=${report.snapshotInterval.max}ms`);
        console.log(`  bursts (>100ms): ${report.burstCount}`);

        if (this.role === 'client') {
            console.log('=== Input RTT ===');
            console.log(`  ackDelay: avg=${report.ackDelayMs.avg}ms p95=${report.ackDelayMs.p95}ms max=${report.ackDelayMs.max}ms`);
            console.log(`  ackDelayTicks: avg=${report.ackDelayTicks.avg} p95=${report.ackDelayTicks.p95}`);
        }

        console.log('=== Prediction ===');
        console.log(`  divergence: avg=${report.divergence.avg}px p95=${report.divergence.p95}px max=${report.divergence.max}px`);
        console.log(`  players: p95=${report.divergencePlayers.p95}px | balls: p95=${report.divergenceBalls.p95}px`);

        console.log('=== Corrections ===');
        console.log(`  rollbacks/min: ${report.rollbacksPerMin} | hardResets/min: ${report.hardResetsPerMin}`);
        console.log(`  resimTicks: avg=${report.resimTicks.avg} p95=${report.resimTicks.p95} max=${report.resimTicks.max}`);
        console.log(`  resimTime: avg=${report.resimTimeMs.avg}ms p95=${report.resimTimeMs.p95}ms max=${report.resimTimeMs.max}ms`);

        console.log('=== Buffers ===');
        for (const [name, stats] of Object.entries(report.buffers)) {
            if (stats.count > 0) {
                console.log(`  ${name}: avg=${stats.avg} max=${stats.max} overflows=${report.bufferOverflows[name] || 0}`);
            }
        }

        console.log('=== Performance ===');
        console.log(`  physicsStep: avg=${report.physicsStep.avg}ms p95=${report.physicsStep.p95}ms max=${report.physicsStep.max}ms`);
        console.log(`  longFrames: ${report.longFrames}`);

        console.groupEnd();

        // Clear rolling stats after report (keep cumulative counts)
        this.clearRollingStats();
    }

    /**
     * Clear rolling stats after report (preserve cumulative counts)
     */
    clearRollingStats() {
        this.tickOffsetStats.clear();
        this.snapshotAgeStats.clear();

        this.snapshotIntervalStats.clear();

        this.ackDelayMsStats.clear();
        this.ackDelayTicksStats.clear();

        this.divergenceStats.clear();
        this.divergenceByType.players.clear();
        this.divergenceByType.balls.clear();

        this.resimTicksStats.clear();
        this.resimTimeMsStats.clear();

        for (const key of Object.keys(this.bufferLengths)) {
            this.bufferLengths[key].clear();
        }

        this.physicsStepStats.clear();
    }

    /**
     * Export event history for detailed analysis
     */
    exportHistory() {
        return {
            role: this.role,
            roomCode: this.roomCode,
            sessionStart: this.sessionStart,
            events: this.eventHistory.getAll()
        };
    }
}

// Singleton instance
export const netDiag = new NetDiagnostics();
