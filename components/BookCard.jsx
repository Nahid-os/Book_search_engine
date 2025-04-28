/**
 * Reusable component to display a single book's information in a card format.
 * Includes cover image, title, author, rating, genres, and a wishlist toggle.
 */

"use client"; // Marks this as a Next.js Client Component

import React, { useState } from "react";
import Image from "next/image";
import { Star, Heart } from "lucide-react"; // Icons for rating and wishlist

// Use React.memo for performance optimization, preventing re-renders if props haven't changed.
const BookCard = React.memo(function BookCard({
  book, // The book object containing details to display
  isInWishlist = false, // Boolean indicating if the book is currently in the user's wishlist
  onAddToWishlist, // Callback function when the wishlist icon is clicked (to add)
  onRemove, // Callback function when the wishlist icon is clicked (to remove)
  onViewDetails, // Callback function when the book card/cover is clicked
}) {
  // State to manage the loading status of the book cover image
  const [imageLoading, setImageLoading] = useState(true);
  // State to track if there was an error loading the book cover image
  const [imageError, setImageError] = useState(false);

  // Avoid rendering if no book data is provided
  if (!book) return null;

  // --- Data Processing ---

  // Safely format the author information into a display string.
  // Handles various possible structures for the author field (string, object, array).
  let authorText = "Unknown Author";
  if (book.author) {
    if (typeof book.author === "object" && book.author !== null) {
      // Handle array of author objects or single author object
      authorText = Array.isArray(book.author)
        ? book.author.map((a) => a?.name || a?.author_id || "").join(", ") || "Unknown Author"
        : book.author.name || book.author.author_id || "Unknown Author";
    } else if (typeof book.author === "string") {
      // Handle simple string author
      authorText = book.author;
    }
  }
  // Ensure authorText isn't empty after processing
  authorText = authorText || "Unknown Author";

  // Construct the cover image URL using OpenLibrary based on ISBN-13, with a fallback.
  const coverImageUrl = book.isbn13
    ? `https://covers.openlibrary.org/b/isbn/${book.isbn13}-L.jpg` // Use large cover size
    : "https://dummyimage.com/150x200/cccccc/000000?text=No+Cover"; // Fallback placeholder

  // Parse genre information (assuming `max_genre` might be array or comma-separated string)
  const genreArray = Array.isArray(book.max_genre)
    ? book.max_genre
    : book.max_genre
    ? book.max_genre.split(",").map((g) => g.trim()) // Split string into array
    : []; // Default to empty array if no genre info

  // Predefined color classes for genre tags (cycles through these)
  const genreColors = [
    { bg: "bg-purple-100", text: "text-purple-800", darkBg: "dark:bg-purple-900", darkText: "dark:text-purple-200" },
    { bg: "bg-blue-100", text: "text-blue-800", darkBg: "dark:bg-blue-900", darkText: "dark:text-blue-200" },
    { bg: "bg-green-100", text: "text-green-800", darkBg: "dark:bg-green-900", darkText: "dark:text-green-200" },
    { bg: "bg-pink-100", text: "text-pink-800", darkBg: "dark:bg-pink-900", darkText: "dark:text-pink-200" },
    { bg: "bg-yellow-100", text: "text-yellow-800", darkBg: "dark:bg-yellow-900", darkText: "dark:text-yellow-200" },
  ];

  // --- Event Handlers ---

  // Handles clicks on the main card/image area to trigger detail view.
  const handleImageClick = () => {
    onViewDetails?.(book.id); // Call prop function if provided
  };

  // Handles clicks on the heart icon to toggle wishlist status.
  const handleHeartClick = (e) => {
    e.stopPropagation(); // Prevent triggering handleImageClick when heart is clicked
    if (isInWishlist) {
      onRemove?.(book.id); // Call remove callback if provided
    } else {
      onAddToWishlist?.(book.id); // Call add callback if provided
    }
  };

  // --- Render Logic ---

  return (
    <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col box-border border border-gray-200 dark:border-gray-700">
      {/* Clickable Book Cover Area */}
      <div onClick={handleImageClick} className="relative w-full h-56 mb-4 cursor-pointer overflow-hidden rounded">
        {/* Loading State Placeholder (Skeleton + Spinner) */}
        {imageLoading && !imageError && (
          <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 rounded animate-pulse flex items-center justify-center">
            {/* Shimmer effect container */}
            <div className="shimmer-wrapper">
              <div className="shimmer"></div>
            </div>
            {/* Loading spinner */}
            <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin z-10"></div>
          </div>
        )}

        {/* Actual Book Cover Image */}
        <Image
          src={imageError ? "https://dummyimage.com/150x200/cccccc/000000?text=No+Cover" : coverImageUrl} // Use fallback on error
          alt={book.title}
          fill // Makes image cover the container div
          className={`object-fill rounded transition-opacity duration-300 ${
            imageLoading ? "opacity-0" : "opacity-100" // Fade in on load
          }`}
          onLoadingComplete={() => setImageLoading(false)}
          onError={() => {
            setImageLoading(false);
            setImageError(true);
          }}
          priority={false} // Set to true for above-the-fold images if needed
        />

        {/* Wishlist Toggle Button Overlay */}
        <button
          onClick={handleHeartClick}
          className="absolute top-2 right-2 z-10 p-1.5 bg-white dark:bg-gray-900 rounded-full shadow-md hover:bg-white dark:hover:bg-gray-900 transition-colors group"
          aria-label="Toggle Wishlist"
        >
          {isInWishlist ? (
            <Heart className="h-6 w-6 text-green-600 fill-green-600" /> // Filled heart when in wishlist
          ) : (
            <Heart className="h-6 w-6 text-green-600 fill group-hover:fill-green-600" /> // Outline heart, fills on hover
          )}
        </button>
      </div>

      {/* Book Details Section */}
      <div className="flex-1">
        {/* Title (truncated if too long) */}
        <h3 className="text-lg font-semibold mb-1 text-gray-800 dark:text-gray-200 truncate">{book.title}</h3>
        {/* Author (truncated) */}
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 font-medium truncate">by {authorText}</p>
        {/* Rating Stars */}
        <div className="flex items-center mb-2">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${
                i < Math.floor(book.rating ?? 0) // Check rating exists, default 0
                  ? "text-yellow-400 fill-current" // Fully filled star
                  : i < (book.rating ?? 0)
                  ? "text-yellow-400" // Partially filled appearance (outline color) - consider half star icon if needed
                  : "text-gray-300 dark:text-gray-600" // Empty star
              }`}
            />
          ))}
          {/* Number of Ratings */}
          <span className="ml-2 text-xs text-gray-600 dark:text-gray-400">({book.numRatings ?? 0})</span>
        </div>
        {/* Genre Chips */}
        <div className="flex flex-wrap gap-2">
          {genreArray.length > 0 ? (
            genreArray.slice(0, 3).map((genre, idx) => { // Limit displayed genres if desired
              const color = genreColors[idx % genreColors.length]; // Cycle through colors
              return (
                <span
                  key={idx}
                  className={`px-2 py-1 rounded-full text-xs ${color.bg} ${color.text} ${color.darkBg} ${color.darkText} truncate`}
                >
                  {genre}
                </span>
              );
            })
          ) : (
            // Display placeholder if no genres
            <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs dark:bg-gray-700 dark:text-gray-200 truncate">
              No Genre
            </span>
          )}
        </div>
      </div>

      {/* Inline CSS for Shimmer Animation using JSX style */}
      <style jsx>{`
        .shimmer-wrapper {
          position: absolute;
          inset: 0; /* Equivalent to top, right, bottom, left = 0 */
          overflow: hidden;
          border-radius: inherit; /* Inherit rounding from parent */
        }
        .shimmer {
          width: 50%;
          height: 100%;
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.3) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          transform: skewX(-20deg);
          position: absolute;
          top: 0;
          left: -150%;
          animation: shimmer 2.0s infinite linear; /* Linear timing can feel smoother */
        }
        @keyframes shimmer {
          0% { left: -150%; }
          100% { left: 150%; }
        }
        /* Dark mode adjustment for shimmer effect */
        @media (prefers-color-scheme: dark) {
          .shimmer {
            background: linear-gradient(
              90deg,
              rgba(255, 255, 255, 0) 0%,
              rgba(255, 255, 255, 0.08) 50%, /* Reduced opacity for dark */
              rgba(255, 255, 255, 0) 100%
            );
          }
        }
      `}</style>
    </div>
  );
});

export default BookCard;