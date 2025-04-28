// routes/library.js
const express = require('express');
const { ObjectId } = require('mongodb');
const router = express.Router();

// --- Middleware to check authentication ---
const isAuthenticated = (req, res, next) => {
    // Check if the user is authenticated using Passport.js
    if (req.isAuthenticated() && req.user && req.user._id) { // Add check for req.user._id existence
        return next();
    }
    res.status(401).json({ error: "User not authenticated or user ID missing." });
};

// --- GET User Library Data ---
// Fetches custom shelves and book details (merged from wishlists and userBookData)
router.get('/', isAuthenticated, async (req, res) => {
     try {    
        const db = req.app.locals.db;  // Access the database connection from app locals
        const userId = req.user._id; // Verified ObjectId
        
        console.log(`[GET /api/library] Fetching library for userId: ${userId}`);   

        // 1. Fetch User's Custom Shelves
        const customShelves = await db.collection('shelves').find({ userId }).toArray(); 
        console.log(`[GET /api/library] Found ${customShelves.length} custom shelves.`);  

        // 2. Fetch User's Wishlist Items (primary source for which books are in library)
        const wishlistItems = await db.collection('wishlists').find({ userId }).toArray();
        console.log(`[GET /api/library] Found ${wishlistItems.length} wishlist items.`);
        if (wishlistItems.length === 0) {
            // If no wishlist items, library is empty - return early
            return res.status(200).json({ shelves: customShelves, books: [] });
        }

        // Extract book IDs and create a map for quick lookup of addedAt dates
        const bookIds = wishlistItems.map(item => item.bookId); // Array of numbers
        const wishlistDetailsMap = new Map(wishlistItems.map(item => [item.bookId, { addedAt: item.addedAt }]));

        // 3. Fetch Core Book Details + User Specific Data using Aggregation
        // This joins books, authors, and userBookData collections
        const bookDataPipeline = [
            { $match: { book_id: { $in: bookIds } } }, // Match books collection using book_id (Number)
            { $lookup: { from: "authors", localField: "authors.author_id", foreignField: "author_id", as: "authorObjects" } }, // Join authors
            { $lookup: {
                    from: "userBookData", // Join user-specific data
                    let: { book_id_lookup: "$book_id" }, // Variable for book_id from books collection
                    pipeline: [
                        { $match: { // Match userBookData using bookId (Number) and userId (ObjectId)
                             $expr: {
                                 $and: [
                                     { $eq: ["$bookId", "$$book_id_lookup"] },
                                     { $eq: ["$userId", userId] } // userId from the outer scope (req.user._id)
                                 ]
                             }
                         }},
                        { $limit: 1 } // Expect only one document per user per book
                    ],
                    as: "userData" // Output array name
                }},
             { $unwind: { path: "$userData", preserveNullAndEmptyArrays: true } }, // Deconstruct userData array, keep books even if no user data exists
            { $project: { // Define the final structure of each book object
                    _id: 0, // Exclude MongoDB default _id
                    id: "$book_id", // Standardize ID field (maps to book_id)
                    bookId: "$book_id", // Keep bookId as well if needed elsewhere (Number)
                    title: 1,
                    authors: 1, // Keep original authors array if needed
                    authorDetails: "$authorObjects", // Include joined author objects
                    rating: "$average_rating", // Community rating
                    numRatings: "$ratings_count", // Community rating count
                    genre: { $ifNull: ["$max_genre", "$genre", "Genre Unknown"] }, // Determine genre
                    isbn13: 1,
                    description:1,
                    publisher:1,
                    publication_year: 1,
                    num_pages: 1,
                    // Merge User Data - Use $ifNull to provide defaults if userData doesn't exist
                    readingStatus: { $ifNull: ["$userData.readingStatus", "want-to-read"] }, // Default status
                    userRating: { $ifNull: ["$userData.userRating", null] }, // Default user rating
                    notes: { $ifNull: ["$userData.notes", null] }, // Default notes
                    customShelfIds: { $ifNull: ["$userData.customShelfIds", []] }, // Default custom shelves (empty array)
                    dateAdded: { $ifNull: ["$userData.lastModified", "$userData.dateAdded", null ] }, // Prefer modified date, then added date from userBookData
                }}
        ];

        let combinedBooks = await db.collection('books').aggregate(bookDataPipeline).toArray();
        console.log(`[GET /api/library] Aggregated ${combinedBooks.length} books with details.`);

        // Fallback for dateAdded using wishlist add date if not found in userBookData
        combinedBooks = combinedBooks.map(book => {
            if (!book.dateAdded) {
                 const wishlistItemDetails = wishlistDetailsMap.get(book.id); // Use 'id' which is book_id (Number)
                 book.dateAdded = wishlistItemDetails ? wishlistItemDetails.addedAt : new Date(); // Use wishlist date or current date as last resort
            }
            // Ensure customShelfIds is always an array
            book.customShelfIds = book.customShelfIds || [];
            return book;
         });


        res.status(200).json({ shelves: customShelves, books: combinedBooks });

    } catch (error) {
        console.error("[GET /api/library] Error fetching user library:", error);
        res.status(500).json({ error: "Error fetching user library data" });
    }
});

