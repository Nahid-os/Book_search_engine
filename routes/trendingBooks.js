// routes/trendingBooks.js
const express = require('express');
const router = express.Router();

// Trending Books API without $function
router.get('/', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const booksCollection = db.collection('books');

    // 1) Build an aggregation pipeline
    const pipeline = [
      {
        $match: {
          ratings_count: { $gt: 0 },    // Only books with at least one rating
          average_rating: { $ne: null } // Only books with a defined average_rating
        }
      },
      {
        $sort: {
          ratings_count: -1,
          average_rating: -1
        }
      },
      {
        $limit: 20
      },
      // 2) Lookup matching author docs from the "authors" collection
      {
        $lookup: {
          from: "authors",
          localField: "authors.author_id",  // must be an array of objects
          foreignField: "author_id",
          as: "authorDetails"
        }
      },
      // 3) (Optional) project only the fields you want
      {
        $project: {
          title: 1,
          average_rating: 1,
          ratings_count: 1,
          description: 1,
          authors: 1,
          authorDetails: 1
        }
      }
    ];

    // Run the aggregation
    const rawBooks = await booksCollection.aggregate(pipeline).toArray();

    // 4) Transform "authorDetails" into a readable string for "authors"
    const formattedBooks = rawBooks.map(book => {
      // "authorDetails" is an array of author docs with a "name" field
      const names = (book.authorDetails || []).map(a => a.name).filter(Boolean);
      return {
        ...book,
        // Overwrite "authors" with a human-readable string
        authors: names.length > 0 ? names.join(', ') : "Author"
      };
    });

    // 5) Return the final data
    res.json(formattedBooks);

  } catch (error) {
    console.error('Error fetching trending books:', error);
    res.status(500).json({ error: 'Error fetching trending books' });
  }
});

module.exports = router;
