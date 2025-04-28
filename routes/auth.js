/**
 * Defines API routes for user authentication (register, login, logout, status check).
 * Uses Express, Passport.js for authentication strategies, bcrypt for password hashing,
 * and MongoDB for user data storage.
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt'); // Library for password hashing
const passport = require('passport'); // Authentication middleware for Node.js
const { ObjectId } = require('mongodb'); // Used if manipulating MongoDB ObjectIDs directly (not used here currently)

// --- User Registration Route ---
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  // --- Input Validation ---
  if (!username || !email || !password) {
    return res.status(400).json({ message: "Username, email, and password are required" });
  }
  // Basic validation rules (can be enhanced with libraries like Joi or express-validator)
  if (username.length < 3) {
    return res.status(400).json({ message: "Username must be at least 3 characters long" });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters long" });
  }
  // Simple regex for email format validation
  if (!/\S+@\S+\.\S+/.test(email)) {
       return res.status(400).json({ message: "Invalid email format" });
  }

  try {
    // Access the database connection established in app.js (or server.js)
    const db = req.app.locals.db;
    const usersCollection = db.collection('users'); // TODO: Use constants for collection names

    // --- Check for Existing User ---
    // Ensure username is unique
    const existingUserByUsername = await usersCollection.findOne({ username });
    if (existingUserByUsername) {
      return res.status(400).json({ message: "Username already taken" });
    }
    // Ensure email is unique
    const existingUserByEmail = await usersCollection.findOne({ email });
    if (existingUserByEmail) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // --- Password Hashing ---
    // Hash the plain text password before storing it in the database
    const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds

    // --- Create and Store New User ---
    const newUser = {
        username,
        email,
        password: hashedPassword, // Store the hashed password
        createdAt: new Date()     // Timestamp for user creation
    };
    await usersCollection.insertOne(newUser);

    // --- Success Response ---
    return res.status(201).json({ message: "User registered successfully" });

  } catch (error) {
    // --- Error Handling ---
    console.error("Registration Error:", error);
    return res.status(500).json({ message: "Registration failed due to server error" });
  }
});


// --- User Login Route ---
// Uses Passport's 'local' strategy (defined elsewhere, typically in passport-config.js)
// Implements a custom callback for passport.authenticate to handle responses directly.
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    // 1. Handle Internal Server Errors during authentication attempt
    if (err) {
      console.error("Passport Authentication Error:", err);
      return res.status(500).json({ message: "Authentication server error" });
    }

    // 2. Handle Authentication Failure (Invalid credentials, user not found)
    if (!user) {
      // 'info' object typically contains a 'message' property from the Passport strategy
      // indicating the reason for failure (e.g., 'Incorrect password', 'User not found').
      return res.status(401).json({ message: info?.message || "Invalid credentials" });
    }

    // 3. Handle Authentication Success
    // Establish a login session for the user. Passport adds req.logIn function.
    req.logIn(user, (loginErr) => {
      if (loginErr) {
        console.error("Session Login Error:", loginErr);
        return res.status(500).json({ message: "Session could not be established" });
      }

      // Explicitly save the session before sending the response to ensure data persistence.
      req.session.save((sessionErr) => {
        if (sessionErr) {
          console.error("Session Save Error After Login:", sessionErr);
          // Note: Session might be partially established, but saving failed.
          // Depending on requirements, might need to attempt logout or send error.
          return res.status(500).json({ message: "Failed to save session" });
        }

        // Optional: Set a client-readable cookie indicating authentication state.
        // Useful for simple client-side checks, but the session cookie is the source of truth.
        // Note: `httpOnly: false` makes it accessible to client-side scripts (use with caution).
        res.cookie('isAuthenticated', 'true', {
            httpOnly: false, // Set to true if client-side JS doesn't need to read it
            sameSite: 'lax', // Recommended for most cases
            secure: process.env.NODE_ENV === 'production', // Send only over HTTPS in production
            path: '/' // Cookie is valid for the entire site
        });

        // Login successful, session created and saved.
        console.log("User logged in:", user.username); // Log successful login

        // --- Prepare and Send Success Response ---
        // IMPORTANT: Never send the hashed password back to the client.
        const { password, ...userToSend } = user; // Use object destructuring to exclude the password field.
        return res.status(200).json({
            message: "Logged in successfully",
            user: userToSend // Send user details (without password)
        });
      });
    });
  })(req, res, next); // Immediately invoke the Passport middleware function
});


// --- User Logout Route ---
router.post('/logout', (req, res, next) => {
    // Passport adds the req.logout function to terminate the login session.
    req.logout((err) => {
        if (err) {
            console.error("Logout Error:", err);
            // Pass the error to the next error-handling middleware if configured
            return next(err);
        }

        // Clear the optional client-readable cookie.
        res.clearCookie('isAuthenticated', { path: '/' });

        // Destroy the session data stored on the server.
        req.session.destroy((destroyErr) => {
            if (destroyErr) {
                // Log the error but still attempt to send success response to client.
                console.error("Session Destruction Error:", destroyErr);
            }
            // Confirm logout to the client.
            return res.status(200).json({ message: "Logged out successfully" });
        });
    });
});

// --- Authentication Status Check Route ---
// Used by the frontend to verify if the user's session is still active.
router.get('/status', (req, res) => {
  // Passport adds req.isAuthenticated() which checks the session status.
  if (req.isAuthenticated() && req.user) {
    // If authenticated, send back confirmation and user details (excluding password).
    const { password, ...userToSend } = req.user;
    return res.status(200).json({ loggedIn: true, user: userToSend });
  } else {
    // If not authenticated, indicate logged-out status.
    return res.status(200).json({ loggedIn: false, user: null });
  }
});

module.exports = router; // Export the router for use in the main application file