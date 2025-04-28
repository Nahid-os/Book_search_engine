/**
 * Defines the API route for fetching a list of trending books.
 * Trending is determined by sorting books based on rating count and average rating.
 */

const express = require('express');  
const router = express.Router();

// GET /api/trending - Fetches a list of trending books
router.get('/', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const booksCollection = db.collection('books');

    // Define the aggregation pipeline to fetch trending books
    const pipeline = [
      {
        $match: {
          ratings_count: { $gt: 0 },
          average_rating: { $ne: null }
        }
      },
      {  
        $sort: {  // Sort by ratings_count and average_rating
          ratings_count: -1, // Descending order for ratings_count
          average_rating: -1 // Descending order for average_rating
        }
      },
      {
        $limit: 55  // Limit to top 55 trending books
      },
      {
        $lookup: {  // Join with authors collection
          from: "authors", // Name of the authors collection
          localField: "authors.author_id", // Field in books collection
          foreignField: "author_id", // Field in authors collection
          as: "authorDetails" // Output field for author details
        }
      },
      {
        $project: { // Project the fields to include in the output
          // Include book_id in the final output
          book_id: 1,
          title: 1,
          average_rating: 1,
          ratings_count: 1,
          description: 1,
          authors: 1,
          authorDetails: 1,
          isbn13: 1,
          max_genre: 1
        }
      }
    ];

    const rawBooks = await booksCollection.aggregate(pipeline).toArray();

    // Transform authors to a string
    const formattedBooks = rawBooks.map(book => {
      const names = (book.authorDetails || []).map(a => a.name).filter(Boolean);
      return {
        ...book,
        authors: names.length > 0 ? names.join(', ') : "Author"
      };
    });

    res.json(formattedBooks); // Send the formatted books as JSON response
  } catch (error) {
    console.error('Error fetching trending books:', error);
    res.status(500).json({ error: 'Error fetching trending books' });
  }
});

module.exports = router;