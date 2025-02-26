// routes/interactions.js
const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
  // Only allow logged-in users to record interactions.
  // Using Passport's isAuthenticated() is more explicit than checking req.user
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  try {
    const { event, bookId } = req.body;
    if (!event || !bookId) {
      return res.status(400).json({ error: "Missing 'event' or 'bookId' in request body" });
    }

    const db = req.app.locals.db;
    const userId = req.user._id; // from Passport session

    // Insert the interaction into the "interactions" collection.
    await db.collection('interactions').insertOne({
      event,       // e.g. "view_details"
      bookId,      // The ID of the book interacted with
      userId,      // The user's ID from the session
      timestamp: new Date()
    });

    res.status(200).json({ message: "Interaction logged" });
  } catch (error) {
    console.error("Error logging interaction:", error);
    res.status(500).json({ error: "Error logging interaction" });
  }
});

module.exports = router;
