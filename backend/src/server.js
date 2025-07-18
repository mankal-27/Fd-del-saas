// backend/src/server.js
const app = require('./app');
const prisma = require('./config/db');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await prisma.$connect() // Connect to database
        console.log('Database connected successfully.');
        app.listen(PORT, () => {
            console.log('Server running on port', PORT);
        });
    }catch(err) {
        console.error('Failed to connect to the database or start server', err);
        process.exit(1); // Exit process with failer
    }
};

startServer();