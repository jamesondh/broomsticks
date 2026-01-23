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
            switch: false
        };

        // Callbacks for game events
        this.onJoined = null;
        this.onPlayerJoined = null;
        this.onPlayerLeft = null;
        this.onGameStart = null;
        this.onStateReceived = null;
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

    // Client: send input state to host
    sendInput(input) {
        if (this.isHost) return;
        this.send({ type: 'input', input: input });
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
            this.send({ type: 'gameStart' });
        }
    }
}
