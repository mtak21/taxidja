import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

const baseURL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:3000';

let socket: Socket | null = null;

function getSocket(): Socket {
  if (!socket) {
    socket = io(baseURL, { autoConnect: false, transports: ['websocket'] });
  }
  return socket;
}

/** Connects (or reuses) the socket, authenticated with the current access token. */
export function connectSocket(): Socket {
  const { accessToken } = useAuthStore.getState();
  const instance = getSocket();
  instance.auth = { token: accessToken };
  if (!instance.connected) {
    instance.connect();
  }
  return instance;
}

export function disconnectSocket() {
  socket?.disconnect();
}
