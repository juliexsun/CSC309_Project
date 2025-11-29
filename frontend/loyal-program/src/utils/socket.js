import { io } from "socket.io-client";

export function createSocket(token) {
  const socket = io(import.meta.env.VITE_BACKEND_WS_URL, {
    auth: { token },
  });

  // successful connection
  socket.on("connect", () => {
    console.log("✅ WS connected:", socket.id);
  });

  // connection error
  socket.on("connect_error", (err) => {
    console.error("❌ WS connect_error:", err.message);
  });

  // disconnected
  socket.on("disconnect", (reason) => {
    console.log("🔌 WS disconnected:", reason);
  });

  // listen for test events from the backend
  socket.on("notification", (data) => {
    console.log("📩 WS notification from server:", data);
  });

  return socket;
}
