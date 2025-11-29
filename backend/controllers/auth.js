'use strict';

const sendResetEmail = require("../services/emailService");

const prisma = require('../db/prisma');
const { v4: uuidv4 } = require('uuid');
const {
  comparePassword,
  hashPassword,
  signToken,
  getExpirationDate,
} = require('../utils/auth');
const {
  Unauthorized,
  NotFound,
  Gone,
  BadRequest,
} = require('../utils/errors');

/**
 * POST /auth/tokens
 * Authenticate a user and generate a JWT token
 */
const login = async (req, res, next) => {
  try {
    const { utorid, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { utorid },
    });

    // comparePassword now takes (inputPassword, storedPassword)
    if (!user || !comparePassword(password, user.password)) {
      return next(Unauthorized('Invalid utorid or password'));
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const tokenPayload = {
      id: updatedUser.id,
      utorid: updatedUser.utorid,
      role: updatedUser.role,
    };
    const tokenExpiresInDays = 7;
    const token = signToken(tokenPayload, `${tokenExpiresInDays}d`);
    const expiresAt = getExpirationDate(tokenExpiresInDays);

    res.status(200).json({
      token,
      expiresAt,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /auth/resets
 * Request a password reset
 */
const requestReset = async (req, res, next) => {
  try {
    const { utorid, email } = req.body;

    // 1. Find user with BOTH utorid and email
    const user = await prisma.user.findFirst({
      where: {
        utorid,
        email,
      },
    });

    if (!user) {
      return next(NotFound('User not found.')); // Case 8 Fix
    }

    // Invalidate previous active reset tokens for this user by setting their expiry to now.
    // This makes them "Gone" according to the check in performReset.
    await prisma.passwordReset.updateMany({
      where: {
        userId: user.id,
        consumedAt: null, // Only invalidate unconsumed tokens
        expiresAt: { gt: new Date() } // Only invalidate tokens not already expired
      },
      data: {
        expiresAt: new Date() // invalidating them immediately
      }
    });

    // Generate a NEW reset token
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // send email
    await sendResetEmail({ to: email, utorid, resetToken: token });

    // Create the new token record
    await prisma.passwordReset.create({
      data: {
        token,
        expiresAt,
        userId: user.id,
        // consumedAt is null initially
      },
    });

    return res.status(202).json({
      expiresAt,
      resetToken: token,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /auth/resets/:resetToken
 * Reset the password of a user given a reset token
 */
const performReset = async (req, res, next) => {
  try {
    const { resetToken } = req.params;
    const { utorid, password } = req.body;

    const resetRequest = await prisma.passwordReset.findUnique({
      where: { token: resetToken },
      include: { user: true },
    });

    // Check if token exists
    if (!resetRequest) {
      return next(NotFound('Reset token not found.'));
    }

    if (new Date() >= new Date(resetRequest.expiresAt)) {
      // The updateMany in requestReset sets expiresAt to now for old tokens,
      // so this check will correctly identify them as expired.
      return next(Gone('Reset token has expired.'));
    }

    if (resetRequest.consumedAt) {
        return next(Gone('Reset token has already been used.'));
    }

    if (resetRequest.user.utorid !== utorid) {
       return next(Unauthorized('Invalid utorid for this reset token.'));
    }

    // Update user's password,  AND mark token as consumed in a transaction
    await prisma.$transaction([
        prisma.user.update({
            where: { id: resetRequest.userId },
            data: {
              password: hashPassword(password),
            },
        }),
        prisma.passwordReset.update({
            where: { id: resetRequest.id },
            data: { consumedAt: new Date() }
        })
    ]);

    res.status(200).json({ message: 'Password has been reset successfully.' }); //
  } catch (err) {
    next(err);
  }
};

module.exports = {
  login,
  requestReset,
  performReset,
};