// backend/src/services/analyticsService.js
const prisma = require('../config/db');

/**
 * Retrieves total spending over time (e.g., monthly).
 * @param {string} userId - The ID of the user.
 * @param {string} interval - 'month' or 'year'.
 * @returns {Promise<Array<object>>} - Aggregated spending data.
 */
const getTotalSpendingOverTime = async (userId, interval = 'month') => {
    // For grouping by date parts (month/year), raw SQL is often the most flexible and performant
    // with PostgreSQL's DATE_TRUNC function.
    let query;
    if (interval === 'month') {
        query = prisma.$queryRaw`
            SELECT
                TO_CHAR("orderDate", 'YYYY-MM') AS period,
                SUM("totalAmount") AS totalSpending
            FROM "Order"
            WHERE "userId" = ${userId}
            GROUP BY period
            ORDER BY period ASC;
        `;
    } else if (interval === 'year') {
        query = prisma.$queryRaw`
            SELECT
                TO_CHAR("orderDate", 'YYYY') AS period,
                SUM("totalAmount") AS totalSpending
            FROM "Order"
            WHERE "userId" = ${userId}
            GROUP BY period
            ORDER BY period ASC;
        `;
    } else {
        throw new Error('Invalid interval. Must be "month" or "year".');
    }
    
    const result = await query;
    // Prisma returns BigInt for SUM in $queryRaw, convert to Number for consistency
    return result.map(row => ({
        ...row,
        totalspending: Number(row.totalspending)
    }));
};

/**
 * Retrieves top N restaurants by spending.
 * @param {string} userId - The ID of the user.
 * @param {number} limit - The number of top restaurants to return.
 * @returns {Promise<Array<object>>} - Top restaurants and their total spending.
 */
const getTopRestaurants = async (userId, limit = 5) => {
    const topRestaurants = await prisma.order.groupBy({
        by: ['restaurant'],
        _sum: {
            totalAmount: true,
        },
        where: {
            userId: userId,
        },
        orderBy: {
            _sum: {
                totalAmount: 'desc',
            },
        },
        take: limit,
    });
    
    return topRestaurants.map(r => ({
        restaurant: r.restaurant,
        totalSpending: r._sum.totalAmount || 0, // Ensure it's not null if no orders
    }));
};

/**
 * Retrieves spending by item category (requires category data, which we don't have yet.
 * For now, we'll sum spending per item name)
 * @param {string} userId - The ID of the user.
 * @returns {Promise<Array<object>>} - Spending per item.
 */
const getSpendingPerItem = async (userId) => {
    // This query sums the total spent on each unique item across all orders for a user.
    // It joins Order and OrderItem and then groups by itemName.
    const spendingPerItem = await prisma.$queryRaw`
        SELECT
            oi."itemName" AS item_name,
            SUM(oi.quantity * oi.price) AS total_spent_on_item
        FROM "OrderItem" oi
        JOIN "Order" o ON oi."orderId" = o.id
        WHERE o."userId" = ${userId}
        GROUP BY oi."itemName"
        ORDER BY total_spent_on_item DESC;
    `;
    return spendingPerItem.map(row => ({
        item_name: row.item_name,
        total_spent_on_item: Number(row.total_spent_on_item)
    }));
};

/**
 * Calculates the average order value for a user.
 * @param {number} userId - The ID of the user.
 * @returns {Promise<number>} - The average order value.
 */
const getAverageOrderValue = async (userId) => {
    const result = await prisma.order.aggregate({
        _avg: {
            totalAmount: true,
        },
        where: {
            userId: userId,
        },
    });
    // Return 0 if no orders exist, otherwise the average
    return result._avg.totalAmount || 0;
};

/**
 * Calculates order frequency (e.g., total orders, average orders per month).
 * For simplicity, we'll return total order count for now.
 * We could expand this to calculate average per period if needed.
 * @param {number} userId - The ID of the user.
 * @returns {Promise<object>} - Order frequency metrics.
 */
const getOrderFrequency = async (userId) => {
    const totalOrders = await prisma.order.count({
        where: {
            userId: userId,
        },
    });
    
    // Optionally, calculate unique months with orders to get avg orders per month
    const distinctMonths = await prisma.$queryRaw`
        SELECT COUNT(DISTINCT TO_CHAR("orderDate", 'YYYY-MM')) AS num_months
        FROM "Order"
        WHERE "userId" = ${userId};
    `;
    const numMonths = Number(distinctMonths[0]?.num_months) || 1; // Avoid division by zero
    
    const avgOrdersPerMonth = totalOrders / numMonths;
    
    return {
        totalOrders,
        avgOrdersPerMonth: parseFloat(avgOrdersPerMonth.toFixed(2)), // Format to 2 decimal places
    };
};

/**
 * Retrieves the most frequently ordered items for a user.
 * @param {number} userId - The ID of the user.
 * @param {number} limit - The number of top items to return.
 * @returns {Promise<Array<object>>} - Most frequently ordered items.
 */
const getMostFrequentItems = async (userId, limit = 5) => {
    const frequentItems = await prisma.orderItem.groupBy({
        by: ['itemName'],
        _sum: {
            quantity: true,
        },
        where: {
            order: {
                userId: userId, // Filter by user through the Order relation
            },
        },
        orderBy: {
            _sum: {
                quantity: 'desc',
            },
        },
        take: limit,
    });
    
    return frequentItems.map(item => ({
        itemName: item.itemName,
        totalQuantityOrdered: item._sum.quantity || 0,
    }));
};

/**
 * Updates an order's like status.
 * @param {number} orderId - The ID of the order.
 * @param {number} userId - The ID of the user (for security check).
 * @param {boolean} isLiked - The new like status.
 * @returns {Promise<object>} - The updated order.
 */
const updateOrderLikeStatus = async (orderId, userId, isLiked) => {
    const order = await prisma.order.updateMany({ // updateMany to ensure userId match for security
        where: {
            id: orderId,
            userId: userId,
        },
        data: {
            isLiked: isLiked,
        },
    });
    
    if (order.count === 0) {
        throw new Error('Order not found or not owned by user.');
    }
    // Fetch the updated order to return
    return prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, restaurant: true, orderDate: true, totalAmount: true, isLiked: true }
    });
};

/**
 * Retrieves all liked orders for a user.
 * @param {number} userId - The ID of the user.
 * @returns {Promise<Array<object>>} - List of liked orders.
 */
const getLikedOrders = async (userId) => {
    const likedOrders = await prisma.order.findMany({
        where: {
            userId: userId,
            isLiked: true,
        },
        orderBy: {
            orderDate: 'desc',
        },
        include: {
            items: true, // Include items for each liked order
        }
    });
    return likedOrders;
};

module.exports = {
    getTotalSpendingOverTime,
    getTopRestaurants,
    getSpendingPerItem,
    getAverageOrderValue,
    getOrderFrequency,
    getMostFrequentItems,
    updateOrderLikeStatus,
    getLikedOrders,
};