'use strict';

const prisma = require('../db/prisma');
const {
  NotFound,
  BadRequest,
  Forbidden,
} = require('../utils/errors');

const { sendNotification } = require("../utils/sendNotification");
const { sendNotificationToMany } = require("../utils/sendNotification");

/**
 * Calculates points for a purchase transaction.
 */
const calculatePoints = (spent, promotions = []) => {
  // Base rate: 1 point per 25 cents
  let points = Math.round(spent / 0.25);

  // Apply promotions
  promotions.forEach(promo => {
    if (promo.rate && (!promo.minSpending || spent >= promo.minSpending)) {
      if (promo.rate) {
        // Example rate: 0.01 means 1 extra point per dollar
        points += Math.round(spent * promo.rate * 100); 
      }
    }
    // One-time or automatic 'points' bonus
    if (promo.points && (!promo.minSpending || spent >= promo.minSpending)) {
      points += promo.points;
    }
  });
  
  return points;
};

/**
 * Helper function to find a user by utorid. Throws NotFound if not found.
 */
const findUserByUtorid = async (utorid) => {
  const user = await prisma.user.findUnique({ where: { utorid } });
  if (!user) {
    throw NotFound(`User with utorid '${utorid}' not found.`);
  }
  return user;
};

/**
 * Helper function to build the common WHERE clause for transaction filtering.
 */
const buildTransactionWhereClause = (query, extraWhere = {}) => {
  const { name, createdBy, suspicious, promotionId, type, relatedId, amount, operator } = query;
  const where = { ...extraWhere };

  if (name) {
    where.user = {
      OR: [
        { name: { contains: name } },
        { utorid: { contains: name } },
      ],
    };
  }
  if (createdBy) {
    where.createdBy = { utorid: { contains: createdBy } };
  }
  if (suspicious !== undefined) {
    where.suspicious = suspicious;
  }
  if (promotionId) {
    where.promotions = { some: { id: promotionId } };
  }
  if (type) {
    where.type = type;
  }
  if (relatedId) {
    where.relatedId = relatedId;
  }
  if (amount !== undefined && operator) {
    where.amount = { [operator]: amount };
  }

  return where;
};


/**
 * POST /transactions
 * Create a new purchase or adjustment transaction
 */
const createTransaction = async (req, res, next) => {
  try {
    const { type } = req.body;
    const createdById = req.auth.id;

    if (type === 'purchase') {
      return createPurchase(req, res, next);
    } else if (type === 'adjustment') {
      return createAdjustment(req, res, next);
    } else {
      return next(BadRequest('Invalid transaction type.'));
    }
  } catch (err) {
    next(err);
  }
};

/**
 * Handles 'purchase' transaction creation.
 */
