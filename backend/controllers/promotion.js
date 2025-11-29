'use strict';

const prisma = require('../db/prisma');
const {
  NotFound,
  BadRequest,
  Forbidden,
} = require('../utils/errors');

/**
 * Helper function to format promotion for regular user.
 */
const formatPromoForRegular = (promo) => ({
  id: promo.id,
  name: promo.name,
  description: promo.description,
  type: promo.type === 'onetime' ? 'one-time' : promo.type, // Normalize for frontend
  endTime: promo.endTime,
  minSpending: promo.minSpending,
  rate: promo.rate,
  points: promo.points,
});

/**
 * Helper function to format promotion for manager.
 */
const formatPromoForManager = (promo) => ({
  id: promo.id,
  name: promo.name,
  description: promo.description,
  type: promo.type === 'onetime' ? 'one-time' : promo.type, // Normalize for frontend
  startTime: promo.startTime,
  endTime: promo.endTime,
  minSpending: promo.minSpending,
  rate: promo.rate,
  points: promo.points,
});


/**
 * POST /promotions
 * Create a new promotion
 */
const createPromotion = async (req, res, next) => {
  try {
    const {
      name,
      description,
      type,
      startTime,
      endTime,
      minSpending,
      rate,
      points,
    } = req.body;

    const prismaType = type === 'one-time' ? 'onetime' : type;
    
    const promotion = await prisma.promotion.create({
      data: {
        name,
        description,
        type: prismaType,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        minSpending,
        rate,
        points,
      },
    });

    res.status(201).json(formatPromoForManager(promotion));
  } catch (err) {
    next(err);
  }
};

/**
 * GET /promotions
 * Retrieve a list of promotions
 */
const getPromotions = async (req, res, next) => {
  try {
    // FIX: Destructure orderBy and order from query
    const { name, type, started, ended, page, limit, orderBy, order } = req.query;
    const { id: userId, role } = req.auth;
    const now = new Date();

    const where = {};

    if (name) where.name = { contains: name };
    
    // FIX: Handle 'one-time' -> 'onetime' mapping for filtering
    if (type) {
      where.type = type === 'one-time' ? 'onetime' : type;
    }
    
    if (role === 'regular' || role === 'cashier') {
      // Regular users only see active, available promotions
      where.startTime = { lte: now };
      where.endTime = { gte: now };
      // Filter out 'onetime' promotions they have already used
      where.OR = [
        { type: 'automatic' },
        {
          type: 'onetime',
          NOT: { usedBy: { some: { id: userId } } },
        },
      ];
    } else {
      // Manager/Superuser time filters
      if (started === true) where.startTime = { lte: now };
      if (started === false) where.startTime = { gt: now };
      if (ended === true) where.endTime = { lte: now };
      if (ended === false) where.endTime = { gt: now };
    }
    
    const skip = (page - 1) * limit;
    const total = await prisma.promotion.count({ where });

    // FIX: Dynamic Sorting logic
    const sortField = orderBy || 'startTime';
    const sortDirection = order === 'desc' ? 'desc' : 'asc';

    const promotions = await prisma.promotion.findMany({
      where,
      skip,
      take: limit,
      // FIX: Use dynamic sort instead of hardcoded
      orderBy: { [sortField]: sortDirection },
    });
    
    const results = promotions.map(promo => {
       // Helper to normalize type for response
       const normalizedType = promo.type === 'onetime' ? 'one-time' : promo.type;

       const common = {
         id: promo.id,
         name: promo.name,
         type: normalizedType,
         endTime: promo.endTime,
         minSpending: promo.minSpending,
         rate: promo.rate,
         points: promo.points,
       };
       if (role === 'regular' || role === 'cashier') {
         return common;
       } else {
         return {
           ...common,
           startTime: promo.startTime,
         }
       }
    });

    res.status(200).json({
      count: total,
      results,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /promotions/:promotionId
 * Retrieve a single promotion
 */
const getPromotionById = async (req, res, next) => {
  try {
    const promotionId = parseInt(req.params.promotionId, 10);
    const { role } = req.auth;
    
    const promotion = await prisma.promotion.findUnique({
      where: { id: promotionId },
    });

    if (!promotion) {
      return next(NotFound('Promotion not found.'));
    }
    
    if (role === 'regular' || role === 'cashier') {
      const now = new Date();
      // Regular users can only see active promotions
      if (new Date(promotion.startTime) > now || new Date(promotion.endTime) < now) {
        return next(NotFound('Promotion not found or is not active.'));
      }
      return res.status(200).json(formatPromoForRegular(promotion));
    } else {
      // Manager/Superuser view
      return res.status(200).json(formatPromoForManager(promotion));
    }
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /promotions/:promotionId
 * Update an existing promotion
 */
const updatePromotion = async (req, res, next) => {
  try {
    const promotionId = parseInt(req.params.promotionId, 10);
    const data = req.body;
    const now = new Date();

    const promotion = await prisma.promotion.findUnique({ where: { id: promotionId } });
    if (!promotion) return next(NotFound('Promotion not found.'));
    
    const originalStartTime = new Date(promotion.startTime);
    const originalEndTime = new Date(promotion.endTime);

    // Check time-based update restrictions
    if (originalStartTime <= now) {
      const restrictedFields = ['name', 'description', 'type', 'startTime', 'minSpending', 'rate', 'points'];
      for (const field of restrictedFields) {
        if (data[field] !== undefined) {
          return next(BadRequest(`Cannot update '${field}' after the promotion's original start time.`)); 
        }
      }
    }
    if (originalEndTime <= now && data.endTime !== undefined) {
      return next(BadRequest("Cannot update 'endTime' after the promotion's original end time.")); 
    }
    
    // Validate new times
    if ((data.startTime && new Date(data.startTime) < now) || (data.endTime && new Date(data.endTime) < now)) {
      return next(BadRequest('start time or end time (or both) is in the past.'));
    }

    const dataToUpdate = {};
    for (const key in data) {
      if (data[key] !== null && data[key] !== undefined) { // only update if not null
        if (['startTime', 'endTime'].includes(key)) {
          dataToUpdate[key] = new Date(data[key]);
        } else if (key === 'type') {
          // one-time string in req not onetime
          dataToUpdate[key] = data[key] === 'one-time' ? 'onetime' : data[key];
        } else {
          dataToUpdate[key] = data[key];
        }
      }
    }

    const updatedPromotion = await prisma.promotion.update({
      where: { id: promotionId },
      data: dataToUpdate,
    });
    
    res.status(200).json(formatPromoForManager(updatedPromotion));
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /promotions/:promotionId
 * Remove the specified promotion
 */
const deletePromotion = async (req, res, next) => {
  try {
    const promotionId = parseInt(req.params.promotionId, 10);
    
    const promotion = await prisma.promotion.findUnique({ where: { id: promotionId } });
    if (!promotion) return next(NotFound('Promotion not found.'));
    
    // Check if promotion has started
    if (new Date(promotion.startTime) <= new Date()) {
      return next(Forbidden('Cannot delete a promotion that has already started.'));
    }
    
    await prisma.promotion.delete({ where: { id: promotionId } });
    
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createPromotion,
  getPromotions,
  getPromotionById,
  updatePromotion,
  deletePromotion,
};