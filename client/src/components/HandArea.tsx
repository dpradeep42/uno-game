import type { UnoCard, Color } from '@shared/types';
import { canPlayCard } from '../utils/canPlay';
import Card from './Card';

interface HandAreaProps {
  hand: UnoCard[];
  discardTop: UnoCard;
  currentColor: Color;
  drawPending: number;
  isMyTurn: boolean;
  drawnCardId: number | null;
  onPlayCard: (cardId: number, chosenColor?: Color) => void;
  onNeedColor: (cardId: number) => void;
}

export default function HandArea({
  hand,
  discardTop,
  currentColor,
  drawPending,
  isMyTurn,
  drawnCardId,
  onPlayCard,
  onNeedColor,
}: HandAreaProps) {
  function handleCardClick(card: UnoCard) {
    if (!isMyTurn) return;
    const playable = canPlayCard(card, discardTop, currentColor, drawPending);
    if (!playable) return;
    // If drawnCardId is set, only allow playing that card
    if (drawnCardId !== null && card.id !== drawnCardId) return;

    if (card.value === 'wild' || card.value === 'wild4') {
      onNeedColor(card.id);
    } else {
      onPlayCard(card.id);
    }
  }

  // Spread cards with overlap on small screens
  const count = hand.length;
  const maxOffset = Math.min(40, count > 1 ? 320 / count : 0);

  return (
    <div className="w-full flex flex-col items-center gap-2">
      <div
        className="relative flex items-end justify-center"
        style={{ height: '7rem', minWidth: '4rem', width: '100%', maxWidth: '100vw' }}
      >
        {hand.map((card, i) => {
          const isHighlighted = card.id === drawnCardId;
          const playable = isMyTurn
            ? (drawnCardId !== null
                ? card.id === drawnCardId && canPlayCard(card, discardTop, currentColor, 0)
                : canPlayCard(card, discardTop, currentColor, drawPending))
            : false;

          // Fan layout
          const offset = count > 1
            ? (i - (count - 1) / 2) * maxOffset
            : 0;
          const rot = count > 1 ? (i - (count - 1) / 2) * 2 : 0;

          return (
            <div
              key={card.id}
              className="absolute bottom-0 card-transition"
              style={{
                transform: `translateX(${offset}px) rotate(${rot}deg)`,
                zIndex: i,
              }}
            >
              <Card
                card={card}
                playable={playable}
                highlighted={isHighlighted}
                onClick={() => handleCardClick(card)}
              />
            </div>
          );
        })}
      </div>
      <p className="text-xs text-white/40">
        {count} card{count !== 1 ? 's' : ''} in hand
      </p>
    </div>
  );
}
