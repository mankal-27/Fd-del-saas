// backend/src/utils/jwtUtils.js
const jwt = require('jsonwebtoken');

// Simple in-memory blacklist for demonstration
// In a production app, use Redis or a similar persistent store
const tokenBlacklist = new Set();

const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES,
    });
};

const verifyToken = (token) => {
    try {
        if (tokenBlacklist.has(token)) {
            throw new Error('Token is blacklisted');
        }
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        // Re-throw the error to be caught by the middleware/controller
        throw error;
    }
}

const blacklistToken = (token) => {
    tokenBlacklist.add(token);
    // Optional: Set a timer to remove the token from the blacklist
    // after its natural expiration (e.g., 1 hour for 'expiresIn: 1h')
    // This prevents the blacklist from growing indefinitely.
    const decoded = jwt.decode(token);
    if (decoded && decoded.exp) {
        const expiresInMs = (decoded.exp * 1000) - Date.now();
        setTimeout(() => {
            tokenBlacklist.delete(token);
            console.log(`Token removed from blacklist: ${token.substring(0, 10)}...`);
        }, expiresInMs);
    }
};


module.exports = {
    generateToken,
    verifyToken,
    blacklistToken
};

