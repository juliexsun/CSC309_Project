// pages/SocketDebugPage.jsx
import { useEffect } from "react";
import { useSocket } from "../context/SocketContext";

export default function SocketDebugPage() {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) {
      console.log("No socket yet (not logged in or still connecting)");
      return;
    }

    // basic events
    socket.on("connect", () => {
      console.log("✅ socket connected:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("❌ socket disconnected");
    });

    // e.g. server sends "notification" for testing
    socket.on("notification", (data) => {
      console.log("📩 notification:", data);
    });

    // cleanup listeners
    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("notification");
    };
  }, [socket]);

  return <div>Socket Debug Page (open console to see logs)</div>;
}
