import { io, Socket } from 'socket.io-client';

// Single shared socket instance
const socket: Socket = io({
  autoConnect: false,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
});

export default socket;
