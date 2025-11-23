/*
 * If you need to initialize your database with some data, you may write a script
 * to do so here.
 */
'use strict';

// prisma/seed.js
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ==========================================================
  // 0. CLEAN DATABASE
  // ==========================================================
  await prisma.eventGuest.deleteMany();
  await prisma.eventOrganizer.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.user.deleteMany();
  await prisma.event.deleteMany();


  // ==========================================================
  // 1. Create Users
  // ==========================================================
  const passwordHash = await bcrypt.hash("Password123!", 10);

  const usersData = [
    {
      utorid: "superuser1",
      email: "super1@mail.utoronto.ca",
      name: "Super User",
      role: "superuser",
      verified: true,
      password: passwordHash,
    },
    {
      utorid: "manager1",
      email: "manager1@mail.utoronto.ca",
      name: "Manager One",
      role: "manager",
      verified: true,
      password: passwordHash,
    },
    {
      utorid: "cashier1",
      email: "cashier1@mail.utoronto.ca",
      name: "Cashier One",
      role: "cashier",
      verified: true,
      password: passwordHash,
    },
  ];

  // Add 7 regular users
  for (let i = 1; i <= 7; i++) {
    usersData.push({
      utorid: `user${i}`,
      email: `user${i}@mail.utoronto.ca`,
      name: `Regular User ${i}`,
      role: "regular",
      verified: true,
      password: passwordHash,
    });
  }

  await prisma.user.createMany({ data: usersData });

  const users = await prisma.user.findMany();
  const user1 = users.find(u => u.utorid === "user1");
  const cashier = users.find(u => u.utorid === "cashier1");
  const manager = users.find(u => u.utorid === "manager1");
  const regularUsers = users.filter(u => u.role === "regular");


  // ==========================================================
  // 2. Create Promotions (5)
  // ==========================================================
  const now = new Date();
  const nextWeek = new Date(Date.now() + 7 * 24 * 3600 * 1000);

  await prisma.promotion.createMany({
    data: [
      {
        name: "Winter Bonus",
        description: "Spend $30 get 10 bonus points",
        type: "automatic",
        startTime: now,
        endTime: nextWeek,
        minSpending: 30,
        rate: 0,
        points: 10,
      },
      {
        name: "Welcome Gift",
        description: "One-time 50 points",
        type: "onetime",
        startTime: now,
        endTime: nextWeek,
        points: 50,
      },
      {
        name: "Double Friday",
        description: "2x points Friday",
        type: "automatic",
        startTime: now,
        endTime: nextWeek,
        rate: 0.04,
      },
      {
        name: "Holiday Gift",
        description: "One-time 100 points",
        type: "onetime",
        startTime: now,
        endTime: nextWeek,
        points: 100,
      },
      {
        name: "Midterm Boost",
        description: "Spend $20 get 5 points",
        type: "automatic",
        startTime: now,
        endTime: nextWeek,
        minSpending: 20,
        points: 5,
      },
    ],
  });


  // ==========================================================
  // 3. Create 5 Events
  // ==========================================================
  const events = [];

  // =====================================================
  // 3a. Create 5 Ongoing Events
  // =====================================================
  const ongoingEvents = [];

  for (let i = 1; i <= 5; i++) {
    const ongoingEvent = await prisma.event.create({
      data: {
        name: `Event ${i}`,
        description: `This is an ongoing event #${i}`,
        location: "BA 1130",
        startTime: new Date("2025-11-01T00:00:00"), // ⬅️ fixed start date
        endTime: new Date("2025-12-31T23:59:59"),   // ⬅️ fixed end date
        capacity: 50,
        pointsAllocated: 500,
        published: true,
        organizers: {
          create: [{ userId: manager.id }, { userId: user1.id }], // Add user1 as organizer too
        },
      },
    });
    ongoingEvents.push(ongoingEvent);
    events.push(ongoingEvent);
  }

  // =====================================================
  // 3b. Create 3 Past Events (already ended)
  // =====================================================
  const pastEvents = [];

  for (let i = 1; i <= 3; i++) {
    const pastEvent = await prisma.event.create({
      data: {
        name: `Past Event ${i}`,
        description: `This is a past event #${i}`,
        location: "BA 3000",
        startTime: new Date("2025-10-01T00:00:00"), // ⬅️ fixed start date
        endTime: new Date("2025-10-07T23:59:59"),   // ⬅️ fixed end date
        capacity: 50,
        pointsAllocated: 300,
        published: true,
        organizers: {
          create: [{ userId: manager.id},{ userId: user1.id }], // Add user1 as organizer too
        },
      },
    });
    pastEvents.push(pastEvent);
  }

  // =====================================================
  // 3c. Create 3 Upcoming Events (not started yet)
  // =====================================================
  const upcomingEvents = [];

  for (let i = 1; i <= 3; i++) {
    const upcomingEvent = await prisma.event.create({
      data: {
        name: `Upcoming Event ${i}`,
        description: `This is an upcoming event #${i}`,
        location: "BA 3000",
        startTime: new Date("2026-01-01T00:00:00"), // ⬅️ fixed start date
        endTime: new Date("2026-01-07T23:59:59"),   // ⬅️ fixed end date
        capacity: 50,
        pointsAllocated: 300,
        published: true,
        organizers: {
          create: [{ userId: manager.id},{ userId: user1.id }], // Add user1 as organizer too
        },
      },
    });
    upcomingEvents.push(upcomingEvent);
  }

  

  // ==========================================================
  // 4. Add guests(all regularUsers, except user1, as user1 is an organizer) to all events
  // ==========================================================
  for (const event of events) {
    for (let i = 1; i < 5; i++) {
      await prisma.eventGuest.create({
        data: {
          eventId: event.id,
          userId: regularUsers[i].id,
        },
      });
    }
  }


  // ==========================================================
  // 5. Create 30+ Transactions
  // ==========================================================
  for (const u of regularUsers) {
    // Purchase
    await prisma.transaction.create({
      data: {
        type: "purchase",
        amount: 40,
        spent: 10.5,
        userId: u.id,
        createdById: cashier.id,
      },
    });

    // Redemption
    await prisma.transaction.create({
      data: {
        type: "redemption",
        amount: -20,
        processed: true,
        userId: u.id,
        createdById: cashier.id,
      },
    });

    // Adjustment
    await prisma.transaction.create({
      data: {
        type: "adjustment",
        amount: -5,
        userId: u.id,
        createdById: manager.id,
      },
    });

    // Transfer (send to next user)
    const target = regularUsers[(u.id + 1) % regularUsers.length];
    await prisma.transaction.create({
      data: {
        type: "transfer",
        amount: -10,
        userId: u.id,
        createdById: u.id,
        relatedId: target.id,
      },
    });

    // Transfer receiving side
    await prisma.transaction.create({
      data: {
        type: "transfer",
        amount: 10,
        userId: target.id,
        createdById: u.id,
        relatedId: u.id,
      },
    });
  }

  console.log("🎉 Seed data created successfully!");
}

main()
  .catch(err => {
    console.error("❌ ERROR:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
