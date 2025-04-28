// Dashboard Page Component for logged-in users
"use client";

// --- Core Imports ---
import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link"; // Keep Link
import { useRouter, useSearchParams } from "next/navigation"; 
// --- UI Imports ---
import { Search, ThumbsUp, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react"; 
// --- Store Import ---
import { useAppStore } from "../store/appStore"; 

// --- Custom Components ---
import BookCard from "../../components/BookCard"; 
import SkeletonLoader from "../../components/SkeletonLoader"; 
import ChunkErrorBoundary from "../../components/ChunkErrorBoundary"; 
import { CategoriesSection } from "../../components/CategoriesSection"; 
// --- Constants ---
const categories = [
  "Fiction", "Non-fiction", "Romance", "Crime", "Paranormal",
  "Fantasy", "Mystery", "Thriller", "History", "Historical Fiction",
  "Children", "Graphic", "Comics", "Young-adult", "Poetry",
];
const DEFAULT_TAB = "popular";
const DEFAULT_CATEGORY = null;
// const DEFAULT_SEARCH = ""; // No longer needed for dashboard state management
const DEFAULT_PAGE = 0;
const DEFAULT_CATEGORY_PAGE = 0;
const API_BASE_URL = 'http://localhost:3001';
const BOOKS_PER_PAGE = 10;

// --- Helper Functions ---
const fetchWithTimeout = async (url, options = {}, timeout = 10000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { credentials: 'include', ...options, signal: controller.signal });
    clearTimeout(id);
    if (!res.ok) {
      const errorBody = await res.text();
      console.error(`API Error Response (${res.status}) for ${url}:`, errorBody);
      // Don't throw for 401 on wishlist as it's handled
      if (!(url.includes('/api/wishlist') && res.status === 401)) {
         throw new Error(`HTTP error! status: ${res.status}, message: ${errorBody || res.statusText}`);
      } else {
          return null; // Return null for expected 401 on wishlist
      }
    }
    if (res.status === 204 || res.headers.get('content-length') === '0') {
      return null;
    }
    return res.json();
  } catch (err) {
    if (err.name === 'AbortError') {
      console.error(`Fetch timed out for ${url}`);
      throw new Error('Request timed out');
    }
    // Avoid re-throwing if it was just the handled 401
    if (!err.message?.includes('status: 401')) {
        console.error(`Fetch error for ${url}:`, err);
        throw err;
    }
    return null; // Return null for expected 401 fetch error on wishlist
  } finally {
    clearTimeout(id);
  }
};


