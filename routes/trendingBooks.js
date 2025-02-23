const express = require('express');
const router = express.Router();
const parseAuthors = require('../server/helpers/parseAuthors');

// Trending Books API
router.get('/', async (req, res) => {
  try {
    const booksCollection = req.app.locals.db.collection('books');
    const trendingBooks = await booksCollection
      .find(
        {
          ratings_count: { $gt: 0 }, // Only books with at least one rating
          average_rating: { $ne: null }, // Only books with a defined average_rating
        },
        {
          projection: {
            title: 1,
            average_rating: 1,
            ratings_count: 1,
            description: 1,
            authors: 1,
          },
        }
      )
      .sort({ ratings_count: -1, average_rating: -1 }) // Sort by ratings_count, then average_rating
      .limit(20)
      .toArray();

    // Format the authors field
    const formattedBooks = trendingBooks.map(book => ({
      ...book,
      authors: parseAuthors(book.authors),
    }));

    res.json(formattedBooks);
  } catch (error) {
    console.error('Error fetching trending books:', error);
    res.status(500).json({ error: 'Error fetching trending books' });
  }
});

module.exports = router;
