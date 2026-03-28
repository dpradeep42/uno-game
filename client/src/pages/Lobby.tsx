import { useState, useEffect } from 'react';
import type { GameState } from '@shared/types';
import socket from '../socket';
import { useTheme } from '../ThemeContext';

interface LobbyProps { gameState?: GameState }

function ThemeBtn() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="absolute top-4 right-4 w-9 h-9 rounded-full glass flex items-center justify-center text-lg transition-all hover:scale-110 active:scale-90"
      title="Toggle theme"
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}

export default function Lobby({ gameState }: LobbyProps) {
  const [name, setName]   = useState('');
  const [code, setCode]   = useState('');
  const [view, setView]   = useState<'home' | 'join'>('home');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fn = ({ message }: { message: string }) => setError(message);
    socket.on('error', fn);
    return () => { socket.off('error', fn); };
  }, []);

  function create() {
    if (!name.trim()) { setError('Enter your name first'); return; }
    setError(''); socket.emit('create_room', { name: name.trim() });
  }
  function join() {
    if (!name.trim()) { setError('Enter your name first'); return; }
    if (!code.trim()) { setError('Enter a room code'); return; }
    setError(''); socket.emit('join_room', { code: code.trim().toUpperCase(), name: name.trim() });
  }
  function copyCode() {
    if (!gameState) return;
    navigator.clipboard.writeText(gameState.roomCode).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  // ── Waiting room ────────────────────────────────────────────────────────────
  if (gameState) {
    const canStart = gameState.isHost && gameState.players.length >= 2;
    return (
      <div className="relative flex items-center justify-center min-h-screen p-4">
        <ThemeBtn />
        <div className="glass rounded-3xl p-7 w-full max-w-md shadow-2xl space-y-5 animate-fadeIn">
          {/* Logo */}
          <div className="text-center">
            <h1 className="text-5xl font-black tracking-tight">
              <span className="text-red-500 drop-shadow-lg">U</span>
              <span className="text-blue-500 drop-shadow-lg">N</span>
              <span className="text-green-500 drop-shadow-lg">O</span>
            </h1>
            <p className="text-white/40 dark:text-white/40 text-sm mt-1 font-medium">Waiting for players…</p>
          </div>

          {/* Room code */}
          <div className="text-center space-y-1.5">
            <p className="text-white/40 dark:text-white/40 text-xs uppercase tracking-widest font-semibold">Room Code</p>
            <button
              onClick={copyCode}
              className="relative w-full text-4xl font-black tracking-[0.3em] text-white dark:text-white
                         bg-white/10 dark:bg-white/10 hover:bg-white/20 active:scale-95
                         px-6 py-3 rounded-2xl transition-all border border-white/10"
            >
              {gameState.roomCode}
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/35 font-normal tracking-normal">
                {copied ? '✓ Copied!' : 'tap to copy'}
              </span>
            </button>
          </div>

          {/* Player list */}
          <div className="space-y-2">
            <p className="text-white/40 dark:text-white/40 text-xs uppercase tracking-widest font-semibold">
              Players ({gameState.players.length}/6)
            </p>
            <div className="space-y-1.5">
              {gameState.players.map((p, i) => (
                <div key={p.id}
                  className="flex items-center gap-3 bg-white/5 dark:bg-white/5 rounded-xl px-3 py-2.5 animate-fadeIn"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-blue-500
                                  flex items-center justify-center text-xs font-black text-white shadow-md">
                    {p.name[0].toUpperCase()}
                  </div>
                  <span className="text-white dark:text-white font-semibold">{p.name}</span>
                  <span className="w-2 h-2 rounded-full bg-green-400 ml-auto animate-pulse" />
                  {p.id === socket.id && <span className="text-white/30 text-xs">you</span>}
                </div>
              ))}
            </div>
          </div>

          <p className="text-center text-white/35 text-sm animate-pulse2">
            {gameState.players.length < 2
              ? '⏳ Need at least 1 more player…'
              : gameState.isHost ? '🚀 Ready to start!' : '⏳ Waiting for host…'}
          </p>

          {gameState.isHost && (
            <button
              onClick={() => socket.emit('start_game')}
              disabled={!canStart}
              className={`
                w-full py-3.5 rounded-2xl font-black text-lg transition-all
                ${canStart
                  ? 'bg-gradient-to-r from-green-500 to-emerald-400 text-white shadow-xl shadow-green-500/30 hover:shadow-green-500/50 hover:scale-[1.02] active:scale-95'
                  : 'bg-white/10 text-white/25 cursor-not-allowed'}
              `}
            >
              {canStart ? '▶ Start Game' : 'Waiting for players…'}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Home / Join ─────────────────────────────────────────────────────────────
  return (
    <div className="relative flex items-center justify-center min-h-screen p-4">
      <ThemeBtn />

      {/* Decorative floating cards */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        {[
          { color: 'bg-red-500',    t: '8%',  l: '5%',  rot: '-15deg', delay: '0s'   },
          { color: 'bg-blue-500',   t: '12%', r: '6%',  rot: '18deg',  delay: '0.5s' },
          { color: 'bg-yellow-400', b: '15%', l: '8%',  rot: '10deg',  delay: '1s'   },
          { color: 'bg-green-500',  b: '10%', r: '5%',  rot: '-12deg', delay: '1.5s' },
        ].map((c, i) => (
          <div key={i} className={`absolute w-10 h-14 ${c.color} rounded-xl opacity-20 animate-float`}
            style={{ top: c.t, bottom: (c as {b?:string}).b, left: (c as {l?:string}).l, right: (c as {r?:string}).r,
                     transform: `rotate(${c.rot})`, animationDelay: c.delay }} />
        ))}
      </div>

      <div className="glass rounded-3xl p-7 w-full max-w-sm shadow-2xl space-y-5 animate-slideUp relative">
        {/* Logo */}
        <div className="text-center space-y-1">
          <h1 className="text-7xl font-black tracking-tight leading-none">
            <span className="text-red-500   drop-shadow-lg [text-shadow:0_0_30px_#ef4444aa]">U</span>
            <span className="text-blue-500  drop-shadow-lg [text-shadow:0_0_30px_#3b82f6aa]">N</span>
            <span className="text-green-500 drop-shadow-lg [text-shadow:0_0_30px_#22c55eaa]">O</span>
          </h1>
          <p className="text-white/40 dark:text-white/40 text-sm font-medium">Multiplayer Card Game</p>
        </div>

        {/* Name */}
        <div className="space-y-1.5">
          <label className="text-xs text-white/45 uppercase tracking-widest font-semibold">Your Name</label>
          <input
            type="text" value={name} maxLength={20} placeholder="Enter your name…"
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') view === 'join' ? join() : create(); }}
            className="
              w-full bg-white/10 dark:bg-white/10 border border-white/10 rounded-2xl px-4 py-3
              text-white dark:text-white placeholder-white/25 outline-none
              focus:border-white/30 focus:bg-white/15 transition font-medium
            "
          />
        </div>

        {view === 'home' ? (
          <div className="space-y-3">
            <button onClick={create}
              className="w-full py-3.5 rounded-2xl font-black text-lg text-white transition-all active:scale-95
                         bg-gradient-to-r from-red-500 to-rose-600 shadow-xl shadow-red-500/30
                         hover:shadow-red-500/50 hover:scale-[1.02]">
              + Create Game
            </button>
            <button onClick={() => setView('join')}
              className="w-full py-3.5 rounded-2xl font-black text-lg transition-all active:scale-95
                         bg-white/10 hover:bg-white/15 text-white dark:text-white border border-white/10">
              → Join Game
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs text-white/45 uppercase tracking-widest font-semibold">Room Code</label>
              <input
                type="text" value={code} maxLength={6} placeholder="XXXXXX"
                onChange={e => setCode(e.target.value.toUpperCase())}
                onKeyDown={e => { if (e.key === 'Enter') join(); }}
                className="
                  w-full bg-white/10 dark:bg-white/10 border border-white/10 rounded-2xl px-4 py-3
                  text-white dark:text-white placeholder-white/25 outline-none
                  focus:border-white/30 focus:bg-white/15 transition
                  text-center text-2xl font-black tracking-[0.4em]
                "
              />
            </div>
            <button onClick={join}
              className="w-full py-3.5 rounded-2xl font-black text-lg text-white transition-all active:scale-95
                         bg-gradient-to-r from-blue-500 to-indigo-600 shadow-xl shadow-blue-500/30
                         hover:shadow-blue-500/50 hover:scale-[1.02]">
              Join Room
            </button>
            <button onClick={() => { setView('home'); setError(''); }}
              className="w-full py-2 text-white/35 hover:text-white/65 text-sm transition-colors">
              ← Back
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-500/15 border border-red-500/30 rounded-2xl px-4 py-2.5 text-red-300 text-sm text-center animate-fadeIn">
            ⚠ {error}
          </div>
        )}
      </div>
    </div>
  );
}
