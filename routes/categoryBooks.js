// routes/categoryBooks.js
const express = require("express");
const router = express.Router();
const esClient = require("../elasticClient");

// Define the valid categories for filtering
const VALID_CATEGORIES = [
  "fiction",
  "non-fiction",
  "romance",
  "paranormal",
  "fantasy",
  "mystery",
  "crime",
  "thriller",
  "history",
  "biography",
  "historical fiction",
  "children",
  "graphic",
  "comics",
  "young-adult",
  "poetry",
];

// GET /api/category/:categoryName - Fetches books by category
router.get("/:categoryName", async (req, res) => {
  const { categoryName } = req.params; // Extract category name from URL parameter
  const lowerCat = categoryName.toLowerCase(); // Normalize to lowercase

  if (!VALID_CATEGORIES.includes(lowerCat)) {  // Check if the category is valid
    // If not, return a 400 error with a message
    return res.status(400).json({  
      error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}`,  
    });
  }

  try {
    // Construct the Elasticsearch query to fetch books by category
    const esQuery = {
      query: {
        term: {
          max_genre: lowerCat,  // Use the normalized category name for the term query
        },
      },
      size: 1000,
      sort: [{ "ratings_count": { "order": "desc" } }] // optional sorting by ratings_count
    };

    // Execute the search query against the Elasticsearch index
    const esResponse = await esClient.search({  
      index: "books", 
      body: esQuery,
    });

    // Convert each hit to a "BookCard-friendly" format
    const rawBooks = esResponse.hits.hits.map((hit) => hit._source);
    const formattedBooks = rawBooks.map((book) => {
      return {
        // Use the existing or fallback IDs for detail
        id: book.book_id || book._id || null,
        author: book.author_names || book.authors || "Unknown Author",
        rating: book.average_rating ?? 0,
        numRatings: book.ratings_count ?? 0,
        title: book.title,
        isbn13: book.isbn13,
        cover_id: book.cover_id,
        authors: book.author_names || book.authors,
        max_genre: book.max_genre,
      };
    });

    res.json(formattedBooks);  // Send the formatted books as JSON response
  } catch (error) {
    console.error("Error fetching category books:", error);
    res.status(500).json({ error: "Error fetching category books" });
  }
});

module.exports = router;
