'use strict';

const prisma = require('../db/prisma');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const {
  NotFound,
  Conflict,
  Forbidden,
  BadRequest,
} = require('../utils/errors');
const { comparePassword } = require('../utils/auth');


/**
 * POST /users
 * Register a new user
 */
const createUser = async (req, res, next) => {
  try {
    const { utorid, name, email } = req.body;
    const tempPassword = uuidv4() + Date.now();

    // Create the user
    const user = await prisma.user.create({
      data: {
        utorid,
        name,
        email,
        password: tempPassword,
        verified: false,
      },
    });

    // Create an activation token (which is a password reset token)
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const resetRequest = await prisma.passwordReset.create({
      data: {
        token,
        expiresAt,
        userId: user.id,
      },
    });

    res.status(201).json({
      id: user.id,
      utorid: user.utorid,
      name: user.name,
      email: user.email,
      verified: user.verified,
      expiresAt: resetRequest.expiresAt,
      resetToken: resetRequest.token,
    });
  } catch (e) {
    if (e.code === 'P2002') {
      const field = e.meta.target.includes('utorid') ? 'utorid' : 'email';
      return next(Conflict(`User with that ${field} already exists`));
    }
    next(e);
  }
};

/**
 * GET /users
 * Retrieve a list of users
 */
const getUsers = async (req, res, next) => {
  try {

    const { name, role, verified, activated } = req.query;

    const page = req.query.page;
    const limit = req.query.limit;

    const where = {};

    if (name) {
      where.OR = [
        { name: { contains: name } },
        { utorid: { contains: name } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (verified !== undefined) {
      const isVerified = String(verified).toLowerCase() === 'true';
      where.verified = isVerified;
    }

    if (activated !== undefined) {
      const isActivated = String(activated).toLowerCase() === 'true';
      where.lastLogin = isActivated ? { not: null } : null;
    }

    const skip = (page - 1) * limit;

    const totalUsers = await prisma.user.count({ where });

    const users = await prisma.user.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        utorid: true,
        name: true,
        email: true,
        birthday: true,
        role: true,
        points: true,
        createdAt: true,
        lastLogin: true,
        verified: true,
        avatarUrl: true,
      },
      orderBy: { id: 'asc' },
    });

    res.status(200).json({
      count: totalUsers,
      results: users,
    });
  } catch (err) {
    next(err);
  }
};


/**
 * GET /users/:userId
 * Retrieve a specific user
 */
const getUserById = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    const requestingUserRole = req.auth.role; // Role of the user making the request

    // Define what to select based on the user's role
    let selectClause;
    if (requestingUserRole === 'cashier') {
      selectClause = {
        id: true,
        utorid: true,
        name: true,
        points: true,
        verified: true,
      };
    } else {
      selectClause = {
        id: true,
        utorid: true,
        name: true,
        email: true,
        birthday: true,
        role: true,
        points: true,
        createdAt: true,
        lastLogin: true,
        verified: true,
        avatarUrl: true,
      };
    }

    // 1. Get the user *without* promotions
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: selectClause,
    });

    if (!user) {
      return next(NotFound('User not found'));
    }

    // 2. Query for available one-time promotions separately
    const availablePromotions = await prisma.promotion.findMany({
      where: {
        type: 'onetime',
        NOT: {
          usedBy: {
            some: { id: userId },
          },
        },
      },
      select: {
        id: true,
        name: true,
        minSpending: true,
        rate: true,
        points: true,
      },
    });

    // 3. Add the promotions to the user object
    user.promotions = availablePromotions;

    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /users/:userId
 * Update a specific user's status
 */
