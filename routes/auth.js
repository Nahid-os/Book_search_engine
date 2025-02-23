// routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const passport = require('passport');

// Register route
router.post('/register', async (req, res) => {
    const { email, password } = req.body;
  
    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
  
    try {
      const db = req.app.locals.db;
      const usersCollection = db.collection('users');
  
      // Check if email is already in use
      const existingUser = await usersCollection.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }
  
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Insert new user
      const newUser = {
        email,
        password: hashedPassword,
      };
      await usersCollection.insertOne(newUser);
  
      res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });
  

// Login route (using Passport to authenticate)
router.post('/login', passport.authenticate('local'), (req, res) => {
  res.json({ message: "Logged in successfully", user: req.user });
});

// Logout route
router.post('/logout', (req, res) => {
  req.logout();
  res.json({ message: "Logged out successfully" });
});

module.exports = router;
