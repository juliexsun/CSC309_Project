/*
 * Complete this script so that it is able to add a superuser to the database
 * Usage example:
 * node prisma/createsu.js clive123 clive.su@mail.utoronto.ca SuperUser123!
 */
'use strict';

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);

  if (args.length !== 3) {
    console.error(
      'Usage: node prisma/createsu.js <utorid> <email> <password>'
    );
    process.exit(1);
  }

  const [utorid, email, password] = args;

  if (!utorid || !email || !password) {
    console.error('All arguments (utorid, email, password) are required.');
    process.exit(1);
  }

  try {
    const superuser = await prisma.user.create({
      data: {
        utorid: utorid,
        email: email,
        password: password,
        name: 'Super User', // Default name, can be changed later
        role: 'superuser',
        verified: true, // Superusers are verified by default
        suspicious: false,
        points: 0,
      },
    });

    console.log(
      `Successfully created superuser with utorid: ${superuser.utorid}`
    );
  } catch (e) {
    // unique violation
    if (e.code === 'P2002' && e.meta?.target?.includes('utorid')) {
      console.error(`Error: A user with utorid '${utorid}' already exists.`);
    } else if (e.code === 'P2002' && e.meta?.target?.includes('email')) {
      console.error(`Error: A user with email '${email}' already exists.`);
    } else {
      console.error('An error occurred while creating the superuser:', e.message);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();