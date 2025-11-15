'use strict';
const { BadRequest } = require('../utils/errors');

// POST /transactions
exports.validateCreateTransaction = (req, res, next) => {
  const { type, utorid, spent, promotionIds, remark, amount, relatedId } =
    req.body;

  if (!type) {
    return next(BadRequest('type is required.'));
  }

  if (type === 'purchase') {
    const allowedKeys = ['utorid', 'type', 'spent', 'promotionIds', 'remark'];
    for (const key in req.body) {
      if (!allowedKeys.includes(key)) {
        return next(
          BadRequest(`Extra field '${key}' is not allowed for purchase.`)
        );
      }
    }
    if (!utorid || spent === undefined) {
      return next(BadRequest('utorid and spent are required for purchase.'));
    }
    if (typeof spent !== 'number' || spent <= 0) {
      return next(BadRequest('spent must be a positive number.'));
    }
    if (promotionIds && !Array.isArray(promotionIds)) {
      return next(BadRequest('promotionIds must be an array.'));
    }
  } else if (type === 'adjustment') {
    const allowedKeys = [
      'utorid',
      'type',
      'amount',
      'relatedId',
      'promotionIds',
      'remark',
    ];
    for (const key in req.body) {
      if (!allowedKeys.includes(key)) {
        return next(
          BadRequest(`Extra field '${key}' is not allowed for adjustment.`)
        );
      }
    }
    if (utorid === undefined || amount === undefined || relatedId === undefined) {
      return next(
        BadRequest('utorid, amount, and relatedId are required for adjustment.')
      );
    }
    if (typeof amount !== 'number' || !Number.isInteger(amount)) {
      return next(BadRequest('amount must be an integer.'));
    }
    if (
      typeof relatedId !== 'number' ||
      !Number.isInteger(relatedId) ||
      relatedId < 1
    ) {
      return next(BadRequest('relatedId must be a positive integer.'));
    }
  } else {
    return next(
      BadRequest('Invalid transaction type. Must be "purchase" or "adjustment".')
    );
  }

  next();
};

// GET /transactions and GET /users/me/transactions
exports.validateGetTransactions = (req, res, next) => {
  const { type, relatedId, amount, operator, page, limit, suspicious, promotionId } = req.query;

  if (relatedId && !type) {
    return next(BadRequest('type is required when relatedId is provided.'));
  }
  if (amount !== undefined && !operator) {
    return next(BadRequest('operator is required when amount is provided.'));
  }
  if (operator && !['gte', 'lte'].includes(operator)) {
    return next(BadRequest('operator must be "gte" or "lte".'));
  }
  if (type && !['purchase', 'redemption', 'adjustment', 'event', 'transfer'].includes(type)) {
    return next(BadRequest('Invalid transaction type.'));
  }
  if (suspicious && !['true', 'false'].includes(suspicious)) {
    return next(BadRequest('suspicious must be "true" or "false".'));
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

  if (relatedId) req.query.relatedId = parseInt(relatedId, 10);
  if (amount) req.query.amount = parseInt(amount, 10);
  if (suspicious) req.query.suspicious = suspicious === 'true';
  if (promotionId) req.query.promotionId = parseInt(promotionId, 10);

  next();
};

// Middleware for validating :transactionId param
exports.validateTransactionIdParam = (req, res, next) => {
  const id = parseInt(req.params.transactionId, 10);
  if (isNaN(id) || id < 1) {
    return next(BadRequest('Invalid transactionId parameter.'));
  }
  req.params.transactionId = id;
  next();
};

// PATCH /transactions/:transactionId/suspicious
exports.validateUpdateSuspicious = (req, res, next) => {
  if (req.body.suspicious === undefined) {
    return next(BadRequest('suspicious field is required.'));
  }
  if (typeof req.body.suspicious !== 'boolean') {
    return next(BadRequest('suspicious must be a boolean.'));
  }
  next();
};

// PATCH /transactions/:transactionId/processed
exports.validateProcessRedemption = (req, res, next) => {
  if (req.body.processed !== true) {
    return next(BadRequest('processed can only be set to true.'));
  }
  next();
};

// POST /users/:userId/transactions
exports.validateCreateTransfer = (req, res, next) => {
  const { type, amount, remark } = req.body;
  
  const allowedKeys = ['type', 'amount', 'remark'];
  for (const key in req.body) {
    if (!allowedKeys.includes(key)) {
      return next(BadRequest(`Extra field '${key}' is not allowed.`));
    }
  }

  if (type !== 'transfer') {
    return next(BadRequest('type must be "transfer".'));
  }
  if (amount === undefined) {
    return next(BadRequest('amount is required.'));
  }
  if (typeof amount !== 'number' || !Number.isInteger(amount) || amount < 1) {
    return next(BadRequest('amount must be a positive integer.'));
  }
  next();
};

// POST /users/me/transactions
exports.validateCreateRedemption = (req, res, next) => {
  const { type, amount, remark } = req.body;

  const allowedKeys = ['type', 'amount', 'remark'];
  for (const key in req.body) {
    if (!allowedKeys.includes(key)) {
      return next(BadRequest(`Extra field '${key}' is not allowed.`));
    }
  }

  if (type !== 'redemption') {
    return next(BadRequest('type must be "redemption".'));
  }
  if (amount === undefined) {
    return next(BadRequest('amount is required.'));
  }
  if (typeof amount !== 'number' || !Number.isInteger(amount) || amount < 1) {
    return next(BadRequest('amount must be a positive integer.'));
  }
  next();
};