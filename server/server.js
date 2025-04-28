/**
 * Main server setup file for the Book Recommendation API.
 * Initializes Express application, configures middleware (CORS, JSON parsing, session management, Passport),
 * connects to MongoDB, sets up Passport authentication strategies, mounts API routes,
 * and starts the HTTP server.
 */

// --- Core Dependencies ---
const express = require('express');
const cors = require('cors'); // Middleware for enabling Cross-Origin Resource Sharing
const session = require('express-session'); // Middleware for session management
const passport = require('passport'); // Authentication middleware
const MongoStore = require('connect-mongo'); // Session store for MongoDB
const { MongoClient, ObjectId } = require('mongodb'); // MongoDB native driver

// --- Application Setup ---
const app = express();
const PORT = process.env.PORT || 3001; // Use environment variable for port or default to 3001
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017'; // MongoDB connection URI
const DATABASE_NAME = process.env.DATABASE_NAME || 'book_database'; // Database name
const SESSION_SECRET = process.env.SESSION_SECRET || 'your-very-secure-and-secret-key-change-me'; // !! CHANGE AND USE ENV VARIABLE !!

// --- MongoDB Client Initialization ---
const client = new MongoClient(MONGODB_URI);

// --- Core Middleware Configuration ---

// 1. CORS: Allow requests from the frontend development server.
//    Adjust origin for production environments.
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true // Allow sending cookies cross-origin
}));

// 2. Body Parsing: Parse incoming JSON request bodies.
app.use(express.json());

// 3. Session Management: Configure express-session.
//    Uses connect-mongo to store session data persistently in MongoDB.
app.use(session({
  secret: SESSION_SECRET, // Secret used to sign the session ID cookie. Strong and from env var is crucial.
  resave: false, // Don't save session if unmodified.
  saveUninitialized: false, // Don't create session until something stored.
  store: MongoStore.create({
    mongoUrl: `${MONGODB_URI}/${DATABASE_NAME}`, // Full connection string including database name
    ttl: 14 * 24 * 60 * 60, // Session Time-To-Live: 14 days (in seconds)
    autoRemove: 'native' // Use MongoDB's native TTL indexes for session cleanup
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Send cookie only over HTTPS in production
    sameSite: 'lax', // Recommended setting for CSRF protection. Use 'none' only if cross-site requests with credentials are required AND secure=true.
    maxAge: 14 * 24 * 60 * 60 * 1000 // Cookie max age: 14 days (in milliseconds), should match TTL
    // httpOnly: true // Default is true, cookie cannot be accessed via client-side JS (good for security)
  }
}));

// 4. Passport Initialization: Initialize Passport and session integration.
//    Must be configured *after* express-session.
app.use(passport.initialize()); // Initialize Passport middleware
app.use(passport.session());    // Enable session support for persistent logins

// --- Import API Route Handlers ---
// Grouping route imports for clarity.
const bookDetailsRoutes = require('../routes/bookDetails');
const trendingBooksRoutes = require('../routes/trendingBooks');
const searchBooksRoutes = require('../routes/searchBooks');
const authRoutes = require('../routes/auth');
const interactionsRoutes = require('../routes/interactions');
const wishlistRoutes = require('../routes/wishlist');
const recommendationsRoutes = require('../routes/recommendations');
const categoryBooksRoutes = require("../routes/categoryBooks");
const libraryRoutes = require('../routes/library');
const shelfRoutes = require('../routes/shelves');


// --- MongoDB Connection and Server Startup ---
async function startServer() {
  try {
    // Connect to the MongoDB server
    await client.connect();
    console.log(`Successfully connected to MongoDB at ${MONGODB_URI}`);
    const database = client.db(DATABASE_NAME);

    // Make the database connection instance available globally via app.locals
    // Routes can access it using `req.app.locals.db`
    app.locals.db = database;

    // --- Initialize Passport Authentication Strategies ---
    const initializePassport = require('../passport-config'); 
    initializePassport(
      passport,
      // Function to find user by email (used by local strategy)
      async (email) => await database.collection('users').findOne({ email: email }), 
      // Function to find user by ID (used for deserialization)
      async (id) => {
          try {
              // Validate ID format before querying to prevent errors
              if (!ObjectId.isValid(id)) {
                   console.warn(`[Passport Deserialize] Invalid ObjectId format received: ${id}`);
                   return null; // Not a valid ID format
              }
              // Find user by MongoDB ObjectId
              return await database.collection('users').findOne({ _id: new ObjectId(id) }); 
          } catch (error) {
              console.error("[Passport Deserialize] Error fetching user by ID:", error);
              return null; // Error during lookup
          }
      }
    );
    console.log("Passport strategies initialized.");

    // --- Mount API Routes ---
    // Define base paths for different API resource groups.
    app.use('/api/books', bookDetailsRoutes);
    app.use('/api/trending-books', trendingBooksRoutes);
    app.use('/api/search-books', searchBooksRoutes);
    app.use('/api/auth', authRoutes);
    app.use('/api/interactions', interactionsRoutes);
    app.use('/api/wishlist', wishlistRoutes);
    app.use('/api/recommendations', recommendationsRoutes);
    app.use("/api/category", categoryBooksRoutes);
    app.use('/api/library', libraryRoutes);
    app.use('/api/shelves', shelfRoutes);

    // --- Basic Root Route ---
    // Simple health check or landing page for the API.
    app.get('/', (req, res) => {
      res.status(200).send('Book Recommendation API is running!');
    });

    // --- Default 404 Handler ---
    // Catch-all for unhandled routes
    app.use((req, res, next) => {
      res.status(404).json({ error: 'Not Found' });
    });

    // --- Global Error Handler ---
    // Catches errors passed via next(err)
    app.use((err, req, res, next) => {
      console.error("Unhandled Application Error:", err.stack || err);
      res.status(err.status || 500).json({
        error: 'Internal Server Error',
        message: err.message || 'An unexpected error occurred.'
      });
    });

    // --- Start HTTP Server ---
    app.listen(PORT, () => {
      console.log(`Server running successfully on http://localhost:${PORT}`);
    });

  } catch (error) {
    // Handle initial connection errors
    console.error('Failed to connect to MongoDB or start server:', error);
    process.exit(1); // Exit the application if critical setup fails
  }
}

// --- Execute Server Startup ---
startServer();

// --- Graceful Shutdown Handling ---
// Listen for interrupt signals (like Ctrl+C) to close the DB connection properly.
process.on('SIGINT', async () => {
    console.log('SIGINT signal received: Closing MongoDB connection...');
    try {
        await client.close();
        console.log('MongoDB connection closed.');
        process.exit(0); // Exit cleanly
    } catch (err) {
         console.error('Error closing MongoDB connection during shutdown:', err);
         process.exit(1); // Exit with error
    }
});

process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: Closing MongoDB connection...');
     try {
        await client.close();
        console.log('MongoDB connection closed.');
        process.exit(0); // Exit cleanly
    } catch (err) {
         console.error('Error closing MongoDB connection during shutdown:', err);
         process.exit(1); // Exit with error
    }
});