'use strict';

const express = require('express');
const promotionController = require('../controllers/promotion');
const { authenticate, protect } = require('../middleware/auth');
const {
  validateCreatePromotion,
  validateGetPromotions,
  validatePromotionIdParam,
  validateUpdatePromotion,
} = require('../middleware/promotionValidators');

const router = express.Router();

// POST /promotions - Create a new promotion
router.post(
  '/',
  protect(['manager', 'superuser']),
  validateCreatePromotion,
  promotionController.createPromotion
);

// GET /promotions - Retrieve a list of promotions
router.get(
  '/',
  authenticate,
  validateGetPromotions,
  promotionController.getPromotions
);

// GET /promotions/:promotionId - Retrieve a single promotion
router.get(
  '/:promotionId',
  authenticate,
  validatePromotionIdParam,
  promotionController.getPromotionById
);

// PATCH /promotions/:promotionId - Update an existing promotion
router.patch(
  '/:promotionId',
  protect(['manager', 'superuser']),
  validatePromotionIdParam,
  validateUpdatePromotion,
  promotionController.updatePromotion
);

// DELETE /promotions/:promotionId - Remove the specified promotion
router.delete(
  '/:promotionId',
  protect(['manager', 'superuser']),
  validatePromotionIdParam,
  promotionController.deletePromotion
);

module.exports = router;