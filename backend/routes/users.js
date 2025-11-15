'use strict';

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const userController = require('../controllers/user');
const transactionController = require('../controllers/transaction'); // For /users/:userId/transactions
const { authenticate, protect } = require('../middleware/auth');
const {
  validateCreateUser,
  validateGetUsers,
  validateUpdateUser,
  validateUpdateMe,
  validateUpdatePassword,
  validateUserIdParam,
} = require('../middleware/userValidators');
const {
  validateCreateTransfer,
  validateCreateRedemption,
  validateGetTransactions, // For GET /users/me/transactions
} = require('../middleware/transactionValidators');

const router = express.Router();

// --- Multer Setup for Avatar Uploads ---
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', 'uploads', 'avatars');
    // Ensure the directory exists
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate a unique filename: utorid + extension
    const utorid = req.auth.utorid;
    const extension = path.extname(file.originalname);
    cb(null, `${utorid}${extension}`);
  },
});

const upload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file limit
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
});

// POST /users - Register a new user
router.post(
  '/',
  protect(['cashier', 'manager', 'superuser']),
  validateCreateUser,
  userController.createUser
);

// GET /users - Retrieve a list of users
router.get(
  '/',
  protect(['manager', 'superuser']),
  validateGetUsers,
  userController.getUsers
);

// GET /users/me - Retrieve current user's info
router.get(
  '/me',
  authenticate,
  userController.getMe
);

// PATCH /users/me - Update current user's info
router.patch(
  '/me',
  authenticate,
  upload.single('avatar'), // Multer middleware for file upload
  validateUpdateMe, // Manual validation for body fields
  userController.updateMe
);

// PATCH /users/me/password - Update current user's password
router.patch(
  '/me/password',
  authenticate,
  validateUpdatePassword,
  userController.updatePassword
);

// GET /users/me/transactions - Get current user's transactions
router.get(
  '/me/transactions',
  authenticate,
  validateGetTransactions, // Use the same validator as GET /transactions
  transactionController.getMyTransactions
);

// POST /users/me/transactions - Create a redemption transaction
router.post(
  '/me/transactions',
  authenticate,
  validateCreateRedemption,
  transactionController.createRedemption
);

// GET /users/:userId - Retrieve a specific user
router.get(
  '/:userId',
  protect(['cashier', 'manager', 'superuser']),
  validateUserIdParam,
  userController.getUserById
);

// PATCH /users/:userId - Update a specific user
router.patch(
  '/:userId',
  protect(['manager', 'superuser']),
  validateUserIdParam,
  validateUpdateUser,
  userController.updateUser
);

// POST /users/:userId/transactions - Create a transfer transaction
router.post(
  '/:userId/transactions',
  authenticate,
  validateUserIdParam,
  validateCreateTransfer,
  transactionController.createTransfer
);

module.exports = router;