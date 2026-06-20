

const mongoose = require('mongoose');
require('dotenv').config();


const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('MongoDB connection failed:', err.message);
        console.log('Server will continue running without database features');
        // Don't exit - allow server to run without MongoDB for AI features
    }
};

module.exports = connectDB;
