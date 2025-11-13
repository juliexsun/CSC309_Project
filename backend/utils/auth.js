'use strict';

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET environment variable is not set.');
  process.exit(1);
}

/**
 * Compares two plaintext passwords.
 * @param {string} inputPassword - The plaintext password from user input.
 * @param {string} storedPassword - The plaintext password from the database.
 * @returns {boolean} - True if the passwords match exactly.
 */
const comparePassword = (inputPassword, storedPassword) => {
  // Direct string comparison for plaintext
  return inputPassword === storedPassword;
};

/**
 * Signs a JWT token.
 * @param {object} payload - The payload to include in the token (e.g., userId, utorid, role).
 * @param {string} expiresIn - Token expiration time (e.g., '7d').
 * @returns {string} - The signed JWT.
 */
const signToken = (payload, expiresIn = '7d') => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

/**
 * Calculates the expiration date for a token.
 * @param {number} days - Number of days until expiration.
 * @returns {Date} - The expiration timestamp.
 */
const getExpirationDate = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

module.exports = {
  comparePassword,
  signToken,
  getExpirationDate,
};