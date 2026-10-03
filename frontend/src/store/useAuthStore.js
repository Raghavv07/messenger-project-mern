import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { io } from "socket.io-client";

const BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.MODE === "development" ? "http://localhost:5001" : "/");

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,
  isSocketConnected: false,

  checkAuth: async () => {
    set({ isCheckingAuth: true });

    try {
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data });

      get().connectSocket(res.data);
    } catch (error) {
      console.error("Error in checkAuth:", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  clearAuth: () => {
    set({ authUser: null, isCheckingAuth: false, onlineUsers: [] });
    get().disconnectSocket();
  },

  connectSocket: (user) => {
    if (!user) return;

    const currentSocket = get().socket;
    // If socket is already active for this exact user, reuse it
    if (currentSocket?.connected && currentSocket.auth?.userId === user._id) {
      return;
    }

    // Clean up any stale socket instance and remove listeners to prevent memory leaks
    if (currentSocket) {
      currentSocket.removeAllListeners();
      currentSocket.disconnect();
    }

    const socket = io(BASE_URL, {
      query: { userId: user._id },
      auth: { userId: user._id },
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      closeOnBeforeunload: true,
    });

    socket.on("connect", () => {
      set({ isSocketConnected: true });
    });

    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });

    socket.on("disconnect", (reason) => {
      set({ isSocketConnected: false });
      // If server manually closed connection, reconnect explicitly per Socket.IO documentation
      if (reason === "io server disconnect") {
        socket.connect();
      }
    });

    socket.on("connect_error", (err) => {
      console.warn("Socket.io connection warning:", err.message);
      set({ isSocketConnected: false });
    });

    set({ socket, isSocketConnected: socket.connected });
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      socket.removeAllListeners();
      if (socket.connected) {
        socket.disconnect();
      }
    }
    set({ socket: null, isSocketConnected: false, onlineUsers: [] });
  },
}));
