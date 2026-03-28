import type { UnoCard, Color } from '@shared/types';
import Card from './Card';

const COLOR_RING: Record<Color, string> = {
  red: 'ring-red-500',
  blue: 'ring-blue-500',
  green: 'ring-green-500',
  yellow: 'ring-yellow-400',
  wild: 'ring-purple-500',
};

interface DiscardPileProps {
  discardTop: UnoCard;
  currentColor: Color;
  onDrawClick: () => void;
  drawPending: number;
  canDraw: boolean;
}

export default function DiscardPile({
  discardTop,
  currentColor,
  onDrawClick,
  drawPending,
  canDraw,
}: DiscardPileProps) {
  const ring = COLOR_RING[currentColor];

  return (
    <div className="flex items-center gap-6 justify-center">
      {/* Draw pile */}
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={onDrawClick}
          disabled={!canDraw}
          className={`
            focus:outline-none rounded-xl transition-all
            ${canDraw
              ? 'hover:scale-105 hover:-translate-y-1 cursor-pointer'
              : 'cursor-not-allowed opacity-50'
            }
          `}
        >
          <Card faceDown />
        </button>
        <span className="text-xs text-white/50">
          {drawPending > 0 ? (
            <span className="text-red-400 font-bold">Draw {drawPending}</span>
          ) : (
            'Draw'
          )}
        </span>
      </div>

      {/* Discard pile */}
      <div className="flex flex-col items-center gap-1">
        <div
          className={`
            rounded-xl p-0.5 transition-all
            ${discardTop.color === 'wild' ? `ring-4 ${ring}` : ''}
          `}
        >
          <Card card={discardTop} />
        </div>
        {discardTop.color === 'wild' && (
          <span className={`text-xs font-semibold capitalize`} style={{ color: currentColorHex(currentColor) }}>
            {currentColor}
          </span>
        )}
        {discardTop.color !== 'wild' && (
          <span className="text-xs text-white/50">Discard</span>
        )}
      </div>
    </div>
  );
}

function currentColorHex(color: Color): string {
  const map: Record<Color, string> = {
    red: '#ef4444',
    blue: '#3b82f6',
    green: '#22c55e',
    yellow: '#eab308',
    wild: '#a855f7',
  };
  return map[color];
}
