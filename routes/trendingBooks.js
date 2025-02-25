// routes/trendingBooks.js
const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const booksCollection = db.collection('books');

    const pipeline = [
      {
        $match: {
          ratings_count: { $gt: 0 },
          average_rating: { $ne: null }
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
      {
        $lookup: {
          from: "authors",
          localField: "authors.author_id",
          foreignField: "author_id",
          as: "authorDetails"
        }
      },
      {
        $project: {
          // Include book_id in the final output
          book_id: 1,
          title: 1,
          average_rating: 1,
          ratings_count: 1,
          description: 1,
          authors: 1,
          authorDetails: 1
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

    res.json(formattedBooks);
  } catch (error) {
    console.error('Error fetching trending books:', error);
    res.status(500).json({ error: 'Error fetching trending books' });
  }
});

module.exports = router;
