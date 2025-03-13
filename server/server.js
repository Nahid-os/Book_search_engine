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

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

app.use(session({
  secret: 'your-secret-key', 
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: 'mongodb://127.0.0.1:27017/book_database' }),
  cookie: {
    sameSite: 'lax',   // for local development
    secure: false
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// Import routes
const bookDetailsRoutes = require('../routes/bookDetails');
const trendingBooksRoutes = require('../routes/trendingBooks');
const searchBooksRoutes = require('../routes/searchBooks');
const authRoutes = require('../routes/auth');
const interactionsRoutes = require('../routes/interactions');
const wishlistRoutes = require('../routes/wishlist');  // Newly added

client.connect().then(() => {
  console.log('Connected to MongoDB');
  const database = client.db('book_database');
  app.locals.db = database;

  const initializePassport = require('../passport-config');
  initializePassport(
    passport,
    async (email) => await database.collection('users').findOne({ email }),
    async (id) => await database.collection('users').findOne({ _id: new ObjectId(id) })
  );

  app.use('/api/books', bookDetailsRoutes);
  app.use('/api/trending-books', trendingBooksRoutes);
  // Note: Mounted as "/api/search-books" (with hyphen)
  app.use('/api/search-books', searchBooksRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/interactions', interactionsRoutes);
  app.use('/api/wishlist', wishlistRoutes);  // Mount wishlist routes

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}).catch(error => {
  console.error('Failed to connect to MongoDB:', error);
});
