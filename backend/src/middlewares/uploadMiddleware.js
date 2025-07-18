// backend/src/middlewares/uploadMiddleware.js
const multer = require('multer');
const path = require('path');

//configure storage for uploaded files
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Specify the directory where files will be stored temporarily
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        // Generate a unique filename to prevent clashes
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    },
});

//Configure multer for CSV files only
const uploadCSV = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        //Accept only CSV files
        if(file.mimetype === 'text/csv' || path.extname(file.originalname).toLowerCase() === '.csv') {
            cb(null, true);
        }else {
            cb(new Error('Only csv files allowed'), false);
        }
    },
    limits: {
        fileSize: 1024 * 1024 * 5 // 5 MB file size limit
    }
});

module.exports = uploadCSV;
