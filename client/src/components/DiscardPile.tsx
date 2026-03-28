import { useState, useEffect, useRef } from 'react';
import type { UnoCard, Color } from '@shared/types';
import Card from './Card';

const COLOR_HEX: Record<Color, string> = {
  red: '#ef4444', blue: '#3b82f6', green: '#22c55e', yellow: '#eab308', wild: '#a855f7',
};
const COLOR_RING: Record<Color, string> = {
  red: 'ring-red-500', blue: 'ring-blue-500', green: 'ring-green-500',
  yellow: 'ring-yellow-400', wild: 'ring-purple-500',
};

interface DiscardPileProps {
  discardTop: UnoCard; currentColor: Color;
  onDrawClick: () => void; drawPending: number; canDraw: boolean;
}

export default function DiscardPile({ discardTop, currentColor, onDrawClick, drawPending, canDraw }: DiscardPileProps) {
  const prevId = useRef(-1);
  const [landing,     setLanding]     = useState(false);
  const [deckShaking, setDeckShaking] = useState(false);

  useEffect(() => {
    if (prevId.current !== -1 && prevId.current !== discardTop.id) {
      setLanding(true);
      const t = setTimeout(() => setLanding(false), 500);
      return () => clearTimeout(t);
    }
    prevId.current = discardTop.id;
  }, [discardTop.id]);

  function handleDraw() {
    if (!canDraw) return;
    setDeckShaking(true);
    setTimeout(() => setDeckShaking(false), 500);
    onDrawClick();
  }

  const ring = COLOR_RING[currentColor];

  return (
    <div className="flex items-center gap-8 justify-center">
      {/* Draw pile */}
      <div className="flex flex-col items-center gap-2">
        <div className={`relative cursor-pointer ${!canDraw ? 'opacity-40 cursor-not-allowed' : ''} ${deckShaking ? 'animate-deckShake' : ''}`}
          onClick={handleDraw}>
          {[2,1,0].map(o => (
            <div key={o} className="absolute" style={{ top: -o*2, left: o*1, zIndex: o === 0 ? 1 : 0 }}>
              <Card faceDown />
            </div>
          ))}
          <div className="relative z-10">
            <Card faceDown onClick={canDraw ? handleDraw : undefined} />
          </div>
          {canDraw && <div className="absolute inset-0 rounded-2xl animate-turnFlash pointer-events-none" />}
        </div>
        <span className={`text-xs font-bold ${drawPending > 0 ? 'text-red-500' : 'text-gray-400 dark:text-white/40'}`}>
          {drawPending > 0 ? `Draw ${drawPending}` : 'Draw pile'}
        </span>
      </div>

      {/* Discard pile */}
      <div className="flex flex-col items-center gap-2">
        <div className={`rounded-2xl transition-all duration-300 ${discardTop.color === 'wild' ? `ring-4 ${ring}` : ''}`}>
          <Card card={discardTop} landing={landing} />
        </div>
        {discardTop.color === 'wild' ? (
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full shadow-lg"
              style={{ backgroundColor: COLOR_HEX[currentColor], boxShadow: `0 0 8px ${COLOR_HEX[currentColor]}` }} />
            <span className="text-xs font-semibold capitalize" style={{ color: COLOR_HEX[currentColor] }}>
              {currentColor}
            </span>
          </div>
        ) : (
          <span className="text-xs text-gray-400 dark:text-white/40">Discard</span>
        )}
      </div>
    </div>
  );
}
