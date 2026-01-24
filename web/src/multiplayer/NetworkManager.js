// NetworkManager.js - WebSocket client for PartyKit multiplayer

// PartyKit server URL - update this after deployment
// Development: ws://localhost:1999/party/{roomCode}
// Production: wss://broomsticks.{username}.partykit.dev/party/{roomCode}
const PARTYKIT_HOST = import.meta.env.VITE_PARTYKIT_HOST || 'localhost:1999';

// State broadcast interval (50ms = 20Hz)
const STATE_BROADCAST_INTERVAL = 50;

export class NetworkManager {
    constructor(game) {
        this.game = game;
        this.ws = null;
        this.roomCode = null;
        this.playerId = null;
        this.isHost = false;
        this.connected = false;

        // State broadcast interval (host only)
        this.broadcastInterval = null;

        // Remote player input (host only)
        this.remoteInput = {
            left: false,
            right: false,
            up: false,
            down: false,
            switch: false,
            tick: undefined
        };

        // Buffered input events for prediction (Phase 6/7)
        this.hostInputBuffer = [];   // Host inputs received by client
        this.localInputBuffer = [];  // Local inputs sent by client (for Phase 7 resimulation)

        // Callbacks for game events
        this.onJoined = null;
        this.onPlayerJoined = null;
        this.onPlayerLeft = null;
        this.onGameStart = null;
        this.onStateReceived = null;
        this.onSettingsReceived = null;
        this.onError = null;
    }

