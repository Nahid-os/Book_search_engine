// routes/recommendations.js
const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  // Check if the user is authenticated
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  try {
    const db = req.app.locals.db;
    const booksCollection = db.collection('books');
    const wishlistCollection = db.collection('wishlists');
    const interactionsCollection = db.collection('interactions');

    // 1. Fetch the logged-in user's wishlist & interactions
    const userId = req.user._id;
    const wishlistEntries = await wishlistCollection.find({ userId }).toArray();
    // Convert all wishlist bookIds to numbers
    const wishlistBookIds = wishlistEntries.map(entry => Number(entry.bookId));

    const interactionEntries = await interactionsCollection.find({
      userId,
      event: 'view_details'
    }).toArray();
    // Convert all interacted bookIds to numbers
    const interactedBookIds = interactionEntries.map(entry => Number(entry.bookId));

    // 2. Map for aggregated candidate weights
    // (+2 for similar books from wishlist, +1 from interactions)
    const candidateWeights = {};

    // Helper to parse similar_books into numeric IDs
    const parseSimilarBooks = (book) => {
      if (book.similar_books) {
        try {
          // Convert "['8709549','17074050',...]" -> array of numeric IDs
          const arr = JSON.parse(book.similar_books.replace(/'/g, '"'));
          return arr.map(id => Number(id)); // convert each to a number
        } catch (err) {
          console.error(`Error parsing similar_books for book ${book.book_id}:`, err);
        }
      }
      return [];
    };

    // 3a. Process wishlist books with weight +2
    if (wishlistBookIds.length > 0) {
      // Fetch the actual wishlist book docs
      const wishlistBooks = await booksCollection.find({
        book_id: { $in: wishlistBookIds }
      }).toArray();

      wishlistBooks.forEach(book => {
        const similarIds = parseSimilarBooks(book); // numeric array
        similarIds.forEach(simId => {
          candidateWeights[simId] = (candidateWeights[simId] || 0) + 2;
        });
      });
    }

    // 3b. Process interacted books with weight +1
    if (interactedBookIds.length > 0) {
      const interactedBooks = await booksCollection.find({
        book_id: { $in: interactedBookIds }
      }).toArray();

      interactedBooks.forEach(book => {
        const similarIds = parseSimilarBooks(book);
        similarIds.forEach(simId => {
          candidateWeights[simId] = (candidateWeights[simId] || 0) + 1;
        });
      });
    }

    // 4. Remove candidates that are in the wishlist (so we don't recommend them)
    for (const candidateId in candidateWeights) {
      const numericCandidateId = Number(candidateId);
      if (wishlistBookIds.includes(numericCandidateId)) {
        delete candidateWeights[candidateId];
      }
    }

    // 5. Sort candidates by descending weight
    const candidatesArray = Object.entries(candidateWeights).map(([bookIdStr, weight]) => ({
      bookId: Number(bookIdStr),
      weight
    }));
    candidatesArray.sort((a, b) => b.weight - a.weight);

    // 6. Find recommended books in the DB
    const recommendedBookIds = candidatesArray.map(c => c.bookId);
    const recommendedBooks = await booksCollection.find({
      book_id: { $in: recommendedBookIds }
    }).toArray();

    // Sort the final recommended books in the same order as recommendedBookIds
    const recommendedMap = {};
    recommendedBooks.forEach(book => {
      recommendedMap[book.book_id] = book;
    });

    const sortedRecommendedBooks = recommendedBookIds
      .map(id => recommendedMap[id])
      .filter(b => b); // remove any undefined

    res.json({ recommendations: sortedRecommendedBooks });
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    res.status(500).json({ error: "Error fetching recommendations" });
  }
});

module.exports = router;
