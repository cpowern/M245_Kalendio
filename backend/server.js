//server.js
const express = require('express');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const cors = require('cors');
const passport = require('passport');
require('dotenv').config();
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Verbinde mit MongoDB
connectDB();

// MongoDB-Store für Sessions
const store = new MongoDBStore({
    uri: process.env.MONGO_URI,
    collection: 'sessions',
});

store.on('error', (error) => {
    console.error('MongoDB Session Store Error:', error);
});

// Middleware
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(
    session({
        secret: 'secret',
        resave: false,
        saveUninitialized: false,
        store: store,
        cookie: { maxAge: 1000 * 60 * 60 * 24 }, // 1 Tag
    })
);
app.use(passport.initialize());
app.use(passport.session());

// Authentifizierungsrouten
app.use('/auth', authRoutes);

// Root-Route
app.get('/', (req, res) => {
    res.send({ message: 'Welcome to the Kalendio API' });
});

// Server starten
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
