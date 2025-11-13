'use strict';

/**
 * Custom error class for API errors.
 * This allows us to throw errors with a specific status code and message.
 * @param {number} statusCode - The HTTP status code (e.g., 400, 403, 404).
 * @param {string} message - The error message to be sent in the JSON response.
 */
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

// Specific error types for common scenarios
const Errors = {
  BadRequest: (message = 'Bad Request') => new ApiError(400, message),
  Unauthorized: (message = 'Unauthorized') => new ApiError(401, message),
  Forbidden: (message = 'Forbidden') => new ApiError(403, message),
  NotFound: (message = 'Not Found') => new ApiError(404, message),
  MethodNotAllowed: (message = 'Method Not Allowed') => new ApiError(405, message),
  Conflict: (message = 'Conflict') => new ApiError(409, message),
  Gone: (message = 'Gone') => new ApiError(410, message),
  TooManyRequests: (message = 'Too Many Requests') => new ApiError(429, message),
};

module.exports = {
  ApiError,
  ...Errors,
};