    // Generate a 4-character room code
    static generateRoomCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 4; i++) {
            code += chars[Math.floor(Math.random() * chars.length)];
        }
        return code;
    }

    // Connect to a room (create or join)
    connect(roomCode, playerName) {
        if (this.ws) {
            this.disconnect();
        }

        this.roomCode = roomCode.toUpperCase();

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const url = `${protocol}//${PARTYKIT_HOST}/party/${this.roomCode}`;

        console.log(`[NetworkManager] Connecting to ${url}`);

        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
            console.log('[NetworkManager] Connected, sending join');
            this.connected = true;
            // Send join message
            this.send({ type: 'join', name: playerName });
        };

        this.ws.onmessage = (event) => {
            this.handleMessage(JSON.parse(event.data));
        };

        this.ws.onerror = (error) => {
            console.error('[NetworkManager] WebSocket error:', error);
            if (this.onError) {
                this.onError('Connection error');
            }
        };

        this.ws.onclose = () => {
            console.log('[NetworkManager] Disconnected');
            this.connected = false;
            this.stopBroadcast();
        };
    }

    disconnect() {
        this.stopBroadcast();
        if (this.ws) {
            this.send({ type: 'leave' });
            this.ws.close();
            this.ws = null;
        }
        this.connected = false;
        this.isHost = false;
        this.playerId = null;
        this.roomCode = null;
    }

    send(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        }
    }

    handleMessage(msg) {
        switch (msg.type) {
            case 'joined':
                this.playerId = msg.playerId;
                this.isHost = msg.isHost;
                this.roomCode = msg.roomCode;
                console.log(`[NetworkManager] Joined room ${msg.roomCode} as ${msg.isHost ? 'host' : 'client'}`);
                if (this.onJoined) {
                    this.onJoined(msg);
                }
                break;

            case 'playerJoined':
                console.log(`[NetworkManager] Player joined: ${msg.player.name}`);
                if (this.onPlayerJoined) {
                    this.onPlayerJoined(msg.player);
                }
                break;

            case 'playerLeft':
                console.log(`[NetworkManager] Player left: ${msg.playerId}`);
                if (this.onPlayerLeft) {
                    this.onPlayerLeft(msg.playerId);
                }
                break;

            case 'gameStart':
                console.log('[NetworkManager] Game starting');
                if (this.isHost) {
                    this.startBroadcast();
                }
                if (this.onGameStart) {
                    this.onGameStart(msg.config);
                }
                break;

            case 'state':
                // Client receives state from host
                if (!this.isHost && this.onStateReceived) {
                    this.onStateReceived(msg.state);
                }
                break;

            case 'input':
                // Host receives input from client
                if (this.isHost) {
                    this.remoteInput = msg.input;
                    this.remoteInput.tick = msg.tick;  // Preserve tick for acknowledgment
                    console.log('[Net] Host received input tick:', msg.tick, msg.input);
                }
                break;

            case 'hostInput':
                // Client receives host input (for prediction)
                if (!this.isHost) {
                    this.hostInputBuffer.push({
                        tick: msg.tick,
                        input: msg.input
                    });
                    console.log('[Net] Client received hostInput tick:', msg.tick, msg.input, 'buffer size:', this.hostInputBuffer.length);
                    // Keep buffer size reasonable (~2 seconds at 30Hz)
                    if (this.hostInputBuffer.length > 60) {
                        this.hostInputBuffer.shift();
                    }
                }
                break;

            case 'settings':
                // Client receives settings update from host (lobby)
                if (!this.isHost && this.onSettingsReceived) {
                    console.log('[NetworkManager] Received settings from host:', msg.settings);
                    this.onSettingsReceived(msg.settings);
                }
                break;

            case 'error':
                console.error('[NetworkManager] Error:', msg.message);
                if (this.onError) {
                    this.onError(msg.message);
                }
                break;
        }
    }

    // Host: start broadcasting state at 20Hz
    startBroadcast() {
        if (!this.isHost) return;

        this.stopBroadcast();
        this.broadcastInterval = setInterval(() => {
            if (this.game && this.game.serializeState) {
                const state = this.game.serializeState();
                this.send({ type: 'state', state: state });
            }
        }, STATE_BROADCAST_INTERVAL);
    }

    stopBroadcast() {
        if (this.broadcastInterval) {
            clearInterval(this.broadcastInterval);
            this.broadcastInterval = null;
        }
    }

    // Client: send input state to host with tick timestamp
    sendInput(input, tick) {
        if (this.isHost) return;

        // Save to local history (for Phase 7 resimulation)
        this.localInputBuffer.push({ tick, input });
        if (this.localInputBuffer.length > 60) {
            this.localInputBuffer.shift();
        }

        console.log('[Net] Sending input tick:', tick, input);
        this.send({ type: 'input', input, tick });
    }

    // Host: send input to clients (for client-side prediction)
    sendHostInput(input, tick) {
        if (!this.isHost) return;
        console.log('[Net] Host sending hostInput tick:', tick, input);
        this.send({ type: 'hostInput', input, tick });
    }

    // Host: get remote player's input
    getRemoteInput() {
        return this.remoteInput;
    }

    // Host: clear remote input (after processing)
    clearRemoteInputSwitch() {
        this.remoteInput.switch = false;
    }

    // Request game start (host only)
    requestGameStart() {
        if (this.isHost) {
            // Send host's simulation-affecting settings to sync with client
            const settings = this.extractSimulationSettings();
            console.log('[NetworkManager] Sending gameStart with settings:', settings);
            this.send({ type: 'gameStart', settings });
        }
    }

    // Host: broadcast settings to clients (for lobby settings sync)
    broadcastSettings(settings) {
        if (!this.isHost) return;
        const simSettings = this.extractSimulationSettings();
        console.log('[NetworkManager] Broadcasting settings:', simSettings);
        this.send({ type: 'settings', settings: simSettings });
    }

    // Extract simulation-affecting settings for network sync
    extractSimulationSettings() {
        return {
            dive: this.game.settings.dive,
            accel: this.game.settings.accel,
            maxSpeed: this.game.settings.maxSpeed,
            redBalls: this.game.settings.redBalls,
            blackBalls: this.game.settings.blackBalls,
            goldBalls: this.game.settings.goldBalls,
            goldPoints: this.game.settings.goldPoints,
            duration: this.game.settings.duration,
            winScore: this.game.settings.winScore,
            goldSpawnTick: Math.floor((this.game.settings.duration * 1000) / 30),
            seed: this.game.randomSeed || Math.floor(Math.random() * 0xFFFFFFFF)
        };
    }
}
