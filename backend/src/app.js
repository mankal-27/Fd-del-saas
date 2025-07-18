const express = require('express');
const cors = require('cors'); // Allow cross-origin requests
const helmet = require('helmet'); // Basic security
const rateLimit = require('express-rate-limit'); // Prevent brute-force attacks
const dotenv = require('dotenv');
const allRoutes = require('./routes'); //API routes
const errorHandler = require('./middlewares/errorHandler');
dotenv.config();

const app = express();

//Middleware for security, cross-origin and JSON parsing
app.use(helmet());
app.use(cors()); // Enable CORS for all origins
app.use(express.json()); // Body parser for JSON data

//Rate Limit: max 100 requests per 15 minute per IP
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
});
app.use(limiter);

//All API routes mounted under /api
app.use('/api', allRoutes);

// Error handling middleware (should be last)
app.use(errorHandler);

module.exports = app;