const updateUser = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    const { email, verified, suspicious, role } = req.body;
    const { role: adminRole } = req.auth;

    const dataToUpdate = {};

    if (email) dataToUpdate.email = email;
    if (verified === true) dataToUpdate.verified = true;
    if (suspicious) dataToUpdate.suspicious = suspicious;

    if (role) {
      // Role update logic depends on the admin's role
      if (adminRole === 'superuser') {
        dataToUpdate.role = role;
      } else if (adminRole === 'manager') {
        if (role === 'cashier' || role === 'regular') {
          dataToUpdate.role = role;
        } else {
          return next(
            Forbidden('Managers can only set roles to cashier or regular.')
          );
        }
      }
    }

    // Check if user exists before update
    const userToUpdate = await prisma.user.findUnique({ where: { id: userId } });
    if (!userToUpdate) return next(NotFound('User not found'));

    // If promoting to cashier, set suspicious to false
    if (role === 'cashier') {
      dataToUpdate.suspicious = false;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
    });

    // Return only the fields that were updated, plus key info
    const response = {
      id: updatedUser.id,
      utorid: updatedUser.utorid,
      name: updatedUser.name,
    };
    if (email) response.email = updatedUser.email;
    if (verified) response.verified = updatedUser.verified;
    if (suspicious) response.suspicious = updatedUser.suspicious;
    if (role) response.role = updatedUser.role;

    res.status(200).json(response);
  } catch (e) {
    if (e.code === 'P2025') {
      return next(NotFound('User not found'));
    }
    if (e.code === 'P2002') {
      return next(Conflict('Email already in use.'));
    }
    next(e);
  }
};

/**
 * GET /users/me
 * Retrieve the current logged-in user's information
 */
const getMe = async (req, res, next) => {
  try {
    const userId = req.auth.id;

    // 1. Get the user *without* promotions
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        utorid: true,
        name: true,
        email: true,
        birthday: true,
        role: true,
        points: true,
        createdAt: true,
        lastLogin: true,
        verified: true,
        avatarUrl: true,
      },
    });

    if (!user) {
      return next(NotFound('User not found. This should not happen.'));
    }

    // 2. Query for available one-time promotions separately
    const availablePromotions = await prisma.promotion.findMany({
      where: {
        type: 'onetime',
        NOT: {
          usedBy: {
            some: { id: userId },
          },
        },
      },
      select: {
        id: true,
        name: true,
        minSpending: true,
        rate: true,
        points: true,
      },
    });

    // 3. Add the promotions to the user object
    user.promotions = availablePromotions;

    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /users/me
 * Update the current logged-in user's information
 */
const updateMe = async (req, res, next) => {
  try {
    const userId = req.auth.id;
    const { name, email, birthday } = req.body;
    const dataToUpdate = {};

    if (name) dataToUpdate.name = name;
    if (email) dataToUpdate.email = email;
    if (birthday) dataToUpdate.birthday = birthday;


    // Check if a file was uploaded
    if (req.file) {
      // Construct the URL path for the avatar
      dataToUpdate.avatarUrl = `/uploads/avatars/${req.file.filename}`;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      select: {
        id: true,
        utorid: true,
        name: true,
        email: true,
        birthday: true,
        role: true,
        points: true,
        createdAt: true,
        lastLogin: true,
        verified: true,
        avatarUrl: true,
      },
    });

    res.status(200).json(updatedUser);
  } catch (e) {
    if (e.code === 'P2025') {
      return next(NotFound('User not found'));
    }
    if (e.code === 'P2002') {
      return next(Conflict('Email already in use.'));
    }
    next(e);
  }
};

/**
 * PATCH /users/me/password
 * Update the current logged-in user's password
 */
const updatePassword = async (req, res, next) => {
  try {
    const userId = req.auth.id;
    const { old: oldPassword, new: newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return next(NotFound('User not found.'));
    }

    if (!comparePassword(oldPassword, user.password)) {
      return next(Forbidden('Incorrect current password.'));
    }

    await prisma.user.update({
      where: { id: userId },
      data: { password: newPassword },
    });

    res.status(200).json({ message: 'Password updated successfully.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  getMe,
  updateMe,
  updatePassword,
};