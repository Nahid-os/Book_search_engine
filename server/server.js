const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = 3001;

// MongoDB Connection URI
const uri = 'mongodb://127.0.0.1:27017';

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Adjust timeout for better error handling
});

// Middleware
app.use(cors());
app.use(express.json());

// Import Routes
const trendingBooksRoutes = require('./routes/trendingBooks');
const searchBooksRoutes = require('./routes/searchBooks');

// Async function to connect to MongoDB and start the server
async function startServer() {
  try {
    await client.connect();
    console.log('Connected to MongoDB 8.0.4');

    const database = client.db('book_database');
    app.locals.db = database;

    // Use Routes
    app.use('/api/trending-books', trendingBooksRoutes);
    app.use('/api/search-books', searchBooksRoutes);

    // Start the Express server after MongoDB is connected
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1); // Exit process if MongoDB connection fails
  }
}

// Start the server
startServer();
