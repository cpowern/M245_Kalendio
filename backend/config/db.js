const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Simplified connection call without deprecated options
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected...');
    } catch (err) {
        console.error('Error connecting to MongoDB:', err.message);
        process.exit(1); // Exit process if connection fails
    }
};

module.exports = connectDB;
