// components/BookCard.jsx
"use client";

import React from 'react';
import Link from 'next/link';
import { Star, BookmarkPlus, BookOpen } from 'lucide-react';

// Utility function to truncate text
const truncateText = (text, wordLimit) => {
  const words = text.split(" ");
  return words.length > wordLimit ? words.slice(0, wordLimit).join(" ") + "..." : text;
};

const BookCard = ({ bookId, title, author, average_rating, ratings_count, description }) => (
  // Use a pastel gradient for light mode, and a dark gradient for dark mode
  <div className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-lg shadow-md p-6 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] min-h-[400px] flex flex-col justify-between">
    <div>
      <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200 hover:text-pink-600 dark:hover:text-pink-300 transition-colors duration-300">
        {title}
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 font-medium">by {author}</p>
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
      {/* Purple button for "Add to Wishlist" */}
      <button className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors dark:bg-purple-700 dark:hover:bg-purple-600 flex items-center text-sm">
        <BookmarkPlus className="h-4 w-4 mr-2" />
        Add to Wishlist
      </button>

      {/* Pink button for "View Details" */}
      <Link href={`/book/${bookId}`}>
        <button className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors dark:bg-pink-700 dark:hover:bg-pink-600 flex items-center text-sm">
          <BookOpen className="h-4 w-4 mr-2" />
          View Details
        </button>
      </Link>
    </div>
  </div>
);

export default BookCard;
