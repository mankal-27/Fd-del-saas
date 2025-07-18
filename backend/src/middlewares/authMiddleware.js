// backend/src/middlewares/authMiddleware.js
const { verifyToken } = require('../utils/jwtUtils');
const prisma = require('../config/db');

const protect = async (req, res, next) => {
    let token;
    
    //Check for token from header
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        try {
            //Get Token from header
            token = req.headers.authorization.split(' ')[1];
            
            //verify token
            const decoded = verifyToken(token);
            
            //attach user to the request object
            req.user = await prisma.user.findUnique({
                where: { id: decoded.id },
                select: {id:true, email:true, name:true} // Slect only neccesary
            });
            
            if(!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }
            next(); // Proceed to the next middleware/route handler
        }catch(err) {
            console.error(err);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
        
        if(!token) {
            return res.status(401).json({ message: 'Not authorized, no token' });
        }
    }
};

module.exports = { protect };