// --- POST Add a book to the user's wishlist ---
// Creates an entry in the 'wishlists' collection. User data is handled separately via PATCH/upsert.
router.post('/books', isAuthenticated, async (req, res) => {
    const { bookId } = req.body;
    const userId = req.user._id; // ObjectId
    const numericBookId = Number(bookId); // Ensure bookId is a number

    if (isNaN(numericBookId)) {
        return res.status(400).json({ error: "Valid numeric bookId is required." });
    }

    try {
        const db = req.app.locals.db;

        // 1. Check if the book exists in the main 'books' collection
        const bookExists = await db.collection('books').findOne({ book_id: numericBookId });
        if (!bookExists) {
             return res.status(404).json({ error: "Book not found in global catalog." });
        }

        // 2. Check if it's already in the user's 'wishlists' collection
        const existing = await db.collection('wishlists').findOne({ userId, bookId: numericBookId });
        if (existing) {
            return res.status(409).json({ error: "Book already in wishlist." });
        }

        // 3. Add the book to the 'wishlists' collection
        const result = await db.collection('wishlists').insertOne({
            userId,
            bookId: numericBookId,
            addedAt: new Date()
        });

        console.log(`[POST /api/library/books] Book ${numericBookId} added to wishlist for user ${userId}. Inserted ID: ${result.insertedId}`);
        res.status(201).json({ message: "Book added to wishlist.", insertedId: result.insertedId });

    } catch (error) {
        console.error("[POST /api/library/books] Error adding book to wishlist:", error);
        res.status(500).json({ error: "Failed to add book to wishlist" });
    }
});

// --- DELETE Remove a book from the user's library ---
// Removes entries from BOTH 'wishlists' and 'userBookData' collections
router.delete('/books/:bookId', isAuthenticated, async (req, res) => {
    const bookIdParam = req.params.bookId;
    const userId = req.user._id; // ObjectId
    const bookId = parseInt(bookIdParam, 10); // Ensure bookId is a number

    if (isNaN(bookId)) {
        return res.status(400).json({ error: "Invalid numeric bookId provided." });
    }

    try {
        const db = req.app.locals.db;

        // 1. Delete from 'wishlists' collection
        const wishlistResult = await db.collection('wishlists').deleteOne({ userId, bookId });
        console.log(`[DELETE /api/library/books/${bookId}] Wishlist delete result for user ${userId}:`, wishlistResult.deletedCount);

        // 2. Delete from 'userBookData' collection
        const userDataResult = await db.collection('userBookData').deleteOne({ userId, bookId });
        console.log(`[DELETE /api/library/books/${bookId}] UserBookData delete result for user ${userId}:`, userDataResult.deletedCount);

        // Check if anything was deleted from either collection
        if (wishlistResult.deletedCount === 0 && userDataResult.deletedCount === 0) {
            // Book wasn't found in either place for this user
            return res.status(404).json({ error: "Book not found in user's library records." });
        }

        // If at least one delete occurred, it's successful
        res.status(200).json({ message: "Book removed from library successfully." });

    } catch (error) {
        console.error(`[DELETE /api/library/books/${bookId}] Error removing book from library for user ${userId}:`, error);
        res.status(500).json({ error: "Failed to remove book from library" });
    }
});

