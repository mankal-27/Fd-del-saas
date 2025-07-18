// backend/src/controllers/analyticsController.js
const analyticsService = require('../services/analyticsService');

const getDashboardData = async (req, res) => {
    const userId = req.user.id; // From authMiddleware
    
    try {
        const totalSpendingMonthly = await analyticsService.getTotalSpendingOverTime(userId, 'month');
        const totalSpendingYearly = await analyticsService.getTotalSpendingOverTime(userId, 'year');
        const topRestaurants = await analyticsService.getTopRestaurants(userId, 5);
        const spendingPerItem = await analyticsService.getSpendingPerItem(userId);
        const averageOrderValue = await analyticsService.getAverageOrderValue(userId); // NEW
        const orderFrequency = await analyticsService.getOrderFrequency(userId);       // NEW
        const mostFrequentItems = await analyticsService.getMostFrequentItems(userId, 5); // NEW
        const likedOrders = await analyticsService.getLikedOrders(userId);             // NEW
        
        res.status(200).json({
            totalSpendingMonthly,
            totalSpendingYearly,
            topRestaurants,
            spendingPerItem,
            averageOrderValue,        // Include new data
            orderFrequency,           // Include new data
            mostFrequentItems,        // Include new data
            likedOrders,              // Include new data
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ message: 'Failed to fetch dashboard data.' });
    }
};

const likeOrder = async (req, res) => {
    const userId = req.user.id;
    const { orderId } = req.params; // Get orderId from URL parameters
    const { isLiked } = req.body; // Get new like status from body
    
    // Basic validation
    if (typeof isLiked !== 'boolean') {
        return res.status(400).json({ message: 'isLiked must be a boolean.' });
    }
    if (isNaN(parseInt(orderId, 10))) {
        return res.status(400).json({ message: 'Invalid order ID.' });
    }
    
    try {
        const updatedOrder = await analyticsService.updateOrderLikeStatus(parseInt(orderId, 10), userId, isLiked);
        res.status(200).json({ message: 'Order like status updated successfully.', order: updatedOrder });
    } catch (error) {
        console.error('Error updating order like status:', error);
        if (error.message.includes('Order not found or not owned by user')) {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: 'Failed to update order like status.' });
    }
};

module.exports = {
    getDashboardData,
    likeOrder, // Export the new controller function
};