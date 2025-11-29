// backend/routes/notifications.js
'use strict';

const express = require('express');
const router = express.Router();

const NotificationController = require('../controllers/notifications');
const { authenticate } = require('../middleware/auth');

// GET /notifications
router.get(
  '/',
  authenticate, 
  NotificationController.getMyNotifications
);

module.exports = router;
