import type { Player } from '@shared/types';
import Card from './Card';

interface OpponentPanelProps {
  player: Player;
  isActive: boolean;
}

export default function OpponentPanel({ player, isActive }: OpponentPanelProps) {
  const showUno = player.cardCount === 1;

  return (
    <div
      className={`
        flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all
        ${isActive
          ? 'bg-green-500/20 ring-2 ring-green-400 scale-105'
          : 'bg-white/5'
        }
        ${player.disconnected ? 'opacity-50' : ''}
      `}
    >
      {/* Name + badges */}
      <div className="flex items-center gap-1.5">
        {isActive && (
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
        )}
        <span className={`text-xs font-semibold truncate max-w-[72px] ${isActive ? 'text-green-300' : 'text-white/80'}`}>
          {player.name}
        </span>
        {showUno && (
          <span className="text-xs font-black text-yellow-300 animate-pulse2 bg-yellow-900/40 px-1 rounded">
            UNO!
          </span>
        )}
        {player.disconnected && (
          <span className="text-xs text-red-400">●</span>
        )}
      </div>

      {/* Card stack visualization */}
      <div className="relative flex items-center justify-center h-14 w-12">
        {player.cardCount === 0 ? (
          <span className="text-white/30 text-xs">0</span>
        ) : (
          Array.from({ length: Math.min(player.cardCount, 5) }).map((_, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                transform: `translateX(${(i - Math.min(player.cardCount, 5) / 2) * 4}px) rotate(${(i - 2) * 3}deg)`,
                zIndex: i,
              }}
            >
              <Card faceDown small />
            </div>
          ))
        )}
      </div>

      <span className="text-xs text-white/50">
        {player.cardCount} card{player.cardCount !== 1 ? 's' : ''}
      </span>
    </div>
  );
}
