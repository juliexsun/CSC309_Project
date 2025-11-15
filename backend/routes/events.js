'use strict';

const express = require('express');
const eventController = require('../controllers/event');
const transactionController = require('../controllers/transaction'); // For /events/:eventId/transactions
const { authenticate, protect } = require('../middleware/auth');
const { validateUserIdParam } = require('../middleware/userValidators');
const {
  validateCreateEvent,
  validateGetEvents,
  validateEventIdParam,
  validateUpdateEvent,
  validateAddUserToEvent,
  validateCreateEventTransaction,
} = require('../middleware/eventValidators');
const {
  validateCreateEventTransaction: validateEventTx, // Alias to avoid name conflict
} = require('../middleware/eventValidators');

const router = express.Router();

// POST /events - Create a new event
router.post(
  '/',
  protect(['manager', 'superuser']),
  validateCreateEvent,
  eventController.createEvent
);

// GET /events - Retrieve a list of events
router.get(
  '/',
  authenticate,
  validateGetEvents,
  eventController.getEvents
);

// GET /events/:eventId - Retrieve a single event
router.get(
  '/:eventId',
  authenticate,
  validateEventIdParam,
  eventController.getEventById
);

// PATCH /events/:eventId - Update an existing event
router.patch(
  '/:eventId',
  authenticate, //manager or organizer
  validateEventIdParam,
  validateUpdateEvent,
  eventController.updateEvent
);

// DELETE /events/:eventId - Remove the specified event
router.delete(
  '/:eventId',
  protect(['manager', 'superuser']),
  validateEventIdParam,
  eventController.deleteEvent
);

// POST /events/:eventId/organizers - Add an organizer
router.post(
  '/:eventId/organizers',
  protect(['manager', 'superuser']),
  validateEventIdParam,
  validateAddUserToEvent,
  eventController.addOrganizer
);

// DELETE /events/:eventId/organizers/:userId - Remove an organizer
router.delete(
  '/:eventId/organizers/:userId',
  protect(['manager', 'superuser']),
  validateEventIdParam,
  validateUserIdParam,
  eventController.removeOrganizer
);

// POST /events/:eventId/guests - Add a guest
router.post(
  '/:eventId/guests',
  authenticate, // Manager or organizer
  validateEventIdParam,
  validateAddUserToEvent,
  eventController.addGuest
);

// POST /events/:eventId/guests/me - RSVP the logged-in user
router.post(
  '/:eventId/guests/me',
  protect(['regular']),
  validateEventIdParam,
  eventController.rsvpMe
);

// DELETE /events/:eventId/guests/me - Un-RSVP the logged-in user
router.delete(
  '/:eventId/guests/me',
  protect(['regular']),
  validateEventIdParam,
  eventController.unRsvpMe
);

// DELETE /events/:eventId/guests/:userId - Remove a guest
router.delete(
  '/:eventId/guests/:userId',
  protect(['manager', 'superuser']),
  validateEventIdParam,
  validateUserIdParam,
  eventController.removeGuest
);

// POST /events/:eventId/transactions - Create a reward transaction
router.post(
  '/:eventId/transactions',
  authenticate, // Manager or organizer
  validateEventIdParam,
  validateEventTx,
  transactionController.createEventTransaction
);

module.exports = router;