const createPurchase = async (req, res, next) => {
  try {
    const { utorid, spent, promotionIds = [], remark } = req.body;
    const createdById = req.auth.id;
    const now = new Date();

    const [customer, cashier] = await Promise.all([
      findUserByUtorid(utorid),
      prisma.user.findUnique({ where: { id: createdById } })
    ]);

    let appliedPromotions = [];
    if (promotionIds.length > 0) {
      // Validate promotions
      appliedPromotions = await prisma.promotion.findMany({
        where: { id: { in: promotionIds } }
      });
      if (appliedPromotions.length !== promotionIds.length) {
        return next(BadRequest('One or more promotion IDs are invalid.'));
      }

      for (const promo of appliedPromotions) {
        if (new Date(promo.startTime) > now || new Date(promo.endTime) < now) {
          return next(BadRequest('Promotion not active'));
        }
      }
      
      // Check for one-time promotions
      for (const promo of appliedPromotions.filter(p => p.type === 'onetime')) {
         const usage = await prisma.user.count({
           where: { id: customer.id, usedPromotions: { some: { id: promo.id } } }
         });
         if (usage > 0) {
           return next(BadRequest(`Promotion '${promo.name}' has already been used.`));
         }
      }
    }
    
    // Get active 'automatic' promotions
    const automaticPromotions = await prisma.promotion.findMany({
      where: {
        type: 'automatic',
        startTime: { lte: now },
        endTime: { gte: now },
      }
    });

    const allPromotions = [...appliedPromotions, ...automaticPromotions];
    const pointsEarned = calculatePoints(spent, allPromotions);
    
    // Check if cashier is suspicious
    const isSuspicious = cashier.suspicious;
    const pointsAwarded = isSuspicious ? 0 : pointsEarned;

    const transaction = await prisma.transaction.create({
      data: {
        type: 'purchase',
        amount: pointsEarned,
        spent,
        remark,
        suspicious: isSuspicious,
        userId: customer.id,
        createdById: cashier.id,
        promotions: {
          connect: allPromotions.map(p => ({ id: p.id })),
        },
      },
    });

    // Connect one-time promotions to user
    const oneTimePromoIds = appliedPromotions
      .filter(p => p.type === 'onetime')
      .map(p => ({ id: p.id }));

    // Update user points and link used promotions
    await prisma.user.update({
      where: { id: customer.id },
      data: {
        points: {
          increment: pointsAwarded, // Don't award points if suspicious
        },
        usedPromotions: {
          connect: oneTimePromoIds
        }
      },
    });

    const io = req.app.get("io");
    console.log('>>> io in createPurchase:', !!io);

    // Notify the user via WebSocket
    // io.to(`user:${customer.id}`).emit("notification", {
    //   type: "purchase_created",
    //   message: `A purchase was created for you, you earned ${pointsAwarded} points.`,
    //   transactionId: transaction.id,
    //   spent,
    //   createdAt: transaction.createdAt,
    // });

    // io.to(`user:${cashier.id}`).emit("notification", {
    //   type: "purchase_created",
    //   message: `You created a purchase for ${customer.utorid}, they earned ${pointsAwarded} points.`,
    //   transactionId: transaction.id,
    //   spent,
    //   createdAt: transaction.createdAt,
    // });
    await sendNotification(customer.id, "success", `Your purchase earned ${pointsAwarded} points.`);
    await sendNotification(cashier.id, "success", `You created a purchase for ${customer.utorid}, they earned ${pointsAwarded} points.`);


    res.status(201).json({
      id: transaction.id,
      utorid: customer.utorid,
      type: transaction.type,
      spent: transaction.spent,
      earned: pointsAwarded,
      remark: transaction.remark,
      promotionIds: allPromotions.map(p => p.id),
      createdBy: cashier.utorid,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Handles 'adjustment' transaction creation.
 */
const createAdjustment = async (req, res, next) => {
   try {
    const { utorid, amount, relatedId, remark } = req.body;
    const createdById = req.auth.id;

    const [customer, manager] = await Promise.all([
      findUserByUtorid(utorid),
      prisma.user.findUnique({ where: { id: createdById } })
    ]);
    
    // Check if related transaction exists
    const relatedTransaction = await prisma.transaction.findUnique({
      where: { id: relatedId }
    });
    if (!relatedTransaction) {
      return next(NotFound('The related transaction does not exist.'));
    }

    // Create the transaction and update user points
    const [transaction, _] = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          type: 'adjustment',
          amount,
          remark,
          relatedId,
          userId: customer.id,
          createdById: manager.id,
        },
      }),
      prisma.user.update({
        where: { id: customer.id },
        data: {
          points: {
            increment: amount, // Apply adjustment immediately
          },
        },
      }),
    ]);
    
    res.status(201).json({
      id: transaction.id,
      utorid: customer.utorid,
      amount: transaction.amount,
      type: transaction.type,
      relatedId: transaction.relatedId,
      remark: transaction.remark,
      promotionIds: [], // Adjustments don't have promotions
      createdBy: manager.utorid,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /transactions
 * Retrieve a list of all transactions
 */
const getAllTransactions = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const where = buildTransactionWhereClause(req.query);
    
    const skip = (page - 1) * limit;
    const total = await prisma.transaction.count({ where });
    const transactions = await prisma.transaction.findMany({
      where,
      skip,
      take: limit,
      include: {
        user: { select: { utorid: true } },
        createdBy: { select: { utorid: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    const results = transactions.map(t => ({
      id: t.id,
      utorid: t.user.utorid,
      amount: t.amount,
      type: t.type,
      spent: t.spent,
      redeemed: t.type === 'redemption' ? t.amount : undefined,
      promotionIds: [],
      suspicious: t.suspicious,
      remark: t.remark,
      createdBy: t.createdBy.utorid,
      relatedId: t.relatedId,
      createdAt: t.createdAt
    }));

    res.status(200).json({
      count: total,
      results,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /transactions/:transactionId
 * Retrieve a single transaction
 */
const getTransactionById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.transactionId, 10);
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        user: { select: { utorid: true } },
        createdBy: { select: { utorid: true } },
        promotions: { select: { id: true } }
      }
    });

    if (!transaction) {
      return next(NotFound('Transaction not found'));
    }

    res.status(200).json({
      id: transaction.id,
      utorid: transaction.user.utorid,
      type: transaction.type,
      spent: transaction.spent,
      amount: transaction.amount,
      promotionIds: transaction.promotions.map(p => p.id),
      suspicious: transaction.suspicious,
      remark: transaction.remark,
      createdBy: transaction.createdBy.utorid,
      relatedId: transaction.relatedId
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /transactions/:transactionId/suspicious
 * Set or unset a transaction as being suspicious
 */
const updateSuspicious = async (req, res, next) => {
  try {
    const id = parseInt(req.params.transactionId, 10);
    const { suspicious } = req.body;

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        user: { select: { utorid: true } },
        createdBy: { select: { utorid: true } },
      }
    });

    if (!transaction) {
      return next(NotFound('Transaction not found'));
    }

    // Check if the flag is actually changing
    if (transaction.suspicious === suspicious) {
      return next(BadRequest(`Transaction is already marked as ${suspicious ? 'suspicious' : 'not suspicious'}.`));
    }
    
    // Determine the point adjustment
    let pointChange = 0;
    if (suspicious === true) {
      // Marking as suspicious: deduct points
      pointChange = -transaction.amount;
    } else {
      // Clearing suspicion: credit points
      pointChange = transaction.amount;
    }

    // Update transaction and user points in one transaction
    const [updatedTransaction, _] = await prisma.$transaction([
      prisma.transaction.update({
        where: { id },
        data: { suspicious },
      }),
      prisma.user.update({
        where: { id: transaction.userId },
        data: {
          points: { increment: pointChange }
        }
      })
    ]);

    res.status(200).json({
      id: updatedTransaction.id,
      utorid: transaction.user.utorid,
      type: updatedTransaction.type,
      spent: updatedTransaction.spent,
      amount: updatedTransaction.amount,
      promotionIds: [],
      suspicious: updatedTransaction.suspicious,
      remark: updatedTransaction.remark,
      createdBy: transaction.createdBy.utorid,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /users/:userId/transactions (Transfer)
 * Create a new transfer transaction
 */
const createTransfer = async (req, res, next) => {
  try {
    const senderId = req.auth.id;
    const recipientId = parseInt(req.params.userId, 10);
    const { amount, remark } = req.body;

    if (senderId === recipientId) {
      return next(BadRequest('Cannot transfer points to yourself.'));
    }

    const [sender, recipient] = await Promise.all([
      prisma.user.findUnique({ where: { id: senderId } }),
      prisma.user.findUnique({ where: { id: recipientId } }),
    ]);

    if (!recipient) {
      return next(NotFound('Recipient user not found.'));
    }

    // Check if sender is verified
    if (!sender.verified) {
      return next(Forbidden('You must be verified to transfer points.'));
    }

    // Check if sender has enough points
    if (sender.points < amount) {
      return next(BadRequest('Insufficient points.'));
    }

    // Create two transactions and update balances
    const [senderTx, recipientTx, _, __] = await prisma.$transaction([
      // 1. Create sender's transaction (negative amount)
      prisma.transaction.create({
        data: {
          type: 'transfer',
          amount: -amount,
          remark,
          userId: sender.id,
          createdById: sender.id,
          relatedId: recipient.id,
        }
      }),
      // 2. Create recipient's transaction (positive amount)
      prisma.transaction.create({
        data: {
          type: 'transfer',
          amount: amount,
          remark,
          userId: recipient.id,
          createdById: sender.id,
          relatedId: sender.id,
        }
      }),
      // 3. Update sender's balance
      prisma.user.update({
        where: { id: sender.id },
        data: { points: { decrement: amount } }
      }),
      // 4. Update recipient's balance
      prisma.user.update({
        where: { id: recipient.id },
        data: { points: { increment: amount } }
      })
    ]);

    const io = req.app.get("io");
    console.log('>>> io in createTransfer:', !!io);

    // io.to(`user:${recipient.id}`).emit("notification", {
    //   type: "notification",
    //   message: `You received a transfer of ${amount} points from ${sender.utorid}.`,
    //   transactionId: recipientTx.id,
    //   amount,
    //   createdAt: recipientTx.createdAt,
    // });

    // io.to(`user:${sender.id}`).emit("notification", {
    //   type: "notification",
    //   message: `You sent a transfer of ${amount} points to ${recipient.utorid}.`,
    //   transactionId: senderTx.id,
    //   amount: amount,
    //   createdAt: senderTx.createdAt,
    // });
    await sendNotification(recipient.id, "success", `You received a transfer of ${amount} points from ${sender.utorid}.`);
    await sendNotification(sender.id, "success", `You sent a transfer of ${amount} points to ${recipient.utorid}.`);

    res.status(201).json({
      id: senderTx.id, // Return sender's transaction ID
      sender: sender.utorid,
      recipient: recipient.utorid,
      type: 'transfer',
      sent: amount,
      remark: senderTx.remark,
      createdBy: sender.utorid,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /users/me/transactions (Redemption)
 * Create a new redemption transaction
 */
const createRedemption = async (req, res, next) => {
  try {
    const userId = req.auth.id;
    const { amount, remark } = req.body;
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    // Check if user is verified
    if (!user.verified) {
      return next(Forbidden('You must be verified to redeem points.'));
    }
    
    // Check if user has enough points
    if (user.points < amount) {
      return next(BadRequest('Insufficient points to redeem.'));
    }
    
    // Create redemption transaction. Points are NOT deducted yet
    const transaction = await prisma.transaction.create({
      data: {
        type: 'redemption',
        amount: amount, // Stored as a positive number
        remark,
        userId: user.id,
        createdById: user.id,
        processed: false,
      }
    });

    const io = req.app.get("io");
    console.log('>>> io in createRedemption:', !!io);
    // io.to(`user:${user.id}`).emit("notification", {
    //   type: "notification",
    //   message: `You created a redemption request for ${amount} points.`,
    //   transactionId: transaction.id,
    //   amount,
    //   createdAt: transaction.createdAt,
    // });
    await sendNotification(user.id, "info", `You created a redemption request for ${amount} points.`);

    
    res.status(201).json({
      id: transaction.id,
      utorid: user.utorid,
      type: 'redemption',
      processedBy: null,
      amount: transaction.amount,
      remark: transaction.remark,
      createdBy: user.utorid,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /transactions/:transactionId/processed
 * Set a redemption transaction as being completed
 */
const processRedemption = async (req, res, next) => {
  try {
    const transactionId = parseInt(req.params.transactionId, 10);
    const cashierId = req.auth.id;

    const [transaction, cashier] = await Promise.all([
      prisma.transaction.findUnique({ where: { id: transactionId } }),
      prisma.user.findUnique({ where: { id: cashierId } }),
    ]);
    
    if (!transaction) {
      return next(NotFound('Transaction not found.'));
    }
    
    // Check transaction type
    if (transaction.type !== 'redemption') {
      return next(BadRequest('This transaction is not a redemption.'));
    }
    
    // Check if already processed
    if (transaction.processed) {
      return next(BadRequest('This redemption has already been processed.'));
    }
    
    // Deduct points from user and mark as processed
    const [updatedTransaction, _] = await prisma.$transaction([
      prisma.transaction.update({
        where: { id: transactionId },
        data: {
          processed: true,
          relatedId: cashier.id, // Store cashier ID in relatedId
        }
      }),
      prisma.user.update({
        where: { id: transaction.userId },
        data: {
          points: { decrement: transaction.amount }
        }
      })
    ]);

    const io = req.app.get("io");
    console.log('>>> io in processRedemption:', !!io);  
    // io.to(`user:${transaction.userId}`).emit("notification", {
    //   type: "notification",
    //   message: `Your redemption of ${transaction.amount} points has been processed by ${cashier.utorid}.`,
    //   transactionId: updatedTransaction.id,
    //   amount: -updatedTransaction.amount,
    //   createdAt: updatedTransaction.createdAt,
    // });
    await sendNotification(transaction.userId, "success", `Your redemption of ${transaction.amount} points has been processed by ${cashier.utorid}.`);

    res.status(200).json({
      id: updatedTransaction.id,
      utorid: (await prisma.user.findUnique({ where: { id: updatedTransaction.userId }})).utorid,
      type: 'redemption',
      processedBy: cashier.utorid,
      redeemed: updatedTransaction.amount,
      remark: updatedTransaction.remark,
      createdBy: (await prisma.user.findUnique({ where: { id: updatedTransaction.createdById }})).utorid,
    });
  } catch (err) {
    next(err);
  }
};


/**
 * GET /users/me/transactions
 * Retrieve a list of transactions owned by the currently logged in user
 */
const getMyTransactions = async (req, res, next) => {
  try {
    const userId = req.auth.id;
    const { page, limit } = req.query;
    
    // Build WHERE clause, forcing the userId to be the logged-in user
    const where = buildTransactionWhereClause(req.query, { userId });
    
    const skip = (page - 1) * limit;
    const total = await prisma.transaction.count({ where });
    const transactions = await prisma.transaction.findMany({
      where,
      skip,
      take: limit,
      include: {
        createdBy: { select: { utorid: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    const results = transactions.map(t => ({
      id: t.id,
      type: t.type,
      spent: t.spent,
      amount: t.amount,
      promotionIds: [],
      remark: t.remark,
      createdBy: t.createdBy.utorid,
      relatedId: t.relatedId,
      processed: t.processed,
      createdAt: t.createdAt.toISOString(),
    }));
    
    res.status(200).json({
      count: total,
      results,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /events/:eventId/transactions
 * Create a new reward transaction for an event
 */
const createEventTransaction = async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.eventId, 10);
    const { utorid, amount, remark } = req.body;
    const creatorId = req.auth.id;

    const [event, creator] = await Promise.all([
      prisma.event.findUnique({
        where: { id: eventId },
        include: { guests: { include: { user: true } } }
      }),
      prisma.user.findUnique({ where: { id: creatorId } })
    ]);

    if (!event) {
      return next(NotFound('Event not found.'));
    }

    // Check if creator is an organizer or manager
    const isOrganizer = await prisma.eventOrganizer.count({
      where: { eventId, userId: creatorId }
    }) > 0;
    if (creator.role !== 'manager' && creator.role !== 'superuser' && !isOrganizer) {
      return next(Forbidden('You must be a manager or event organizer to award points.'));
    }

    let guestsToAward = [];
    if (utorid) {
      // Awarding to a single specified guest
      const guest = event.guests.find(g => g.user.utorid === utorid);
      if (!guest) {
        return next(BadRequest('User is not on the guest list for this event.'));
      }
      guestsToAward.push(guest.user);
    } else {
      // Awarding to all guests
      guestsToAward = event.guests.map(g => g.user);
    }

    if (guestsToAward.length === 0) {
      return next(BadRequest('No guests to award points to.'));
    }

    const totalPointsToAward = amount * guestsToAward.length;
    const pointsRemaining = event.pointsAllocated - event.pointsAwarded;

    // Check if there are enough points
    if (pointsRemaining < totalPointsToAward) {
      return next(BadRequest(`Not enough points remaining in event. Remaining: ${pointsRemaining}`)); // [cite: 331]
    }
    
    // Create a transaction for each guest and update their balance
    const transactionsData = guestsToAward.map(guest => ({
      type: 'event',
      amount,
      remark,
      userId: guest.id,
      createdById: creatorId,
      relatedId: eventId,
    }));
    
    // Use a database transaction to ensure all operations succeed or fail together
    const result = await prisma.$transaction([
      // 1. Create all event transactions
      prisma.transaction.createMany({
        data: transactionsData,
      }),
      // 2. Update event's pointsAwarded
      prisma.event.update({
        where: { id: eventId },
        data: { pointsAwarded: { increment: totalPointsToAward } }
      }),
      // 3. Update each user's points
      ...guestsToAward.map(guest => 
        prisma.user.update({
          where: { id: guest.id },
          data: { points: { increment: amount } }
        })
      ),
    ]);

    // Fetch the newly created transactions to return them
    const newTransactions = await prisma.transaction.findMany({
      where: {
        relatedId: eventId,
        createdById: creatorId,
      },
      orderBy: { createdAt: 'desc' },
      take: guestsToAward.length
    });
    
    const responseBody = newTransactions.map(t => ({
      id: t.id,
      recipient: guestsToAward.find(g => g.id === t.userId).utorid,
      awarded: t.amount,
      type: 'event',
      relatedId: t.relatedId,
      remark: t.remark,
      createdBy: creator.utorid
    })).reverse(); // Re-order to match creation

    // ⭐ Send notifications
    const guestUserIds = guestsToAward.map((g) => g.id);

    await sendNotificationToMany(
      guestUserIds,
      "success",
      `You were awarded ${amount} points for event "${event.name}".`
    );

    await sendNotification(
      creator.id,
      "success",
      `You awarded ${amount} points to ${guestsToAward.length} guest(s) for event "${event.name}".`
    );

    
    // Respond differently for single vs. multiple awards
    if (utorid) {
      res.status(201).json(responseBody[0]);
    } else {
      res.status(201).json(responseBody);
    }
    
  } catch (err) {
    next(err);
  }
};


module.exports = {
  createTransaction,
  getAllTransactions,
  getTransactionById,
  updateSuspicious,
  createTransfer,
  createRedemption,
  processRedemption,
  getMyTransactions,
  createEventTransaction,
};