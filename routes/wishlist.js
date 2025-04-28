// This file contains the routes for managing the user's wishlist.
// It allows adding, retrieving, and removing books from the wishlist.

const express = require('express');
const router = express.Router();

// Add a book to the wishlist
router.post('/', async (req, res) => { 
  if (!req.isAuthenticated()) { // Check if the user is authenticated
    return res.status(401).json({ error: "User not authenticated" });
  }

  const { bookId } = req.body; // Extract bookId from request body
  if (!bookId) {
    return res.status(400).json({ error: "Missing bookId in request" });
  }

  try { 
    const db = req.app.locals.db;
    const userId = req.user._id;
    const numericBookId = Number(bookId);

    // Check if already in wishlist
    const existing = await db.collection('wishlists').findOne({ userId, bookId: numericBookId });
    if (existing) {
      return res.status(400).json({ error: "Book already in wishlist" });
    }

    await db.collection('wishlists').insertOne({  // Insert the new wishlist item
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
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "User not authenticated" });
  }
  try {  
    const db = req.app.locals.db; // Access the database connection from app locals
    const userId = req.user._id;  // Get the authenticated user's ID
    const wishlistItems = await db.collection('wishlists').find({ userId }).toArray();  // Fetch wishlist items for this user
    const bookIds = wishlistItems.map(item => item.bookId); // Extract book IDs from wishlist items

    // Use an aggregation pipeline to fetch complete book details along with author details
    const pipeline = [
      { $match: { book_id: { $in: bookIds } } },
      {
        $lookup: {
          from: "authors",
          localField: "authors.author_id",
          foreignField: "author_id",
          as: "authorDetails"
        }
      },
      {
        $project: {  // Project the fields to include in the output
          book_id: 1,
          title: 1,
          average_rating: 1,
          ratings_count: 1,
          description: 1,
          authors: 1,
          authorDetails: 1,
          publisher: 1,
          publication_year: 1,
          num_pages: 1,
          isbn13: 1,
          max_genre: 1,
          isbn: 1,
          language_code: 1,
          similar_books: 1,
          url: 1
        }
      }
    ];

    const books = await db.collection('books').aggregate(pipeline).toArray();
    res.status(200).json({ wishlist: books });
  } catch (error) {
    console.error("Error retrieving wishlist:", error);
    res.status(500).json({ error: "Error retrieving wishlist" });
  }
});

// Remove a book from the wishlist
router.delete('/:bookId', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  const { bookId } = req.params;  // Extract bookId from URL parameter
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