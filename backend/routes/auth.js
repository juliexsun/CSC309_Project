'use strict';

const express = require('express');
const authController = require('../controllers/auth');
const {
  validateLogin,
  validateRequestReset,
  validatePerformReset,
} = require('../middleware/authValidators');
// const { rateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// POST /auth/tokens - Authenticate a user
router.post('/tokens', validateLogin, authController.login);

// POST /auth/resets - Request a password reset
router.post(
  '/resets',
//   rateLimiter,
  validateRequestReset,
  authController.requestReset
);

// POST /auth/resets/:resetToken - Perform the password reset
router.post(
  '/resets/:resetToken',
  validatePerformReset,
  authController.performReset
);

module.exports = router;