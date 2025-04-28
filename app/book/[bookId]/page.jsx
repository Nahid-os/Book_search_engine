"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  Star,
  Heart,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Share2,
} from "lucide-react";
import BookCard from "../../../components/BookCard";
import SkeletonLoader from "../../../components/SkeletonLoader";

export default function BookDetails() {
  // Retrieve bookId from route parameters
  const { bookId } = useParams();
  const router = useRouter();

  // Component state
  const [book, setBook] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const [similarBooks, setSimilarBooks] = useState([]);
  const [similarBooksLoading, setSimilarBooksLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Wishlist-related state
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [notification, setNotification] = useState(null);
  const [isInWishlist, setIsInWishlist] = useState(false);

  // Fetch wishlist items and mark if current book is included
  useEffect(() => {
    async function fetchWishlist() {
      try {
        const res = await fetch("http://localhost:3001/api/wishlist", {
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error(`Wishlist fetch failed: ${res.status}`);
        }
        const data = await res.json();
        const ids = data.wishlist.map((b) => b.book_id);
        setWishlistIds(new Set(ids));
        setIsInWishlist(bookId && ids.includes(Number(bookId)));
      } catch (err) {
        console.error("Error fetching wishlist:", err);
      }
    }
    fetchWishlist();
  }, [bookId]);

  // Automatically clear notifications after 2 seconds
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 2000);
    return () => clearTimeout(timer);
  }, [notification]);

  // Add a book to the wishlist
  const handleAddToWishlist = async (id) => {
    const numericId = Number(id);
    try {
      await fetch("http://localhost:3001/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ bookId: numericId }),
      });
      setWishlistIds((prev) => new Set(prev).add(numericId));
      if (numericId === Number(book?.book_id || book?.id)) {
        setIsInWishlist(true);
      }
      setNotification("Book added to wishlist!");
    } catch (err) {
      console.error("Error adding to wishlist:", err);
    }
  };

  // Remove a book from the wishlist
  const handleRemoveFromWishlist = async (id) => {
    const numericId = Number(id);
    try {
      const res = await fetch(
        `http://localhost:3001/api/wishlist/${numericId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      if (!res.ok) {
        console.error("Failed to remove from wishlist");
        return;
      }
      setWishlistIds((prev) => {
        const updated = new Set(prev);
        updated.delete(numericId);
        return updated;
      });
      if (numericId === Number(book?.book_id || book?.id)) {
        setIsInWishlist(false);
      }
      setNotification("Book removed from wishlist!");
    } catch (err) {
      console.error("Error removing from wishlist:", err);
    }
  };

  // Log view-details interaction and navigate to that book
  const handleViewDetails = async (id) => {
    try {
      await fetch("http://localhost:3001/api/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ event: "view_details", bookId: id }),
      });
    } catch (err) {
      console.error("Error logging interaction:", err);
    }
    router.push(`/book/${id}`);
  };

  // Initialize theme based on stored preference
  useEffect(() => {
    const stored = localStorage.getItem("darkMode") === "true";
    setDarkMode(stored);
    document.documentElement.classList.toggle("dark", stored);
  }, []);

  // Fetch book details and similar book recommendations
  useEffect(() => {
    async function fetchBookDetails() {
      try {
        setIsLoading(true);
        const res = await fetch(
          `http://localhost:3001/api/books/${bookId}`
        );
        if (!res.ok) {
          throw new Error("Failed to fetch book details");
        }
        const data = await res.json();
        setBook(data);

        // Parse similar_books field if present
        if (data.similar_books) {
          const parseSimilar = (b) => {
            try {
              return JSON.parse(b.similar_books.replace(/'/g, '"')).map(Number);
            } catch {
              return [];
            }
          };
          const ids = parseSimilar(data);
          if (ids.length > 0) {
            setSimilarBooksLoading(true);
            const fetched = await Promise.all(
              ids.map((id) =>
                fetch(`http://localhost:3001/api/books/${id}`)
                  .then((r) => (r.ok ? r.json() : null))
                  .catch(() => null)
              )
            );
            setSimilarBooks(fetched.filter(Boolean));
          } else {
            setSimilarBooks([]);
          }
          setSimilarBooksLoading(false);
        } else {
          setSimilarBooks([]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    if (bookId) {
      fetchBookDetails();
    }
  }, [bookId]);

  // Share book via Web Share API or clipboard
  const handleShare = async () => {
    const shareData = {
      title: book.title,
      text: `Check out this book: ${book.title} by ${book.authors}`,
      url: book.url,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setNotification("Book shared successfully!");
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        setNotification("Link copied to clipboard!");
      } else {
        setNotification("Sharing not supported by this browser.");
      }
    } catch (err) {
      console.error("Error sharing book:", err);
      setNotification("Failed to share the book.");
    }
  };

  // Prepare props for BookCard component
  const renderBookCard = (b) => {
    const props = {
      ...b,
      id: b.book_id || b._id || b.id,
      rating: b.average_rating,
      numRatings: b.ratings_count,
      author: b.authors,
      genre: b.max_genre || "Genre",
      isbn13: b.isbn13,
      cover_id: b.cover_id,
    };
    return (
      <BookCard
        key={props.id}
        book={props}
        isInWishlist={wishlistIds.has(Number(props.id))}
        onAddToWishlist={handleAddToWishlist}
        onRemove={handleRemoveFromWishlist}
        onViewDetails={handleViewDetails}
      />
    );
  };

  // Pagination logic for similar books
  const booksPerPage = 4;
  const totalPages = Math.ceil(similarBooks.length / booksPerPage);
  const currentBooks = similarBooks.slice(
    currentPage * booksPerPage,
    (currentPage + 1) * booksPerPage
  );
  const goToPreviousPage = () =>
    setCurrentPage((prev) => Math.max(0, prev - 1));
  const goToNextPage = () =>
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));

  // Display loading placeholder
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-teal-100 via-blue-50 to-teal-100 dark:from-teal-950 dark:via-blue-950 dark:to-cyan-950 p-4 md:p-6 lg:p-8 transition-colors duration-300">
        <div className="max-w-[1400px] mx-auto w-full">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl p-6 md:p-8 mb-12 flex items-center justify-center">
            <div className="animate-pulse text-teal-600 dark:text-teal-400 text-xl">
              Loading book details...
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle case where no book is found
  if (!book) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-teal-100 via-blue-50 to-teal-100 dark:from-teal-950 dark:via-blue-950 dark:to-cyan-950 p-4 md:p-6 lg:p-8 transition-colors duration-300">
        <div className="max-w-[1400px] mx-auto w-full">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl p-6 md:p-8 mb-12">
            <div className="text-red-600 dark:text-red-400">Book not found.</div>
          </div>
        </div>
      </div>
    );
  }

  // Determine number of filled stars for rating display
  const filledStars = Math.floor(book.average_rating || 0);

  // Convert genre string into array
  const genreArray = book.max_genre
    ? book.max_genre.split(",").map((g) => g.trim())
    : [];

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-teal-100 via-blue-50 to-teal-100 dark:from-teal-950 dark:via-blue-950 dark:to-cyan-950 p-4 md:p-6 lg:p-8 transition-colors duration-300">
      {/* Notification banner */}
      {notification && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded shadow-md z-50">
          {notification}
        </div>
      )}

      <div className="max-w-[1400px] mx-auto w-full">
        {/* Back navigation button */}
        <button
          onClick={() => router.back()}
          className="flex items-center mb-6 text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors group"
        >
          <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back</span>
        </button>

        {/* Book details section */}
        <section className="bg-white dark:bg-gray-900 rounded-xl shadow-xl p-6 md:p-8 mb-12 animate-fadeIn">
          <div className="grid md:grid-cols-[300px_1fr] gap-8">
            {/* Cover image and action buttons */}
            <div className="flex flex-col items-center">
              <div className="relative w-full max-w-[300px] h-[525px] mb-4 rounded-lg overflow-hidden shadow-lg">
                {imageLoading && !imageError && (
                  <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 rounded animate-pulse">
                    <div className="shimmer-wrapper">
                      <div className="shimmer"></div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </div>
                )}
                <Image
                  src={
                    imageError
                      ? "/default-cover.png"
                      : `https://covers.openlibrary.org/b/isbn/${book.isbn13}-L.jpg`
                  }
                  alt={`Cover of ${book.title}`}
                  fill
                  className={`object-cover rounded-lg transition-opacity duration-300 ${
                    imageLoading ? "opacity-0" : "opacity-100"
                  }`}
                  onLoadingComplete={() => setImageLoading(false)}
                  onError={() => {
                    setImageLoading(false);
                    setImageError(true);
                  }}
                />
              </div>

              {/* Wishlist toggle button */}
              <button
                onClick={
                  isInWishlist
                    ? () => handleRemoveFromWishlist(book.book_id || book.id)
                    : () => handleAddToWishlist(book.book_id || book.id)
                }
                className={`w-full flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-medium transition-colors ${
                  isInWishlist
                    ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                    : "bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600"
                }`}
              >
                <Heart
                  className={`h-5 w-5 ${isInWishlist ? "fill-current" : ""}`}
                />
                {isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
              </button>

              {/* Share button */}
              <button
                onClick={handleShare}
                className="w-full mt-3 flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <Share2 className="h-5 w-5" />
                Share
              </button>
            </div>

            {/* Main book information */}
            <div className="flex flex-col">
              <h1 className="text-3xl md:text-4xl font-bold mb-2 text-gray-900 dark:text-gray-100">
                {book.title || "Untitled Book"}
              </h1>
              <p className="text-xl text-gray-700 dark:text-gray-300 mb-3">
                by {book.authors || "Unknown Author"}
              </p>

              {/* Genre tags */}
              <div className="mb-4 flex flex-wrap gap-2">
                {genreArray.length > 0
                  ? genreArray.map((genre, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300 rounded-full text-sm"
                      >
                        {genre}
                      </span>
                    ))
                  : (
                    <span className="px-3 py-1 bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300 rounded-full text-sm">
                      {book.max_genre || "Genre"}
                    </span>
                  )}
              </div>

              {/* Rating display */}
              <div className="flex items-center mb-6">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < filledStars
                          ? "text-yellow-400 fill-current"
                          : "text-gray-300 dark:text-gray-600"
                      }`}
                    />
                  ))}
                </div>
                <span className="ml-2 text-gray-700 dark:text-gray-300">
                  {book.average_rating || "0"} (
                  {book.ratings_count?.toLocaleString() || "0"} ratings)
                </span>
              </div>

              {/* Description */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
                  Description
                </h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {book.description || "No description available."}
                </p>
              </div>

              {/* Additional book details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 mb-8">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Publisher
                  </h3>
                  <p className="text-gray-900 dark:text-gray-100">
                    {book.publisher || "Unknown Publisher"}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Pages
                  </h3>
                  <p className="text-gray-900 dark:text-gray-100">
                    {book.num_pages || "N/A"}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Publication Year
                  </h3>
                  <p className="text-gray-900 dark:text-gray-100">
                    {book.publication_year || "Unknown"}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    ISBN-10
                  </h3>
                  <p className="text-gray-900 dark:text-gray-100">
                    {book.isbn || "N/A"}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    ISBN-13
                  </h3>
                  <p className="text-gray-900 dark:text-gray-100">
                    {book.isbn13 || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Similar books section */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-600 dark:from-teal-400 dark:to-blue-400 inline-block section-heading">
            Similar Books
          </h2>

          {similarBooksLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {Array(4)
                .fill(null)
                .map((_, index) => (
                  <div
                    key={index}
                    className="bg-white/80 dark:bg-gray-800/80 rounded-lg shadow-md p-6"
                  >
                    <SkeletonLoader />
                  </div>
                ))}
            </div>
          ) : similarBooks.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-lg text-center">
              <p className="text-gray-700 dark:text-gray-300">
                No similar books found.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {currentBooks.map(renderBookCard)}
            </div>
          )}

          {/* Pagination controls */}
          {similarBooks.length > booksPerPage && (
            <div className="flex justify-center mt-10">
              <div className="bg-white dark:bg-gray-900 rounded-full shadow-lg p-2 flex items-center space-x-4">
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 0}
                  className="p-3 rounded-full bg-teal-500 dark:bg-teal-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-teal-600 dark:hover:bg-teal-500 flex items-center"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-6 w-6" />
                  <span className="ml-1 hidden sm:inline">Previous</span>
                </button>
                <div className="px-4 py-2">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Page {currentPage + 1} of {totalPages}
                  </span>
                </div>
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages - 1}
                  className="p-3 rounded-full bg-teal-500 dark:bg-teal-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-teal-600 dark:hover:bg-teal-500 flex items-center"
                  aria-label="Next page"
                >
                  <span className="mr-1 hidden sm:inline">Next</span>
                  <ChevronRight className="h-6 w-6" />
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Component-specific styles */}
      <style jsx>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .section-heading {
          animation: gradientShift 5s ease infinite;
          background-size: 200% 200%;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
        .shimmer-wrapper {
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          animation: loading 2.5s infinite;
          overflow: hidden;
        }
        .shimmer {
          position: absolute;
          top: 0; left: -150%;
          width: 50%; height: 100%;
          background: linear-gradient(
            90deg,
            rgba(255,255,255,0) 0%,
            rgba(255,255,255,0.3) 50%,
            rgba(255,255,255,0) 100%
          );
          transform: skewX(-20deg);
          animation: shimmer 2.5s infinite;
        }
        @keyframes shimmer {
          0% { left: -150%; }
          100% { left: 150%; }
        }
        @media (prefers-color-scheme: dark) {
          .shimmer {
            background: linear-gradient(
              90deg,
              rgba(255,255,255,0) 0%,
              rgba(255,255,255,0.1) 50%,
              rgba(255,255,255,0) 100%
            );
          }
        }
      `}</style>
    </div>
  );
}
