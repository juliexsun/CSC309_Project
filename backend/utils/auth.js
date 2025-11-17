'use strict';

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET environment variable is not set.');
  process.exit(1);
}

/**
 * Compares plaintext password with hashed password.
 * @param {string} inputPassword - The plaintext password from user input.
 * @param {string} storedPassword - The hashed password from the database.
 * @returns {boolean} - True if the passwords match.
 */
const comparePassword = (inputPassword, storedPassword) => {
  return bcrypt.compareSync(inputPassword, storedPassword);
};

/**
 * Hashes a plaintext password.
 * @param {string} password - The plaintext password.
 * @returns {string} - The hashed password.
 */
const hashPassword = (password) => {
  return bcrypt.hashSync(password, 10);
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
  hashPassword,
  signToken,
  getExpirationDate,
};