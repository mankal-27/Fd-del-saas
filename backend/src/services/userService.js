// backend/src/services/userService.js
const prisma = require('../config/db');
const { hashPassword, comparePassword } = require('../utils/passwordUtils');
const { generateToken } = require('../utils/jwtUtils');

const registerUser = async (name, email, password) => {
    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
        data:{
            name,
            email,
            password: hashedPassword
        },
    });
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        token: generateToken(user.id)
    };
};

const loginUser = async (email, password) => {
    const user = await prisma.user.findUnique({ where: { email } });
    
    if(user && (await comparePassword(password, user.password))){
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            token: generateToken(user.id)
        };
    }else {
        throw new Error(`Invalid credentials`);
    }
};

module.exports = {
    registerUser,
    loginUser
}