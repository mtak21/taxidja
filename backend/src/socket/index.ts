import { Server as HttpServer } from 'http';
import { Socket } from 'socket.io';
import { UserRole } from '@prisma/client';
import { verifyAccessToken } from '../services/auth.service';
import * as dispatchService from '../services/dispatch.service';
import { initIo, userRoom, type SocketData } from './io';

type AppSocket = Socket<Record<string, never>, Record<string, never>, Record<string, never>, SocketData>;

export function initSocket(httpServer: HttpServer) {
  const io = initIo(httpServer);

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      return next(new Error('Missing auth token'));
    }
    try {
      const payload = verifyAccessToken(token);
      socket.data.user = { id: payload.sub, role: payload.role };
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket: AppSocket) => {
    const { user } = socket.data;
    socket.join(userRoom(user.id));

    socket.on('ride:accepted', ({ rideId }: { rideId: string }) => {
      dispatchService.handleDriverResponse(rideId, user.id, 'accepted').catch(console.error);
    });

    socket.on('ride:rejected', ({ rideId }: { rideId: string }) => {
      dispatchService.handleDriverResponse(rideId, user.id, 'rejected').catch(console.error);
    });

    socket.on('disconnect', () => {
      if (user.role === UserRole.DRIVER) {
        dispatchService.handleDriverDisconnect(user.id).catch(console.error);
      }
    });
  });

  return io;
}
