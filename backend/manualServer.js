const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const ManualUser = require('./models/ManualUser'); // Manual user schema
require('dotenv').config();

const app = express();
const PORT = 5001;

console.log('Manual auth server starting...');
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('Manual Auth DB Connected...'))
  .catch((err) => {
    console.error('Error connecting to manual auth DB:', err);
    process.exit(1);
  });

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Signup Route
app.post('/signup', async (req, res) => {
  console.log('Received signup request:', req.body);

  const { name, email, password } = req.body;

  try {
    const normalizedEmail = email.toLowerCase();
    const newUser = new ManualUser({ name, email: normalizedEmail, password });
    await newUser.save();

    console.log('User saved to database:', newUser);
    res.status(201).json({ success: true, message: 'Signup successful' });
  } catch (err) {
    console.error('Error during signup:', err);
    res.status(500).json({ success: false, message: 'Server error during signup' });
  }
});

// Login Route
app.post('/login', async (req, res) => {
  console.log('Received login request:', req.body);

  const { email, password } = req.body;

  try {
    const normalizedEmail = email.toLowerCase();
    const user = await ManualUser.findOne({ email: normalizedEmail });

    if (!user) {
      console.log('User not found');
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    console.log('Login Plain password:', password);
    console.log('Password from DB:', user.password);

    if (password !== user.password) {
      console.log('Invalid password');
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    console.log('Login successful');
    res.status(200).json({ success: true, message: 'Login successful', user });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

// Start the server
app.listen(PORT, () => console.log(`Manual auth server running on http://localhost:${PORT}`));
