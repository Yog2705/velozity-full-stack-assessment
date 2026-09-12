import { io, Socket } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  "http://localhost:5000";

let socket: Socket | null = null;

export const connectSocket = (
  token: string
) => {
  if (socket) {
    if (!socket.connected) {
      socket.auth = { token };
      socket.connect();
    }

    return socket;
  }

  socket = io(SOCKET_URL, {
    autoConnect: false,
    auth: {
      token,
    },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.connect();

  return socket;
};

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};

export const joinProject = (
  projectId: string
) => {
  socket?.emit(
    "join-project",
    projectId
  );
};

export const leaveProject = (
  projectId: string
) => {
  socket?.emit(
    "leave-project",
    projectId
  );
};

export const requestMissedActivity = (
  projectId: string,
  since?: string
) => {
  socket?.emit(
    "activity:missed",
    {
      projectId,
      since,
    }
  );
};

/*
 * Request the latest global activity
 * for Admin users after reconnecting.
 */
export const requestMissedGlobalActivity = (
  since?: string
) => {
  socket?.emit(
    "activity:missed-global",
    {
      since,
    }
  );
};

export const getSocket = () => {
  return socket;
};