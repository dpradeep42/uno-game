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

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('room_joined', (state: GameState) => setGameState(state));
    socket.on('game_updated', (state: GameState) => setGameState(state));

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('room_joined');
      socket.off('game_updated');
    };
  }, []);

  if (!connected) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-white/60 text-sm">Connecting to server…</p>
        </div>
      </div>
    );
  }

  if (!gameState) return <Lobby />;

  if (gameState.status === 'waiting') return <Lobby gameState={gameState} />;

  return <Game gameState={gameState} />;
}
