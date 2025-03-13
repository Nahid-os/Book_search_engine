const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  const { title } = req.query;
  if (!title) {
    return res.status(400).json({ error: 'Title is required for search' });
  }
  try {
    const db = req.app.locals.db;
    const pipeline = [
      // 1) Match books by text search
      {
        $match: {
          $text: { $search: title }
        }
      },
      // 2) Add a textScore field
      {
        $addFields: {
          score: { $meta: 'textScore' }
        }
      },
      // 3) Sort by textScore descending
      {
        $sort: {
          score: { $meta: 'textScore' }
        }
      },
      // 4) Limit results
      {
        $limit: 20
      },
      // 5) Lookup author docs if "authors" is an array of objects
      {
        $lookup: {
          from: 'authors',
          localField: 'authors.author_id',
          foreignField: 'author_id',
          as: 'authorDetails'
        }
      },
      // 6) Project the fields 
      {
        $project: {
          book_id: 1,
          title: 1,
          average_rating: 1,
          ratings_count: 1,
          description: 1,
          authors: 1,
          authorDetails: 1,
          score: 1
        }
      }
    ];

    // Run the pipeline
    const rawBooks = await db.collection('books').aggregate(pipeline).toArray();

    // 7) Transform authorDetails into a single authors string
    const formattedBooks = rawBooks.map(book => {
      const names = (book.authorDetails || []).map(a => a.name).filter(Boolean);
      return {
        ...book,
        authors: names.length > 0 ? names.join(', ') : "Author"
      };
    });

    res.json(formattedBooks);
  } catch (error) {
    console.error('Error fetching search results:', error);
    res.status(500).json({ error: 'Error fetching search results' });
  }
});

module.exports = router;
