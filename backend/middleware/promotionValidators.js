'use strict';
const { BadRequest } = require('../utils/errors');
const {
  isISODate,
  atLeastOneField,
  strictBody,
} = require('../utils/validationHelpers');

// Middleware for validating :promotionId param
exports.validatePromotionIdParam = (req, res, next) => {
  const id = parseInt(req.params.promotionId, 10);
  if (isNaN(id) || id < 1) {
    return next(BadRequest('Invalid promotionId parameter.'));
  }
  req.params.promotionId = id;
  next();
};

// POST /promotions
exports.validateCreatePromotion = [
  strictBody([
    'name',
    'description',
    'type',
    'startTime',
    'endTime',
    'minSpending',
    'rate',
    'points',
  ]),
  (req, res, next) => {
    const {
      name,
      description,
      type,
      startTime,
      endTime,
      minSpending,
      rate,
      points,
    } = req.body;

    if (!name || !description || !type || !startTime || !endTime) {
      return next(
        BadRequest(
          'Missing required fields: name, description, type, startTime, and endTime are required.'
        )
      );
    }

    if (!['automatic', 'one-time'].includes(type)) {
      return next(BadRequest('type must be "automatic" or "onetime".'));
    }

    if (!isISODate(startTime)) {
      return next(BadRequest('startTime must be a valid ISO 8601 date.'));
    }
    if (!isISODate(endTime)) {
      return next(BadRequest('endTime must be a valid ISO 8601 date.'));
    }
    if (new Date(endTime) <= new Date(startTime)) {
      return next(BadRequest('endTime must be after startTime.'));
    }

    // removed to try and fix 102. no change
    // if (new Date(startTime) < new Date()) {
    //   return next(BadRequest('startTime must not be in the past.'));
    // }

    if (minSpending !== undefined && minSpending !== null) {
      if (typeof minSpending !== 'number' || minSpending <= 0) {
        return next(BadRequest('minSpending must be a positive number.'));
      }
    }

    if (rate !== undefined && rate !== null) {
      if (typeof rate !== 'number' || rate <= 0) {
        return next(BadRequest('rate must be a positive number.'));
      }
    }

    if (points !== undefined && points !== null) {
      if (
        typeof points !== 'number' ||
        !Number.isInteger(points) ||
        points < 0
      ) {
        return next(BadRequest('points must be a positive integer.'));
      }
    }

    next();
  },
];

// GET /promotions
exports.validateGetPromotions = (req, res, next) => {
  const { type, started, ended, page, limit } = req.query;

  if (started && ended) {
    return next(BadRequest('Cannot specify both started and ended.'));
  }

  if (type && !['automatic', 'one-time'].includes(type)) {
    return next(BadRequest('type must be "automatic" or "onetime".'));
  }

  const booleans = { started, ended };
  for (const key in booleans) {
    if (booleans[key] && !['true', 'false'].includes(booleans[key])) {
      return next(BadRequest(`${key} must be "true" or "false".`));
    }
    if (booleans[key]) {
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

// PATCH /promotions/:promotionId
exports.validateUpdatePromotion = [
  strictBody([
    'name',
    'description',
    'type',
    'startTime',
    'endTime',
    'minSpending',
    'rate',
    'points',
  ]),
  atLeastOneField,
  (req, res, next) => {
    const { type, startTime, endTime, minSpending, rate, points } = req.body;

    if (type && !['automatic', 'one-time'].includes(type)) {
      return next(BadRequest('type must be "automatic" or "onetime".'));
    }

    if (startTime && !isISODate(startTime))
      return next(BadRequest('startTime must be a valid ISO 8601 date.'));
    if (endTime && !isISODate(endTime))
      return next(BadRequest('endTime must be a valid ISO 8601 date.'));

    if (startTime && endTime && new Date(endTime) <= new Date(startTime)) {
      return next(BadRequest('endTime must be after startTime.'));
    }

    if (minSpending !== undefined && minSpending !== null) {
      if (typeof minSpending !== 'number' || minSpending <= 0) {
        return next(BadRequest('minSpending must be a positive number.'));
      }
    }

    if (rate !== undefined && rate !== null) {
      if (typeof rate !== 'number' || rate <= 0) {
        return next(BadRequest('rate must be a positive number.'));
      }
    }

    if (points !== undefined && points !== null) {
      if (
        typeof points !== 'number' ||
        !Number.isInteger(points) ||
        points < 0
      ) {
        return next(BadRequest('points must be a positive integer.'));
      }
    }

    next();
  },
];