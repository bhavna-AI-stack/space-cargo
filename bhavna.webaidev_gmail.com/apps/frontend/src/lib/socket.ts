import { io } from 'socket.io-client';
import { BACKEND_URL } from './config';

export const socket = io(BACKEND_URL, {
  autoConnect: false,
  reconnectionAttempts: 5,
  reconnectionDelay: 2000,
  reconnectionDelayMax: 15000
});

export function connectSocket() {
  if (socket.disconnected) {
    socket.connect();
  }
}
