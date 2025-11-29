'use strict';

const prisma = require('../db/prisma');
const {
  NotFound,
  BadRequest,
  Forbidden,
  Gone,
} = require('../utils/errors');

const { sendNotification } = require("../utils/sendNotification");
const { sendNotificationToMany } = require("../utils/sendNotification");

/**
 * Helper function to check if a user is an organizer for an event.
 */
const isOrganizer = async (eventId, userId) => {
  const count = await prisma.eventOrganizer.count({
    where: { eventId, userId },
  });
  return count > 0;
};

/**
 * Helper function to format event details for a regular user response.
 */
const formatEventForRegular = (event, guestCount) => ({
  id: event.id,
  name: event.name,
  description: event.description,
  location: event.location,
  startTime: event.startTime,
  endTime: event.endTime,
  capacity: event.capacity,
  organizers: event.organizers.map(org => ({
    id: org.user.id,
    utorid: org.user.utorid,
    name: org.user.name,
  })),
  numGuests: guestCount,
});

/**
 * Helper function to format event details for a manager/organizer response. [cite: 305]
 */
const formatEventForManager = (event, guestCount) => ({
  id: event.id,
  name: event.name,
  description: event.description,
  location: event.location,
  startTime: event.startTime,
  endTime: event.endTime,
  capacity: event.capacity,
  pointsRemain: event.pointsAllocated - event.pointsAwarded,
  pointsAwarded: event.pointsAwarded,
  published: event.published,
  organizers: event.organizers.map(org => ({
    id: org.user.id,
    utorid: org.user.utorid,
    name: org.user.name,
  })),
  guests: event.guests.map(g => ({
    id: g.user.id,
    utorid: g.user.utorid,
    name: g.user.name,
  })),
  numGuests: guestCount,
});

/**
 * POST /events
 * Create a new point-earning event
 */
const createEvent = async (req, res, next) => {
  try {
    const { name, description, location, startTime, endTime, capacity, points } = req.body;
      
    const userId = req.auth.id; 

    if (new Date(startTime) < new Date()) {
      return next(BadRequest('startTime must not be in the past.')); 
    }

    const event = await prisma.event.create({
      data: {
        name,
        description,
        location,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        capacity: capacity || null,
        pointsAllocated: points,
        published: false,

        // FIX 1: ESTABLISH THE ORGANIZER RELATIONSHIP to prevent 500 crash
        organizers: {
            create: {
                userId: userId, 
            },
        },
      },
      // FIX 2: INCLUDE relationships to prevent TypeError in formatEventForManager
      include: {
          organizers: { 
              include: { 
                  user: { 
                      select: { id: true, utorid: true, name: true } 
                  } 
              } 
          },
          guests: { // Also include guests to prevent formatting crash if guests are referenced
              include: { 
                  user: { 
                      select: { id: true, utorid: true, name: true } 
                  } 
              } 
          }
      }
    });

    const baseResponse = formatEventForManager(event, 0);

    // Override 'organizers' and 'guests' to be empty arrays 
    // to match the exact response specification
    res.status(201).json({
      ...baseResponse,
      organizers: [], 
      guests: [],     
    });
    
  } catch (err) {
    next(err);
  }
};

/**
 * GET /events
 * Retrieve a list of events
 */
