import { useState, useEffect } from 'react';
import type { GameState } from '@shared/types';
import socket from '../socket';

interface LobbyProps {
  gameState?: GameState;
}

export default function Lobby({ gameState }: LobbyProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [view, setView] = useState<'home' | 'join'>('home');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onError = ({ message }: { message: string }) => setError(message);
    socket.on('error', onError);
    return () => { socket.off('error', onError); };
  }, []);

  function createGame() {
    if (!name.trim()) { setError('Enter your name first'); return; }
    setError('');
    socket.emit('create_room', { name: name.trim() });
  }

  function joinGame() {
    if (!name.trim()) { setError('Enter your name first'); return; }
    if (!code.trim()) { setError('Enter a room code'); return; }
    setError('');
    socket.emit('join_room', { code: code.trim().toUpperCase(), name: name.trim() });
  }

  function copyCode() {
    if (!gameState) return;
    navigator.clipboard.writeText(gameState.roomCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── Waiting room ────────────────────────────────────────────────────────────
  if (gameState) {
    const canStart = gameState.isHost && gameState.players.length >= 2;

    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 p-4">
        <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-6">
          {/* Logo */}
          <div className="text-center">
            <h1 className="text-5xl font-black text-white tracking-tight">
              <span className="text-red-500">U</span>
              <span className="text-blue-500">N</span>
              <span className="text-green-500">O</span>
            </h1>
            <p className="text-white/50 text-sm mt-1">Waiting for players…</p>
          </div>

          {/* Room code */}
          <div className="text-center space-y-1">
            <p className="text-white/50 text-xs uppercase tracking-widest">Room Code</p>
            <button
              onClick={copyCode}
              className="
                text-4xl font-black tracking-[0.25em] text-white
                bg-white/10 hover:bg-white/20 active:scale-95
                px-6 py-3 rounded-xl transition-all w-full
                relative
              "
            >
              {gameState.roomCode}
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/40 font-normal tracking-normal">
                {copied ? '✓ Copied!' : 'tap to copy'}
              </span>
            </button>
          </div>

          {/* Player list */}
          <div className="space-y-2">
            <p className="text-white/50 text-xs uppercase tracking-widest">
              Players ({gameState.players.length}/6)
            </p>
            <div className="space-y-1.5">
              {gameState.players.map(p => (
                <div
                  key={p.id}
                  className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2"
                >
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-white font-medium">{p.name}</span>
                  {p.id === gameState.players.find(x => x.id === socket.id)?.id && (
                    <span className="text-white/40 text-xs ml-auto">you</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Status */}
          <p className="text-center text-white/40 text-sm animate-pulse2">
            {gameState.players.length < 2
              ? 'Waiting for at least 1 more player…'
              : gameState.isHost
              ? 'Ready to start!'
              : 'Waiting for host to start the game…'}
          </p>

          {/* Start button (host only) */}
          {gameState.isHost && (
            <button
              onClick={() => socket.emit('start_game')}
              disabled={!canStart}
              className={`
                w-full py-3 rounded-xl font-bold text-lg transition-all
                ${canStart
                  ? 'bg-green-500 hover:bg-green-400 active:scale-95 text-white shadow-lg shadow-green-500/30'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'}
              `}
            >
              Start Game
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Home / Join screen ──────────────────────────────────────────────────────
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 p-4">
      <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-6">
        {/* Logo */}
        <div className="text-center space-y-1">
          <h1 className="text-6xl font-black text-white tracking-tight">
            <span className="text-red-500">U</span>
            <span className="text-blue-500">N</span>
            <span className="text-green-500">O</span>
          </h1>
          <p className="text-white/40 text-sm">Multiplayer Card Game</p>
        </div>

        {/* Name input */}
        <div className="space-y-1">
          <label className="text-xs text-white/50 uppercase tracking-widest">Your Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') view === 'join' ? joinGame() : createGame(); }}
            placeholder="Enter your name…"
            maxLength={20}
            className="
              w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3
              text-white placeholder-white/30 outline-none
              focus:border-white/30 focus:bg-white/15 transition
            "
          />
        </div>

        {view === 'home' ? (
          <div className="space-y-3">
            <button
              onClick={createGame}
              className="w-full py-3 rounded-xl font-bold text-lg bg-red-500 hover:bg-red-400 active:scale-95 text-white transition-all shadow-lg"
            >
              Create Game
            </button>
            <button
              onClick={() => setView('join')}
              className="w-full py-3 rounded-xl font-bold text-lg bg-white/10 hover:bg-white/20 active:scale-95 text-white transition-all"
            >
              Join Game
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs text-white/50 uppercase tracking-widest">Room Code</label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                onKeyDown={e => { if (e.key === 'Enter') joinGame(); }}
                placeholder="Enter 6-char code…"
                maxLength={6}
                className="
                  w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3
                  text-white placeholder-white/30 outline-none
                  focus:border-white/30 focus:bg-white/15 transition
                  text-center text-2xl font-bold tracking-[0.3em]
                "
              />
            </div>
            <button
              onClick={joinGame}
              className="w-full py-3 rounded-xl font-bold text-lg bg-blue-500 hover:bg-blue-400 active:scale-95 text-white transition-all shadow-lg"
            >
              Join Game
            </button>
            <button
              onClick={() => { setView('home'); setError(''); }}
              className="w-full py-2 text-white/40 hover:text-white/70 text-sm transition-colors"
            >
              ← Back
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-500/20 border border-red-500/40 rounded-xl px-4 py-2 text-red-300 text-sm text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
