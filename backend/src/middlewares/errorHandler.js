// backend/src/middlewares/errorHandler.js
const errorHandler = (err, req, res, next) => {
    console.log(err.stack); // Log the error for debugging
    const statusCode = err.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({
        message: err.message,
        //In production, dont send stack trace
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

module.exports = errorHandler;