const getEvents = async (req, res, next) => {
  try {
    const {
      name,
      location,
      started,
      ended,
      showFull,
      published,
      page,
      limit,
    } = req.query;
    const { role } = req.auth;
    const now = new Date();

    const where = {};

    // Filter by name/location
    if (name) where.name = { contains: name };
    if (location) where.location = { contains: location };

    // Filter by time
    if (started === true) where.startTime = { lte: now };
    if (started === false) where.startTime = { gt: now };
    if (ended === true) where.endTime = { lte: now };
    if (ended === false) where.endTime = { gt: now };

    // Filter by visibility
    if (role === 'regular' || role == 'cashier') {
      where.published = true; // Regular & cashier only see published events
    } else if (published !== undefined) {
      where.published = published; // Managers can filter by published status
    }
    
    const skip = (page - 1) * limit;

    // Get events with their guest counts
    const eventsWithCounts = await prisma.event.findMany({
      where,
      skip,
      take: limit,
      include: {
        organizers: {
          select: { userId: true }
        },
        _count: {
          select: { guests: true },
        },
      },
      orderBy: { startTime: 'asc' },
    });
    
    // Filter out full events if showFull is false
    let filteredEvents = eventsWithCounts;
    if (showFull === false) {
      filteredEvents = eventsWithCounts.filter(event => {
        return event.capacity === null || event._count.guests < event.capacity;
      });
    }

    const total = await prisma.event.count({ where });

    const results = filteredEvents.map((event) => {
      const common = {
        id: event.id,
        name: event.name,
        description: event.description,
        location: event.location,
        startTime: event.startTime,
        endTime: event.endTime,
        capacity: event.capacity,
        numGuests: event._count.guests,
        organizers: event.organizers,
      };
      if (role === 'regular') {
        return common;
      } else {
        return {
          ...common,
          pointsRemain: event.pointsAllocated - event.pointsAwarded,
          pointsAwarded: event.pointsAwarded,
          published: event.published,
        };
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
 * GET /events/:eventId [cite: 302, 305]
 * Retrieve a single event
 */
const getEventById = async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.eventId, 10);
    const { id: userId, role } = req.auth;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organizers: { include: { user: { select: { id: true, utorid: true, name: true } } } },
        guests: { include: { user: { select: { id: true, utorid: true, name: true } } } },
        _count: { select: { guests: true } }
      },
    });

    if (!event) {
      return next(NotFound('Event not found.'));
    }

    const userIsOrganizer = await isOrganizer(eventId, userId);

    // Organizer OR manager OR superuser → full access
    if (userIsOrganizer || role === 'manager' || role === 'superuser') {
      // Organizer can see unpublished events
      return res.status(200).json(formatEventForManager(event, event._count.guests));
    }

    // Regular or cashier → limited access, but only if published
    if (!event.published) {
      return next(NotFound('Event not found or is not published.'));
    }

    return res.status(200).json(formatEventForRegular(event, event._count.guests));
    
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /events/:eventId
 * Update an existing event
 */
const updateEvent = async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.eventId, 10);
    const { id: userId, role } = req.auth;
    const data = req.body;
    const now = new Date();

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return next(NotFound('Event not found.'));

    // Authorization check
    const userIsOrganizer = await isOrganizer(eventId, userId);
    if (role !== 'manager' && role !== 'superuser' && !userIsOrganizer) {
      return next(Forbidden('You must be a manager or organizer for this event to update it.'));
    }

    if (userIsOrganizer && role !== 'manager' && role !== 'superuser') {
        if (data.points !== undefined && data.points !== null
           || data.published !== undefined && data.published !== null) {
            return next(Forbidden('Organizers cannot update event points or published status.'));
        }
    }

    if (role === 'superuser') {
        if (data.points !== undefined && data.points !== null
           || data.published !== undefined && data.published !== null) {
            return next(Forbidden('Superusers cannot update event points or published status.'));
        }
    }

    const dataToUpdate = {};

    // Check time-based update restrictions
    const originalStartTime = new Date(event.startTime);
    const originalEndTime = new Date(event.endTime);
    
    if (originalStartTime <= now) {
      // After original start time
      const restrictedFields = ['name', 'description', 'location', 'startTime', 'capacity'];
      for (const field of restrictedFields) {
        if (data[field] !== undefined && data[field] !== null) {
          return next(BadRequest(`Cannot update '${field}' after the event's original start time.`));
        }
      }
    }
    if (originalEndTime <= now && data.endTime !== undefined) {
      return next(BadRequest("Cannot update 'endTime' after the event's original end time."));
    }
    
    if (data.startTime && new Date(data.startTime) < now) {
      return next(BadRequest('startTime must not be in the past.'));
    }
    
    const endTime = data.endTime ? new Date(data.endTime) : originalEndTime;
    const startTime = data.startTime ? new Date(data.startTime) : originalStartTime;
    if (endTime <= startTime) {
      return next(BadRequest('endTime must be after startTime.'));
    }

    if (data.capacity !== undefined && data.capacity != null) {
      if (event.capacity !== null && data.capacity === null) {
        return next(BadRequest('Cannot change a limited capacity event to unlimited.'));
      }
      
      const guestCount = await prisma.eventGuest.count({ where: { eventId } });
      if (data.capacity !== null && guestCount > data.capacity) {
        return next(BadRequest('New capacity is less than the number of confirmed guests.'));
      }
      dataToUpdate.capacity = data.capacity;
    }

    if (data.points !== undefined && data.points !== null) {
      const newPointsAllocated = data.points;
      if (newPointsAllocated < event.pointsAwarded) {
        return next(BadRequest('Total points cannot be reduced below the amount already awarded.'));
      }
      dataToUpdate.pointsAllocated = data.points;
    }
    
    if (data.published === false) {
      return next(BadRequest('Published status can only be set to true.'));
    } else if (data.published === true) {
      dataToUpdate.published = true;
    }
    
    ['name', 'description', 'location'].forEach(f => {
      if (data[f]) dataToUpdate[f] = data[f];
    });
    if (data.startTime) dataToUpdate.startTime = startTime;
    if (data.endTime) dataToUpdate.endTime = endTime;

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: dataToUpdate,
      include: {
        guests: {
          select: { userId: true }, // 只要 userId 就行
        },
      },
    });
    
    // Format response to only include updated fields + key info
    const response = {
      id: updatedEvent.id,
      name: updatedEvent.name,
      location: updatedEvent.location,
    };
    for (const key of Object.keys(dataToUpdate)) {
      if (key === 'pointsAllocated') {
        response.pointsRemain = updatedEvent.pointsAllocated - updatedEvent.pointsAwarded;
      } else {
        response[key] = updatedEvent[key];
      }
    }

    // Send notifications
    const io = req.app.get("io");
    console.log('>>> io in updateEvent:', !!io);

    await sendNotification(userId, "success", `You updated the event '${updatedEvent.name}'.`);

    const guestUserIds = updatedEvent.guests.map((g) => g.userId);
    if (guestUserIds.length > 0) {
      await sendNotificationToMany(
        guestUserIds,
        "info",
        `Event "${updatedEvent.name}" has been updated.`
      );
    }
    
    
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /events/:eventId
 * Remove the specified event
 */
