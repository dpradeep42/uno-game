import type { UnoCard } from '@shared/types';

interface CardProps {
  card?: UnoCard;
  faceDown?: boolean;
  playable?: boolean;
  highlighted?: boolean;
  small?: boolean;
  landing?: boolean;   // animate card landing on discard
  drawing?: boolean;   // animate card sliding into hand
  onClick?: () => void;
}

// Vivid gradients
const COLOR_BG: Record<string, string> = {
  red:    'from-red-400 via-red-500 to-rose-700',
  blue:   'from-blue-400 via-blue-500 to-indigo-700',
  green:  'from-emerald-400 via-green-500 to-teal-700',
  yellow: 'from-yellow-300 via-amber-400 to-orange-500',
  wild:   'from-gray-900 via-slate-800 to-gray-950',
};

// Colored glow shadows per colour
const COLOR_SHADOW: Record<string, string> = {
  red:    'shadow-red-500/60',
  blue:   'shadow-blue-500/60',
  green:  'shadow-emerald-500/60',
  yellow: 'shadow-amber-400/60',
  wild:   'shadow-purple-500/60',
};

const COLOR_RING: Record<string, string> = {
  red:    'ring-red-400',
  blue:   'ring-blue-400',
  green:  'ring-emerald-400',
  yellow: 'ring-yellow-300',
  wild:   'ring-purple-400',
};

function sym(value: string): string {
  switch (value) {
    case 'skip':    return '⊘';
    case 'reverse': return '⇄';
    case 'draw2':   return '+2';
    case 'wild':    return '★';
    case 'wild4':   return '+4';
    default:        return value;
  }
}

const WildQuarters = () => (
  <div className="w-9 h-9 rounded-full overflow-hidden grid grid-cols-2 shadow-inner">
    <div className="bg-red-500"   />
    <div className="bg-blue-500"  />
    <div className="bg-yellow-400"/>
    <div className="bg-green-500" />
  </div>
);

export default function Card({
  card, faceDown = false, playable = false, highlighted = false,
  small = false, landing = false, drawing = false, onClick,
}: CardProps) {
  const w   = small ? 'w-10 h-[3.5rem]' : 'w-[4.2rem] h-[6rem] sm:w-[4.6rem] sm:h-[6.5rem]';
  const r   = small ? 'rounded-lg'       : 'rounded-2xl';

  // ── Face-down ──────────────────────────────────────────────────────────────
  if (faceDown || !card) {
    return (
      <div
        className={`
          ${w} ${r} relative select-none card-transition card-shine
          bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-950
          border-2 border-white/10 shadow-lg
          flex items-center justify-center overflow-hidden
          ${onClick ? 'cursor-pointer hover:scale-105 hover:-translate-y-1' : ''}
        `}
        onClick={onClick}
      >
        <div className="absolute inset-[3px] rounded-xl border border-white/10
                        flex items-center justify-center overflow-hidden">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 6px)',
            }}
          />
        </div>
        <span className="relative z-10 text-white font-black text-base tracking-tight drop-shadow">
          UNO
        </span>
      </div>
    );
  }

  const bg     = COLOR_BG[card.color]     ?? COLOR_BG.wild;
  const shadow = COLOR_SHADOW[card.color] ?? COLOR_SHADOW.wild;
  const ring   = COLOR_RING[card.color]   ?? COLOR_RING.wild;
  const label  = sym(card.value);
  const isWild = card.color === 'wild';

  const glowCls      = playable   ? `ring-2 ${ring} animate-glow shadow-xl ${shadow}` : '';
  const highlightCls = highlighted ? `ring-2 ring-white shadow-2xl shadow-white/30 scale-105 -translate-y-3` : '';
  const dimCls       = !playable && !highlighted ? 'opacity-55 saturate-50 cursor-not-allowed' : '';
  const hoverCls     = (playable || highlighted) ? 'hover:-translate-y-4 hover:scale-110 cursor-pointer' : '';
  const landCls      = landing ? 'animate-cardLand' : '';
  const drawCls      = drawing ? 'animate-cardDraw' : '';

  return (
    <div
      className={`
        ${w} ${r} bg-gradient-to-br ${bg}
        relative select-none card-transition card-shine overflow-hidden
        border-2 border-white/25 shadow-lg
        flex items-center justify-center
        ${glowCls} ${highlightCls} ${dimCls} ${hoverCls} ${landCls} ${drawCls}
      `}
      onClick={(playable || highlighted) ? onClick : undefined}
      title={`${card.color} ${card.value}`}
    >
      {/* Inner border / frame */}
      <div className={`absolute inset-[3px] ${r === 'rounded-2xl' ? 'rounded-xl' : 'rounded-md'} border border-white/20 pointer-events-none`} />

      {/* Top-left label */}
      {!small && (
        <div className="absolute top-1.5 left-2 flex flex-col items-center leading-none z-10">
          {isWild
            ? <span className="text-[9px] font-black text-transparent bg-clip-text"
                    style={{ backgroundImage: 'linear-gradient(135deg,#ef4444,#f97316,#eab308,#22c55e,#3b82f6,#a855f7)' }}>★</span>
            : <span className="text-[10px] font-black text-white drop-shadow leading-none">{label}</span>
          }
        </div>
      )}

      {/* Center symbol inside white oval */}
      <div className="relative z-10 bg-white/90 rounded-full flex items-center justify-center shadow-inner"
           style={{ width: small ? 28 : 42, height: small ? 28 : 42 }}>
        {isWild
          ? <WildQuarters />
          : <span className={`font-black drop-shadow-sm ${
              card.color === 'yellow' ? 'text-amber-600' :
              card.color === 'red'    ? 'text-red-600'   :
              card.color === 'blue'   ? 'text-blue-700'  : 'text-green-700'
            } ${label.length > 2 ? (small ? 'text-[10px]' : 'text-sm') : (small ? 'text-base' : 'text-xl')}`}>
              {label}
            </span>
        }
      </div>

      {/* Bottom-right label (rotated) */}
      {!small && (
        <div className="absolute bottom-1.5 right-2 rotate-180 flex flex-col items-center leading-none z-10">
          {isWild
            ? <span className="text-[9px] font-black text-transparent bg-clip-text"
                    style={{ backgroundImage: 'linear-gradient(135deg,#ef4444,#f97316,#eab308,#22c55e,#3b82f6,#a855f7)' }}>★</span>
            : <span className="text-[10px] font-black text-white drop-shadow leading-none">{label}</span>
          }
        </div>
      )}
    </div>
  );
}
