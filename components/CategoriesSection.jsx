"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import BookCard from "./BookCard"; 
import SkeletonLoader from "./SkeletonLoader"; 

// Define the CategoriesSection component, accepting props from the parent
export function CategoriesSection({
  categories, // Array of category names
  allBooks, // Array of all books fetched for the selected category
  selectedCategory, // The currently selected category name (or null)
  onCategoryClick, // Handler function to change the selected category in the parent
  // Wishlist and view details handlers passed down from the parent
  onAddToWishlist,
  onRemoveFromWishlist,
  onViewDetails,
  wishlistIds, // Set of book IDs in the user's wishlist
  booksPerPage = 10, // Default books per page for this section
  // --- Props received from parent for pagination ---
  categoryCurrentPage, // Current validated page index (0-based) for this section
  categoryTotalPages, // Total pages calculated in the parent for this section
  goToPreviousCategoryPage, // Function from parent to go to the previous category page
  goToNextCategoryPage, // Function from parent to go to the next category page
  isLoading, // Boolean indicating if category books are currently loading
}) {

  // Calculate the slice of books for the current page based on props received from parent
  const currentCategoryBooks = allBooks.slice(
    categoryCurrentPage * booksPerPage, // Start index based on current page prop
    (categoryCurrentPage + 1) * booksPerPage // End index
  );

  // --- Render the component ---
  return (
    <>
      {/* Section for Category Filter Buttons */}
      <section className="mb-8">
        <h2 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-600 dark:from-teal-400 dark:to-blue-400 inline-block section-heading">
          Categories
        </h2>
        {/* Grid layout for category buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {/* Map over the categories array to create a button for each */}
          {categories.map((category) => (
            <button
              key={category}
              // Call the parent's handler on click
              // Toggle behavior: clicking the selected category again deselects it (passes null)
              onClick={() =>
                selectedCategory === category
                  ? onCategoryClick(null)
                  : onCategoryClick(category)
              }
              // Apply dynamic styling based on whether the category is selected
              className={`p-4 rounded-lg text-center transition-all duration-300 transform hover:scale-105 ${
                selectedCategory === category
                  ? "bg-teal-500 text-white shadow-lg ring-2 ring-teal-300 dark:ring-teal-600" // Style for selected
                  : "bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 shadow-md hover:bg-teal-50 dark:hover:bg-gray-800" // Style for non-selected
              }`}
            >
              <span className="font-medium">{category}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Section to Display Books for the Selected Category */}
      {/* Render this section only if a category is actually selected */}
      {selectedCategory && (
        <section className="mb-12 animate-fadeIn">
          {/* Header for the category books section */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            {/* Category Title */}
            <h2 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-600 dark:from-teal-400 dark:to-blue-400 section-heading">
              {selectedCategory} Books
            </h2>
            {/* Top Pagination Controls - Use props from parent */}
            {/* Show controls only if there's more than one page and not loading */}
            {categoryTotalPages > 1 && !isLoading && (
                <div className="flex items-center space-x-4">
                <button
                    onClick={goToPreviousCategoryPage} // Use handler from props
                    disabled={categoryCurrentPage === 0} // Use state from props
                    className="p-2 rounded-full bg-teal-500 dark:bg-teal-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-teal-600 dark:hover:bg-teal-500 transition-colors"
                    aria-label="Previous category page"
                >
                    <ChevronLeft className="h-6 w-6" />
                </button>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                    {/* Display page based on props */}
                    Page {categoryCurrentPage + 1} of {categoryTotalPages}
                </span>
                <button
                    onClick={goToNextCategoryPage} // Use handler from props
                    disabled={categoryCurrentPage >= categoryTotalPages - 1} // Use state from props
                    className="p-2 rounded-full bg-teal-500 dark:bg-teal-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-teal-600 dark:hover:bg-teal-500 transition-colors"
                    aria-label="Next category page"
                >
                    <ChevronRight className="h-6 w-6" />
                </button>
                </div>
            )}
          </div>

          {/* Content Display: Loading Skeletons / Book Grid / Empty State */}
          {isLoading ? (
             // Show skeleton loaders while fetching category books
             <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {Array(booksPerPage).fill(null).map((_, index) => (
                    <div key={`cat-skel-${index}`} className="bg-white/80 dark:bg-gray-800/80 rounded-lg shadow-md p-4">
                        <SkeletonLoader />
                    </div>
                ))}
             </div>
          ) : currentCategoryBooks.length > 0 ? (
            // Render the grid of BookCards for the current page of category books
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {currentCategoryBooks.map((book) => {
                // Ensure book has a valid ID, provide fallback if necessary for key prop
                const numericId = Number(book.id || book.book_id || Math.random());
                // Prepare the book object for the BookCard if structure differs from expected
                const bookForCard = {
                    ...book,
                    id: numericId, 
                };
                return (
                  <BookCard
                    key={`cat-${numericId}`} // Unique key prefix for category books
                    book={bookForCard}
                    // Check wishlist status using the numeric ID
                    isInWishlist={wishlistIds?.has(numericId)}
                    // Pass down event handlers
                    onAddToWishlist={onAddToWishlist}
                    onRemove={onRemoveFromWishlist}
                    onViewDetails={onViewDetails}
                  />
                );
              })}
            </div>
          ) : (
            // Display message if no books were found for the category (and not loading)
            <div className="text-center py-10 text-gray-600 dark:text-gray-400">
              No books found in the "{selectedCategory}" category.
            </div>
          )}

          {/* Bottom Pagination Controls - Use props from parent */}
          {/* Show only if not loading, more than one page, and there are books to display */}
          {!isLoading && categoryTotalPages > 1 && currentCategoryBooks.length > 0 && (
            <div className="flex justify-center mt-10">
              <div className="bg-white dark:bg-gray-900 rounded-full shadow-lg p-2 flex items-center space-x-4 transition-colors duration-300">
                <button
                  onClick={goToPreviousCategoryPage} // Use handler from props
                  disabled={categoryCurrentPage === 0} // Use state from props
                  className="p-3 rounded-full bg-teal-500 dark:bg-teal-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-teal-600 dark:hover:bg-teal-500 transition-colors flex items-center"
                  aria-label="Previous category page"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <div className="px-4 py-2">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {/* Display page based on props */}
                    Page {categoryCurrentPage + 1} of {categoryTotalPages}
                  </span>
                </div>
                <button
                  onClick={goToNextCategoryPage} // Use handler from props
                  disabled={categoryCurrentPage >= categoryTotalPages - 1} // Use state from props
                  className="p-3 rounded-full bg-teal-500 dark:bg-teal-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-teal-600 dark:hover:bg-teal-500 transition-colors flex items-center"
                  aria-label="Next category page"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </div>
            </div>
          )}
        </section>
      )} {/* End conditional rendering for selected category section */}
    </>
  );
}