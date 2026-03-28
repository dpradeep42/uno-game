export type Color = 'red' | 'blue' | 'green' | 'yellow' | 'wild';
export type CardValue =
  | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
  | 'skip' | 'reverse' | 'draw2' | 'wild' | 'wild4';

export interface UnoCard {
  id: number;
  color: Color;
  value: CardValue;
}

export interface Player {
  id: string;       // socket.id
  name: string;
  cardCount: number;
  disconnected?: boolean;
}

export interface GameState {
  roomCode: string;
  status: 'waiting' | 'playing' | 'finished';
  players: Player[];
  currentTurnIndex: number;
  direction: 1 | -1;
  currentColor: Color;
  discardTop: UnoCard;
  drawPending: number;
  myHand: UnoCard[];
  winnerId: string | null;
  log: string[];
  isHost: boolean;
  /** Set when you just drew a card and may optionally play it */
  drawnCardId: number | null;
  /** True if game is paused waiting for a disconnected player to reconnect */
  paused: boolean;
}

// ─── Socket event payloads ────────────────────────────────────────────────────

export interface CreateRoomPayload {
  name: string;
}

export interface JoinRoomPayload {
  code: string;
  name: string;
}

export interface PlayCardPayload {
  cardId: number;
  chosenColor?: Color;
}

export interface ErrorPayload {
  message: string;
}

export interface PlayerLeftPayload {
  name: string;
}
