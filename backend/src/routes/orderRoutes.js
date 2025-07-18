// backend/src/routes/orderRoutes.js
const express = require('express');
const { uploadOrderHistory } = require('../controllers/orderController');
const uploadCSV = require('../middlewares/uploadMiddleware'); // Import the multer middleware
const { protect } = require('../middlewares/authMiddleware'); // Protect the route

const router = express.Router();

// Route for uploading order history CSV
// protect middleware ensures only authenticated users can upload
// uploadCSV.single('file') processes a single file upload with the field name 'file'
router.post('/upload', protect, uploadCSV.single('file'), uploadOrderHistory);

module.exports = router;