import { useState, useEffect } from 'react';
import type { GameState } from '@shared/types';
import socket from './socket';
import Lobby from './pages/Lobby';
import Game from './pages/Game';

export default function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    socket.connect();
    socket.on('connect',     () => setConnected(true));
    socket.on('disconnect',  () => setConnected(false));
    socket.on('room_joined', (s: GameState) => setGameState(s));
    socket.on('game_updated',(s: GameState) => setGameState(s));
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('room_joined');
      socket.off('game_updated');
    };
  }, []);

  if (!connected) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <div className="relative w-14 h-14 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-purple-500/30" />
            <div className="absolute inset-0 rounded-full border-4 border-t-purple-400 animate-spin" />
          </div>
          <p className="text-white/50 dark:text-white/50 text-sm font-medium">Connecting…</p>
        </div>
      </div>
    );
  }

  if (!gameState || gameState.status === 'waiting') return <Lobby gameState={gameState ?? undefined} />;
  return <Game gameState={gameState} />;
}
