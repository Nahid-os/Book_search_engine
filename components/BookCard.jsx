// components/BookCard.jsx
"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Star, BookmarkPlus, BookOpen } from 'lucide-react';

// Utility function to truncate text
const truncateText = (text, wordLimit) => {
  const words = text.split(" ");
  return words.length > wordLimit ? words.slice(0, wordLimit).join(" ") + "..." : text;
};

const BookCard = ({ bookId, title, author, average_rating, ratings_count, description }) => {
  const router = useRouter();

  // Convert the author prop into a human-readable string if it's not already a string.
  let authorText = "";
  if (typeof author === "object") {
    if (Array.isArray(author)) {
      // Check if objects have a 'name' property; if not, use author_id
      authorText = author
        .map((item) => item.name ? item.name : item.author_id)
        .join(", ");
    } else {
      authorText = author.name || author.author_id || "Unknown Author";
    }
  } else {
    authorText = author;
  }

  // Handler for "View Details" button (logs interaction and navigates)
  const handleViewDetails = async () => {
    try {
      await fetch("http://localhost:3001/api/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ event: "view_details", bookId }),
      });
    } catch (error) {
      console.error("Error logging interaction:", error);
    }
    router.push(`/book/${bookId}`);
  };

  // Handler for "Add to Wishlist" button
  const handleAddToWishlist = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ bookId }),
      });
      if (res.ok) {
        alert("Book added to wishlist!");
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to add book to wishlist");
      }
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      alert("An error occurred while adding to wishlist");
    }
  };

  return (
    <div className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-lg shadow-md p-6 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] min-h-[400px] flex flex-col justify-between">
      <div>
        <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200 hover:text-pink-600 dark:hover:text-pink-300 transition-colors duration-300">
          {title}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 font-medium">
          by {authorText || "Unknown Author"}
        </p>
        <div className="flex items-center mb-2">
          <Star className="h-4 w-4 text-yellow-400 mr-1" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {average_rating > 0 && ratings_count > 0
              ? `${average_rating} (${ratings_count} reviews)`
              : "No rating available"}
          </span>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
          {truncateText(description || "A captivating story that you’ll enjoy.", 180)}
        </p>
      </div>

      <div className="flex space-x-2 mt-auto">
        <button
          onClick={handleAddToWishlist}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors dark:bg-purple-700 dark:hover:bg-purple-600 flex items-center text-sm"
        >
          <BookmarkPlus className="h-4 w-4 mr-2" /> Add to Wishlist
        </button>

        <button 
          onClick={handleViewDetails}
          className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors dark:bg-pink-700 dark:hover:bg-pink-600 flex items-center text-sm"
        >
          <BookOpen className="h-4 w-4 mr-2" /> View Details
        </button>
      </div>
    </div>
  );
};

export default BookCard;
