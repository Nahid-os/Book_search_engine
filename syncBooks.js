/**
 * Script to synchronize book data from a MongoDB collection
 * into an Elasticsearch index ('books'). It first deletes and recreates the
 * Elasticsearch index with a defined mapping, then iterates through MongoDB
 * documents in batches and indexes them using the Elasticsearch Bulk API.
 */


const { MongoClient } = require('mongodb');
const esClient = require('./elasticClient');

async function recreateIndex() {
  try {
    // Check if the index exists
    const exists = await esClient.indices.exists({ index: 'books' });
    if (exists.body) {
      console.log('Deleting existing "books" index...');
      await esClient.indices.delete({ index: 'books' });
      console.log('Existing "books" index deleted.');
    }

    // Create a new index with the proper mapping
    console.log('Creating new "books" index with mapping...');
    await esClient.indices.create({
      index: 'books',
      body: {
        mappings: {
          properties: {
            title: { type: 'text' },
            author_names: { type: 'text' },
            description: { type: 'text' },
            average_rating: { type: 'float' },
            ratings_count: { type: 'integer' },
            isbn: { type: 'keyword' },
            isbn13: { type: 'keyword' },
            language_code: { type: 'keyword' },
            max_genre: { type: 'keyword' },
            book_id: { type: 'keyword' },
            publication_year: { type: 'integer' },
          }
        }
      }
    });
    console.log('New "books" index created successfully.');
  } catch (error) {
    console.error('Error recreating index:', error);
    throw error;
  }
}

async function syncBooks() {
  const mongoUrl = 'mongodb://127.0.0.1:27017';
  const dbName = 'book_database'; 
  const client = new MongoClient(mongoUrl);
  const BATCH_SIZE = 1000; 
  try {
    console.log('Starting syncBooks process...');
    // Re-create the index with the correct mapping
    await recreateIndex();

    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('✓ Connected to MongoDB.');

    const db = client.db(dbName);
    const booksCollection = db.collection('books');

    // Use a cursor to iterate over the MongoDB documents
    const cursor = booksCollection.find({});
    let batch = [];
    let totalDocsProcessed = 0;
    let batchCount = 0;

    console.log('Processing documents in batches...');
    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      batch.push(doc);

      if (batch.length === BATCH_SIZE) {
        batchCount++;
        console.log(`Processing batch #${batchCount} with ${batch.length} documents...`);
        await indexBatch(batch);
        totalDocsProcessed += batch.length;
        console.log(`✓ Batch #${batchCount} indexed. Total processed: ${totalDocsProcessed}`);
        batch = []; // reset for the next batch
      }
    }

    // Process any remaining documents
    if (batch.length > 0) {
      batchCount++;
      console.log(`Processing final batch #${batchCount} with ${batch.length} documents...`);
      await indexBatch(batch);
      totalDocsProcessed += batch.length;
      console.log(`✓ Final batch indexed. Total processed: ${totalDocsProcessed}`);
    }

    console.log(`✓ Sync complete. Total documents indexed: ${totalDocsProcessed}`);
  } catch (err) {
    console.error('❌ Error during sync:', err);
  } finally {
    console.log('Closing MongoDB connection...');
    await client.close();
    console.log('✓ MongoDB connection closed.');
  }
}

async function indexBatch(docs) {
  // Build the bulk indexing request
  const bulkBody = docs.flatMap((book) => {
    // If book.max_genre is a comma-separated string, convert to an array
    let genreField = book.max_genre;
    if (genreField && typeof genreField === 'string') {
      genreField = genreField.split(',').map((g) => g.trim());
    }

    return [
      { index: { _index: 'books', _id: book._id.toString() } },
      {
        title: book.title,
        author_names: book.author_names || book.authors,
        description: book.description,
        average_rating: book.average_rating,
        ratings_count: book.ratings_count,
        isbn: book.isbn,
        isbn13: book.isbn13,
        language_code: book.language_code,
        max_genre: genreField,
        book_id: book.book_id,
        publication_year: book.publication_year,
      }
    ];
  });

  try {
    const bulkResponse = await esClient.bulk({
      refresh: false, 
      body: bulkBody
    });

    if (bulkResponse.errors) {
      bulkResponse.items.forEach((item, idx) => {
        if (item.index && item.index.error) {
          console.error(`Error indexing document #${idx} in this batch:`, item.index.error);
        }
      });
    }
  } catch (error) {
    console.error('Bulk indexing error:', error);
  }
}

syncBooks();
