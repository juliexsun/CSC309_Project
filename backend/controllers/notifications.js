'use strict';

const prisma = require('../db/prisma');
const {
  NotFound,
  BadRequest,
  Forbidden,
  Gone,
} = require('../utils/errors');



// GET /notifications
const getMyNotifications = async (req, res, next) => {
  try {
    const { id: userId } = req.auth; // from authenticate middleware

    const {
      read,        // optional: "true" | "false"
      page = '1',  
      limit = '20',
    } = req.query;

    const where = { userId };

    // read filter (only read/unread)
    if (read !== undefined) {
      if (read !== 'true' && read !== 'false') {
        return next(BadRequest('Invalid read filter'));
      }
      where.read = read === 'true';
    }

    const take = Math.min(parseInt(limit, 10) || 20, 100); // max 100 at a time
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (pageNum - 1) * take;

    const [count, results] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },  // newest first
        skip,
        take,
        select: {
          id: true,
          type: true,
          message: true,
          read: true,
          createdAt: true,
        },
      }),
    ]);

    return res.json({ count, results });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMyNotifications,
};
