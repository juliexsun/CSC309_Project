'use strict';
const { BadRequest } = require('../utils/errors');
const { validatePassword } = require('../utils/validationHelpers');

// POST /auth/tokens
exports.validateLogin = (req, res, next) => {
  const { utorid, password } = req.body;
  if (!utorid || !password) {
    return next(BadRequest('utorid and password are required.'));
  }
  if (typeof utorid !== 'string' || typeof password !== 'string') {
    return next(BadRequest('utorid and password must be strings.'));
  }
  next();
};

// POST /auth/resets
exports.validateRequestReset = (req, res, next) => {
  const { utorid, email } = req.body;

  if (!req.body.utorid) {
    return next(BadRequest('utorid is required.'));
  }
  if (!req.body.email) {
    return next(BadRequest('email is required.'));
  }
  if (typeof req.body.utorid !== 'string') {
    return next(BadRequest('utorid must be a string.'));
  }
  next();
};

// POST /auth/resets/:resetToken
exports.validatePerformReset = (req, res, next) => {
  const { utorid, password } = req.body;

  if (!utorid || !password) {
    return next(BadRequest('utorid and password are required.'));
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    return next(BadRequest(passwordError));
  }

  next();
};