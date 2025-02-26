// routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const passport = require('passport');

// Register route
router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }
  try {
    const db = req.app.locals.db;
    const usersCollection = db.collection('users');
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { email, password: hashedPassword };
    await usersCollection.insertOne(newUser);
    return res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ message: "Registration failed" });
  }
});

// Login route
router.post('/login', passport.authenticate('local'), (req, res) => {
  req.session.save((err) => {
    if (err) {
      console.error("Session save error:", err);
      return res.status(500).json({ message: "Session save failed" });
    }
    // Set a non-HttpOnly cookie for middleware
    res.cookie('isAuthenticated', 'true', {
      httpOnly: false,    // so Next.js middleware can read it
      sameSite: 'lax',   // required for cross-site
      secure: false,      // false for local HTTP
      path: '/'
    });
    console.log("Logged in user:", req.user);
    return res.status(200).json({ message: "Logged in successfully", user: req.user });
  });
});

// Logout route
router.post('/logout', (req, res, next) => {
  // Provide a callback to req.logout
  req.logout((err) => {
    if (err) { 
      return next(err); 
    }
    // Clear your custom cookie
    res.clearCookie('isAuthenticated', { path: '/' });
    return res.json({ message: "Logged out successfully" });
  });
});

// Status route
router.get('/status', (req, res) => {
  console.log("Auth status check, req.user:", req.user);
  if (req.isAuthenticated && req.isAuthenticated()) {
    return res.status(200).json({ loggedIn: true, user: req.user });
  } else {
    return res.status(200).json({ loggedIn: false });
  }
});

module.exports = router;
