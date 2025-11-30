#!/usr/bin/env node
'use strict';

require('dotenv').config();

// const port = (() => {
//     const args = process.argv;

//     if (args.length !== 3) {
//         console.error("usage: node index.js port");
//         process.exit(1);
//     }

//     const num = parseInt(args[2], 10);
//     if (isNaN(num)) {
//         console.error("error: argument must be an integer.");
//         process.exit(1);
//     }

//     return num;
// })();
const port = process.env.PORT || 3000;

const express = require("express");
const cors = require('cors'); //
const path = require('path');
const { ApiError } = require('./utils/errors');
const mainRouter = require('./routes');

const http = require("http");
const { Server } = require("socket.io");

const jwt = require("jsonwebtoken"); 

const app = express();

app.use(express.json());

// ADD YOUR WORK HERE
// --- Global Middleware ---

// Enable Cross-Origin Resource Sharing
// Set up cors to allow requests from your React frontend
// app.use(cors({
// origin: 'http://localhost:5173',
// methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
// allowedHeaders: ['Content-Type', 'Authorization'],
// credentials: true
// }));

const allowedOrigins = [
  "http://localhost:5173",
];

app.use(
  cors({
    origin: (origin, callback) => {
    
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) return callback(null, true);
 
      if (origin.endsWith("csc309-project.pages.dev")) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"), false);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);


// Serve static files from the 'uploads' directory
// This allows accessing avatar images via URLs like /uploads/avatars/image.png
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Routes ---
app.use('/', mainRouter);

// --- Error Handling Middleware ---
// This middleware catches all errors thrown in the application
app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    // Error from express-jwt when token is invalid or missing
    return res.status(401).json({ error: 'Invalid or missing token' });
  }

  if (err instanceof ApiError) {
    // Custom defined errors (e.g., 400, 403, 404)
    return res.status(err.statusCode).json({ error: err.message });
  }

  // Fallback for unexpected server errors
  console.error('Unhandled error:', err);
  return res.status(500).json({ error: 'Internal Server Error' });
});

const { setSocketIO } = require("./utils/sendNotification");


// change original app.listen to the following:
const httpServer = http.createServer(app);

// initialize socket.io
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:5173', // React dev server
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }
});


setSocketIO(io);

io.on("connection", (socket) => {
  const token = socket.handshake.auth?.token;

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // JWT payload = { id, utorid, role }
    const userId = payload.id;

    // join a room named after the user ID
    const room = `user:${userId}`;
    socket.join(room);

    console.log(`🔐 Socket ${socket.id} joined room ${room}`);

    // test message (only sent to the user themselves)
    // socket.emit("notification", {
    //   message: "Hello from WebSocket server!"
    // });

    socket.on("disconnect", () => {
      console.log("❌ WebSocket disconnected:", socket.id);
    });

  } catch (err) {
    console.error("Invalid token:", err.message);
    socket.disconnect(true);
  }
});


// attach the io object to the app for use in routes
app.set("io", io);


// start HTTP + WebSocket server
httpServer.listen(port, () => {
  console.log(`🚀 Server & WebSocket running on port ${port}`);
});

httpServer.on("error", (err) => {
  console.error(`cannot start server: ${err.message}`);
  process.exit(1);
});


// const server = app.listen(port, () => {
//     console.log(`Server running on port ${port}`);
// });

// server.on('error', (err) => {
//     console.error(`cannot start server: ${err.message}`);
//     process.exit(1);
// });