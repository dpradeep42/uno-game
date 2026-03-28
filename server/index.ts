import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import path from 'path';
import {
  createRoom,
  joinRoom,
  startGame,
  getRoom,
  getRoomBySocket,
  buildGameState,
  removePlayer,
  Room,
} from './roomManager';
import {
  applyCard,
  drawForPlayer,
  endTurnPass,
  checkWin,
  canPlayCard,
} from './gameEngine';
import type {
  CreateRoomPayload,
  JoinRoomPayload,
  PlayCardPayload,
} from '../shared/types';

const app = express();
const httpServer = createServer(app);

// Serve built React app in production
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// ─── Broadcast helpers ────────────────────────────────────────────────────────

function broadcastRoom(room: Room): void {
  for (const p of room.players) {
    const state = buildGameState(room, p.id);
    io.to(p.id).emit('game_updated', state);
  }
}

function err(socket: Socket, message: string): void {
  socket.emit('error', { message });
}

// ─── Socket events ────────────────────────────────────────────────────────────

io.on('connection', (socket: Socket) => {
  // ── create_room ────────────────────────────────────────────────────────────
  socket.on('create_room', ({ name }: CreateRoomPayload) => {
    if (!name?.trim()) return err(socket, 'Name is required');
    const room = createRoom(socket.id, name.trim());
    socket.join(room.code);
    socket.emit('room_joined', buildGameState(room, socket.id));
  });

  // ── join_room ──────────────────────────────────────────────────────────────
  socket.on('join_room', ({ code, name }: JoinRoomPayload) => {
    if (!name?.trim()) return err(socket, 'Name is required');
    if (!code?.trim()) return err(socket, 'Room code is required');

    const result = joinRoom(code.trim().toUpperCase(), socket.id, name.trim());
    if (!result.ok) return err(socket, result.error);

    const { room, reconnected } = result;
    socket.join(room.code);

    if (reconnected) {
      socket.emit('room_joined', buildGameState(room, socket.id));
      broadcastRoom(room);
      return;
    }

    socket.emit('room_joined', buildGameState(room, socket.id));
    // Notify others
    socket.to(room.code).emit('player_joined', { name: name.trim() });
    broadcastRoom(room);
  });

  // ── start_game ─────────────────────────────────────────────────────────────
  socket.on('start_game', () => {
    const room = getRoomBySocket(socket.id);
    if (!room) return err(socket, 'Not in a room');

    const result = startGame(room.code, socket.id);
    if (!result.ok) return err(socket, result.error);

    broadcastRoom(room);
  });

  // ── play_card ──────────────────────────────────────────────────────────────
  socket.on('play_card', ({ cardId, chosenColor }: PlayCardPayload) => {
    const room = getRoomBySocket(socket.id);
    if (!room || !room.gameState) return err(socket, 'Not in a game');
    if (room.paused) return err(socket, 'Game is paused');

    const gs = room.gameState;
    const currentPlayerId = gs.playerIds[gs.currentTurnIndex];
    if (currentPlayerId !== socket.id)
      return err(socket, "It's not your turn");

    // If drawnCardId is set, only that card can be played
    if (gs.drawnCardId !== null && gs.drawnCardId !== cardId)
      return err(socket, 'You can only play the card you just drew');

    const hand = gs.hands.get(socket.id) ?? [];
    const card = hand.find(c => c.id === cardId);
    if (!card) return err(socket, 'Card not in your hand');

    const discardTop = gs.discardPile[gs.discardPile.length - 1];
    if (!canPlayCard(card, discardTop, gs.currentColor, gs.drawPending))
      return err(socket, 'Card cannot be played');

    // Wild requires chosen colour
    if ((card.value === 'wild' || card.value === 'wild4') && !chosenColor)
      return err(socket, 'Choose a color for the wild card');

    try {
      let next = applyCard(gs, socket.id, card, chosenColor);
      const winner = checkWin(next);
      if (winner) {
        next.winnerId = winner;
        room.status = 'finished';
        const name = next.playerNames.get(winner) ?? 'Someone';
        next.log.push(`${name} wins!`);
      }
      room.gameState = next;
      broadcastRoom(room);
    } catch (e: unknown) {
      err(socket, e instanceof Error ? e.message : 'Unknown error');
    }
  });

  // ── draw_card ──────────────────────────────────────────────────────────────
  socket.on('draw_card', () => {
    const room = getRoomBySocket(socket.id);
    if (!room || !room.gameState) return err(socket, 'Not in a game');
    if (room.paused) return err(socket, 'Game is paused');

    const gs = room.gameState;
    const currentPlayerId = gs.playerIds[gs.currentTurnIndex];
    if (currentPlayerId !== socket.id)
      return err(socket, "It's not your turn");

    if (gs.drawnCardId !== null)
      return err(socket, 'You already drew a card — play it or pass');

    room.gameState = drawForPlayer(gs, socket.id);
    broadcastRoom(room);
  });

  // ── end_turn (pass after drawing) ─────────────────────────────────────────
  socket.on('end_turn', () => {
    const room = getRoomBySocket(socket.id);
    if (!room || !room.gameState) return err(socket, 'Not in a game');
    if (room.paused) return err(socket, 'Game is paused');

    const gs = room.gameState;
    const currentPlayerId = gs.playerIds[gs.currentTurnIndex];
    if (currentPlayerId !== socket.id)
      return err(socket, "It's not your turn");

    if (gs.drawnCardId === null)
      return err(socket, 'Nothing to pass');

    room.gameState = endTurnPass(gs, socket.id);
    broadcastRoom(room);
  });

  // ── call_uno ───────────────────────────────────────────────────────────────
  socket.on('call_uno', () => {
    const room = getRoomBySocket(socket.id);
    if (!room || !room.gameState) return;

    const gs = room.gameState;
    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    const hand = gs.hands.get(socket.id) ?? [];
    if (hand.length === 1) {
      gs.log.push(`${player.name} called UNO!`);
      if (gs.log.length > 8) gs.log = gs.log.slice(-8);
      broadcastRoom(room);
    }
  });

  // ── play_again ─────────────────────────────────────────────────────────────
  socket.on('play_again', () => {
    const room = getRoomBySocket(socket.id);
    if (!room) return err(socket, 'Not in a room');
    if (room.hostId !== socket.id) return err(socket, 'Only the host can restart');
    if (room.status !== 'finished') return err(socket, 'Game is not finished');

    // Reset to waiting, keep players
    room.status = 'waiting';
    room.gameState = null;
    room.paused = false;
    broadcastRoom(room);
  });

  // ── leave_room ─────────────────────────────────────────────────────────────
  socket.on('leave_room', () => handleLeave(socket, true));

  // ── disconnect ────────────────────────────────────────────────────────────
  socket.on('disconnect', () => handleLeave(socket, false));
});

