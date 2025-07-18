# Food Delivery Expense & Analytics Tracker (Backend)

This is the backend for the Food Delivery Expense & Analytics Tracker SaaS app.

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in your values.

3. Set up your database (PostgreSQL) and run migrations:
   ```
   npx prisma migrate dev --name init
   ```

4. Start the development server:
   ```
   npm run dev
   ```

## Folder Structure

- `src/` - Application source code
- `prisma/` - Prisma schema
- `uploads/` - Temporary file uploads

## Features

- User authentication (JWT)
- CSV upload and parsing (Swiggy/Zomato order history)
- Analytics by week/month/year
- Multi-user SaaS