// --- Main Dashboard Page Component ---
export default function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get required state/actions from Zustand store
  const { setLastDashboardPath, isLoggedIn, isLoadingAuth } = useAppStore();

  // UI control state
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || DEFAULT_TAB);
  const [selectedCategory, setSelectedCategory] = useState(() => searchParams.get('category') || DEFAULT_CATEGORY);

  // State for the dashboard's search *input field* only
  const [searchQuery, setSearchQuery] = useState(""); // Initialize empty

  // State for fetched data
  const [books, setBooks] = useState([]); // For Popular/Recommended
  const [isLoading, setIsLoading] = useState(true); // Loading for Popular/Recommended
  const [error, setError] = useState(null);
  const [categoryBooks, setCategoryBooks] = useState([]); // For selected category
  const [categoryLoading, setCategoryLoading] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(() => {
      const pageParam = searchParams.get('page');
      const pageNumber = pageParam ? parseInt(pageParam, 10) : 1;
      return !isNaN(pageNumber) && pageNumber > 0 ? pageNumber - 1 : DEFAULT_PAGE;
  });
  const [categoryCurrentPage, setCategoryCurrentPage] = useState(() => {
      const cPageParam = searchParams.get('cpage');
      const pageNumber = cPageParam ? parseInt(cPageParam, 10) : 1;
      return !isNaN(pageNumber) && pageNumber > 0 ? pageNumber - 1 : DEFAULT_CATEGORY_PAGE;
  });

  // Wishlist & Notification state
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [notification, setNotification] = useState({ message: null, type: 'success' });

  // Ref for initial mount control
  const isInitialMount = useRef(true);

  // --- Derived State ---
  const totalPages = books.length > 0 ? Math.ceil(books.length / BOOKS_PER_PAGE) : 1;
  const validatedCurrentPage = Math.max(0, Math.min(currentPage, totalPages > 0 ? totalPages - 1 : 0));
  const currentBooks = books.slice( validatedCurrentPage * BOOKS_PER_PAGE, (validatedCurrentPage + 1) * BOOKS_PER_PAGE );
  const categoryTotalPages = categoryBooks.length > 0 ? Math.ceil(categoryBooks.length / BOOKS_PER_PAGE) : 1;
  const validatedCategoryCurrentPage = Math.max(0, Math.min(categoryCurrentPage, categoryTotalPages > 0 ? categoryTotalPages - 1 : 0));

  // --- Effects ---

  // Notification timeout
  useEffect(() => {
    if (notification.message) {
      const timer = setTimeout(() => setNotification({ message: null, type: 'success' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Wishlist Fetch Function
  const fetchWishlist = useCallback(async () => {
    try {
      const data = await fetchWithTimeout(`${API_BASE_URL}/api/wishlist`);
      if (data && Array.isArray(data.wishlist)) {
        const bookIds = data.wishlist.map((b) => Number(b.book_id));
        setWishlistIds(new Set(bookIds));
      } else { setWishlistIds(new Set()); } // Clear if data is null (e.g., 401) or invalid
    } catch (err) { console.error("Error processing wishlist fetch:", err); setWishlistIds(new Set()); }
  }, []);

  // Effect to Fetch Wishlist Conditionally
  useEffect(() => {
    if (!isLoadingAuth) {
      if (isLoggedIn) fetchWishlist();
      else setWishlistIds(new Set());
    }
  }, [isLoggedIn, isLoadingAuth, fetchWishlist]);

  // Fetch Popular/Recommended books (main list) 
  useEffect(() => {
    async function fetchBooks() {
      setIsLoading(true); setError(null);
      try {
        const url = activeTab === "recommended" ? `${API_BASE_URL}/api/recommendations` : `${API_BASE_URL}/api/trending-books`;
        const data = await fetchWithTimeout(url);
        const booksData = (activeTab === "recommended" && data?.recommendations) ? data.recommendations : data;
        setBooks(Array.isArray(booksData) ? booksData : []);
      } catch (err) { console.error(`Fetch error (${activeTab}):`, err); setError(err); setBooks([]); }
      finally { setIsLoading(false); }
    }
    fetchBooks();
  }, [activeTab]); // Only depends on activeTab

  // Fetch Category books
  useEffect(() => {
    const fetchCategoryBooks = async () => {
      if (!selectedCategory) { setCategoryBooks([]); return; }
      setCategoryLoading(true);
      try {
        const url = `${API_BASE_URL}/api/category/${encodeURIComponent(selectedCategory)}`;
        const data = await fetchWithTimeout(url);
        setCategoryBooks(Array.isArray(data) ? data : []);
      } catch (err) { console.error("Error fetching category books:", err); setCategoryBooks([]); }
      finally { setCategoryLoading(false); }
    };
    fetchCategoryBooks();
  }, [selectedCategory]);

  // Effects to validate page numbers
   useEffect(() => {
     if (isInitialMount.current || isLoading) return;
     if (currentPage !== validatedCurrentPage) setCurrentPage(validatedCurrentPage);
   }, [isLoading, currentPage, validatedCurrentPage]);
   useEffect(() => {
      if (isInitialMount.current || categoryLoading) return;
      if (categoryCurrentPage !== validatedCategoryCurrentPage) setCategoryCurrentPage(validatedCategoryCurrentPage);
   }, [categoryLoading, categoryCurrentPage, validatedCategoryCurrentPage]);

  // Effect to Update URL Query Params AND Global State 
  useEffect(() => {
    if (isInitialMount.current) {
      const timer = setTimeout(() => { isInitialMount.current = false; }, 10);
      return () => clearTimeout(timer);
    }
    const params = new URLSearchParams(searchParams);
    if (activeTab && activeTab !== DEFAULT_TAB) params.set('tab', activeTab); else params.delete('tab');
    if (selectedCategory && selectedCategory !== DEFAULT_CATEGORY) params.set('category', selectedCategory); else params.delete('category');
    if (validatedCurrentPage > 0) params.set('page', (validatedCurrentPage + 1).toString()); else params.delete('page');
    if (selectedCategory && validatedCategoryCurrentPage > 0) params.set('cpage', (validatedCategoryCurrentPage + 1).toString()); else params.delete('cpage');

    const queryString = params.toString();
    const newPath = queryString ? `/dashboard?${queryString}` : '/dashboard';
    const currentPath = window.location.pathname + window.location.search;

    setLastDashboardPath(newPath); // Update global state

    if (currentPath !== newPath) router.replace(newPath, { scroll: false }); // Update browser URL

  }, [ activeTab, selectedCategory, validatedCurrentPage, validatedCategoryCurrentPage, router, searchParams, setLastDashboardPath ]);


  // --- Event Handlers ---

  // Wishlist handlers
  const handleAddToWishlist = async (bookId) => {
    if (!isLoggedIn) { setNotification({ message: "Please log in to add books to wishlist.", type: 'warning' }); return; }
    try {
      const numericId = Number(bookId);
      const res = await fetchWithTimeout( `${API_BASE_URL}/api/wishlist`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bookId: numericId }) } );
      if (!res) { setNotification({ message: "Error adding book.", type: 'error' }); return; } // Changed check to handle null from timeout/401
      setWishlistIds((prev) => new Set(prev).add(numericId));
      setNotification({ message: "Book added to wishlist!", type: 'success' });
    } catch (error) { console.error("Add wishlist error:", error); setNotification({ message: "Error adding book.", type: 'error' }); }
  };
  const handleRemoveFromWishlist = async (bookId) => {
    if (!isLoggedIn) { console.warn("Remove wishlist attempt while not logged in."); return; }
    try {
      const numericId = Number(bookId);
      const res = await fetchWithTimeout( `${API_BASE_URL}/api/wishlist/${numericId}`, { method: "DELETE" } );
      if (!res) { setNotification({ message: "Error removing book.", type: 'error' }); return; }
      setWishlistIds((prev) => { const u = new Set(prev); u.delete(numericId); return u; });
      setNotification({ message: "Book removed from wishlist!", type: 'success' });
    } catch (error) { console.error("Remove wishlist error:", error); setNotification({ message: "Error removing book.", type: 'error' }); }
  };

  // View details handler
  const handleViewDetails = async (id) => {
    if (!isLoggedIn) { setNotification({ message: "Please log in to view book details.", type: 'warning' }); return; }
    try { await fetchWithTimeout( `${API_BASE_URL}/api/interactions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event: "view_details", bookId: id }) } ); }
    catch (error) { console.error("Error logging interaction:", error); }
    router.push(`/book/${id}`);
  };

  // --- Search form submission ---
  const handleSearch = (e) => {
    e.preventDefault();
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery) {
      router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`);
      // No longer setting dashboard state like searchModeQuery
    } else {
      console.log("Dashboard search query is empty.");
      // Optionally provide feedback or focus input
    }
  };

  // --- Pagination handlers ---
  const goToPreviousPage = () => setCurrentPage((prev) => Math.max(0, prev - 1));
  const goToNextPage = () => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
  const goToPreviousCategoryPage = () => setCategoryCurrentPage((prev) => Math.max(0, prev - 1));
  const goToNextCategoryPage = () => setCategoryCurrentPage((prev) => Math.min(categoryTotalPages - 1, prev + 1));

  // --- Category selection handler ---
  const handleCategoryClick = (category) => {
      const newCategory = selectedCategory === category ? DEFAULT_CATEGORY : category;
      if (newCategory !== selectedCategory) {
          setSelectedCategory(newCategory);
          // Don't reset dashboard search input on category change
          setCategoryCurrentPage(DEFAULT_CATEGORY_PAGE);
      }
  };

   // --- Tab switching handler ---
   const handleTabChange = (tab) => {
       if (tab !== activeTab) {
           setActiveTab(tab);
           // Don't reset dashboard search input on tab change
           setCurrentPage(DEFAULT_PAGE);
       }
   };

  // --- Render BookCard helper ---
  const renderBookCard = (book) => {
    const bookId = Number(book.book_id || book._id || book.id);
    if (!bookId || isNaN(bookId)) return null;
    const updatedBook = {
      ...book, id: bookId, rating: book.average_rating, numRatings: book.ratings_count,
      author: book.authors, genre: book.max_genre || "Genre Unknown", isbn13: book.isbn13,
      cover_id: book.cover_id,
    };
    return (
      <BookCard
        key={`dash-${bookId}-${activeTab}`}
        book={updatedBook}
        isLoggedIn={isLoggedIn}
        isInWishlist={isLoggedIn && wishlistIds.has(bookId)}
        onAddToWishlist={handleAddToWishlist}
        onRemove={handleRemoveFromWishlist}
        onViewDetails={handleViewDetails}
        isClickable={isLoggedIn}
      />
    );
  };

  // --- JSX Output ---
  return (
    <ChunkErrorBoundary>
      <div className={`flex flex-col min-h-screen bg-gradient-to-br from-teal-100 via-blue-50 to-teal-100 dark:from-teal-950 dark:via-blue-950 dark:to-cyan-950 transition-colors duration-300`}>
        {/* Notification */}
        {notification.message && (
          <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded shadow-lg z-[100] text-white flex items-center gap-2 ${
              notification.type === 'success' ? 'bg-green-500' :
              notification.type === 'error' ? 'bg-red-500' : 'bg-yellow-500'
          }`}>
            {notification.type === 'warning' && <AlertCircle className="h-5 w-5" />}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 w-full">
          <div className="max-w-[1400px] mx-auto">

            {/* Search Bar (uses updated handleSearch) */}
            <section className="mb-12">
              <form onSubmit={handleSearch} className="max-w-3xl mx-auto">
                <div className="flex items-center border-2 border-teal-300 dark:border-teal-700 rounded-full overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 bg-white dark:bg-gray-900">
                  <input
                    type="search" // Use type="search" for semantics
                    placeholder="Search books across the collection..." 
                    className="w-full px-6 py-3 text-gray-700 dark:text-gray-200 focus:outline-none bg-transparent"
                    value={searchQuery} // Still controlled by local state
                    onChange={(e) => setSearchQuery(e.target.value)} // Update local state
                    aria-label="Search Books"
                  />
                  <button type="submit" className="bg-teal-600 dark:bg-teal-700 text-white px-6 py-3 hover:bg-teal-700 dark:hover:bg-teal-600 transition-colors duration-300" aria-label="Search Books">
                    <Search className="h-6 w-6" />
                  </button>
                </div>
              </form>
            </section>

            {/* Categories Section */}
            <CategoriesSection
              categories={categories} allBooks={categoryBooks} selectedCategory={selectedCategory}
              onCategoryClick={handleCategoryClick} onAddToWishlist={handleAddToWishlist}
              onRemoveFromWishlist={handleRemoveFromWishlist} onViewDetails={handleViewDetails}
              wishlistIds={wishlistIds} booksPerPage={BOOKS_PER_PAGE}
              categoryCurrentPage={validatedCategoryCurrentPage} categoryTotalPages={categoryTotalPages}
              goToPreviousCategoryPage={goToPreviousCategoryPage} goToNextCategoryPage={goToNextCategoryPage}
              isLoading={categoryLoading} isLoggedIn={isLoggedIn}
            />

            {/* Spacer */}
            <div className="mb-12"></div>

            {/* Popular/Recommended Section */}
            <section className="mb-12">
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-600 dark:from-teal-400 dark:to-blue-400 inline-block section-heading">
                    {/* Title only depends on activeTab now */}
                    {activeTab === "popular" ? "Popular Books" : "Recommended For You"}
                  </h2>
                  {/* Tabs */}
                  <div className="bg-white dark:bg-gray-900 rounded-full shadow-md p-1 flex">
                    <button onClick={() => handleTabChange("popular")} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === "popular" ? "bg-teal-500 text-white" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"}`}> Popular </button>
                    <button onClick={() => handleTabChange("recommended")} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center ${activeTab === "recommended" ? "bg-teal-500 text-white" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"}`}> <ThumbsUp className="h-4 w-4 mr-1" /> Recommended </button>
                  </div>
                </div>
                {/* Pagination Controls for Popular/Recommended */}
                {totalPages > 1 && !isLoading && (
                  <div className="flex items-center space-x-4">
                    <button onClick={goToPreviousPage} disabled={validatedCurrentPage === 0} className="p-2 rounded-full bg-teal-500 dark:bg-teal-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-teal-600 dark:hover:bg-teal-500 transition-colors" aria-label="Previous page"> <ChevronLeft className="h-6 w-6" /> </button>
                    <span className="text-sm text-gray-700 dark:text-gray-300"> Page {validatedCurrentPage + 1} of {totalPages} </span>
                    <button onClick={goToNextPage} disabled={validatedCurrentPage >= totalPages - 1} className="p-2 rounded-full bg-teal-500 dark:bg-teal-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-teal-600 dark:hover:bg-teal-500 transition-colors" aria-label="Next page"> <ChevronRight className="h-6 w-6" /> </button>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && <div className="text-center text-red-500 dark:text-red-400 mb-4 p-4 bg-red-100 dark:bg-red-900/30 rounded-lg"> Error fetching books: {error.message || "Please try again later."} </div>}
              {/* Recommended Info */}
              {activeTab === "recommended" && <div className="mb-6 bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg text-sm text-blue-800 dark:text-blue-200"> <p> These books are recommended based on reading history, preferences, and similar users' interests. </p> </div>}

              {/* Content: Loading / Books Grid / Empty State */}
              {isLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"> {Array(BOOKS_PER_PAGE).fill(null).map((_, index) => <div key={`skel-main-${index}`} className="bg-white/80 dark:bg-gray-800/80 rounded-lg shadow-md p-4 transition-all duration-300"> <SkeletonLoader /> </div>)} </div>
              ) : books.length > 0 ? (
                 <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"> {currentBooks.map((book) => renderBookCard(book))} </div>
              ) : (
                 !error && <div className="text-center py-10 text-gray-600 dark:text-gray-400"> No books found in this section. </div>
              )}

              {/* Bottom Pagination */}
              {!isLoading && totalPages > 1 && (
                 <div className="flex justify-center mt-10">
                    <div className="bg-white dark:bg-gray-900 rounded-full shadow-lg p-2 flex items-center space-x-4 transition-colors duration-300">
                       <button onClick={goToPreviousPage} disabled={validatedCurrentPage === 0} className="p-3 rounded-full bg-teal-500 dark:bg-teal-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-teal-600 dark:hover:bg-teal-500 transition-colors flex items-center" aria-label="Previous page"> <ChevronLeft className="h-6 w-6" /> </button>
                       <div className="px-4 py-2"> <span className="font-medium text-gray-700 dark:text-gray-300"> Page {validatedCurrentPage + 1} of {totalPages} </span> </div>
                       <button onClick={goToNextPage} disabled={validatedCurrentPage >= totalPages - 1} className="p-3 rounded-full bg-teal-500 dark:bg-teal-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-teal-600 dark:hover:bg-teal-500 transition-colors flex items-center" aria-label="Next page"> <ChevronRight className="h-6 w-6" /> </button>
                    </div>
                 </div>
              )}
            </section>

          </div> {/* End max-w container */}
        </main>

        {/* CSS for animated heading */}
        <style jsx>{`
          @keyframes gradientShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
          .section-heading { animation: gradientShift 5s ease infinite; background-size: 200% 200%; }
        `}</style>
      </div> {/* End main container div */}
    </ChunkErrorBoundary>
  );
}