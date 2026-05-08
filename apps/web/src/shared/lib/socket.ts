import { io } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@tacfinity/shared';

export const socket = io(import.meta.env.VITE_API_URL ?? 'http://localhost:3001', {
  withCredentials: true,
  autoConnect: false,
}) as import('socket.io-client').Socket<ServerToClientEvents, ClientToServerEvents>;
