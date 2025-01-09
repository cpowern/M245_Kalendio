//server.js
const express = require('express');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const cors = require('cors');
const passport = require('passport');
require('dotenv').config();
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth'); // Authentication routes
const apiRoutes = require('./routes/api'); // API routes for calendars, etc.
const tasksRoutes = require('./routes/tasks'); // Task routes

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// MongoDB Store for Sessions
const store = new MongoDBStore({
    uri: process.env.MONGO_URI,
    collection: 'sessions',
});

store.on('error', (error) => {
    console.error('MongoDB Session Store Error:', error);
});

// Middleware
app.use(cors({ origin: 'http://localhost:5173', credentials: true })); // Enable CORS for frontend
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
    session({
        secret: process.env.SESSION_SECRET || 'secret',
        resave: false,
        saveUninitialized: false,
        store: store, // MongoDB store
        cookie: { maxAge: 1000 * 60 * 60 * 24 }, // 1 day
    })
);
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/auth', authRoutes); // Authentication Routes
app.use('/api', apiRoutes); // Calendar and group API Routes
app.use('/tasks', tasksRoutes); // Task-related routes

// Start the Server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

// Test Endpoint for Debugging CORS (Add this first, above other handlers)
app.get('/test', (req, res) => {
    console.log('Test endpoint hit');
    res.json({ message: 'CORS is working!' });
});

// Root Route
app.get('/', (req, res) => {
    res.send({ message: 'Welcome to the Kalendio API' });
});

// Catch-All for Undefined Routes (Move this to the end)
app.use((req, res, next) => {
    res.status(404).send({ message: 'Route not found' });
});
