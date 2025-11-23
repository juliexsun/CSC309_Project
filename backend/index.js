#!/usr/bin/env node
'use strict';

require('dotenv').config();

const port = (() => {
    const args = process.argv;

    if (args.length !== 3) {
        console.error("usage: node index.js port");
        process.exit(1);
    }

    const num = parseInt(args[2], 10);
    if (isNaN(num)) {
        console.error("error: argument must be an integer.");
        process.exit(1);
    }

    return num;
})();

const express = require("express");
const cors = require('cors'); //
const path = require('path');
const { ApiError } = require('./utils/errors');
const mainRouter = require('./routes');

const app = express();

app.use(express.json());

// ADD YOUR WORK HERE
// --- Global Middleware ---

// Enable Cross-Origin Resource Sharing
// Set up cors to allow requests from your React frontend
app.use(cors({
origin: 'http://localhost:5173',
methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
allowedHeaders: ['Content-Type', 'Authorization'],
credentials: true
}));

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


const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

server.on('error', (err) => {
    console.error(`cannot start server: ${err.message}`);
    process.exit(1);
});