// --- PATCH Update user-specific data for a book (Rating, Status, Notes) ---
// Uses Upsert on 'userBookData'
router.patch('/books/:bookId', isAuthenticated, async (req, res) => {
    const bookIdParam = req.params.bookId;
    const userId = req.user._id; 
    const bookId = parseInt(bookIdParam, 10); 
    const updates = req.body;

    console.log(`--- PATCH /api/library/books/${bookIdParam} for user ${userId} ---`);

    if (isNaN(bookId)) {
        console.error("PATCH Error: Invalid bookId NaN:", bookIdParam);
        return res.status(400).json({ error: "Invalid bookId." });
    }

    if (!userId || !(userId instanceof ObjectId)) {
         console.error("PATCH Error: Invalid or missing userId:", userId);
         // This indicates an issue with session/authentication middleware upstream
         return res.status(401).json({ error: "User authentication invalid or ID missing." });
    }

    // Validate incoming update fields
    const allowedUpdates = ['readingStatus', 'userRating', 'notes'];
    const updateFields = {};
    let isValidUpdate = false;

    for (const key of allowedUpdates) {
        if (updates.hasOwnProperty(key)) {
            // Specific validation for each field type
            if (key === 'userRating' && updates[key] !== null && (typeof updates[key] !== 'number' || !Number.isInteger(updates[key]) || updates[key] < 1 || updates[key] > 5)) {
                 console.warn(`PATCH Validation Fail: Invalid userRating value: ${updates[key]}`);
                 return res.status(400).json({ error: "Invalid user rating (must be null or integer 1-5)." });
            }
            if (key === 'readingStatus' && !['want-to-read', 'read', 'dnf'].includes(updates[key])) {
                 console.warn(`PATCH Validation Fail: Invalid readingStatus value: ${updates[key]}`);
                 return res.status(400).json({ error: "Invalid reading status." });
            }
            if (key === 'notes' && updates[key] !== null && typeof updates[key] !== 'string') {
                 console.warn(`PATCH Validation Fail: Invalid notes type: ${typeof updates[key]}`);
                 return res.status(400).json({ error: "Notes must be a string or null." });
            }
            // If valid, add to updateFields
            updateFields[key] = updates[key];
            isValidUpdate = true;
        }
    }
       
    if (!isValidUpdate) {
        console.warn(`PATCH Validation Fail: No valid update fields provided.`);   
        return res.status(400).json({ error: "No valid fields provided for update." });  
    }

    const now = new Date();
    updateFields.lastModified = now; // Always update the last modified timestamp

    try {
        const db = req.app.locals.db;
        if (!db) {
            console.error("PATCH Error: Database connection not found on req.app.locals");
            return res.status(500).json({ error: "Database connection error." });
        }

        // Perform the Upsert operation on 'userBookData'
        console.log(`PATCH Upsert: Updating 'userBookData' for userId: ${userId}, bookId: ${bookId} with updates:`, updateFields);
        const result = await db.collection('userBookData').updateOne(
            { userId: userId, bookId: bookId }, // Filter: find the document for this user and book
            {
                $set: updateFields, // Apply the validated updates
                $setOnInsert: { userId: userId, bookId: bookId, dateAdded: now } // Fields to set ONLY if creating a new document
            },
            { upsert: true } // Option to create the document if it doesn't exist
        );
        console.log(`PATCH Upsert: Result: matchedCount=${result.matchedCount}, modifiedCount=${result.modifiedCount}, upsertedCount=${result.upsertedCount}`);

        // Respond based on the upsert result
        if (result.upsertedCount > 0) {
            // A new userBookData document was created
            res.status(201).json({ message: "Book data created successfully.", updatedData: updateFields });
        } else if (result.modifiedCount > 0 || result.matchedCount > 0) {
            // An existing document was matched (and potentially modified)
             res.status(200).json({ message: "Book data updated successfully.", updatedData: updateFields });
        } else {
            // This case should ideally not happen with upsert: true unless there's a preceding error
            console.error(`PATCH Error: Upsert operation failed unexpectedly for book ${bookId}, user ${userId}. Result:`, result);
            return res.status(500).json({ error: "Book data update failed unexpectedly. Please try again." });
        }

    } catch (error) {
        console.error(`PATCH Error: Error updating book data for book ${bookId}, user ${userId}:`, error);
        res.status(500).json({ error: "Failed to update book data" });
    }
});