const deleteEvent = async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.eventId, 10);
    
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return next(NotFound('Event not found.'));
    
    if (event.published) {
      return next(BadRequest('Cannot delete an event that has already been published.')); // [cite: 318]
    }
    
    await prisma.event.delete({ where: { id: eventId } });
    
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

/**
 * POST /events/:eventId/organizers
 * Add an organizer to this event
 */
const addOrganizer = async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.eventId, 10);
    const { utorid } = req.body;
    
    const [event, user] = await Promise.all([
      prisma.event.findUnique({ where: { id: eventId } }),
      prisma.user.findUnique({ where: { utorid } }),
    ]);
    
    if (!event) return next(NotFound('Event not found.'));
    if (!user) return next(NotFound('User not found.'));

    if (new Date(event.endTime) < new Date()) {
      return next(Gone('Cannot add organizers to an event that has ended.'));
    }
    
    const isGuest = await prisma.eventGuest.count({
      where: { eventId, userId: user.id }
    });
    if (isGuest > 0) {
      return next(BadRequest('User is already a guest. Remove them as a guest first.'));
    }
    
    await prisma.eventOrganizer.create({
      data: { eventId, userId: user.id }
    });
    
    const updatedEvent = await prisma.event.findUnique({
      where: { id: eventId },
      include: { organizers: { include: { user: { select: { id: true, utorid: true, name: true } } } } }
    });
    
    res.status(201).json({
      id: updatedEvent.id,
      name: updatedEvent.name,
      location: updatedEvent.location,
      organizers: updatedEvent.organizers.map(org => org.user),
    });
  } catch (e) {
    if (e.code === 'P2002') {
      return next(BadRequest('User is already an organizer for this event.'));
    }
    next(e);
  }
};

/**
 * DELETE /events/:eventId/organizers/:userId
 * Remove an organizer from this event
 */
const removeOrganizer = async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.eventId, 10);
    const userId = parseInt(req.params.userId, 10);

    const result = await prisma.eventOrganizer.deleteMany({
      where: { eventId, userId }
    });
    
    if (result.count === 0) {
      return next(NotFound('Organizer not found for this event.'));
    }
    
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

/**
 * POST /events/:eventId/guests
 * Add a guest to this event
 */
