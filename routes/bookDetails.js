/**
 * Defines API route to fetch detailed information for a specific book,
 * including author details populated via aggregation.
 */

const express = require('express');
const router = express.Router(); 

// GET /:bookId - Fetches details for a single book by its ID
router.get('/:bookId', async (req, res) => {
  try {
    const { bookId } = req.params; // Extract book ID from URL parameter
    const db = req.app.locals.db;  // Access the database connection from app locals
    const numericId = parseInt(bookId, 10);   // Convert bookId to a number
      
    const pipeline = [
      { $match: { book_id: numericId } },
      {
        $lookup: { 
          from: "authors",   // Join with authors collection
          localField: "authors.author_id",   // Match on author_id in the book's authors array
          foreignField: "author_id",  // Match on author_id in the authors collection
          as: "authorDetails" // Output to authorDetails field
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
          isbn13: 1,
          max_genre: 1,
          isbn: 1, 
          language_code: 1,
          similar_books: 1,
          url: 1
        }
      }
    ];
             
    const results = await db.collection('books').aggregate(pipeline).toArray();       
    if (!results || results.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const book = results[0];

    // Convert authorDetails -> a single authors string
    const names = (book.authorDetails || []).map(a => a.name).filter(Boolean);
    // Handle cases where authorDetails might be empty or undefined
    book.authors = names.length > 0 ? names.join(', ') : "Author";    
        
    res.json(book);
  } catch (error) { 
    console.error('Error fetching book details:', error);
    res.status(500).json({ error: 'Error fetching book details' });
  }
});

module.exports = router;
