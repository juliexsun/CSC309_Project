'use strict';

const express = require('express');
const transactionController = require('../controllers/transaction');
const { protect } = require('../middleware/auth');
const {
  validateCreateTransaction,
  validateGetTransactions,
  validateTransactionIdParam,
  validateUpdateSuspicious,
  validateProcessRedemption,
} = require('../middleware/transactionValidators');

const router = express.Router();

// POST /transactions - Create a purchase or adjustment transaction
router.post(
  '/',
  protect(['cashier', 'manager', 'superuser']),
  validateCreateTransaction,
  transactionController.createTransaction
);

// GET /transactions - Retrieve a list of all transactions
router.get(
  '/',
  protect(['manager', 'superuser']),
  validateGetTransactions,
  transactionController.getAllTransactions
);

// GET /transactions/:transactionId - Retrieve a single transaction
router.get(
  '/:transactionId',
  protect(['manager', 'superuser']),
  validateTransactionIdParam,
  transactionController.getTransactionById
);

// PATCH /transactions/:transactionId/suspicious - Mark a transaction as suspicious
router.patch(
  '/:transactionId/suspicious',
  protect(['manager', 'superuser']),
  validateTransactionIdParam,
  validateUpdateSuspicious,
  transactionController.updateSuspicious
);

// PATCH /transactions/:transactionId/processed - Process a redemption
router.patch(
  '/:transactionId/processed',
  protect(['cashier', 'manager', 'superuser']),
  validateTransactionIdParam,
  validateProcessRedemption,
  transactionController.processRedemption
);

module.exports = router;