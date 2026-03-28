import { useState, useEffect, useRef } from 'react';
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
  hand, discardTop, currentColor, drawPending,
  isMyTurn, drawnCardId, onPlayCard, onNeedColor,
}: HandAreaProps) {
  const prevDrawnId = useRef<number | null>(null);
  const [animDrawId, setAnimDrawId] = useState<number | null>(null);

  // Trigger draw animation when a new card is drawn
  useEffect(() => {
    if (drawnCardId !== null && drawnCardId !== prevDrawnId.current) {
      setAnimDrawId(drawnCardId);
      const t = setTimeout(() => setAnimDrawId(null), 500);
      prevDrawnId.current = drawnCardId;
      return () => clearTimeout(t);
    }
    if (drawnCardId === null) prevDrawnId.current = null;
  }, [drawnCardId]);

  function handleCardClick(card: UnoCard) {
    if (!isMyTurn) return;
    const ok = canPlayCard(card, discardTop, currentColor, drawPending);
    if (!ok) return;
    if (drawnCardId !== null && card.id !== drawnCardId) return;

    if (card.value === 'wild' || card.value === 'wild4') {
      onNeedColor(card.id);
    } else {
      onPlayCard(card.id);
    }
  }

  const count     = hand.length;
  // Fan: max spread 44px per card, capped so all cards fit in ~90vw
  const maxSpread = Math.min(44, count > 1 ? Math.min(44, (window.innerWidth * 0.82) / count) : 0);
  const maxRot    = Math.min(3, 18 / count);          // tighter rotation for many cards

  return (
    <div className="w-full flex flex-col items-center gap-1">
      <div
        className="relative flex items-end justify-center"
        style={{ height: '7.5rem', width: '100%' }}
      >
        {hand.map((card, i) => {
          const isHighlighted = card.id === drawnCardId;
          const drawing       = card.id === animDrawId;

          const playable = isMyTurn
            ? drawnCardId !== null
              ? card.id === drawnCardId && canPlayCard(card, discardTop, currentColor, 0)
              : canPlayCard(card, discardTop, currentColor, drawPending)
            : false;

          const mid    = (count - 1) / 2;
          const offset = (i - mid) * maxSpread;
          const rot    = (i - mid) * maxRot;
          // Arc: cards near center sit lower
          const arc    = -Math.abs(i - mid) * 3;

          return (
            <div
              key={card.id}
              className="absolute bottom-0 card-transition"
              style={{
                transform:     `translateX(${offset}px) translateY(${arc}px) rotate(${rot}deg)`,
                zIndex:        i,
                transformOrigin: 'bottom center',
              }}
            >
              <Card
                card={card}
                playable={playable}
                highlighted={isHighlighted}
                drawing={drawing}
                onClick={() => handleCardClick(card)}
              />
            </div>
          );
        })}
      </div>

      <p className="text-xs text-white/30 dark:text-white/30">
        {count} card{count !== 1 ? 's' : ''} in hand
      </p>
    </div>
  );
}
