import type { UnoCard, Color, CardValue } from '../shared/types';

// ─── Deck construction ────────────────────────────────────────────────────────

export function buildDeck(): UnoCard[] {
  let id = 0;
  const make = (color: Color, value: CardValue): UnoCard => ({ id: id++, color, value });
  const deck: UnoCard[] = [];
  const colors: Color[] = ['red', 'blue', 'green', 'yellow'];

  for (const color of colors) {
    deck.push(make(color, '0'));
    const repeats: CardValue[] = ['1','2','3','4','5','6','7','8','9','skip','reverse','draw2'];
    for (let i = 0; i < 2; i++) {
      for (const v of repeats) deck.push(make(color, v));
    }
  }

  for (let i = 0; i < 4; i++) {
    deck.push(make('wild', 'wild'));
    deck.push(make('wild', 'wild4'));
  }

  return shuffle(deck);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Internal game state (server-only) ───────────────────────────────────────

export interface InternalGameState {
  playerIds: string[];                  // ordered; index === seat
  playerNames: Map<string, string>;     // socketId → display name
  deck: UnoCard[];
  hands: Map<string, UnoCard[]>;        // socketId → cards in hand
  discardPile: UnoCard[];               // last element is top
  currentTurnIndex: number;
  direction: 1 | -1;
  currentColor: Color;
  drawPending: number;                  // accumulated draw2/wild4 count
  winnerId: string | null;
  log: string[];
  drawnCardId: number | null;           // set when player drew & may play it
}

// ─── Deal ─────────────────────────────────────────────────────────────────────

export function dealHands(playerIds: string[]): InternalGameState {
  let deck = buildDeck();
  const hands = new Map<string, UnoCard[]>();
  for (const id of playerIds) hands.set(id, []);

  for (let i = 0; i < 7; i++) {
    for (const id of playerIds) hands.get(id)!.push(deck.shift()!);
  }

  // Opening card must not be a wild
  let top = deck.shift()!;
  while (top.value === 'wild' || top.value === 'wild4') {
    deck.push(top);
    deck = shuffle(deck);
    top = deck.shift()!;
  }

  return {
    playerIds,
    playerNames: new Map(),            // caller fills this in
    deck,
    hands,
    discardPile: [top],
    currentTurnIndex: 0,
    direction: 1,
    currentColor: top.color,
    drawPending: 0,
    winnerId: null,
    log: [`Game started — opening card: ${top.color} ${top.value}`],
    drawnCardId: null,
  };
}

// ─── Apply opening card effects ───────────────────────────────────────────────

export function applyOpeningCard(gs: InternalGameState): InternalGameState {
  const s = cloneGS(gs);
  const top = s.discardPile[s.discardPile.length - 1];
  const n = s.playerIds.length;

  switch (top.value) {
    case 'skip':
      s.currentTurnIndex = (s.currentTurnIndex + s.direction + n) % n;
      s.log.push('Opening Skip — first player skipped');
      break;
    case 'reverse':
      s.direction = -1;
      if (n === 2) {
        s.currentTurnIndex = (s.currentTurnIndex + s.direction + n) % n;
        s.log.push('Opening Reverse — first player skipped');
      } else {
        s.log.push('Opening Reverse — order reversed');
      }
      break;
    case 'draw2': {
      const victimId = s.playerIds[s.currentTurnIndex];
      pullCards(s, victimId, 2);
      s.currentTurnIndex = (s.currentTurnIndex + s.direction + n) % n;
      s.log.push('Opening +2 — first player drew 2');
      break;
    }
  }

  if (s.log.length > 8) s.log = s.log.slice(-8);
  return s;
}

// ─── Playability check ────────────────────────────────────────────────────────

export function canPlayCard(
  card: UnoCard,
  discardTop: UnoCard,
  currentColor: Color,
  drawPending: number
): boolean {
  if (drawPending > 0) {
    if (discardTop.value === 'draw2') return card.value === 'draw2';
    if (discardTop.value === 'wild4') return card.value === 'wild4';
  }
  if (card.value === 'wild' || card.value === 'wild4') return true;
  return card.color === currentColor || card.value === discardTop.value;
}

// ─── Play a card ──────────────────────────────────────────────────────────────

export function applyCard(
  gs: InternalGameState,
  playerId: string,
  card: UnoCard,
  chosenColor?: Color
): InternalGameState {
  const s = cloneGS(gs);
  const name = s.playerNames.get(playerId) ?? 'Unknown';
  const n = s.playerIds.length;

  // Remove card from hand
  const hand = s.hands.get(playerId)!;
  const idx = hand.findIndex(c => c.id === card.id);
  if (idx === -1) throw new Error('Card not in hand');
  hand.splice(idx, 1);

  s.discardPile.push(card);
  s.drawnCardId = null;

  const adv = () => (s.currentTurnIndex + s.direction + n) % n;

  switch (card.value) {
    case 'wild':
      s.currentColor = chosenColor!;
      s.currentTurnIndex = adv();
      s.log.push(`${name} played Wild → ${chosenColor}`);
      break;

    case 'wild4':
      s.currentColor = chosenColor!;
      s.drawPending += 4;
      s.currentTurnIndex = adv();
      s.log.push(`${name} played Wild +4 → ${chosenColor}`);
      break;

    case 'draw2':
      s.currentColor = card.color;
      s.drawPending += 2;
      s.currentTurnIndex = adv();
      s.log.push(`${name} played ${card.color} +2`);
      break;

    case 'skip': {
      s.currentColor = card.color;
      const skippedIdx = adv();
      const skippedName = s.playerNames.get(s.playerIds[skippedIdx]) ?? 'Unknown';
      s.currentTurnIndex = (skippedIdx + s.direction + n) % n;
      s.log.push(`${name} skipped ${skippedName}`);
      break;
    }

    case 'reverse':
      s.currentColor = card.color;
      s.direction = (s.direction * -1) as 1 | -1;
      if (n === 2) {
        // Acts as skip — current player goes again
        // currentTurnIndex stays the same
        s.log.push(`${name} played Reverse`);
      } else {
        s.currentTurnIndex = adv();
        s.log.push(`${name} played Reverse`);
      }
      break;

    default:
      s.currentColor = card.color;
      s.currentTurnIndex = adv();
      s.log.push(`${name} played ${card.color} ${card.value}`);
  }

  if (s.log.length > 8) s.log = s.log.slice(-8);
  return s;
}

// ─── Draw cards ───────────────────────────────────────────────────────────────

export function drawForPlayer(
  gs: InternalGameState,
  playerId: string
): InternalGameState {
  const s = cloneGS(gs);
  const name = s.playerNames.get(playerId) ?? 'Unknown';
  const n = s.playerIds.length;

  if (s.drawPending > 0) {
    const count = s.drawPending;
    s.drawPending = 0;
    pullCards(s, playerId, count);
    s.currentTurnIndex = (s.currentTurnIndex + s.direction + n) % n;
    s.drawnCardId = null;
    s.log.push(`${name} drew ${count} cards (penalty)`);
    if (s.log.length > 8) s.log = s.log.slice(-8);
    return s;
  }

  // Normal draw: 1 card
  pullCards(s, playerId, 1);
  const hand = s.hands.get(playerId)!;
  const drawn = hand[hand.length - 1];
  const top = s.discardPile[s.discardPile.length - 1];

  if (canPlayCard(drawn, top, s.currentColor, 0)) {
    s.drawnCardId = drawn.id;           // player may optionally play it
    s.log.push(`${name} drew a card`);
  } else {
    s.drawnCardId = null;
    s.currentTurnIndex = (s.currentTurnIndex + s.direction + n) % n;
    s.log.push(`${name} drew a card`);
  }

  if (s.log.length > 8) s.log = s.log.slice(-8);
  return s;
}

// ─── End turn (pass after drawing) ───────────────────────────────────────────

export function endTurnPass(
  gs: InternalGameState,
  playerId: string
): InternalGameState {
  const s = cloneGS(gs);
  const name = s.playerNames.get(playerId) ?? 'Unknown';
  const n = s.playerIds.length;
  s.drawnCardId = null;
  s.currentTurnIndex = (s.currentTurnIndex + s.direction + n) % n;
  s.log.push(`${name} passed`);
  if (s.log.length > 8) s.log = s.log.slice(-8);
  return s;
}

// ─── Win check ────────────────────────────────────────────────────────────────

export function checkWin(gs: InternalGameState): string | null {
  for (const id of gs.playerIds) {
    if ((gs.hands.get(id)?.length ?? 1) === 0) return id;
  }
  return null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pullCards(s: InternalGameState, playerId: string, count: number): void {
  const hand = s.hands.get(playerId)!;
  for (let i = 0; i < count; i++) {
    if (s.deck.length === 0) {
      if (s.discardPile.length <= 1) break;          // nothing left
      const top = s.discardPile[s.discardPile.length - 1];
      s.deck = shuffle(s.discardPile.slice(0, -1));
      s.discardPile = [top];
    }
    if (s.deck.length > 0) hand.push(s.deck.shift()!);
  }
}

export function cloneGS(gs: InternalGameState): InternalGameState {
  return {
    playerIds: [...gs.playerIds],
    playerNames: new Map(gs.playerNames),
    deck: [...gs.deck],
    hands: new Map(Array.from(gs.hands.entries()).map(([k, v]) => [k, [...v]])),
    discardPile: [...gs.discardPile],
    currentTurnIndex: gs.currentTurnIndex,
    direction: gs.direction,
    currentColor: gs.currentColor,
    drawPending: gs.drawPending,
    winnerId: gs.winnerId,
    log: [...gs.log],
    drawnCardId: gs.drawnCardId,
  };
}
