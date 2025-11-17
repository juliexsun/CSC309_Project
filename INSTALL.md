# Installation Instructions

Hello, this document will help you install and run our CSSU Loyalty Program project. Please follow the steps carefully.

## What You Need First

Before you start, you need to have these things on your computer:

- Node.js version 18 or higher (you can check by typing `node --version` in terminal)
- npm version 9 or higher (you can check by typing `npm --version` in terminal)
- A terminal or command line application

If you do not have Node.js, please go to https://nodejs.org and download it first.

## Step 1: Get the Code

First, you need to clone or download our repository to your computer. If you already have the code, you can skip this step.

## Step 2: Setting Up the Backend

The backend is the server part of our application. Here is how to set it up:

### 2.1 Go to Backend Folder

Open your terminal and type:

```
cd backend
```

This will take you into the backend folder.

### 2.2 Install All the Packages

Now you need to install all the required packages. Type this command:

```
npm install
```

This might take a few minutes. Wait until it finishes. You will see many files being downloaded.

### 2.3 Set Up Environment Variables

There is a file called `.env` in the backend folder. This file has important settings. You should check if it exists. If you need to create it, copy from `.env.example` or create a new file with these contents:

```
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
DATABASE_URL="file:./dev.db"
PORT=3000
```

Do not share the JWT_SECRET with anyone.

### 2.4 Set Up the Database

Now we need to create the database. Type this command:

```
npx prisma migrate dev
```

If it asks you to reset the database, type yes. This will create all the tables we need.

### 2.5 Add Test Data

We need to put some example data in the database so you can test the application. Type:

```
node prisma/seed.js
```

You should see a message saying the seed was successful.

### 2.6 Start the Backend Server

Now you can start the backend server. Type:

```
node index.js 3000
```

The server will start on port 3000. You should see a message that says the server is running. Keep this terminal window open.

## Step 3: Setting Up the Frontend

The frontend is the website part that users will see. You need to open a new terminal window for this part. Do not close the backend terminal.

### 3.1 Go to Frontend Folder

In the new terminal, type:

```
cd frontend/loyal-program
```

### 3.2 Install Frontend Packages

Just like the backend, we need to install packages here too:

```
npm install
```

Wait for this to finish.

### 3.3 Start the Frontend Server

Now start the frontend development server:

```
npm run dev
```

The frontend will start and you will see a message with a URL, probably http://localhost:5173

### 3.4 Open the Application

Open your web browser and go to:

```
http://localhost:5173
```

You should see the login page now.

## Step 4: Login with Test Accounts

We have created several test accounts for you to try different user roles. Here are the accounts:

### Regular User Account
- Username: user1
- Password: Password123!

This is a normal user who can earn points, RSVP to events, and redeem points.

### Cashier Account
- Username: cashier1
- Password: Password123!

This account can scan QR codes, award points to customers, and process redemptions.

### Manager Account
- Username: manager1
- Password: Password123!

This account can manage users, create events, create promotions, and see all transactions.

### Superuser Account
- Username: superuser1
- Password: Password123!

This account has all permissions and can do everything in the system.

You can try logging in with any of these accounts to see different features.

## Common Problems and Solutions

### Problem: Port 3000 is already in use

If you see an error about port 3000 being used, it means something else is running on that port. You can kill it with:

```
lsof -ti:3000 | xargs kill -9
```

Then try starting the backend again.

### Problem: Port 5173 is already in use

Same solution but for port 5173:

```
lsof -ti:5173 | xargs kill -9
```

Then try starting the frontend again.

### Problem: Database file is locked

If you see this error, stop both servers and delete the file `backend/dev.db`, then run the migrate and seed commands again.

### Problem: npm install fails

Make sure you have the correct Node.js version. Try deleting the `node_modules` folder and `package-lock.json` file, then run `npm install` again.

## Deployment Information

Our application is deployed online. The frontend and backend are hosted separately.

### Frontend Deployment
We use Vercel to host the frontend. The deployed website will be available at the URL specified in WEBSITE.md file.

### Backend Deployment
We use Render to host the backend API. The backend runs on their servers and the frontend connects to it automatically.

The environment variables are configured in the deployment platform settings, not in the code repository.

## Third Party Services

We use these external services:

### Prisma
We use Prisma as our database ORM (Object Relational Mapping) tool. It helps us work with the SQLite database. No API key needed, it is included in our dependencies.

### JWT (JSON Web Tokens)
We use JWT for user authentication. This is handled by the jsonwebtoken npm package. No external API needed.

### bcrypt
We use bcrypt to hash passwords securely. This is a local library, no external service needed.

### React and Vite
The frontend is built with React and uses Vite as the build tool. These are development tools, no API keys needed.

All these are standard open source packages and do not require any API keys or external accounts.

## Notes

- Always make sure both backend and frontend are running when you want to test the application
- The backend must start before the frontend, or the frontend will not be able to connect
- If you make changes to the database schema, you need to run migrations again
- Test data will be reset every time you run the seed script

That is everything you need to know to install and run our project. If you have any questions, please let us know.
