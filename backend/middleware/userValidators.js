'use strict';
const { BadRequest } = require('../utils/errors');
const {
  validateUtorid,
  validateName,
  validateEmail,
  validatePassword,
  strictBody,
  atLeastOneField,
} = require('../utils/validationHelpers');

// POST /users
exports.validateCreateUser = [
  strictBody(['utorid', 'name', 'email']),
  (req, res, next) => {
    const { utorid, name, email } = req.body;

    if (!utorid || !name || !email) {
      return next(
        BadRequest(
          'Missing required fields: utorid, name, and email are all required.'
        )
      );
    }

    let err;
    if ((err = validateUtorid(utorid))) return next(BadRequest(err));
    if ((err = validateName(name))) return next(BadRequest(err));
    if ((err = validateEmail(email))) return next(BadRequest(err));

    next();
  },
];


// GET /users
exports.validateGetUsers = (req, res, next) => {
  const { role, verified, activated, page, limit } = req.query;
  const allowedRoles = ['regular', 'cashier', 'manager', 'superuser'];

  if (role && !allowedRoles.includes(role)) {
    return next(Forbidden('Invalid role specified.'));
  }

  if (verified !== undefined) {
    const v = String(verified).toLowerCase();
    if (!['true', 'false'].includes(v)) {
      return next(BadRequest('verified must be true or false.'));
    }
    req.query.verified = v;
  }

  if (activated !== undefined) {
    const a = String(activated).toLowerCase();
    if (!['true', 'false'].includes(a)) {
      return next(BadRequest('activated must be true or false.'));
    }
    req.query.activated = a;
  }

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

// PATCH /users/:userId
exports.validateUpdateUser = [
  strictBody(['email', 'verified', 'suspicious', 'role']),
  atLeastOneField,
  (req, res, next) => {
    const { email, verified, suspicious, role } = req.body;

    if (email) {
      const err = validateEmail(email);
      if (err) return next(BadRequest(err));
    }
    if (verified !== undefined && verified !== null) {
      if (typeof verified !== 'boolean') {
        return next(BadRequest('verified must be a boolean.'));
      }
      if (verified === false) {
        return next(BadRequest('verified can only be set to true.'));
      }
    }
    if (suspicious !== undefined && suspicious !== null && typeof suspicious !== 'boolean'){
      return next(BadRequest('suspicious must be a boolean.'));
    }
    if (role !== undefined && role !== null) {
      const allowedRoles = ['regular', 'cashier', 'manager', 'superuser'];
      if (!allowedRoles.includes(role)) {
        return next(BadRequest('Invalid role specified.'));
      }
    }
    next();
  },
];


// PATCH /users/me
exports.validateUpdateMe = [
  strictBody(['name', 'email', 'birthday', 'avatar']),
  (req, res, next) => {
    const { name, email, birthday } = req.body;

    const hasActualValue = 
        (name !== undefined && name !== null) || 
        (email !== undefined && email !== null) || 
        (birthday !== undefined && birthday !== null);
    const hasFile = !!req.file; 

    if (!hasActualValue && !hasFile) {
      return next(
        BadRequest(
          'At least one non-null field (name, email, birthday) or an avatar file must be provided.'
        )
      );
    }

    if (name !== undefined && name !== null) {
      const err = validateName(name);
      if (err) {
        return next(BadRequest(err));
      }
    }

    if (email !== undefined && email !== null) {
      const err = validateEmail(email);
      if (err){
        return next(BadRequest(err));
      }
    }

    if (birthday !== undefined && birthday !== null) {
        if (typeof birthday !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(birthday)) {
          return next(BadRequest('Birthday must be a string in YYYY-MM-DD format.'));
        }

        const dateParts = birthday.split('-');
        const year = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10);
        const day = parseInt(dateParts[2], 10);

        if (month < 1 || month > 12) {
            return next(BadRequest('Birthday month must be between 01 and 12.'));
        }
        if (day < 1 || day > 31) {
             return next(BadRequest('Birthday day must be between 01 and 31.'));
        }

        const dateObj = new Date(year, month - 1, day);

        if (
          dateObj.getFullYear() !== year ||
          dateObj.getMonth() !== month - 1 ||
          dateObj.getDate() !== day
        ) {
          return next(BadRequest('Birthday is not a valid calendar date.'));
        }
    }
    next();
  },
];

// PATCH /users/me/password
exports.validateUpdatePassword = [
  strictBody(['old', 'new']),
  (req, res, next) => {
    const { old, new: newPassword } = req.body;
    if (!old || !newPassword) {
      return next(BadRequest('old and new passwords are required.'));
    }
    const err = validatePassword(newPassword);
    if (err) return next(BadRequest(err));
    next();
  },
];

// Middleware for validating :userId param
exports.validateUserIdParam = (req, res, next) => {
  const userId = parseInt(req.params.userId, 10);
  if (isNaN(userId) || userId < 1) {
    return next(
      BadRequest('Invalid userId parameter. Must be a positive integer.')
    );
  }
  req.params.userId = userId;
  next();
};