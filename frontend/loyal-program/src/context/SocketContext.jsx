// context/SocketContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { createSocket } from "../utils/socket";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const { token, isAuthenticated, user } = useAuth(); // get from Auth the login status

  useEffect(() => {
    // if not authenticated or no token: disconnect existing socket
    if (!isAuthenticated || !token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    // already authenticated + have token: create new socket connection
    const newSocket = createSocket(token);
    setSocket(newSocket);

    // cleanup function: disconnect when token changes or component unmounts
    return () => {
      newSocket.disconnect();
      setSocket(null);
    };
    // Note that the dependencies are isAuthenticated and token
  }, [isAuthenticated, token]);

  // 2️⃣ After socket is created and authenticated, send auth event with user ID
  useEffect(() => {
    if (!socket || !isAuthenticated || !user) return;

    console.log("🔐 Sending auth to socket:", user.id);
    socket.emit("auth", user.id);

  }, [socket, isAuthenticated, user]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return ctx;
}
