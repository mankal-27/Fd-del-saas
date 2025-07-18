// backend/src/controllers/authController.js
const userService = require('../services/userService');
const { blacklistToken } = require('../utils/jwtUtils');// Import blacklistToken

const register = async (req, res) => {
    const { name, email, password } = req.body;
    
    if(!name || !email || !password ) {
        return res.status(400).json({ message: 'Please enter all fields' });
    }
    
    try {
        const user = await userService.registerUser(name, email, password);
        res.status(200).json(user);
    }catch (error) {
        if (error.code === 'P2002' && error.meta.target.includes('email')) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }
        res.status(500).json({ message: 'Server error during registration', error: error.message });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password ) {
        return res.status(400).json({ message: 'Please enter all fields' });
    }
    try {
        const user = await userService.loginUser(email, password);
        res.status(200).json(user);
    }catch (error) {
        res.status(401).json({ message: error.message });
    }
};

//A simple protected route to test authentication
const getMe = (req, res) => {
    // req.user is set by the protect middleware
    res.status(200).json({
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
    });
};

// New logout function
const logout = async (req, res) => {
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
    
    if (!token) {
        return res.status(400).json({ message: 'No token provided' });
    }
    
    try {
        blacklistToken(token);
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        // This catch block would primarily handle unexpected errors with blacklisting
        // Token verification errors are handled by authMiddleware before reaching here for valid tokens
        console.error('Error blacklisting token:', error);
        res.status(500).json({ message: 'Error during logout' });
    }
};

module.exports = {
    register,
    login,
    getMe,
    logout,
};
