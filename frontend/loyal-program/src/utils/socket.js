import { io } from "socket.io-client";
const isDev = import.meta.env.DEV;

export function createSocket(token) {
  const socket = io(import.meta.env.VITE_BACKEND_WS_URL, {
    auth: { token },
  });

  // successful connection
  socket.on("connect", () => {
    if (isDev) console.log("✅ WS connected:", socket.id);
  });

  // connection error
  socket.on("connect_error", (err) => {
    if (isDev) console.error("❌ WS connect_error:", err.message);
  });

  // disconnected
  socket.on("disconnect", (reason) => {
    if (isDev) console.log("🔌 WS disconnected:", reason);
  });

  // listen for test events from the backend
  socket.on("notification", (data) => {
    if (isDev) console.log("📩 WS notification from server:", data);
  });

  return socket;
}
