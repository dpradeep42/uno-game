import type { Player } from '@shared/types';
import Card from './Card';

interface OpponentPanelProps {
  player: Player;
  isActive: boolean;
}

export default function OpponentPanel({ player, isActive }: OpponentPanelProps) {
  const uno = player.cardCount === 1;

  return (
    <div className={`
      flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-2xl transition-all duration-300
      ${isActive
        ? 'glass ring-2 ring-green-400/70 scale-105 shadow-lg shadow-green-500/20'
        : 'glass'}
      ${player.disconnected ? 'opacity-40 grayscale' : ''}
    `}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black
        ${isActive ? 'bg-green-500 text-white shadow-md shadow-green-500/50' : 'bg-black/10 dark:bg-white/15 text-gray-700 dark:text-white/80'}`}>
        {player.name[0].toUpperCase()}
      </div>

      {/* Name */}
      <div className="flex flex-col items-center gap-0.5">
        <div className="flex items-center gap-1">
          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
          <span className={`text-[11px] font-bold truncate max-w-[68px]
            ${isActive ? 'text-green-600 dark:text-green-300' : 'text-gray-700 dark:text-white/75'}`}>
            {player.name}
          </span>
          {player.disconnected && <span className="text-[10px] text-red-500">⚡</span>}
        </div>
        {uno && (
          <span className="text-[10px] font-black text-yellow-600 dark:text-yellow-300 animate-pulse2
                           bg-yellow-400/20 px-1.5 py-0.5 rounded-full border border-yellow-500/30">
            UNO!
          </span>
        )}
      </div>

      {/* Card fan */}
      <div className="relative flex items-center justify-center" style={{ height: 52, width: 48 }}>
        {player.cardCount === 0 ? (
          <span className="text-gray-400 dark:text-white/25 text-xs">empty</span>
        ) : (
          Array.from({ length: Math.min(player.cardCount, 6) }).map((_, i, arr) => (
            <div key={i} className="absolute"
              style={{
                transform: `translateX(${(i - arr.length / 2) * 5}px) rotate(${(i - arr.length / 2) * 4}deg)`,
                zIndex: i,
              }}>
              <Card faceDown small />
            </div>
          ))
        )}
      </div>

      <span className="text-[10px] text-gray-500 dark:text-white/40">
        {player.cardCount} card{player.cardCount !== 1 ? 's' : ''}
      </span>
    </div>
  );
}
