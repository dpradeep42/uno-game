import type { UnoCard } from '@shared/types';

interface CardProps {
  card?: UnoCard;
  faceDown?: boolean;
  playable?: boolean;
  highlighted?: boolean;  // drawn card that may be played
  small?: boolean;
  onClick?: () => void;
}

const COLOR_BG: Record<string, string> = {
  red: 'bg-gradient-to-br from-red-500 to-red-700',
  blue: 'bg-gradient-to-br from-blue-500 to-blue-700',
  green: 'bg-gradient-to-br from-green-500 to-green-700',
  yellow: 'bg-gradient-to-br from-yellow-400 to-yellow-600',
  wild: 'bg-gradient-to-br from-gray-800 to-gray-950',
};

const COLOR_RING: Record<string, string> = {
  red: 'ring-red-400',
  blue: 'ring-blue-400',
  green: 'ring-green-400',
  yellow: 'ring-yellow-400',
  wild: 'ring-purple-400',
};

function valueSymbol(value: string): string {
  switch (value) {
    case 'skip':    return '⊘';
    case 'reverse': return '⇄';
    case 'draw2':   return '+2';
    case 'wild':    return '★';
    case 'wild4':   return '★+4';
    default:        return value;
  }
}

// Rainbow gradient for wild label
const WildCorner = ({ small }: { small?: boolean }) => (
  <span
    className={`font-black leading-none ${small ? 'text-[8px]' : 'text-[10px]'}`}
    style={{
      background: 'linear-gradient(135deg, #ef4444, #f97316, #eab308, #22c55e, #3b82f6, #a855f7)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    }}
  >
    ★
  </span>
);

export default function Card({
  card,
  faceDown = false,
  playable = false,
  highlighted = false,
  small = false,
  onClick,
}: CardProps) {
  const w = small ? 'w-10 h-14' : 'w-16 h-24 sm:w-18 sm:h-28';

  if (faceDown || !card) {
    return (
      <div
        className={`
          ${w} rounded-xl relative select-none cursor-default card-transition
          bg-gradient-to-br from-gray-700 to-gray-900
          border-2 border-white/10
          flex items-center justify-center overflow-hidden
        `}
        style={onClick ? { cursor: 'pointer' } : {}}
        onClick={onClick}
      >
        {/* Back pattern */}
        <div
          className="absolute inset-1 rounded-lg opacity-30"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, #ffffff 0, #ffffff 1px, transparent 0, transparent 50%)',
            backgroundSize: '6px 6px',
          }}
        />
        <span className="relative text-white font-black text-xl z-10">UNO</span>
      </div>
    );
  }

  const bg = COLOR_BG[card.color] ?? COLOR_BG.wild;
  const ring = COLOR_RING[card.color] ?? COLOR_RING.wild;
  const sym = valueSymbol(card.value);
  const isWild = card.color === 'wild';

  const glowClass = playable ? `ring-2 ${ring} animate-glow` : '';
  const highlightClass = highlighted ? 'ring-2 ring-white scale-105 -translate-y-2' : '';
  const dimClass = !playable && !highlighted ? 'opacity-50 cursor-not-allowed' : '';
  const hoverClass = playable || highlighted ? 'hover:-translate-y-3 hover:scale-105 cursor-pointer' : '';

  return (
    <div
      className={`
        ${w} ${bg} rounded-xl relative select-none card-transition
        border-2 border-white/20 shadow-lg
        flex items-center justify-center
        ${glowClass} ${highlightClass} ${dimClass} ${hoverClass}
      `}
      onClick={playable || highlighted ? onClick : undefined}
      title={`${card.color} ${card.value}`}
    >
      {/* Top-left corner */}
      <div className={`absolute top-1 left-1.5 flex flex-col items-center leading-none ${small ? 'hidden' : ''}`}>
        {isWild ? (
          <WildCorner small={small} />
        ) : (
          <span className="text-white font-black text-[10px] leading-none drop-shadow">
            {sym}
          </span>
        )}
      </div>

      {/* Center */}
      <div className="relative z-10">
        {isWild ? (
          <div className="w-8 h-8 rounded-full overflow-hidden shadow-inner flex items-center justify-center">
            <span
              className="text-xl font-black"
              style={{
                background:
                  'linear-gradient(135deg, #ef4444 25%, #3b82f6 25%, #3b82f6 50%, #22c55e 50%, #22c55e 75%, #eab308 75%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {sym}
            </span>
          </div>
        ) : (
          <div className="bg-white/20 rounded-full w-10 h-10 flex items-center justify-center shadow-inner">
            <span className={`text-white font-black drop-shadow ${sym.length > 2 ? 'text-sm' : 'text-xl'}`}>
              {sym}
            </span>
          </div>
        )}
      </div>

      {/* Bottom-right corner (rotated) */}
      <div className={`absolute bottom-1 right-1.5 rotate-180 flex flex-col items-center leading-none ${small ? 'hidden' : ''}`}>
        {isWild ? (
          <WildCorner small={small} />
        ) : (
          <span className="text-white font-black text-[10px] leading-none drop-shadow">
            {sym}
          </span>
        )}
      </div>
    </div>
  );
}
