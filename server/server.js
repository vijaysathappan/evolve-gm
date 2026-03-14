import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Simple request logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

const PORT = process.env.PORT || 5000;


// Sign Up Route
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, userId, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ userId }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User ID or Email already exists' });
    }

    const newUser = new User({
      username,
      userId,
      email,
      password // In a real app, hash this password!
    });

    await newUser.save();
    res.status(201).json({ message: 'User created successfully', user: { username, userId, email } });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Sign In Route
app.post('/api/auth/signin', async (req, res) => {
  try {
    const { userId, password } = req.body;
    
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(400).json({ message: 'Invalid User ID' });
    }

    if (user.password !== password) {
      return res.status(400).json({ message: 'Invalid Password' });
    }

    res.status(200).json({ message: 'Login successful', user: { username: user.username, userId: user.userId, email: user.email } });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Check User ID availability
app.get('/api/auth/check-userid/:userId', async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.userId });
    console.log(`[AUTH] UserID Check: ${req.params.userId} -> ${!user ? 'Available' : 'Taken'}`);
    res.json({ available: !user });
  } catch (err) {
    console.error('[AUTH ERROR] UserID Check:', err.message);
    res.status(500).json({ error: 'Server error', available: true });
  }
});

// Check Email availability
app.get('/api/auth/check-email/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    console.log(`[AUTH] Email Check: ${req.params.email} -> ${!user ? 'Available' : 'Taken'}`);
    res.json({ available: !user });
  } catch (err) {
    console.error('[AUTH ERROR] Email Check:', err.message);
    res.status(500).json({ error: 'Server error', available: true });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT} (0.0.0.0)`);
});