// --- POST Add a book to a custom shelf ---
router.post('/books/:bookId/shelves', isAuthenticated, async (req, res) => {
    const bookIdParam = req.params.bookId;
    const userId = req.user._id; // ObjectId
    const bookId = parseInt(bookIdParam, 10); // Number
    const { shelfId } = req.body; // Expecting shelf ObjectId as string

    console.log(`--- POST /api/library/books/${bookIdParam}/shelves for user ${userId} with shelfId ${shelfId} ---`);

    if (isNaN(bookId)) {
        return res.status(400).json({ error: "Invalid bookId." });
    }
    if (!shelfId || !ObjectId.isValid(shelfId)) {
        return res.status(400).json({ error: "Valid shelfId (ObjectId string) required." });
    }

    const shelfObjectId = new ObjectId(shelfId); // Convert string ID to ObjectId
    const now = new Date();

    try {
        const db = req.app.locals.db;
        if (!db) {
            console.error("Add to Shelf Error: Database connection not found");
            return res.status(500).json({ error: "Database connection error." });
        }

        // 1. Verify the target custom shelf exists AND belongs to the current user
        const shelfExists = await db.collection('shelves').findOne({ _id: shelfObjectId, userId });
        if (!shelfExists) {
             console.warn(`Add to Shelf Fail: Shelf ${shelfId} not found or doesn't belong to user ${userId}.`);
             return res.status(404).json({ error: "Custom shelf not found or does not belong to user." });
        }

        // 2. Upsert 'userBookData': Add the shelf ObjectId to the 'customShelfIds' array.
        console.log(`Add to Shelf Upsert: Updating 'userBookData' for userId: ${userId}, bookId: ${bookId}. Adding shelfId: ${shelfObjectId}`);
        const result = await db.collection('userBookData').updateOne(
            { userId, bookId }, // Filter for the user and book
            { // Update document:
                $addToSet: { customShelfIds: shelfObjectId }, // Add shelfId to array, prevents duplicates
                $set: { lastModified: now }, // Update modification timestamp
                $setOnInsert: { // Fields to set ONLY if creating a new document:
                     userId,
                     bookId,
                     dateAdded: now,
                     readingStatus: 'want-to-read' // Default status on creation via shelf add
                 }
            },
            { upsert: true } // Create the userBookData document if it doesn't exist
        );
        // Log the result of the upsert operation
        console.log(`Add to Shelf Upsert: Result: matchedCount=${result.matchedCount}, modifiedCount=${result.modifiedCount}, upsertedCount=${result.upsertedCount}`);

        if (result.upsertedCount > 0) {
            res.status(201).json({ message: "Book added to custom shelf (new user data created)." });
        } else if (result.modifiedCount > 0) {
            res.status(200).json({ message: "Book added to custom shelf successfully." });
        } else if (result.matchedCount > 0) {
            res.status(200).json({ message: "Book was already on this custom shelf." });
        } else {
            console.error(`Add to Shelf Error: Upsert failed unexpectedly after resolving conflict for book ${bookId}, user ${userId}. Result:`, result);
            
            throw new Error("Update operation failed after conflict resolution.");
        }
    } catch (error) {
        // Log the specific MongoDB error if available
        console.error(`Add to Shelf Error: Error adding book ${bookId} to shelf ${shelfId} for user ${userId}:`, error.message || error);
        if (error.code === 40) {
             console.error("--> Caught MongoDB Conflict Error (Code 40) again - investigate update operators further.");
        }
        res.status(500).json({ error: "Failed to add book to custom shelf" });
    }
});
    

        

// --- DELETE Remove a book from a specific custom shelf ---
// Removes a shelfId from the 'customShelfIds' array in 'userBookData'.
router.delete('/books/:bookId/shelves/:shelfId', isAuthenticated, async (req, res) => {
    const bookIdParam = req.params.bookId;
    const shelfIdParam = req.params.shelfId;
    const userId = req.user._id; // ObjectId
    const bookId = parseInt(bookIdParam, 10); // Number

    console.log(`--- DELETE /api/library/books/${bookIdParam}/shelves/${shelfIdParam} for user ${userId} ---`);

    if (isNaN(bookId)) {
        return res.status(400).json({ error: "Invalid bookId." });
    }
    if (!ObjectId.isValid(shelfIdParam)) {
        return res.status(400).json({ error: "Invalid shelfId." });
    }

    const shelfObjectId = new ObjectId(shelfIdParam);

    try {
        const db = req.app.locals.db;
        if (!db) {
            console.error("Remove from Shelf Error: Database connection not found");
            return res.status(500).json({ error: "Database connection error." });
        }

        // Update 'userBookData' by removing the shelfId from the array
        console.log(`Remove from Shelf Update: Updating 'userBookData' for userId: ${userId}, bookId: ${bookId}. Pulling shelfId: ${shelfObjectId}`);
        const result = await db.collection('userBookData').updateOne(
            { userId, bookId }, // Filter for the user and book
            {
                $pull: { customShelfIds: shelfObjectId }, // Remove the specified shelfId from the array
                $set: { lastModified: new Date() } // Update modification timestamp
            }
            // No upsert needed here - we only modify if the document exists
        );
        console.log(`Remove from Shelf Update: Result: matchedCount=${result.matchedCount}, modifiedCount=${result.modifiedCount}`);

        // Respond based on the update result
        if (result.matchedCount === 0) {
            // No userBookData document found for this user/book combination
            return res.status(200).json({ message: "Book data not found, cannot remove from shelf." }); // Or 404? 200 seems okay as the end state is achieved.
        }
        if (result.modifiedCount === 0) {
            // Document found, but the shelfId wasn't in the array (or array didn't exist)
            return res.status(200).json({ message: "Book was not on this custom shelf." });
        }

        // ShelfId was successfully removed
        res.status(200).json({ message: "Book removed from custom shelf successfully." });

    } catch (error) {
        console.error(`Remove from Shelf Error: Error removing book ${bookId} from shelf ${shelfId} for user ${userId}:`, error);
        res.status(500).json({ error: "Failed to remove book from custom shelf" });
    }
});

console.log("--- routes/library.js loaded and router configured ---"); // Log loading
module.exports = router;