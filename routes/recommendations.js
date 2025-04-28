// routes/recommendations.js
const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  // allow Passport-authenticated users, or synthetic users via X-User-Id header
  let userId;
  if (req.isAuthenticated && req.isAuthenticated()) { // Check if req.isAuthenticated is a function and call it
    userId = req.user._id;
  } else if (req.headers['x-user-id']) { // Fallback for synthetic users
    userId = Number(req.headers['x-user-id']);  // Convert to number for consistency
    if (Number.isNaN(userId)) { 
      return res.status(400).json({ error: "Invalid X-User-Id header" }); 
    }
  } else {
    return res.status(401).json({ error: "User not authenticated" }); 
  }

  
  try { 
    const db = req.app.locals.db;
    const booksCollection = db.collection('books'); 
    const wishlistCollection = db.collection('wishlists');
    const interactionsCollection = db.collection('interactions');

    
    // 1. Fetch wishlist and interactions for this user.
    const wishlistEntries = await wishlistCollection.find({ userId }).toArray();
    // Convert wishlist book IDs to numbers.
    const wishlistBookIds = wishlistEntries.map(entry => Number(entry.bookId));
    
    const interactionEntries = await interactionsCollection.find({ 
      userId, 
      event: 'view_details'
    }).toArray();
    const interactedBookIds = interactionEntries.map(entry => Number(entry.bookId));

    // 2. Create a map to aggregate candidate similar books with weights.
    // +2 for each similar book from a wishlist book, +1 for each from an interaction.
    const candidateWeights = {};

    // Helper: parse the similar_books string into an array of numbers.
    const parseSimilarBooks = (book) => {
      if (book.similar_books) {
        try {
          // Replace single quotes with double quotes and parse, then convert to numbers.
          return JSON.parse(book.similar_books.replace(/'/g, '"')).map(id => Number(id));
        } catch (err) {
          console.error(`Error parsing similar_books for book ${book.book_id}:`, err);
        }
      }
      return [];
    };

    // 3a. Process wishlist books (weight +2).
    if (wishlistBookIds.length > 0) {  
      const wishlistBooks = await booksCollection.find({  
        book_id: { $in: wishlistBookIds }
      }).toArray();

      wishlistBooks.forEach(book => {  
        const similarBooks = parseSimilarBooks(book);  
        similarBooks.forEach(simId => {
          candidateWeights[simId] = (candidateWeights[simId] || 0) + 2;
        });
      });
    }

    // 3b. Process interacted books (weight +1).
    if (interactedBookIds.length > 0) {
      const interactedBooks = await booksCollection.find({
        book_id: { $in: interactedBookIds }
      }).toArray();

      interactedBooks.forEach(book => {
        const similarBooks = parseSimilarBooks(book);
        similarBooks.forEach(simId => {
          candidateWeights[simId] = (candidateWeights[simId] || 0) + 1;
        });
      });
    }

    // 4. Remove candidates that are already in the wishlist.
    for (const candidateId in candidateWeights) {
      if (wishlistBookIds.includes(Number(candidateId))) {
        delete candidateWeights[candidateId];
      }
    }

    // 5. Sort the candidate recommendations by weight (highest first).
    const candidatesArray = Object.entries(candidateWeights).map(([bookId, weight]) => ({
      bookId: Number(bookId),
      weight
    }));
    candidatesArray.sort((a, b) => b.weight - a.weight);
    const recommendedBookIds = candidatesArray.map(candidate => candidate.bookId);

    // 6. Query the books collection for these recommended books using an aggregation pipeline.
    const pipeline = [
      {
        $match: {
          book_id: { $in: recommendedBookIds }
        }
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

    const rawRecommendedBooks = await booksCollection.aggregate(pipeline).toArray();

    // 7. Transform authorDetails into a single authors string.
    const formattedRecommendedBooks = rawRecommendedBooks.map(book => {
      const names = (book.authorDetails || []).map(a => a.name).filter(Boolean);
      return {
        ...book,
        authors: names.length > 0 ? names.join(', ') : "Author"
      };
    });

    res.json({
      recommendations: formattedRecommendedBooks
    });
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    res.status(500).json({ error: "Error fetching recommendations" });
  }
});

module.exports = router;