// ─── Disconnect / leave logic ─────────────────────────────────────────────────

const RECONNECT_WINDOW = 30_000; // 30 seconds

function handleLeave(socket: Socket, explicit: boolean): void {
  const room = getRoomBySocket(socket.id);
  if (!room) return;

  const player = room.players.find(p => p.id === socket.id);
  if (!player) return;

  socket.to(room.code).emit('player_left', { name: player.name });

  if (room.status === 'waiting' || explicit) {
    // Remove immediately
    room.players = room.players.filter(p => p.id !== socket.id);
    if (room.players.length === 0) {
      getRoom(room.code); // just a reference, room auto-cleans
      return;
    }
    // Re-assign host if needed
    if (room.hostId === socket.id && room.players.length > 0) {
      room.hostId = room.players[0].id;
    }
    if (room.gameState) removePlayer(room, socket.id);
    broadcastRoom(room);
    return;
  }

  // Mid-game implicit disconnect: start reconnect timer
  player.disconnected = true;
  room.paused = true;

  player.disconnectTimer = setTimeout(() => {
    // Time's up — remove player permanently
    removePlayer(room, socket.id);
    room.players = room.players.filter(p => p.id !== socket.id);
    room.paused = false;

    if (room.players.length === 0) return;

    if (room.hostId === socket.id && room.players.length > 0) {
      room.hostId = room.players[0].id;
      room.gameState && (room.gameState.playerNames.set(
        room.players[0].id,
        room.players[0].name
      ));
    }

    if (room.status !== 'finished') {
      room.gameState?.log.push(`${player.name} left the game`);
    }

    broadcastRoom(room);
  }, RECONNECT_WINDOW);

  broadcastRoom(room);
}

// ─── Start ────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT ?? 3001;
httpServer.listen(PORT, () => {
  console.log(`UNO server running on http://localhost:${PORT}`);
});
