'use strict';
const { BadRequest } = require('./errors');

/**
 * Validates password complexity
 * @param {string} password
 * @returns {string|null} Error message or null if valid
 */
exports.validatePassword = (password) => {
  if (typeof password !== 'string') {
    return 'Password must be a string.';
  }
  if (password.length < 8 || password.length > 20) {
    return 'Password must be 8-20 characters';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number';
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'Password must contain at least one special character';
  }
  return null;
};

/**
 * Validates U of T email format
 * @param {string} email
 * @returns {string|null} Error message or null if valid
 */
exports.validateEmail = (email) => {
  if (typeof email !== 'string') {
    return 'Email must be a string.';
  }
  if (!/@(mail\.utoronto\.ca|utoronto\.ca)$/.test(email)) {
    return 'Email must be a valid University of Toronto email';
  }
  return null;
};

/**
 * Validates utorid format
 * @param {string} utorid
 * @returns {string|null} Error message or null if valid
 */
exports.validateUtorid = (utorid) => {
  if (typeof utorid !== 'string') {
    return 'utorid must be a string.';
  }
  if (utorid.length < 7 || utorid.length > 8) {
    return 'utorid must be 7-8 alphanumeric characters';
  }
  if (!/^[a-zA-Z0-9]+$/.test(utorid)) {
    return 'utorid must be alphanumeric';
  }
  return null;
};

/**
 * Validates name format
 * @param {string} name
 * @returns {string|null} Error message or null if valid
 */
exports.validateName = (name) => {
  if (typeof name !== 'string') {
    return 'Name must be a string.';
  }
  if (name.length < 1 || name.length > 50) {
    return 'Name must be 1-50 characters';
  }
  return null;
};

/**
 * Middleware to check for unexpected fields in the request body
 * @param {string[]} allowedKeys
 */
exports.strictBody = (allowedKeys) => {
  return (req, res, next) => {
    for (const key in req.body) {
      if (!allowedKeys.includes(key)) {
        return next(
          BadRequest(`Extra field '${key}' is not allowed in body.`)
        );
      }
    }
    next();
  };
};

/**
 * Middleware to check that at least one field is in the body.
 * This fixes Cases 22 and 33.
 */
exports.atLeastOneField = (req, res, next) => {
  if (Object.keys(req.body).length === 0) {
    return next(BadRequest('At least one field must be provided to update.'));
  }
  next();
};

/**
 * Validates ISO 8601 date strings.
 * @param {string} dateString
 * @returns {boolean}
 */
exports.isISODate = (dateString) => {
  if (typeof dateString !== 'string') return false;

  const d = new Date(dateString);
  
  // new Date() returns 'Invalid Date' for unparsable strings,
  // and its time value will be NaN.
  return !isNaN(d.getTime());
};