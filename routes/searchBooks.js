// routes/searchBooks.js
const express = require("express");
const router = express.Router();
const esClient = require("../elasticClient"); // Import  Elasticsearch client

// Helper function to treat any query that is purely numeric
// (or numeric with an optional trailing X/x) as an ISBN.
function isISBN(query) {
  const cleaned = query.replace(/[-\s]/g, "");
  return /^\d+([Xx])?$/.test(cleaned);
}

router.get("/", async (req, res) => {
  const { title } = req.query;
  if (!title) {
    return res.status(400).json({ error: "Title is required for search" });
  }

  try {
    let esQuery;

    if (isISBN(title)) {
      // ----- ISBN SEARCH BRANCH -----
      let cleanedQuery = title.replace(/[-\s]/g, "");
      // If the cleaned ISBN is 10 digits and starts with "0", remove the leading 0.
      if (/^\d{10}$/.test(cleanedQuery) && cleanedQuery.startsWith("0")) {
        cleanedQuery = cleanedQuery.substring(1);
      }
      
      esQuery = {
        query: {
          bool: {
            should: [
              { term: { isbn: cleanedQuery } },  // ISBN-10
              { term: { isbn13: cleanedQuery } } // ISBN-13
            ]
          }
        },
        size: 240
      };
    } else {
      // ----- NON-ISBN SEARCH (TITLE, KEYWORDS, AUTHOR) -----
      esQuery = {
        query: {
          multi_match: {
            query: title,
            fields: ["title^3", "author_names^2", "description"]  
          }
        },
        size: 240
      };
    }

    // Perform the search in Elasticsearch
    const esResponse = await esClient.search({
      index: "books", // Make sure this matches your actual index name
      body: esQuery
    });

    // esResponse.hits.hits is the array of matching docs
    const rawBooks = esResponse.hits.hits.map((hit) => {
      const source = hit._source;
      return {
        ...source,
        score: isISBN(title) ? 100 : hit._score
      };
    });

    // Format the output: use the denormalized author_names field if available.
    const formattedBooks = rawBooks.map((book) => ({
      ...book,
      authors: book.author_names || book.authors || "Author"
    }));

    res.json(formattedBooks);
  } catch (error) {
    console.error("Error searching with Elasticsearch:", error);
    res.status(500).json({ error: "Error fetching search results" });
  }
});

module.exports = router;
