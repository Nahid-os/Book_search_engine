// components/BookCard.jsx
import React from 'react';
import Link from 'next/link';
import { Star, BookmarkPlus, BookOpen } from 'lucide-react';

// Utility function to truncate text
const truncateText = (text, wordLimit) => {
  const words = text.split(" ");
  return words.length > wordLimit ? words.slice(0, wordLimit).join(" ") + "..." : text;
};

const BookCard = ({ bookId, title, author, average_rating, ratings_count, description }) => (
  <div className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-750 rounded-lg shadow-md p-6 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] min-h-[400px] flex flex-col justify-between">
    <div>
      <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300">
        {title}
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 font-medium">by {author}</p>
      <div className="flex items-center mb-2">
        <Star className="h-4 w-4 text-yellow-400 mr-1" />
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {average_rating > 0 && ratings_count > 0 ? `${average_rating} (${ratings_count} reviews)` : "No rating available"}
        </span>
      </div>
      <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
        {truncateText(description || "A captivating story that you’ll enjoy.", 180)}
      </p>
    </div>
    <div className="flex space-x-2 mt-auto">
      <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors duration-300 flex items-center text-sm">
        <BookmarkPlus className="h-4 w-4 mr-2" /> Add to Wishlist
      </button>
      <Link href={`/book/${bookId}`}>
        <button className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white px-4 py-2 rounded-md transition-colors duration-300 flex items-center text-sm">
          <BookOpen className="h-4 w-4 mr-2" /> View Details
        </button>
      </Link>
    </div>
  </div>
);

export default BookCard;
