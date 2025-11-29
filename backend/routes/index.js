'use strict';

const express = require('express');
const authRouter = require('./auth');
const usersRouter = require('./users');
const transactionsRouter = require('./transactions');
const eventsRouter = require('./events');
const promotionsRouter = require('./promotions');
const stripeRouter = require('./stripe');
const notificationRouter = require('./notifications');
const { MethodNotAllowed } = require('../utils/errors');

const router = express.Router();

router.use('/auth', authRouter);
router.use('/users', usersRouter);
router.use('/transactions', transactionsRouter);
router.use('/events', eventsRouter);
router.use('/promotions', promotionsRouter);
router.use('/stripe', stripeRouter);
router.use('/notifications', notificationRouter);

// If the endpoint does not support a particular method, return 405 Method Not Allowed
const allRoutes = [
  authRouter,
  usersRouter,
  transactionsRouter,
  eventsRouter,
  promotionsRouter,
  stripeRouter,
  notificationRouter,
];

allRoutes.forEach((r) => {
  r.stack.forEach((layer) => {
    if (layer.route) {
      // Get the path and implemented methods for this route
      const path = layer.route.path;
      const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();

      // Attach a handler for 'all' that rejects any method NOT in the list
      router.all(layer.route.path, (req, res, next) => {
        if (!layer.route.methods[req.method.toLowerCase()]) {
          // Method is not allowed
          res.set('Allow', methods); // Set the 'Allow' header
          return next(MethodNotAllowed(`Method ${req.method} Not Allowed. Allowed methods: ${methods}`));
        }
        next();
      });
    }
  });
});

module.exports = router;