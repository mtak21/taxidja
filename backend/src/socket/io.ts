import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { UserRole } from '@prisma/client';

export interface SocketData {
  user: { id: string; role: UserRole };
}

export type AppServer = Server<Record<string, never>, Record<string, never>, Record<string, never>, SocketData>;

let io: AppServer | null = null;

/** Room every connected user's socket joins, so the server can target them by user id. */
export function userRoom(userId: string): string {
  return `user:${userId}`;
}

export function initIo(httpServer: HttpServer): AppServer {
  io = new Server(httpServer, {
    cors: { origin: '*' },
  });
  return io;
}

export function getIo(): AppServer {
  if (!io) {
    throw new Error('Socket.IO server accessed before initialization');
  }
  return io;
}
