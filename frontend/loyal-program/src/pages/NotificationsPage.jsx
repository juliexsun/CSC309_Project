// frontend/loyal-program/src/NotificationsPage.jsx
import { useEffect, useState } from "react";
import { useSocket } from "../context/SocketContext";
import { notificationAPI } from "../api";
import "./NotificationsPage.css";

const NotificationsPage = () => {
  const { socket } = useSocket();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  // 1. page loading, get existing notifications
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await notificationAPI.getMyNotifications({
          page: 1,
          limit: 50,
        });
        
        setNotifications(res.data.results || []);
      } catch (err) {
        console.error("Failed to load notifications:", err);
        const msg =
          err.response?.data?.error || "Failed to load notifications.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, []);

  // 2. listen to socket, append new notifications in real-time
  useEffect(() => {
    if (!socket) return;

    const handler = (data) => {
      setNotifications((prev) => [
        {
          id: data.id ?? Date.now() + Math.random(),
          type: data.type ?? "info",
          message: data.message ?? "",
          read: false,
          createdAt: data.createdAt ? data.createdAt : new Date().toISOString(),
        },
        ...prev,
      ]);

    // ⭐ Dispatch a global event to Navbar to show a toast notification
    window.dispatchEvent(
        new CustomEvent("notification-toast", {
        detail: { message: data.message, type: data.type ?? "info" }
        })
    );
    };

    socket.on("notification", handler);
    return () => socket.off("notification", handler);
  }, [socket]);

  // Reserved: Mark a single notification as read (to be used after backend PATCH is implemented)
  const handleMarkRead = async (id) => {
    try {
      // await notificationAPI.markRead(id, true);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
      alert("Failed to mark as read, please try again.");
    }
  };

  // Reserved: Mark all notifications as read (to be used after backend PATCH is implemented)
  const handleMarkAllRead = async () => {
    try {
      // await notificationAPI.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
      alert("Failed to mark all as read, please try again.");
    }
  };

  if (loading) {
    return <div className="notifications-page">Loading notifications...</div>;
  }

  return (
    <div className="page-container">
      <h1 className="page-title">Notifications</h1>

      {/* <div className="notifications-actions">
        <button
          className="notifications-clear-btn"
          onClick={handleMarkAllRead}
          disabled={notifications.length === 0}
        >
          Mark all as read
        </button>
      </div> */}

      {error && <div className="notifications-error">{error}</div>}

      {notifications.length === 0 ? (
        <p className="notifications-empty">
          You don&apos;t have any notifications yet.
        </p>
      ) : (
        <ul className="notifications-list">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`notification-item notification-${
                n.type || "info"
              } ${n.read ? "notification-read" : ""}`}
            >
              <div className="notification-header">
                <span className="notification-type">
                  {(n.type || "info").toUpperCase()}
                </span>
                <span className="notification-time">
                  {new Date(n.createdAt).toLocaleString()}
                </span>
              </div>

              <div className="notification-message">{n.message}</div>

              {/* {!n.read && (
                <button
                  className="notification-mark-read-btn"
                  onClick={() => handleMarkRead(n.id)}
                >
                  Mark as read
                </button>
              )} */}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NotificationsPage;
