// backend/src/controllers/orderController.js
const csvParserService = require('../services/csvParserService');
const fs = require('fs'); // For deleting file in case of error

const uploadOrderHistory = async (req, res) => {
    // Multer places the file info on req.file
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }
    
    // req.user is populated by the authMiddleware
    const userId = req.user.id;
    const filePath = req.file.path; // Path where multer saved the file
    
    try {
        const { orderCount, itemCount } = await csvParserService.parseAndSaveOrders(filePath, userId);
        res.status(200).json({
            message: 'Order history uploaded and processed successfully!',
            ordersProcessed: orderCount,
            itemsProcessed: itemCount,
        });
    } catch (error) {
        console.error('Error processing order history upload:', error);
        // Ensure the uploaded file is deleted even if parsing or DB saving fails
        fs.unlink(filePath, (err) => {
            if (err) console.error('Error deleting file after processing error:', err);
        });
        res.status(500).json({ message: 'Failed to process order history. Please check file format.' });
    }
};

module.exports = {
    uploadOrderHistory,
};