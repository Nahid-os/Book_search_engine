const express = require('express');
const router = express.Router();

// Search Books API
router.get('/', async (req, res) => {
  const { title } = req.query;
  if (!title) {
    return res.status(400).json({ error: 'Title is required for search' });
  }
  try {
    const booksCollection = req.app.locals.db.collection('books');
    const searchResults = await booksCollection
      .find(
        { $text: { $search: title } }, // Use $text for text-based search
        {
          projection: {
            title: 1,
            average_rating: 1,
            ratings_count: 1,
            description: 1,
            authors: 1,
            score: { $meta: 'textScore' }, // Include text match score
          },
        }
      )
      .sort({ score: { $meta: 'textScore' } }) // Sort by text match score
      .limit(20)
      .toArray();

    res.json(searchResults);
  } catch (error) {
    console.error('Error fetching search results:', error);
    res.status(500).json({ error: 'Error fetching search results' });
  }
});

module.exports = router;
