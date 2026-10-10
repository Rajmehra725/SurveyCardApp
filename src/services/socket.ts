import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "../config/api";

let socket: Socket | null = null;

export const getSocket = (): Socket | null => {
  return socket;
};

export const initSocket = (userId: string): Socket => {
  if (socket && socket.connected) {
    socket.emit("userOnline", userId);
    return socket;
  }

  socket = io(API_BASE_URL, {
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  socket.on("connect", () => {
    console.log("⚡ [Socket Client] Connected to RaazChat Server:", socket?.id);
    if (userId) {
      socket?.emit("userOnline", userId);
    }
  });

  socket.on("disconnect", (reason) => {
    console.log("⚡ [Socket Client] Disconnected:", reason);
  });

  socket.on("connect_error", (error) => {
    console.log("⚡ [Socket Client] Connection Error:", error.message);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinRoom = (roomId: string) => {
  if (socket && roomId) {
    socket.emit("joinRoom", roomId);
  }
};

export const leaveRoom = (roomId: string) => {
  if (socket && roomId) {
    socket.emit("leaveRoom", roomId);
  }
};

export const emitTyping = (conversationId: string, user: any) => {
  if (socket) {
    socket.emit("typing", { conversationId, user });
  }
};

export const emitStopTyping = (conversationId: string, userId: string) => {
  if (socket) {
    socket.emit("stopTyping", { conversationId, userId });
  }
};

export const emitMarkSeen = (conversationId: string, messageId: string, userId: string) => {
  if (socket) {
    socket.emit("markSeen", { conversationId, messageId, userId });
  }
};

export const emitMarkDelivered = (conversationId: string, messageIds: string[], userId: string) => {
  if (socket && messageIds.length > 0) {
    socket.emit("markDelivered", { conversationId, messageIds, userId });
  }
};
