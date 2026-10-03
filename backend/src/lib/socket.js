import express from "express";
import http from "http";
import { Server } from "socket.io";
import { getAllowedOrigins } from "./env.js";

const app = express();
const server = http.createServer(app);

/**
 * Production-ready Socket.IO server configuration following official Socket.IO v4 best practices:
 * - CORS origins security
 * - Connection state recovery (automatic packet buffering & reconnection sync)
 * - Payload size defense limits
 * - Handshake authentication middleware
 * - Efficient multi-device / multi-tab online presence tracking
 */
const io = new Server(server, {
  cors: {
    origin: getAllowedOrigins(),
    methods: ["GET", "POST"],
    credentials: true,
  },
  // Automatically recover connection state (rooms, missed events) on temporary network drops
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
    skipMiddlewares: false,
  },
  maxHttpBufferSize: 1e6, // 1MB packet limit to guard against memory exhaustion
  pingTimeout: 20000,
  pingInterval: 25000,
});

// Map of userId -> Set of active socketIds (supports multiple tabs & devices per user)
const userSocketMap = new Map();

/**
 * Socket.IO Middleware: Authenticate incoming connection handshake
 * Rejects connection early if userId is missing or invalid
 */
io.use((socket, next) => {
  const rawUserId = socket.handshake.query?.userId || socket.handshake.auth?.userId;

  if (!rawUserId || typeof rawUserId !== "string" || !rawUserId.trim()) {
    return next(new Error("Authentication error: userId is required to establish connection"));
  }

  socket.data.userId = rawUserId.trim();
  next();
});

io.on("connection", (socket) => {
  const userId = socket.data.userId;
  const isFirstConnection = !userSocketMap.has(userId) || userSocketMap.get(userId).size === 0;

  if (!userSocketMap.has(userId)) {
    userSocketMap.set(userId, new Set());
  }
  userSocketMap.get(userId).add(socket.id);

  // Join user to their personal room (allows io.to(userId) to reach all tabs/devices for this user)
  socket.join(userId);

  // If client reconnected via Connection State Recovery, log it
  if (socket.recovered) {
    console.log(`⚡ Socket recovered for user ${userId} (${socket.id})`);
  }

  // Optimize broadcast: Only broadcast to all clients when user transitions from Offline -> Online
  if (isFirstConnection) {
    io.emit("getOnlineUsers", Array.from(userSocketMap.keys()));
  } else {
    // If opening an additional tab, reply directly to this socket with the current list
    socket.emit("getOnlineUsers", Array.from(userSocketMap.keys()));
  }

  // Handle optional real-time typing indicators
  socket.on("typing", (data) => {
    const receiverId = data?.toUserId || data?.receiverId;
    if (receiverId) {
      io.to(String(receiverId)).emit("userTyping", { fromUserId: userId });
    }
  });

  socket.on("stopTyping", (data) => {
    const receiverId = data?.toUserId || data?.receiverId;
    if (receiverId) {
      io.to(String(receiverId)).emit("userStoppedTyping", { fromUserId: userId });
    }
  });

  // Handle client-side error events to prevent uncaught exceptions
  socket.on("error", (err) => {
    console.error(`⚠️ Socket error [user: ${userId}, socket: ${socket.id}]:`, err.message);
  });

  // Handle disconnect
  socket.on("disconnect", (reason) => {
    const userSockets = userSocketMap.get(userId);
    if (userSockets) {
      userSockets.delete(socket.id);
      // Only broadcast offline status when user's LAST connection closes
      if (userSockets.size === 0) {
        userSocketMap.delete(userId);
        io.emit("getOnlineUsers", Array.from(userSocketMap.keys()));
      }
    }
  });
});

/**
 * Returns a recipient socket ID (for backward compatibility)
 */
function getReceiverSocketId(userId) {
  const sockets = userSocketMap.get(String(userId));
  if (!sockets || sockets.size === 0) return null;
  return Array.from(sockets).pop();
}

/**
 * Helper to check if a specific user is currently online
 */
function isUserOnline(userId) {
  const sockets = userSocketMap.get(String(userId));
  return Boolean(sockets && sockets.size > 0);
}

export { app, server, io, getReceiverSocketId, isUserOnline };
