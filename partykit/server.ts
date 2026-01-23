// PartyKit server for Broomsticks online multiplayer
// Handles room creation, player joining, and message routing

import type * as Party from "partykit/server";

// Room code characters (excluding confusable chars like 0/O, 1/I)
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

// Message types
type ClientMessage =
  | { type: "join"; name: string }
  | { type: "ready" }
  | { type: "input"; input: InputState }
  | { type: "gameStart"; settings?: GameSettings }
  | { type: "settings"; settings: GameSettings }
  | { type: "state"; state: GameState }
  | { type: "leave" };

// Game settings that affect simulation (must be synced)
interface GameSettings {
  dive: boolean;
  accel: number;
  maxSpeed: number;
  redBalls: number;
  blackBalls: number;
  goldBalls: number;
  goldPoints: number;
  duration: number;
  winScore: number;
}

type ServerMessage =
  | { type: "joined"; playerId: string; isHost: boolean; roomCode: string; players: PlayerInfo[] }
  | { type: "playerJoined"; player: PlayerInfo }
  | { type: "playerLeft"; playerId: string }
  | { type: "gameStart"; config: GameConfig }
  | { type: "settings"; settings: GameSettings }
  | { type: "state"; state: GameState }
  | { type: "input"; playerId: string; input: InputState }
  | { type: "error"; message: string };

interface PlayerInfo {
  id: string;
  name: string;
  isHost: boolean;
  ready: boolean;
}

interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  switch: boolean;
}

interface GameConfig {
  hostId: string;
  settings?: GameSettings;
}

// Compact game state for network sync
interface GameState {
  players: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    score: number;
    model: number;
  }>;
  balls: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    alive: boolean;
  }>;
  currBasket: number;
  timer: number;
  goldSpawned: boolean;
}

export default class BroomsticksRoom implements Party.Server {
  players: Map<string, PlayerInfo> = new Map();
  hostId: string | null = null;
  gameStarted: boolean = false;

  constructor(public room: Party.Room) {}

  // Generate a 4-character room code
  static generateRoomCode(): string {
    let code = "";
    for (let i = 0; i < 4; i++) {
      code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    }
    return code;
  }

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    // Connection established, wait for join message
    console.log(`[${this.room.id}] Connection opened: ${conn.id}`);
  }

  onClose(conn: Party.Connection) {
    const player = this.players.get(conn.id);
    if (player) {
      console.log(`[${this.room.id}] Player left: ${player.name} (${conn.id})`);
      this.players.delete(conn.id);

      // Notify other players
      this.broadcast(
        JSON.stringify({ type: "playerLeft", playerId: conn.id } as ServerMessage),
        [conn.id]
      );

      // If host left, end the game/room
      if (conn.id === this.hostId) {
        this.hostId = null;
        this.gameStarted = false;
        // Notify remaining players
        this.broadcast(
          JSON.stringify({ type: "error", message: "Host disconnected" } as ServerMessage)
        );
      }
    }
  }

  onMessage(message: string, sender: Party.Connection) {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(message);
    } catch {
      console.error(`[${this.room.id}] Invalid message from ${sender.id}`);
      return;
    }

    switch (msg.type) {
      case "join":
        this.handleJoin(sender, msg.name);
        break;

      case "ready":
        this.handleReady(sender);
        break;

      case "gameStart":
        this.handleGameStart(sender, msg.settings);
        break;

      case "settings":
        this.handleSettings(sender, msg.settings);
        break;

      case "state":
        this.handleState(sender, msg.state);
        break;

      case "input":
        this.handleInput(sender, msg.input);
        break;

      case "leave":
        this.handleLeave(sender);
        break;
    }
  }

  handleJoin(conn: Party.Connection, name: string) {
    // Check if room is full (max 2 players)
    if (this.players.size >= 2) {
      conn.send(JSON.stringify({ type: "error", message: "Room is full" } as ServerMessage));
      return;
    }

    // Check if game already started
    if (this.gameStarted) {
      conn.send(JSON.stringify({ type: "error", message: "Game already in progress" } as ServerMessage));
      return;
    }

    const isHost = this.players.size === 0;
    if (isHost) {
      this.hostId = conn.id;
    }

    const player: PlayerInfo = {
      id: conn.id,
      name: name,
      isHost: isHost,
      ready: false
    };

    this.players.set(conn.id, player);
    console.log(`[${this.room.id}] Player joined: ${name} (${conn.id}), isHost: ${isHost}`);

    // Send join confirmation to the new player
    const playersArray = Array.from(this.players.values());
    conn.send(JSON.stringify({
      type: "joined",
      playerId: conn.id,
      isHost: isHost,
      roomCode: this.room.id,
      players: playersArray
    } as ServerMessage));

    // Notify other players about the new player
    this.broadcast(
      JSON.stringify({ type: "playerJoined", player: player } as ServerMessage),
      [conn.id]
    );
  }

  handleReady(conn: Party.Connection) {
    const player = this.players.get(conn.id);
    if (player) {
      player.ready = true;
    }
  }

  handleGameStart(conn: Party.Connection, settings?: GameSettings) {
    // Only host can start the game
    if (conn.id !== this.hostId) {
      conn.send(JSON.stringify({ type: "error", message: "Only host can start" } as ServerMessage));
      return;
    }

    // Need 2 players to start
    if (this.players.size < 2) {
      conn.send(JSON.stringify({ type: "error", message: "Need 2 players" } as ServerMessage));
      return;
    }

    this.gameStarted = true;
    console.log(`[${this.room.id}] Game started by host with settings:`, settings);

    // Notify all players with host settings
    this.broadcast(JSON.stringify({
      type: "gameStart",
      config: {
        hostId: this.hostId,
        settings: settings
      }
    } as ServerMessage));
  }

  handleSettings(conn: Party.Connection, settings: GameSettings) {
    // Only host can broadcast settings
    if (conn.id !== this.hostId) return;

    // Don't allow settings changes after game started
    if (this.gameStarted) return;

    console.log(`[${this.room.id}] Host updated settings:`, settings);

    // Forward settings to all clients (excluding host)
    this.broadcast(
      JSON.stringify({ type: "settings", settings: settings } as ServerMessage),
      [conn.id]
    );
  }

  handleState(conn: Party.Connection, state: GameState) {
    // Only host can broadcast state
    if (conn.id !== this.hostId) return;

    // Forward state to all clients (excluding host)
    this.broadcast(
      JSON.stringify({ type: "state", state: state } as ServerMessage),
      [conn.id]
    );
  }

  handleInput(conn: Party.Connection, input: InputState) {
    // Clients send input to host
    if (conn.id === this.hostId) return;

    // Forward input to host only
    const hostConn = this.room.getConnection(this.hostId!);
    if (hostConn) {
      hostConn.send(JSON.stringify({
        type: "input",
        playerId: conn.id,
        input: input
      } as ServerMessage));
    }
  }

  handleLeave(conn: Party.Connection) {
    // Close connection, onClose will handle cleanup
    conn.close();
  }

  broadcast(message: string, exclude: string[] = []) {
    for (const conn of this.room.getConnections()) {
      if (!exclude.includes(conn.id)) {
        conn.send(message);
      }
    }
  }
}
