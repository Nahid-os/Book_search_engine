// evaluate.js

const { MongoClient } = require('mongodb');
const fetch = require('node-fetch');

(async function main() {
  try {
    const MONGO_URI = 'mongodb://127.0.0.1:27017';
    console.log('▶ Connecting to MongoDB…');
    const client = await MongoClient.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');
    const db = client.db('book_database');
    const booksCol = db.collection('books');
    const wishCol  = db.collection('wishlists');

    // Helper to parse similar_books field
    function parseSimilarBooks(book) {
      if (!book.similar_books) return [];
      try {
        return JSON
          .parse(book.similar_books.replace(/'/g, '"'))
          .map(id => Number(id));
      } catch (err) {
        console.error(`Error parsing similar_books for ${book.book_id}:`, err);
        return [];
      }
    }

    // 1) Stream just book_id + max_genre to avoid OOM
    console.log('▶ Loading books by genre (streaming)…');
    const byGenre = {};
    let totalBooks = 0;
    const genreCursor = booksCol.find(
      {},
      { projection: { book_id: 1, max_genre: 1, _id: 0 } }
    );
    await genreCursor.forEach(doc => {
      totalBooks++;
      const genre = doc.max_genre || 'Unknown';
      if (!byGenre[genre]) byGenre[genre] = [];
      byGenre[genre].push(doc.book_id);
    });
    console.log(`✅ Loaded ${totalBooks} books across ${Object.keys(byGenre).length} genres`);

    // 2) Generate synthetic users
    const users = [];
    let nextUserId = 1_000_000;
    function sample(arr, n) {
      return arr.slice().sort(() => 0.5 - Math.random()).slice(0, n);
    }
    const genres = Object.keys(byGenre);
    // 20 single-genre users
    for (let i = 0; i < 20; i++) {
      const g = genres[Math.floor(Math.random() * genres.length)];
      users.push({ id: nextUserId++, wishlist: sample(byGenre[g], 5) });
    }
    // 20 mixed-genre users
    for (let i = 0; i < 20; i++) {
      const chosen = sample(genres, 3);
      const flat = chosen.flatMap(g => sample(byGenre[g], 2));
      users.push({ id: nextUserId++, wishlist: flat.slice(0, 5) });
    }
    console.log(`✅ Generated ${users.length} synthetic users`);

    // 3) Insert their wishlists
    const syntheticIds = users.map(u => u.id);
    await wishCol.deleteMany({ userId: { $in: syntheticIds } });
    console.log('▶ Inserting synthetic wishlists…');
    await wishCol.insertMany(
      users.flatMap(u =>
        u.wishlist.map(bookId => ({ userId: u.id, bookId }))
      )
    );
    console.log('✅ Synthetic wishlists inserted');

    // 4) Evaluate recommendations via similar_books as ground truth
    const K = 10;
    let hitCount = 0,
        precisionSum = 0,
        mrrSum = 0,
        ndcgSum = 0;

    for (const u of users) {
      const training = u.wishlist;
      // reset this user's wishlist to training set
      await wishCol.deleteMany({ userId: u.id });
      await wishCol.insertMany(
        training.map(bid => ({ userId: u.id, bookId: bid }))
      );

      // build relevant set = union of similar_books of each training book
      const relevantSet = new Set();
      for (const bid of training) {
        const bookDoc = await booksCol.findOne(
          { book_id: bid },
          { projection: { similar_books: 1, _id: 0 } }
        );
        parseSimilarBooks(bookDoc || {}).forEach(sim => {
          if (!training.includes(sim)) relevantSet.add(sim);
        });
      }
      const relSize = relevantSet.size;
      if (relSize === 0) {
        console.log(`▶ [User ${u.id}] no similar_books for training; skipping`);
        continue;
      }

      console.log(`▶ [User ${u.id}] training ${training.length} items, ${relSize} relevant`);

      // call recommendations endpoint
      const res = await fetch('http://localhost:3001/api/recommendations', {
        headers: { 'X-User-Id': String(u.id) }
      });
      if (!res.ok) {
        console.warn(`↳ Skipped user ${u.id} (status ${res.status})`);
        continue;
      }
      const data = await res.json();
      const recs = (data.recommendations || [])
        .map(b => b.book_id)
        .slice(0, K);
      console.log(`   ↳ got ${recs.length} recs`);

      // compute metrics
      const hits = recs.filter(id => relevantSet.has(id)).length;
      if (hits > 0) hitCount++;
      precisionSum += hits / K;

      const firstIdx = recs.findIndex(id => relevantSet.has(id));
      if (firstIdx !== -1) {
        mrrSum  += 1 / (firstIdx + 1);
        ndcgSum += 1 / Math.log2(firstIdx + 2);
      }
    }

    // 5) Print final metrics
    const n = users.length;
    console.log('▶ Final metrics:');
    console.log({
      'HitRate@10':   (hitCount     / n).toFixed(4),
      'Precision@10': (precisionSum / n).toFixed(4),
      'MRR@10':       (mrrSum       / n).toFixed(4),
      'NDCG@10':      (ndcgSum      / n).toFixed(4),
    });

    await client.close();
    process.exit(0);

  } catch (err) {
    console.error('❌ Evaluation error:', err);
    process.exit(1);
  }
})();
