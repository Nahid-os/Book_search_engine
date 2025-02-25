// routes/bookDetails.js
const express = require('express');
const router = express.Router();

router.get('/:bookId', async (req, res) => {
  try {
    const { bookId } = req.params;
    const db = req.app.locals.db;
    
    // If book_id is numeric, parse it:
    const numericId = parseInt(bookId, 10);

    const pipeline = [
      {
        $match: { book_id: numericId }
      },
      {
        $lookup: {
          from: "authors",
          localField: "authors.author_id",  // authors field must be an array
          foreignField: "author_id",
          as: "authorDetails"
        }
      },
      {
        $project: {
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
          isbn13: 1
        }
      }
    ];

    const results = await db.collection('books').aggregate(pipeline).toArray();
    if (!results || results.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const book = results[0];

    // Transform authorDetails into a human-readable string for authors
    const names = (book.authorDetails || []).map(a => a.name).filter(Boolean);
    book.authors = names.length > 0 ? names.join(', ') : "Author";

    res.json(book);
  } catch (error) {
    console.error('Error fetching book details:', error);
    res.status(500).json({ error: 'Error fetching book details' });
  }
});

module.exports = router;
