import type { User } from '@prisma/client';
import type { Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@tacfinity/shared';

export type AuthedSocket = Socket<ClientToServerEvents, ServerToClientEvents> & {
  data: { user: User };
};
