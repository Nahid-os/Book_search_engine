const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

// Initialize Express App
const app = express();
const PORT = 3001;

// MongoDB Connection String
const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

// Middleware
app.use(cors());
app.use(express.json());

// Import Routes
const trendingBooksRoutes = require('./routes/trendingBooks');   // Route to display trending books
const searchBooksRoutes = require('./routes/searchBooks');       // Route to fetch queried books

// Connect to MongoDB
client.connect().then(() => {
  console.log('Connected to MongoDB');
  const database = client.db('book_database');
  app.locals.db = database; // Make the database accessible to routes

  // Use Routes
  app.use('/api/trending-books', trendingBooksRoutes);
  app.use('/api/search-books', searchBooksRoutes);

  // Start the server
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}).catch(error => {
  console.error('Failed to connect to MongoDB:', error);
});
