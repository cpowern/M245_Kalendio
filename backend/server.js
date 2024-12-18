const express = require('express');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const cors = require('cors');
const passport = require('passport');
require('dotenv').config();
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth'); // Authentication routes
const apiRoutes = require('./routes/api'); // API routes for calendars, etc.

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// MongoDB-Store for Sessions
const store = new MongoDBStore({
    uri: process.env.MONGO_URI,
    collection: 'sessions',
});

store.on('error', (error) => {
    console.error('MongoDB Session Store Error:', error);
});

// Middleware
app.use(cors({ origin: 'http://localhost:5173', credentials: true })); // Enable credentials
app.use(express.json());
app.use(
    session({
        secret: 'secret',
        resave: false,
        saveUninitialized: false,
        store: store, // MongoDB store
        cookie: { maxAge: 1000 * 60 * 60 * 24 }, // 1 day
    })
);
app.use(passport.initialize());
app.use(passport.session());


// Authentication Routes
app.use('/auth', authRoutes);

// API Routes for calendars and group functionality
app.use('/api', apiRoutes);

// Root Route
app.get('/', (req, res) => {
    res.send({ message: 'Welcome to the Kalendio API' });
});

// Handle unauthorized requests
app.use((req, res, next) => {
    res.status(401).send({ message: 'Unauthorized request' });
});

// Start the Server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
