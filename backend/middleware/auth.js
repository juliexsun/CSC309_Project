'use strict';

const { expressjwt } = require('express-jwt');
const { Forbidden } = require('../utils/errors');

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Authentication middleware.
 * Verifies the JWT token from the Authorization header.
 * If valid, attaches the payload to `req.auth`.
 * If invalid or missing, throws an 'UnauthorizedError'
 */
const authenticate = expressjwt({
  secret: JWT_SECRET,
  algorithms: ['HS256'],
});

/**
 * Authorization middleware factory.
 * Returns a middleware function that checks if the authenticated user's role
 * is included in the allowed roles.
 * @param {string[]} allowedRoles - Array of roles that are allowed (e.g., ['manager', 'superuser']).
 * @returns {function} - The middleware function.
 */
const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    // Ensure allowedRoles is always an array
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    // Get user role from the token payload (attached by 'authenticate' middleware)
    const userRole = req.auth?.role;

    // Superusers have full database access and all privileges
    if (userRole === 'superuser') {
        return next();
    }

    if (!roles.includes(userRole)) {
      return next(Forbidden('You do not have permission to perform this action.'));
    }

    // User is authorized
    next();
  };
};

/**
 * Combines authentication and authorization into a single middleware.
 * This is useful for most protected routes.
 * @param {string[]} allowedRoles - Array of allowed roles.
 */
const protect = (allowedRoles) => {
  // authenticate runs first, then authorize
  return [authenticate, authorize(allowedRoles)];
};

module.exports = {
  authenticate,
  authorize,
  protect,
};