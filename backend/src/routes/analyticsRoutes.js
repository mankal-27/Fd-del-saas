// backend/src/routes/analyticsRoutes.js
const express = require('express');
const { getDashboardData, likeOrder } = require('../controllers/analyticsController');
const { protect } = require('../middlewares/authMiddleware'); // Protect the route

const router = express.Router();

// Route to get all dashboard analytics data for the authenticated user
router.get('/dashboard', protect, getDashboardData);

// Route to like/unlike an order
// The order ID will be part of the URL (e.g., /api/analytics/orders/123/like)
router.post('/orders/:orderId/like', protect, likeOrder);
module.exports = router;