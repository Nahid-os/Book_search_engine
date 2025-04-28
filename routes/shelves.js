// routes/shelves.js
const express = require('express');
const { ObjectId } = require('mongodb');
const router = express.Router();

// --- Middleware to check authentication ---
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "User not authenticated" });
};

// --- GET User's Custom Shelves ---
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const db = req.app.locals.db;  // Access the database connection from app locals
        const userId = req.user._id;  // Get the authenticated user's ID
        const customShelves = await db.collection('shelves').find({ userId }).toArray();  // Fetch shelves for this user
        res.status(200).json(customShelves);
    } catch (error) {
        console.error("Error fetching custom shelves:", error);
        res.status(500).json({ error: "Error fetching shelves" });
    }
});


// --- POST Create a New Custom Shelf ---
router.post('/', isAuthenticated, async (req, res) => {  
  const { name, description } = req.body;  // Extract name and description from request body
  const userId = req.user._id; // Get the authenticated user's ID

  if (!name || typeof name !== 'string' || name.trim().length === 0) {  // Check if name is provided and is a non-empty string
    return res.status(400).json({ error: "Shelf name is required and must be a non-empty string." });  
  }
   if (description && typeof description !== 'string') {  // Check if description is a string if provided
      return res.status(400).json({ error: "Shelf description must be a string." });
   }

  // Basic check against default shelf names/ids to avoid confusion
  const forbiddenNames = ["all", "favorites", "want-to-read", "read"];  
  if (forbiddenNames.includes(name.toLowerCase().trim())) {
      return res.status(400).json({ error: `Shelf name cannot be one of the defaults: ${forbiddenNames.join(', ')}` });
  }

  
  try {  
    const db = req.app.locals.db;  // Access the database connection from app locals

    // Check if shelf with the same name already exists for this user
    const existingShelf = await db.collection('shelves').findOne({ userId, name: name.trim() });
    if (existingShelf) {
        return res.status(409).json({ error: "A shelf with this name already exists." });
    }
    // Create a new shelf object
    const newShelf = {  
      userId, // Store the userId to associate this shelf with the user
      name: name.trim(),  // Store trimmed name
      description: description?.trim() || null, // Store null if empty/missing
      createdAt: new Date() // Timestamp for shelf creation
    };

    const result = await db.collection('shelves').insertOne(newShelf); // Insert the new shelf into the database

    // Return the newly created shelf object with its _id
     const createdShelf = { _id: result.insertedId, ...newShelf };

    res.status(201).json(createdShelf);

  } catch (error) {
    console.error("Error creating shelf:", error);
    res.status(500).json({ error: "Failed to create shelf" });
  }
});


// --- DELETE a Custom Shelf ---
// This route deletes a custom shelf and removes its ID from all userBookData documents for this user
router.delete('/:shelfId', isAuthenticated, async (req, res) => {  
    const { shelfId } = req.params; 
    const userId = req.user._id;

    if (!ObjectId.isValid(shelfId)) {  // Check if shelfId is a valid ObjectId
        return res.status(400).json({ error: "Invalid Shelf ID format." });
    }

    try {
        const db = req.app.locals.db;
        const shelfObjectId = new ObjectId(shelfId);

        // 1. Verify the shelf exists and belongs to the user
        const shelf = await db.collection('shelves').findOne({ _id: shelfObjectId, userId });
        if (!shelf) {
            return res.status(404).json({ error: "Shelf not found or user does not have permission." });
        }

        // 2. Delete the shelf document itself
        const deleteShelfResult = await db.collection('shelves').deleteOne({ _id: shelfObjectId, userId });

        if (deleteShelfResult.deletedCount === 0) {
            // If no documents were deleted, it means the shelf was not found or already deleted
             return res.status(404).json({ error: "Shelf not found or failed to delete." });
        }

        // 3. Remove this shelfId from the `customShelfIds` array in all userBookData documents for this user
        await db.collection('userBookData').updateMany(
            { userId }, // Filter by user
            { $pull: { customShelfIds: shelfObjectId } } // Remove the shelfId from the array
        );

        res.status(200).json({ message: "Shelf deleted successfully and removed from associated books." });

    } catch (error) {
        console.error("Error deleting shelf:", error);
        res.status(500).json({ error: "Failed to delete shelf" });
    }
});

module.exports = router;