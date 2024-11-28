const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config(); // Load environment variables from .env
const connectDB = require('./config/db'); // MongoDB connection

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
const exampleRoutes = require('./routes/exampleRoutes');
app.use('/api', exampleRoutes);

// Default Route
app.get('/', (req, res) => {
    res.send({ message: 'Welcome to the Kalendio API' });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
