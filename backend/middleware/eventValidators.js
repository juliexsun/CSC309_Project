'use strict';
const { BadRequest } = require('../utils/errors');
const {
  isISODate,
  atLeastOneField,
  strictBody,
} = require('../utils/validationHelpers');

// Middleware for validating :eventId param
exports.validateEventIdParam = (req, res, next) => {
  const id = parseInt(req.params.eventId, 10);
  if (isNaN(id) || id < 1) {
    return next(BadRequest('Invalid eventId parameter.'));
  }
  req.params.eventId = id;
  next();
};

// POST /events
exports.validateCreateEvent = [
  strictBody([
    'name',
    'description',
    'location',
    'startTime',
    'endTime',
    'capacity',
    'points',
  ]),
  (req, res, next) => {
    const { name, description, location, startTime, endTime, capacity, points } =
      req.body;

    if (
      !name ||
      !description ||
      !location ||
      !startTime ||
      !endTime ||
      points === undefined
    ) {
      return next(
        BadRequest(
          'Missing required fields: name, description, location, startTime, endTime, and points are required.'
        )
      );
    }

    if (!isISODate(startTime))
      return next(BadRequest('startTime must be a valid ISO 8601 date.'));
    if (!isISODate(endTime))
      return next(BadRequest('endTime must be a valid ISO 8601 date.'));

    if (new Date(endTime) <= new Date(startTime)) {
      return next(BadRequest('endTime must be after startTime.'));
    }

    if (new Date(startTime) < new Date()) {
      return next(BadRequest('startTime must not be in the past.'));
    }

    if (capacity !== undefined && capacity !== null) {
      if (
        typeof capacity !== 'number' ||
        !Number.isInteger(capacity) ||
        capacity < 1
      ) {
        return next(BadRequest('capacity must be a positive integer or null.'));
      }
    }

    if (typeof points !== 'number' || !Number.isInteger(points) || points < 1) {
      return next(BadRequest('points must be a positive integer.'));
    }

    next();
  },
];

// GET /events
exports.validateGetEvents = (req, res, next) => {
  const { started, ended, showFull, published, page, limit } = req.query;

  if (started && ended) {
    return next(BadRequest('Cannot specify both started and ended.'));
  }

  const booleans = { started, ended, showFull, published };
  for (const key in booleans) {
    if (booleans[key] && !['true', 'false'].includes(booleans[key])) {
      return next(BadRequest(`${key} must be "true" or "false".`));
    }
    if (key === 'showFull') {
      req.query[key] = booleans[key] === 'true'; // default is false
    } else if (booleans[key]) {
      req.query[key] = booleans[key] === 'true';
    }
  }

  // validate page/limit
  req.query.page = parseInt(page || '1', 10);
  req.query.limit = parseInt(limit || '10', 10);

  if (isNaN(req.query.page) || req.query.page < 1) {
    return next(BadRequest('page must be a positive integer.'));
  }
  if (isNaN(req.query.limit) || req.query.limit < 1) {
    return next(BadRequest('limit must be a positive integer.'));
  }

  next();
};

// PATCH /events/:eventId
exports.validateUpdateEvent = [
  strictBody([
    'name',
    'description',
    'location',
    'startTime',
    'endTime',
    'capacity',
    'points',
    'published',
  ]),
  atLeastOneField,
  (req, res, next) => {
    const { startTime, endTime, capacity, points, published } = req.body;

    if (startTime && !isISODate(startTime)) {
      return next(BadRequest('startTime must be a valid ISO 8601 date.'));
    }

    if (endTime && !isISODate(endTime)) {
      return next(BadRequest('endTime must be a valid ISO 8601 date.'));
    }

    if (startTime && endTime && new Date(endTime) <= new Date(startTime)) {
      return next(BadRequest('endTime must be after startTime.'));
    }

    if (capacity !== undefined && capacity !== null) {
      if (typeof capacity !== 'number' || !Number.isInteger(capacity) || capacity < 1) {
        return next(BadRequest('capacity must be a positive integer or null.'));
      }
    }

    if (
      points !== undefined && points !== null &&
      (typeof points !== 'number' || !Number.isInteger(points) || points < 1)
    ) {
      return next(BadRequest('points must be a positive integer.'));
    }

    if (published !== undefined && published !== null) {
      if (typeof published !== 'boolean') {
        return next(BadRequest('published must be a boolean.'));
      }
    }

    next();
  },
];


// POST /events/:eventId/organizers or /guests
exports.validateAddUserToEvent = [
  strictBody(['utorid']),
  (req, res, next) => {
    if (!req.body.utorid) {
      return next(BadRequest('utorid is required.'));
    }
    if (typeof req.body.utorid !== 'string') {
      return next(BadRequest('utorid must be a string.'));
    }
    next();
  },
];

// POST /events/:eventId/transactions
exports.validateCreateEventTransaction = [
  strictBody(['type', 'utorid', 'amount', 'remark']),
  (req, res, next) => {
    const { type, amount } = req.body;

    if (type !== 'event') {
      return next(BadRequest('type must be "event".'));
    }

    if (amount === undefined) {
      return next(BadRequest('amount is required.'));
    }

    if (typeof amount !== 'number' || !Number.isInteger(amount) || amount < 1) {
      return next(BadRequest('amount must be a positive integer.'));
    }

    next();
  },
];