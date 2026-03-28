import type { GameState, Player } from '../shared/types';
import {
  dealHands,
  applyOpeningCard,
  InternalGameState,
  cloneGS,
} from './gameEngine';

// ─── Internal types ───────────────────────────────────────────────────────────

export interface RoomPlayer {
  id: string;           // current socket.id
  name: string;
  disconnected: boolean;
  disconnectTimer?: ReturnType<typeof setTimeout>;
}

export interface Room {
  code: string;
  hostId: string;
  players: RoomPlayer[];
  status: 'waiting' | 'playing' | 'finished';
  gameState: InternalGameState | null;
  cleanupTimer: ReturnType<typeof setTimeout>;
  paused: boolean;      // true while waiting for a disconnected player
}

// ─── Store ────────────────────────────────────────────────────────────────────

const rooms = new Map<string, Room>();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code: string;
  do {
    code = Array.from({ length: 6 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');
  } while (rooms.has(code));
  return code;
}

function resetCleanup(room: Room): void {
  clearTimeout(room.cleanupTimer);
  room.cleanupTimer = setTimeout(() => rooms.delete(room.code), 60 * 60_000);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function createRoom(socketId: string, name: string): Room {
  const code = generateCode();
  const room: Room = {
    code,
    hostId: socketId,
    players: [{ id: socketId, name, disconnected: false }],
    status: 'waiting',
    gameState: null,
    paused: false,
    cleanupTimer: setTimeout(() => rooms.delete(code), 60 * 60_000),
  };
  rooms.set(code, room);
  return room;
}

export type JoinResult =
  | { ok: true; room: Room; reconnected: boolean }
  | { ok: false; error: string };

export function joinRoom(code: string, socketId: string, name: string): JoinResult {
  const room = rooms.get(code.toUpperCase());
  if (!room) return { ok: false, error: 'Room not found' };

  // Mid-game reconnection: match by name
  if (room.status === 'playing' || room.status === 'finished') {
    const existing = room.players.find(p => p.name === name && p.disconnected);
    if (existing) {
      clearTimeout(existing.disconnectTimer);
      const oldId = existing.id;
      existing.id = socketId;
      existing.disconnected = false;
      existing.disconnectTimer = undefined;

      // Re-key the hand
      if (room.gameState) {
        const hand = room.gameState.hands.get(oldId);
        if (hand) {
          room.gameState.hands.delete(oldId);
          room.gameState.hands.set(socketId, hand);
        }
        // Update playerIds list
        const pidx = room.gameState.playerIds.indexOf(oldId);
        if (pidx !== -1) room.gameState.playerIds[pidx] = socketId;
        // Update playerNames map
        const pname = room.gameState.playerNames.get(oldId);
        if (pname) {
          room.gameState.playerNames.delete(oldId);
          room.gameState.playerNames.set(socketId, pname);
        }
      }

      room.paused = false;
      resetCleanup(room);
      return { ok: true, room, reconnected: true };
    }
    return { ok: false, error: 'Game already in progress' };
  }

  if (room.players.length >= 6) return { ok: false, error: 'Room is full (max 6)' };
  if (room.players.some(p => p.name === name)) return { ok: false, error: 'Name already taken in this room' };

  room.players.push({ id: socketId, name, disconnected: false });
  resetCleanup(room);
  return { ok: true, room, reconnected: false };
}

export type StartResult = { ok: true } | { ok: false; error: string };

export function startGame(code: string, socketId: string): StartResult {
  const room = rooms.get(code);
  if (!room) return { ok: false, error: 'Room not found' };
  if (room.hostId !== socketId) return { ok: false, error: 'Only the host can start the game' };
  if (room.status !== 'waiting') return { ok: false, error: 'Game already started' };
  if (room.players.length < 2) return { ok: false, error: 'Need at least 2 players' };

  const playerIds = room.players.map(p => p.id);
  let gs = dealHands(playerIds);

  // Fill in player names
  for (const p of room.players) gs.playerNames.set(p.id, p.name);

  gs = applyOpeningCard(gs);

  room.gameState = gs;
  room.status = 'playing';
  return { ok: true };
}

export function removePlayer(room: Room, socketId: string): void {
  if (!room.gameState) return;
  const gs = room.gameState;

  const pidx = gs.playerIds.indexOf(socketId);
  if (pidx === -1) return;

  // Adjust currentTurnIndex so we don't skip or loop oddly
  gs.playerIds.splice(pidx, 1);
  gs.hands.delete(socketId);
  gs.playerNames.delete(socketId);
  room.players = room.players.filter(p => p.id !== socketId);

  const n = gs.playerIds.length;

  if (n < 2) {
    // Not enough players — end game
    room.status = 'finished';
    gs.winnerId = gs.playerIds[0] ?? null;
    gs.log.push('Not enough players — game over');
    return;
  }

  // Keep currentTurnIndex in bounds
  if (gs.currentTurnIndex >= n) {
    gs.currentTurnIndex = gs.currentTurnIndex % n;
  }
  // If removed player was before current turn, decrement
  if (pidx < gs.currentTurnIndex) {
    gs.currentTurnIndex = Math.max(0, gs.currentTurnIndex - 1);
  }
}

export function getRoom(code: string): Room | undefined {
  return rooms.get(code.toUpperCase());
}

export function getRoomBySocket(socketId: string): Room | undefined {
  for (const room of rooms.values()) {
    if (room.players.some(p => p.id === socketId)) return room;
  }
  return undefined;
}

// ─── Build per-socket GameState ───────────────────────────────────────────────

export function buildGameState(room: Room, socketId: string): GameState {
  const gs = room.gameState;

  const players: Player[] = room.players.map(p => ({
    id: p.id,
    name: p.name,
    cardCount: gs?.hands.get(p.id)?.length ?? 0,
    disconnected: p.disconnected,
  }));

  if (room.status === 'waiting' || !gs) {
    return {
      roomCode: room.code,
      status: room.status,
      players,
      currentTurnIndex: 0,
      direction: 1,
      currentColor: 'wild',
      discardTop: { id: -1, color: 'wild', value: 'wild' },
      drawPending: 0,
      myHand: [],
      winnerId: null,
      log: [],
      isHost: room.hostId === socketId,
      drawnCardId: null,
      paused: room.paused,
    };
  }

  const myHand = gs.hands.get(socketId) ?? [];
  const discardTop = gs.discardPile[gs.discardPile.length - 1];
  const drawnCardId =
    gs.playerIds[gs.currentTurnIndex] === socketId ? gs.drawnCardId : null;

  return {
    roomCode: room.code,
    status: room.status,
    players,
    currentTurnIndex: gs.currentTurnIndex,
    direction: gs.direction,
    currentColor: gs.currentColor,
    discardTop,
    drawPending: gs.drawPending,
    myHand,
    winnerId: gs.winnerId,
    log: gs.log,
    isHost: room.hostId === socketId,
    drawnCardId,
    paused: room.paused,
  };
}
