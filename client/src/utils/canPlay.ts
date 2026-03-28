import type { UnoCard, Color } from '@shared/types';

/** Mirror of server-side canPlayCard — used only for UI hints, never for enforcement */
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
