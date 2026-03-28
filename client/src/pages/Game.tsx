import { useState, useEffect, useRef } from 'react';
import type { GameState, Color } from '@shared/types';
import socket from '../socket';
import { useTheme } from '../ThemeContext';
import OpponentPanel from '../components/OpponentPanel';
import HandArea from '../components/HandArea';
import DiscardPile from '../components/DiscardPile';
import ColorPicker from '../components/ColorPicker';

interface GameProps { gameState: GameState }

const CONFETTI = Array.from({ length: 18 }, (_, i) => ({
  color: ['bg-red-500','bg-blue-500','bg-green-500','bg-yellow-400','bg-purple-500','bg-pink-500'][i % 6],
  left:  `${5 + (i * 5.5) % 90}%`,
  delay: `${(i * 0.07).toFixed(2)}s`,
  size:  i % 3 === 0 ? 'w-3 h-3' : i % 3 === 1 ? 'w-2 h-4' : 'w-4 h-2',
}));

export default function Game({ gameState }: GameProps) {
  const { theme, toggleTheme } = useTheme();
  const [error, setError]          = useState('');
  const [pendingWildId, setPending] = useState<number | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const myId   = socket.id ?? '';

  const isMyTurn    = gameState.players[gameState.currentTurnIndex]?.id === myId;
  const myCardCount = gameState.myHand.length;
  const showUno     = isMyTurn && myCardCount === 2 && gameState.status === 'playing';
  const opponents   = gameState.players.filter(p => p.id !== myId);

  useEffect(() => {
    const fn = ({ message }: { message: string }) => {
      setError(message); setTimeout(() => setError(''), 3000);
    };
    socket.on('error', fn);
    return () => { socket.off('error', fn); };
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [gameState.log]);

  function playCard(cardId: number, chosenColor?: Color) {
    socket.emit('play_card', { cardId, chosenColor });
  }
  function colorPicked(color: Color) {
    if (pendingWildId === null) return;
    socket.emit('play_card', { cardId: pendingWildId, chosenColor: color });
    setPending(null);
  }

  // ── Win screen ──────────────────────────────────────────────────────────────
  if (gameState.status === 'finished' && gameState.winnerId) {
    const winner = gameState.players.find(p => p.id === gameState.winnerId);
    const iWon   = gameState.winnerId === myId;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-lg">
        {iWon && CONFETTI.map((c, i) => (
          <div key={i} className={`absolute top-0 ${c.size} ${c.color} rounded-sm animate-confetti`}
            style={{ left: c.left, animationDelay: c.delay, opacity: 0 }} />
        ))}
        <div className="glass rounded-3xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl space-y-4 animate-winPop">
          <div className="text-7xl leading-none">{iWon ? '🏆' : '🃏'}</div>
          <h2 className={`text-4xl font-black ${iWon ? 'text-yellow-400' : 'text-gray-900 dark:text-white'}`}>
            {iWon ? 'You Win!' : `${winner?.name ?? 'Someone'} Wins!`}
          </h2>
          <p className="text-gray-500 dark:text-white/50 text-sm">
            {iWon ? '🎉 Congratulations!' : 'Better luck next time!'}
          </p>
          {gameState.isHost ? (
            <button onClick={() => socket.emit('play_again')}
              className="w-full py-3.5 rounded-2xl font-black text-lg text-white transition-all active:scale-95
                         bg-gradient-to-r from-green-500 to-emerald-400 shadow-xl shadow-green-500/30
                         hover:shadow-green-500/50 hover:scale-[1.02]">
              ▶ Play Again
            </button>
          ) : (
            <p className="text-gray-400 dark:text-white/35 text-sm animate-pulse2">Waiting for host to restart…</p>
          )}
        </div>
      </div>
    );
  }

  const pausedPlayer = gameState.paused ? gameState.players.find(p => p.disconnected) : null;
  const dirArrow     = gameState.direction === 1 ? '↻' : '↺';

  return (
    <div className="flex flex-col h-screen select-none overflow-hidden">

      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 py-2 glass border-b border-black/5 dark:border-white/5 shrink-0">
        <span className="font-black text-xl tracking-tight">
          <span className="text-red-500">U</span>
          <span className="text-blue-500">N</span>
          <span className="text-green-500">O</span>
        </span>

        <div className="flex items-center gap-2">
          {isMyTurn && !gameState.paused ? (
            <span className="text-green-600 dark:text-green-400 text-xs font-black animate-pulse2
                             bg-green-500/10 border border-green-500/25 px-2.5 py-0.5 rounded-full">
              YOUR TURN
            </span>
          ) : (
            <span className="text-gray-400 dark:text-white/30 text-xs">
              {gameState.players[gameState.currentTurnIndex]?.name ?? '…'}&apos;s turn
            </span>
          )}
          <span className="text-gray-400 dark:text-white/30 text-base font-bold animate-float"
                style={{ animationDuration: '2s' }}>
            {dirArrow}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={toggleTheme}
            className="w-7 h-7 rounded-full glass flex items-center justify-center text-sm transition-all hover:scale-110"
          >{theme === 'dark' ? '☀️' : '🌙'}</button>
          <button
            onClick={() => { if (confirm('Leave game?')) socket.emit('leave_room'); }}
            className="text-gray-400 dark:text-white/30 hover:text-gray-600 dark:hover:text-white/60 text-xs font-mono transition-colors"
          >{gameState.roomCode}</button>
        </div>
      </div>

      {/* ── Disconnect banner ─────────────────────────────────────────────────── */}
      {gameState.paused && pausedPlayer && (
        <div className="bg-yellow-500/20 border-b border-yellow-500/25 px-3 py-1.5
                        text-center text-yellow-700 dark:text-yellow-300 text-xs font-semibold animate-pulse2 shrink-0">
          ⚡ {pausedPlayer.name} disconnected — reconnecting in 30s…
        </div>
      )}

      {/* ── Opponents ────────────────────────────────────────────────────────── */}
      <div className="flex gap-2 px-3 py-2 overflow-x-auto shrink-0 justify-center">
        {opponents.length === 0 ? (
          <p className="text-gray-400 dark:text-white/25 text-xs py-3">No opponents yet</p>
        ) : opponents.map(p => (
          <OpponentPanel
            key={p.id} player={p}
            isActive={gameState.players[gameState.currentTurnIndex]?.id === p.id}
          />
        ))}
      </div>

      {/* ── Center ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center gap-3 px-3 min-h-0">
        <DiscardPile
          discardTop={gameState.discardTop}
          currentColor={gameState.currentColor}
          onDrawClick={() => socket.emit('draw_card')}
          drawPending={gameState.drawPending}
          canDraw={isMyTurn && !gameState.paused && gameState.drawnCardId === null}
        />

        {/* Log */}
        <div ref={logRef} className="w-full max-w-xs h-14 overflow-y-auto px-2 space-y-0.5">
          {gameState.log.slice(-5).map((entry, i) => (
            <p key={i} className="text-gray-500 dark:text-white/35 text-[11px] text-center leading-snug truncate">
              {entry}
            </p>
          ))}
        </div>
      </div>

      {/* ── Error toast ───────────────────────────────────────────────────────── */}
      {error && (
        <div className="mx-3 mb-1 bg-red-500/10 border border-red-500/30 rounded-2xl
                        px-3 py-1.5 text-red-600 dark:text-red-300 text-xs text-center shrink-0 animate-fadeIn">
          ⚠ {error}
        </div>
      )}

      {/* ── Hand ─────────────────────────────────────────────────────────────── */}
      <div className="px-3 pb-1 shrink-0">
        <HandArea
          hand={gameState.myHand}
          discardTop={gameState.discardTop}
          currentColor={gameState.currentColor}
          drawPending={gameState.drawPending}
          isMyTurn={isMyTurn && !gameState.paused}
          drawnCardId={gameState.drawnCardId}
          onPlayCard={playCard}
          onNeedColor={id => setPending(id)}
        />
      </div>

      {/* ── Action row ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-3 px-3 pb-4 shrink-0">
        {isMyTurn && gameState.drawnCardId !== null && (
          <button onClick={() => socket.emit('end_turn')}
            className="px-5 py-2.5 rounded-2xl font-bold glass
                       text-gray-800 dark:text-white
                       hover:bg-black/5 dark:hover:bg-white/10
                       transition-all active:scale-90 border border-black/10 dark:border-white/10">
            Pass
          </button>
        )}
        {showUno && (
          <button onClick={() => socket.emit('call_uno')}
            className="px-7 py-3 rounded-2xl font-black text-xl text-white
                       bg-gradient-to-r from-red-500 via-yellow-400 to-green-500
                       shadow-xl hover:scale-110 active:scale-90 transition-all animate-glow">
            UNO!
          </button>
        )}
      </div>

      {pendingWildId !== null && (
        <ColorPicker onSelect={colorPicked} onCancel={() => setPending(null)} />
      )}
    </div>
  );
}
