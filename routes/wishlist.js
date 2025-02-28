// routes/wishlist.js
const express = require('express');
const router = express.Router();

// Add a book to the wishlist
router.post('/', async (req, res) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  const { bookId } = req.body;
  if (!bookId) {
    return res.status(400).json({ error: "Missing bookId in request" });
  }

  try {
    const db = req.app.locals.db;
    const userId = req.user._id;
    // Convert bookId to number if your books store numeric IDs
    const numericBookId = Number(bookId);

    // Check if already in wishlist
    const existing = await db.collection('wishlists').findOne({ userId, bookId: numericBookId });
    if (existing) {
      return res.status(400).json({ error: "Book already in wishlist" });
    }

    await db.collection('wishlists').insertOne({
      userId,
      bookId: numericBookId,
      addedAt: new Date()
    });
    res.status(200).json({ message: "Book added to wishlist" });
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    res.status(500).json({ error: "Error adding to wishlist" });
  }
});

// Get wishlist items for the logged-in user
router.get('/', async (req, res) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: "User not authenticated" });
  }
  try {
    const db = req.app.locals.db;
    const userId = req.user._id;
    const wishlistItems = await db.collection('wishlists').find({ userId }).toArray();
    const bookIds = wishlistItems.map(item => item.bookId);

    // Retrieve book details from the "books" collection
    const books = await db.collection('books').find({ book_id: { $in: bookIds } }).toArray();
    res.status(200).json({ wishlist: books });
  } catch (error) {
    console.error("Error retrieving wishlist:", error);
    res.status(500).json({ error: "Error retrieving wishlist" });
  }
});

// Remove a book from the wishlist
router.delete('/:bookId', async (req, res) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  const { bookId } = req.params;
  // Convert to number if that's how you're storing book IDs
  const numericBookId = Number(bookId);

  try {
    const db = req.app.locals.db;
    const userId = req.user._id;
    const result = await db.collection('wishlists').deleteOne({ userId, bookId: numericBookId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Book not found in wishlist" });
    }
    res.status(200).json({ message: "Book removed from wishlist" });
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    res.status(500).json({ error: "Error removing from wishlist" });
  }
});

module.exports = router;
