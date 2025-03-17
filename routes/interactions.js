// routes/interactions.js
const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
  // Log user info and isAuthenticated() result for debugging
  console.log("Incoming interaction request.");
  console.log("req.user:", req.user);
  console.log("req.isAuthenticated:", typeof req.isAuthenticated === "function" ? req.isAuthenticated() : "not a function");

  // Ensure req.isAuthenticated exists and returns true.
  if (typeof req.isAuthenticated !== 'function' || !req.isAuthenticated()) {
    console.error("User not authenticated in interactions route.");
    return res.status(401).json({ error: "User not authenticated" });
  }

  try {
    const { event, bookId } = req.body;
    if (!event || !bookId) {
      return res.status(400).json({ error: "Missing 'event' or 'bookId' in request body" });
    }

    const db = req.app.locals.db;
    const userId = req.user._id; // from Passport session
    console.log(`Logging interaction for userId: ${userId}, event: ${event}, bookId: ${bookId}`);

    const result = await db.collection('interactions').insertOne({
      event,       // e.g. "view_details"
      bookId,      // The ID of the book interacted with
      userId,      // The user's ID from the session
      timestamp: new Date()
    });

    console.log("Interaction insert result:", result);
    res.status(200).json({ message: "Interaction logged" });
  } catch (error) {
    console.error("Error logging interaction:", error);
    res.status(500).json({ error: "Error logging interaction" });
  }
});

module.exports = router;