const addGuest = async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.eventId, 10);
    const { utorid } = req.body;
    const { id: creatorId, role } = req.auth;

    const [event, user] = await Promise.all([
      prisma.event.findUnique({ 
        where: { id: eventId },
        include: { _count: { select: { guests: true } } }
      }),
      prisma.user.findUnique({ where: { utorid } }),
    ]);
    
    if (!event) return next(NotFound('Event not found.'));
    if (!user) return next(NotFound('User not found.'));
    
    // Authorization check
    const userIsOrganizer = await isOrganizer(eventId, creatorId);
    if (role !== 'manager' && role !== 'superuser' && !userIsOrganizer) {
      return next(Forbidden('You must be a manager or organizer for this event.'));
    }
    
    // Visibility check for organizer
    if (userIsOrganizer && !event.published) {
       return next(NotFound('Event is not visible to the organizer yet'));
    }
    
    // Check if event has ended
    if (new Date(event.endTime) < new Date()) {
      return next(Gone('Event has already ended.'));
    }
    
    // Check capacity
    if (event.capacity !== null && event._count.guests >= event.capacity) {
      return next(Gone('Event is full.'));
    }
    
    // Check if user is already an organizer
    const isOrg = await isOrganizer(eventId, user.id);
    if (isOrg) {
      return next(BadRequest('User is an organizer. Remove them as an organizer first.'));
    }
    
    await prisma.eventGuest.create({
      data: { eventId, userId: user.id }
    });
    
    res.status(201).json({
      id: event.id,
      name: event.name,
      location: event.location,
      guestAdded: { id: user.id, utorid: user.utorid, name: user.name },
      numGuests: event._count.guests + 1,
    });
  } catch (e) {
    if (e.code === 'P2002') {
      return next(BadRequest('User is already a guest at this event.'));
    }
    next(e);
  }
};

/**
 * DELETE /events/:eventId/guests/:userId
 * Remove a guest from this event
 */
const removeGuest = async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.eventId, 10);
    const userId = parseInt(req.params.userId, 10);

    const result = await prisma.eventGuest.deleteMany({
      where: { eventId, userId }
    });
    
    if (result.count === 0) {
      return next(NotFound('Guest not found for this event.'));
    }
    
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

/**
 * POST /events/:eventId/guests/me
 * Add the logged-in user to the event (RSVP)
 */
const rsvpMe = async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.eventId, 10);
    const userId = req.auth.id;

    // We can re-use the 'addGuest' logic by faking the request body
    const user = await prisma.user.findUnique({ where: { id: userId }});
    req.body.utorid = user.utorid;
    
    // Manually run the checks from addGuest for a regular user
    const event = await prisma.event.findUnique({ 
      where: { id: eventId },
      include: { _count: { select: { guests: true } } }
    });
    
    if (!event || !event.published) return next(NotFound('Event not found.'));
    
    if (new Date(event.endTime) < new Date()) {
      return next(Gone('Event has already ended.'));
    }
    if (event.capacity !== null && event._count.guests >= event.capacity) {
      return next(Gone('Event is full.'));
    }
    const isOrg = await isOrganizer(eventId, userId);
    if (isOrg) {
      return next(BadRequest('Organizers cannot be guests at their own event.'));
    }
    
    // Call the addGuest logic (which is now authorized)
    // We must manually elevate the user's role for this *one* call
    // to pass the addGuest authorization check.
    const originalRole = req.auth.role;
    req.auth.role = 'manager';
    
    // We must also catch the P2002 error here
    await prisma.eventGuest.create({
      data: { eventId, userId: user.id }
    });
    
    req.auth.role = originalRole;
    
    res.status(201).json({
      id: event.id,
      name: event.name,
      location: event.location,
      guestAdded: { id: user.id, utorid: user.utorid, name: user.name },
      numGuests: event._count.guests + 1,
    });
    
  } catch (e) {
     if (e.code === 'P2002') {
      return next(BadRequest('You are already on the guest list.')); // [cite: 325]
    }
    next(e);
  }
};

/**
 * DELETE /events/:eventId/guests/me
 * Remove the logged-in user from this event (Un-RSVP)
 */
const unRsvpMe = async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.eventId, 10);
    const userId = req.auth.id;
    
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return next(NotFound('Event not found.'));

    // Check if event has ended
    if (new Date(event.endTime) < new Date()) {
      return next(Gone('Event has already ended.'));
    }
    
    const result = await prisma.eventGuest.deleteMany({
      where: { eventId, userId }
    });
    
    if (result.count === 0) {
      return next(NotFound('You did not RSVP to this event.'));
    }
    
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};


module.exports = {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  addOrganizer,
  removeOrganizer,
  addGuest,
  removeGuest,
  rsvpMe,
  unRsvpMe,
};