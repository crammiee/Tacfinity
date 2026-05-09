import { io } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@tacfinity/shared';
import { useAuthStore } from '@/features/auth/store';

export const socket = io(import.meta.env.VITE_API_URL ?? 'http://localhost:3001', {
  withCredentials: true,
  autoConnect: false,
  transports: ['websocket', 'polling'],
  auth: (cb) => cb({ token: useAuthStore.getState().accessToken }),
}) as import('socket.io-client').Socket<ServerToClientEvents, ClientToServerEvents>;
