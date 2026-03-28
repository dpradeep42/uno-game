import { useState, useEffect, useRef } from 'react';
import type { GameState, Color } from '@shared/types';
import socket from '../socket';
import OpponentPanel from '../components/OpponentPanel';
import HandArea from '../components/HandArea';
import DiscardPile from '../components/DiscardPile';
import ColorPicker from '../components/ColorPicker';

interface GameProps {
  gameState: GameState;
}

export default function Game({ gameState }: GameProps) {
  const [error, setError] = useState('');
  const [pendingWildId, setPendingWildId] = useState<number | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const myId = socket.id ?? '';

  const myPlayerIndex = gameState.players.findIndex(p => p.id === myId);
  const isMyTurn = gameState.players[gameState.currentTurnIndex]?.id === myId;
  const myCardCount = gameState.myHand.length;
  const showUnoButton =
    isMyTurn &&
    myCardCount === 2 &&
    gameState.status === 'playing';

  const opponents = gameState.players.filter(p => p.id !== myId);

  useEffect(() => {
    const onError = ({ message }: { message: string }) => {
      setError(message);
      setTimeout(() => setError(''), 3000);
    };
    socket.on('error', onError);
    return () => { socket.off('error', onError); };
  }, []);

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [gameState.log]);

  function handlePlayCard(cardId: number, chosenColor?: Color) {
    socket.emit('play_card', { cardId, chosenColor });
  }

  function handleNeedColor(cardId: number) {
    setPendingWildId(cardId);
  }

  function handleColorPick(color: Color) {
    if (pendingWildId === null) return;
    socket.emit('play_card', { cardId: pendingWildId, chosenColor: color });
    setPendingWildId(null);
  }

  function handleDrawCard() {
    socket.emit('draw_card');
  }

  function handlePass() {
    socket.emit('end_turn');
  }

  // ── Win screen ──────────────────────────────────────────────────────────────
  if (gameState.status === 'finished' && gameState.winnerId) {
    const winner = gameState.players.find(p => p.id === gameState.winnerId);
    const iWon = gameState.winnerId === myId;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="bg-gray-800 rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl space-y-4 animate-slideUp">
          <div className="text-6xl">{iWon ? '🏆' : '🃏'}</div>
          <h2 className={`text-3xl font-black ${iWon ? 'text-yellow-400' : 'text-white'}`}>
            {iWon ? 'You Win!' : `${winner?.name ?? 'Someone'} Wins!`}
          </h2>
          <p className="text-white/50 text-sm">
            {iWon ? 'Congratulations!' : 'Better luck next time!'}
          </p>
          {gameState.isHost ? (
            <button
              onClick={() => socket.emit('play_again')}
              className="w-full py-3 rounded-xl font-bold text-lg bg-green-500 hover:bg-green-400 active:scale-95 text-white transition-all shadow-lg mt-2"
            >
              Play Again
            </button>
          ) : (
            <p className="text-white/40 text-sm animate-pulse2">Waiting for host to restart…</p>
          )}
        </div>
      </div>
    );
  }

  // ── Paused / reconnect banner ───────────────────────────────────────────────
  const pausedPlayer = gameState.paused
    ? gameState.players.find(p => p.disconnected)
    : null;

  const directionArrow = gameState.direction === 1 ? '→' : '←';

  return (
    <div className="flex flex-col h-screen bg-gray-900 select-none overflow-hidden">
      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-800/80 backdrop-blur-sm border-b border-white/5 shrink-0">
        <span className="text-white font-black text-xl">
          <span className="text-red-500">U</span>
          <span className="text-blue-500">N</span>
          <span className="text-green-500">O</span>
        </span>

        <div className="flex items-center gap-2">
          {isMyTurn && !gameState.paused && (
            <span className="text-green-400 text-xs font-bold animate-pulse2 bg-green-400/10 px-2 py-0.5 rounded-full">
              YOUR TURN
            </span>
          )}
          <span className="text-white/30 text-sm">{directionArrow}</span>
        </div>

        <button
          onClick={() => {
            if (confirm('Leave game?')) socket.emit('leave_room');
          }}
          className="text-white/30 hover:text-white/60 text-xs transition-colors"
        >
          {gameState.roomCode}
        </button>
      </div>

      {/* ── Pause banner ─────────────────────────────────────────────────────── */}
      {gameState.paused && pausedPlayer && (
        <div className="bg-yellow-500/20 border-b border-yellow-500/30 px-4 py-2 text-center text-yellow-300 text-xs font-medium animate-pulse2">
          {pausedPlayer.name} disconnected — waiting 30s for reconnect…
        </div>
      )}

      {/* ── Opponents row ────────────────────────────────────────────────────── */}
      <div className="flex gap-2 px-3 py-2 overflow-x-auto shrink-0 justify-center">
        {opponents.length === 0 ? (
          <p className="text-white/30 text-xs py-2">No opponents yet</p>
        ) : (
          opponents.map(p => (
            <OpponentPanel
              key={p.id}
              player={p}
              isActive={gameState.players[gameState.currentTurnIndex]?.id === p.id}
            />
          ))
        )}
      </div>

      {/* ── Center play area ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center gap-3 px-3 min-h-0">
        <DiscardPile
          discardTop={gameState.discardTop}
          currentColor={gameState.currentColor}
          onDrawClick={handleDrawCard}
          drawPending={gameState.drawPending}
          canDraw={isMyTurn && !gameState.paused && gameState.drawnCardId === null}
        />

        {/* Game log */}
        <div
          ref={logRef}
          className="w-full max-w-xs h-16 overflow-y-auto space-y-0.5 px-2"
        >
          {gameState.log.slice(-5).map((entry, i) => (
            <p key={i} className="text-white/40 text-xs text-center leading-tight truncate">
              {entry}
            </p>
          ))}
        </div>
      </div>

      {/* ── Error toast ──────────────────────────────────────────────────────── */}
      {error && (
        <div className="mx-3 mb-1 bg-red-500/20 border border-red-500/40 rounded-xl px-3 py-1.5 text-red-300 text-xs text-center shrink-0">
          {error}
        </div>
      )}

      {/* ── Hand area ─────────────────────────────────────────────────────────── */}
      <div className="px-3 pb-2 shrink-0">
        <HandArea
          hand={gameState.myHand}
          discardTop={gameState.discardTop}
          currentColor={gameState.currentColor}
          drawPending={gameState.drawPending}
          isMyTurn={isMyTurn && !gameState.paused}
          drawnCardId={gameState.drawnCardId}
          onPlayCard={handlePlayCard}
          onNeedColor={handleNeedColor}
        />
      </div>

      {/* ── Action row ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-3 px-3 pb-3 shrink-0">
        {/* Pass button (only when drawnCardId is set) */}
        {isMyTurn && gameState.drawnCardId !== null && (
          <button
            onClick={handlePass}
            className="px-5 py-2.5 rounded-xl font-bold bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95"
          >
            Pass
          </button>
        )}

        {/* UNO button */}
        {showUnoButton && (
          <button
            onClick={() => socket.emit('call_uno')}
            className="
              px-6 py-2.5 rounded-xl font-black text-xl
              bg-gradient-to-r from-red-500 via-yellow-400 to-green-500
              text-white shadow-lg hover:scale-105 active:scale-95 transition-all
              animate-glow
            "
          >
            UNO!
          </button>
        )}

        {/* Turn indicator */}
        {!isMyTurn && (
          <p className="text-white/30 text-sm">
            {gameState.players[gameState.currentTurnIndex]?.name ?? '…'}&apos;s turn
          </p>
        )}
      </div>

      {/* ── Color picker modal ────────────────────────────────────────────────── */}
      {pendingWildId !== null && (
        <ColorPicker
          onSelect={handleColorPick}
          onCancel={() => setPendingWildId(null)}
        />
      )}
    </div>
  );
}
