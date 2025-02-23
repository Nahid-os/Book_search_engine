// server.js
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const MongoStore = require('connect-mongo');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = 3001;
const uri = 'mongodb://127.0.0.1:27017';
const client = new MongoClient(uri);

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // Your Next.js frontend URL
  credentials: true,
}));
app.use(express.json());
app.use(session({
  secret: 'your-secret-key', // Replace with your own secret (or load from env)
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: 'mongodb://127.0.0.1:27017/book_database' }),
}));
app.use(passport.initialize());
app.use(passport.session());

// Import existing routes
const trendingBooksRoutes = require('../routes/trendingBooks');
const searchBooksRoutes = require('../routes/searchBooks');
// Import the new auth routes
const authRoutes = require('../routes/auth');

client.connect().then(() => {
  console.log('Connected to MongoDB');
  const database = client.db('book_database');
  app.locals.db = database; // Make the DB accessible in routes

  // Passport configuration: pass in functions to retrieve users from the DB
  const initializePassport = require('../passport-config');
  initializePassport(
    passport,
    async (email) => await database.collection('users').findOne({ email }),
    async (id) => await database.collection('users').findOne({ _id: new ObjectId(id) })
  );

  // Use routes
  app.use('/api/trending-books', trendingBooksRoutes);  
  app.use('/api/search-books', searchBooksRoutes);
  app.use('/api/auth', authRoutes);

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}).catch(error => {
  console.error('Failed to connect to MongoDB:', error);
});
