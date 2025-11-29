'use strict';

// backend/utils/sendNotification.js

const prisma = require("../db/prisma");

// Socket.IO instance
let ioRef = null;

function setSocketIO(io) {
  ioRef = io;
  console.log("✅ Socket.IO instance set in sendNotification.js");
}

/**
 * auto save to database + auto send notification to user via socket
 *
 * @param {number} userId
 * @param {"info"|"success"|"warning"|"error"} type
 * @param {string} message
 */
async function sendNotification(userId, type, message) {
  if (!ioRef) {
    console.warn("⚠ sendNotification() called before socket is ready.");
  }

  // 1️⃣ write to database
  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      message,
      read: false,
    },
  });

  // 2️⃣ if socket exists, push to the corresponding user
  if (ioRef) {
    // ✅ Room name exactly the same as in index.js
    const room = `user:${userId}`;
    console.log("📤 sendNotification to room", room);

    ioRef.to(room).emit("notification", {
    id: notification.id,
    type: notification.type,
    message: notification.message,
    createdAt: notification.createdAt,
    });

  }

  console.log("🔥 sendNotification called for user", userId, type, message);

  return notification;
}

/**
 * Send the same notification to a group of users
 *
 * @param {number[]} userIds
 * @param {"info"|"success"|"warning"|"error"} type
 * @param {string} message
 */
async function sendNotificationToMany(userIds, type, message) {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return [];
  }

  // Remove duplicates to prevent sending multiple notifications to the same user
  const uniqueIds = [...new Set(userIds)];

  const results = [];
  for (const id of uniqueIds) {
    // Reuse the existing single-user version
    const n = await sendNotification(id, type, message);
    results.push(n);
  }

  return results;
}


module.exports = {
  sendNotification,
  setSocketIO,
  sendNotificationToMany,
};
