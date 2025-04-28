"use client";

// --- Core Imports ---
import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// --- UI Imports ---
import {
  Search, Star, ChevronLeft, ChevronRight, X, ChevronDown, ChevronUp, SlidersHorizontal, AlertCircle, // Import AlertCircle for warning notifications
} from "lucide-react";
import BookCard from "../../components/BookCard"; 

// --- Store Import ---
import { useAppStore } from "../store/appStore"; 

// ----- Filter Options -----
const genres = [
  "fiction", "non-fiction", "romance", "paranormal", "fantasy", "mystery", "crime",
  "thriller", "history", "biography", "historical fiction", "children", "graphic",
  "comics", "young-adult", "poetry",
];
const languages = [
  "English", "Portuguese", "Swedish", "Spanish", "French", "German", "Japanese",
];
const ratings = [5, 4, 3, 2, 1];
const yearRanges = [
  "Before 1900", "1900-1950", "1951-2000", "2001-2010", "After 2010",
];

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // --- Authentication State ---
  const { isLoggedIn, isLoadingAuth } = useAppStore();

  // ---------- Search and API States ----------
  const [searchQuery, setSearchQuery] = useState("");
  const [fetchedBooks, setFetchedBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // For search results loading
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // ---------- Filter and Sort States ----------
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [selectedRatings, setSelectedRatings] = useState([]);
  const [selectedYearRanges, setSelectedYearRanges] = useState([]);
  const [sortOption, setSortOption] = useState("relevance");

  // Pagination
  const booksPerPage = 12;
  const [currentPage, setCurrentPage] = useState(0);
  const maxBooks = 240;

  // UI State
  const [expandedSections, setExpandedSections] = useState({
    genres: true, ratings: true, years: true, languages: true,
  });
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // ---------- Wishlist Logic ----------
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [notification, setNotification] = useState({ message: null, type: 'success' }); // Store message and type

  // Notification timer effect - Updated for type
  useEffect(() => {
    if (notification.message) {
      const timer = setTimeout(() => setNotification({ message: null, type: 'success' }), 3000); // Increase timeout slightly
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // --- Helper fetch with timeout ---
  const fetchWithTimeout = (url, options = {}, timeout = 5000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(id));
  };

  // --- Wishlist Fetch Function (memoized) ---
  const fetchWishlist = useCallback(async () => {
    // console.log("Attempting to fetch wishlist..."); // Keep for debugging if needed
    try {
      const res = await fetch("http://localhost:3001/api/wishlist", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        const bookIds = data.wishlist.map((b) => Number(b.book_id));
        setWishlistIds(new Set(bookIds));
        // console.log("Wishlist fetched successfully."); // Keep for debugging if needed
      } else if (res.status !== 401) {
        console.error("Failed to fetch wishlist (non-OK status):", res.status);
        setWishlistIds(new Set());
      } else {
         setWishlistIds(new Set());
      }
    } catch (error) {
      console.error("Error fetching wishlist (catch block):", error);
       setWishlistIds(new Set());
    }
  }, []);

  // --- Effect to Fetch Wishlist *Conditionally* ---
  useEffect(() => {
    if (!isLoadingAuth) {
      if (isLoggedIn) {
        fetchWishlist();
      } else {
        setWishlistIds(new Set());
      }
    }
  }, [isLoggedIn, isLoadingAuth, fetchWishlist]);

  // --- Add to Wishlist handler  ---
  const handleAddToWishlist = async (bookId) => {
    // ** Check login status first **
    if (!isLoggedIn) {
      // ** Show notification instead of redirecting **
      setNotification({ message: "Please log in to add books to your wishlist.", type: 'warning' });
      return; // Stop execution
    }
    // ** Proceed only if logged in **
    try {
      const numericId = Number(bookId);
      const res = await fetchWithTimeout("http://localhost:3001/api/wishlist", {
        method: "POST", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify({ bookId: numericId }),
      }, 5000);
      if (!res.ok) {
          console.error("Failed to add to wishlist (API Error)", res.status);
          setNotification({ message: "Error adding book. Please try again.", type: 'error' });
          return;
       }
      setWishlistIds((prev) => new Set([...prev, numericId]));
      setNotification({ message: "Book added to wishlist!", type: 'success' });
    } catch (error) {
        console.error("Error adding to wishlist (Catch Block):", error);
        setNotification({ message: "Error adding book. Please try again.", type: 'error' });
    }
  };

  // --- Remove from Wishlist handler ---
  const handleRemoveFromWishlist = async (bookId) => {
     // No need to check isLoggedIn here, as the button won't render if not logged in/in wishlist
    try {
      const numericId = Number(bookId);
      const res = await fetch(`http://localhost:3001/api/wishlist/${numericId}`, {
        method: "DELETE", credentials: "include",
      });
      if (!res.ok) {
          console.error("Failed to remove from wishlist", res.status);
          setNotification({ message: "Error removing book. Please try again.", type: 'error' });
          return;
      }
      setWishlistIds((prev) => {
        const updated = new Set(prev); updated.delete(numericId); return updated;
      });
      setNotification({ message: "Book removed from wishlist!", type: 'success' });
    } catch (error) {
        console.error("Error removing from wishlist:", error);
        setNotification({ message: "Error removing book. Please try again.", type: 'error' });
    }
  };

  // ---------- Reusable Search Fetch Logic ----------
  const performSearch = useCallback(async (query) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
        setFetchedBooks([]);
        setIsLoading(false);
        setInitialLoadComplete(true);
        return;
    }
    setIsLoading(true);
    try {
        const response = await fetch(
            `http://localhost:3001/api/search-books?title=${encodeURIComponent(trimmedQuery)}`,
            { credentials: "include" }
        );
        if (response.ok) {
            const data = await response.json();
            const formattedBooks = data.map((rawBook) => {
                const names = rawBook.authorDetails && Array.isArray(rawBook.authorDetails)
                    ? rawBook.authorDetails.map((a) => a.name).filter(Boolean) : [];
                return {
                    id: rawBook.book_id || rawBook._id,
                    title: rawBook.title || "Untitled",
                    author: names.length > 0 ? names.join(", ") : rawBook.authors || "Author",
                    average_rating: rawBook.average_rating,
                    ratings_count: rawBook.ratings_count,
                    description: rawBook.description || "A captivating story that you'll enjoy.",
                    max_genre: rawBook.max_genre || rawBook.genre || "Genre",
                    isbn13: rawBook.isbn13,
                    isbn: rawBook.isbn,
                    language: rawBook.language || "English",
                    publication_year: rawBook.publication_year ?? 2000,
                    format: rawBook.format || "Paperback",
                    cover_id: rawBook.cover_id
                };
            });
            setFetchedBooks(formattedBooks.slice(0, maxBooks));
            setCurrentPage(0);
        } else {
            console.error("Failed to fetch search results", response.status);
            setFetchedBooks([]);
        }
    } catch (error) {
        console.error("Error fetching search results:", error);
        setFetchedBooks([]);
    } finally {
        setIsLoading(false);
        setInitialLoadComplete(true);
    }
  }, [maxBooks]);

  // --- Effect to Perform Search on Initial Load or URL Change ---
  useEffect(() => {
    const initialQuery = searchParams.get("q");
    if (initialQuery !== null) {
        const decodedQuery = decodeURIComponent(initialQuery);
        setSearchQuery(decodedQuery);
        if (!initialLoadComplete) {
             performSearch(decodedQuery);
        }
    } else if (!initialLoadComplete) {
        setFetchedBooks([]);
        setInitialLoadComplete(true);
    }
  }, [searchParams, performSearch, initialLoadComplete]);

  // --- Form Submission Handler (within Search Page) ---
  const handleSearchFormSubmit = (e) => {
    e.preventDefault();
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery) {
      router.replace(`/search?q=${encodeURIComponent(trimmedQuery)}`, { scroll: false });
      performSearch(trimmedQuery);
    } else {
      setFetchedBooks([]);
      router.replace('/search', { scroll: false });
    }
  };

  // ---------- Filtering Logic ----------
  const filterBooks = (books) => {
    return books.filter((book) => {
      if (selectedGenres.length > 0) {
        const bookGenres = Array.isArray(book.max_genre) ? book.max_genre.map(g => g.toLowerCase()) : typeof book.max_genre === 'string' ? book.max_genre.split(",").map(g => g.trim().toLowerCase()) : [];
        if (!selectedGenres.some(selected => bookGenres.includes(selected.toLowerCase()))) return false;
      }
      if (selectedLanguages.length > 0 && !selectedLanguages.includes(book.language)) return false;
      if (selectedRatings.length > 0 && !selectedRatings.some(r => book.average_rating >= r && book.average_rating < (r + 1))) return false;
      if (selectedYearRanges.length > 0) {
        const pubYear = book.publication_year;
        if (pubYear === null || pubYear === undefined) return false;
        const matches = selectedYearRanges.some(range => {
          if (range === "Before 1900" && pubYear < 1900) return true;
          if (range === "1900-1950" && pubYear >= 1900 && pubYear <= 1950) return true;
          if (range === "1951-2000" && pubYear >= 1951 && pubYear <= 2000) return true;
          if (range === "2001-2010" && pubYear >= 2001 && pubYear <= 2010) return true;
          if (range === "After 2010" && pubYear > 2010) return true;
          return false;
        });
        if (!matches) return false;
      }
      return true;
    });
  };

  // ---------- Sorting Logic ----------
  const sortBooks = (books) => {
    const booksToSort = [...books];
    switch (sortOption) {
      case "popularity": return booksToSort.sort((a, b) => (b.ratings_count ?? 0) - (a.ratings_count ?? 0));
      case "relevance": return books;
      case "title-asc": return booksToSort.sort((a, b) => a.title.localeCompare(b.title));
      case "title-desc": return booksToSort.sort((a, b) => b.title.localeCompare(a.title));
      case "rating-high": return booksToSort.sort((a, b) => (b.average_rating ?? 0) - (a.average_rating ?? 0));
      case "rating-low": return booksToSort.sort((a, b) => (a.average_rating ?? 0) - (b.average_rating ?? 0));
      case "year-new": return booksToSort.sort((a, b) => (b.publication_year ?? 0) - (a.publication_year ?? 0));
      case "year-old": return booksToSort.sort((a, b) => (a.publication_year ?? 0) - (b.publication_year ?? 0));
      default: return books;
    }
  };

  // Apply filtering/sorting/pagination
  const filteredBooks = filterBooks(fetchedBooks);
  const sortedBooks = sortBooks(filteredBooks);
  const limitedBooks = sortedBooks.slice(0, maxBooks);
  const totalPages = Math.ceil(limitedBooks.length / booksPerPage);
  const currentBooks = limitedBooks.slice(currentPage * booksPerPage, (currentPage + 1) * booksPerPage);

  // Pagination handlers
  const goToPreviousPage = () => setCurrentPage((prev) => Math.max(0, prev - 1));
  const goToNextPage = () => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));

  // Filter UI Handlers
  const toggleSection = (section) => { setExpandedSections(prev => ({ ...prev, [section]: !prev[section] })); };
  const resetPageAndToggle = (setter, item) => {
    setter((prev) => prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]);
    setCurrentPage(0);
  };
  const toggleGenre = (genre) => resetPageAndToggle(setSelectedGenres, genre);
  const toggleLanguage = (language) => resetPageAndToggle(setSelectedLanguages, language);
  const toggleRating = (rating) => resetPageAndToggle(setSelectedRatings, rating);
  const toggleYearRange = (range) => resetPageAndToggle(setSelectedYearRanges, range);
  const clearAllFilters = () => {
    setSelectedGenres([]); setSelectedLanguages([]);
    setSelectedRatings([]); setSelectedYearRanges([]);
    setCurrentPage(0);
  };

  // --- BookCard view details handler  ---
  const handleViewDetails = async (id) => {
    // ** Check login status first **
    if (!isLoggedIn) {
      // ** Show notification and stop **
      setNotification({ message: "Please log in to view book details.", type: 'warning' });
      console.log("View details clicked while not logged in. Preventing navigation.");
      return; // Stop execution
    }

    // ** Proceed only if logged in **
    try {
      // Log interaction 
      await fetchWithTimeout("http://localhost:3001/api/interactions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify({ event: "view_details", bookId: id }),
      }, 5000);
    } catch (error) {
      console.error("Error logging view_details interaction:", error);
    }
    // Navigate to book detail page
    router.push(`/book/${id}`);
  };

  // Render BookCard helper
  const renderBookCard = (book) => {
     const bookId = Number(book.id || book.book_id || book._id);
     if (!bookId || isNaN(bookId)) return null;
     const updatedBook = {
         ...book, id: bookId, rating: book.average_rating, numRatings: book.ratings_count,
     };
     return (
       <BookCard
         key={bookId} book={updatedBook}
         isLoggedIn={isLoggedIn} // Pass login status
         isInWishlist={isLoggedIn && wishlistIds.has(bookId)} // Check only if logged in
         onAddToWishlist={() => handleAddToWishlist(bookId)}
         onRemove={() => handleRemoveFromWishlist(bookId)}
         onViewDetails={() => handleViewDetails(bookId)}
         // Add isClickable prop to BookCard component if you want visual changes
         isClickable={isLoggedIn}
       />
     );
  };

  // Count active filters
  const activeFilterCount = selectedGenres.length + selectedLanguages.length + selectedRatings.length + selectedYearRanges.length;

  // ---------- JSX Rendering ----------
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-teal-100 via-blue-50 to-teal-100 dark:from-teal-950 dark:via-blue-950 dark:to-cyan-950 transition-colors duration-300">
      {/* --- Notification Display (Updated for type) --- */}
      {notification.message && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded shadow-lg z-[100] text-white flex items-center gap-2 ${
            notification.type === 'success' ? 'bg-green-500' :
            notification.type === 'error' ? 'bg-red-500' :
            'bg-yellow-500' // Default to warning/info style
        }`}>
          {notification.type === 'warning' && <AlertCircle className="h-5 w-5" />}
          <span>{notification.message}</span>
        </div>
      )}

      <main className="flex-1 p-4 md:p-6 lg:p-8 w-full">
        <div className="max-w-[1400px] mx-auto">
          {/* --- Search Section --- */}
          <section className="mb-8">
            <div className="text-center mb-6">
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Discover your next favorite book from our extensive collection. Use the search bar and filters to find exactly what you're looking for.
              </p>
            </div>
            <form onSubmit={handleSearchFormSubmit} className="w-full">
              <div className="flex items-center border-2 border-teal-300 dark:border-teal-700 rounded-full overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 bg-white dark:bg-gray-900">
                <input
                  type="search"
                  placeholder="Search by title, author, ISBN, or keywords..."
                  className="w-full px-6 py-4 text-gray-700 dark:text-gray-200 focus:outline-none bg-transparent text-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search Books"
                />
                <button type="submit" className="bg-teal-600 dark:bg-teal-700 text-white px-8 py-4 hover:bg-teal-700 dark:hover:bg-teal-600 transition-colors duration-300 flex items-center disabled:opacity-70" disabled={isLoading}>
                   {isLoading ? ( <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> ) : ( <Search className="h-6 w-6 mr-2" /> )}
                   <span className={isLoading ? 'ml-2' : ''}>{isLoading ? 'Searching...' : 'Search'}</span>
                </button>
              </div>
            </form>
          </section>

          {/* --- Mobile Filter Toggle --- */}
          <div className="md:hidden mb-4 flex justify-end">
             <button onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)} className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500">
               <SlidersHorizontal className="h-5 w-5 mr-2" /> {mobileFiltersOpen ? 'Hide' : 'Show'} Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
             </button>
           </div>

          {/* --- Filters and Results --- */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* --- Filters Sidebar --- */}
            <aside className={`${ mobileFiltersOpen ? "block" : "hidden" } md:block w-full md:w-64 lg:w-72 flex-shrink-0`}>
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-4 sticky top-20 md:top-4">
                {/* Filters Header */}
                <div className="flex justify-between items-center mb-4">
                   <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center"><SlidersHorizontal className="h-5 w-5 mr-2" /> Filters</h2>
                   {activeFilterCount > 0 && ( <button onClick={clearAllFilters} className="text-sm text-teal-600 dark:text-teal-400 hover:underline flex items-center"><X className="h-4 w-4 mr-1" /> Clear All</button> )}
                </div>
                {/* Genre Filter */}
                <div className="mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
                   <button onClick={() => toggleSection("genres")} className="flex justify-between items-center w-full text-left font-medium text-gray-800 dark:text-gray-200 mb-2"> <span>Genre</span> {expandedSections.genres ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />} </button>
                   {expandedSections.genres && ( <div className="space-y-2 mt-2 max-h-48 overflow-y-auto pr-2"> {genres.map((genre) => ( <label key={genre} className="flex items-center text-gray-700 dark:text-gray-300 cursor-pointer capitalize hover:text-teal-600 dark:hover:text-teal-400"> <input type="checkbox" checked={selectedGenres.includes(genre)} onChange={() => toggleGenre(genre)} className="rounded text-teal-600 focus:ring-teal-500 mr-2"/> {genre.replace('-', ' ')} </label> ))} </div> )}
                </div>
                 {/* Language Filter */}
                <div className="mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
                   <button onClick={() => toggleSection("languages")} className="flex justify-between items-center w-full text-left font-medium text-gray-800 dark:text-gray-200 mb-2"> <span>Language</span> {expandedSections.languages ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />} </button>
                   {expandedSections.languages && ( <div className="space-y-2 mt-2"> {languages.map((language) => ( <label key={language} className="flex items-center text-gray-700 dark:text-gray-300 cursor-pointer hover:text-teal-600 dark:hover:text-teal-400"> <input type="checkbox" checked={selectedLanguages.includes(language)} onChange={() => toggleLanguage(language)} className="rounded text-teal-600 focus:ring-teal-500 mr-2"/> {language} </label> ))} </div> )}
                </div>
                {/* Rating Filter */}
                <div className="mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
                   <button onClick={() => toggleSection("ratings")} className="flex justify-between items-center w-full text-left font-medium text-gray-800 dark:text-gray-200 mb-2"> <span>Rating</span> {expandedSections.ratings ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />} </button>
                   {expandedSections.ratings && ( <div className="space-y-2 mt-2"> {ratings.map((rating) => ( <label key={rating} className="flex items-center text-gray-700 dark:text-gray-300 cursor-pointer hover:text-teal-600 dark:hover:text-teal-400"> <input type="checkbox" checked={selectedRatings.includes(rating)} onChange={() => toggleRating(rating)} className="rounded text-teal-600 focus:ring-teal-500 mr-2"/> <div className="flex items-center"> {Array.from({ length: 5 }).map((_, i) => ( <Star key={i} className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'}`} /> ))} <span className="ml-1">& up</span> </div> </label> ))} </div> )}
                </div>
                {/* Publication Year Filter */}
                <div className="mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
                   <button onClick={() => toggleSection("years")} className="flex justify-between items-center w-full text-left font-medium text-gray-800 dark:text-gray-200 mb-2"> <span>Publication Year</span> {expandedSections.years ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />} </button>
                   {expandedSections.years && ( <div className="space-y-2 mt-2"> {yearRanges.map((range) => ( <label key={range} className="flex items-center text-gray-700 dark:text-gray-300 cursor-pointer hover:text-teal-600 dark:hover:text-teal-400"> <input type="checkbox" checked={selectedYearRanges.includes(range)} onChange={() => toggleYearRange(range)} className="rounded text-teal-600 focus:ring-teal-500 mr-2"/> {range} </label> ))} </div> )}
                </div>
              </div>
            </aside>

            {/* --- Search Results Area --- */}
            <div className="flex-1">
              {/* Results Header */}
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-4 mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200"> {!isLoading && limitedBooks.length} {!isLoading && (limitedBooks.length === 1 ? "result" : "results")} found </h2>
                    {!isLoading && activeFilterCount > 0 && ( <p className="text-sm text-gray-600 dark:text-gray-400"> {activeFilterCount} {activeFilterCount === 1 ? "filter" : "filters"} applied </p> )}
                  </div>
                   {!isLoading && fetchedBooks.length > 0 && (
                     <div className="flex items-center w-full sm:w-auto">
                       <label htmlFor="sort-select" className="text-gray-700 dark:text-gray-300 mr-2 text-sm whitespace-nowrap">Sort by:</label>
                       <select id="sort-select" value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="flex-grow sm:flex-grow-0 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                         <option value="relevance">Relevance</option>
                         <option value="popularity">Popularity</option>
                         <option value="title-asc">Title (A-Z)</option>
                         <option value="title-desc">Title (Z-A)</option>
                         <option value="rating-high">Highest Rating</option>
                         <option value="rating-low">Lowest Rating</option>
                         <option value="year-new">Newest First</option>
                         <option value="year-old">Oldest First</option>
                       </select>
                     </div>
                   )}
                </div>
                 {!isLoading && activeFilterCount > 0 && (
                   <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                     <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Active Filters:</h3>
                     <div className="flex flex-wrap gap-2">
                       {selectedGenres.map((genre) => ( <div key={genre} className="bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 px-3 py-1 rounded-full text-sm flex items-center"><span className="capitalize">{genre.replace('-',' ')}</span><button onClick={() => toggleGenre(genre)} className="ml-1.5 text-teal-600 dark:text-teal-300 hover:text-teal-800 dark:hover:text-teal-100 focus:outline-none"><X className="h-3 w-3" /></button></div> ))}
                       {selectedRatings.map((rating) => ( <div key={rating} className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-3 py-1 rounded-full text-sm flex items-center">{rating}★ & up<button onClick={() => toggleRating(rating)} className="ml-1.5 text-yellow-600 dark:text-yellow-300 hover:text-yellow-800 dark:hover:text-yellow-100 focus:outline-none"><X className="h-3 w-3" /></button></div> ))}
                       {selectedYearRanges.map((range) => ( <div key={range} className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm flex items-center">{range}<button onClick={() => toggleYearRange(range)} className="ml-1.5 text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100 focus:outline-none"><X className="h-3 w-3" /></button></div> ))}
                       {selectedLanguages.map((language) => ( <div key={language} className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-3 py-1 rounded-full text-sm flex items-center">{language}<button onClick={() => toggleLanguage(language)} className="ml-1.5 text-purple-600 dark:text-purple-300 hover:text-purple-800 dark:hover:text-purple-100 focus:outline-none"><X className="h-3 w-3" /></button></div> ))}
                     </div>
                   </div>
                 )}
              </div>

              {/* --- Results Grid / Loading / No Results --- */}
              {isLoading ? (
                 <div className="flex justify-center items-center p-10 text-gray-600 dark:text-gray-400">
                    <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-teal-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span>Loading search results...</span>
                 </div>
              ) : currentBooks.length > 0 ? (
                <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
                  {currentBooks.map((book) => renderBookCard(book))}
                </div>
              ) : (
                 initialLoadComplete && (
                    <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-md text-center">
                      <p className="text-gray-700 dark:text-gray-300 text-lg mb-4">
                         {searchParams.get("q") || searchQuery ? "No books found matching your search and filters." : "Enter a search term above to find books."}
                      </p>
                      {activeFilterCount > 0 && (
                          <button onClick={clearAllFilters} className="px-4 py-2 bg-teal-500 text-white rounded-full hover:bg-teal-600 transition-colors duration-300 mt-2 text-sm"> Clear Filters </button>
                      )}
                   </div>
                 )
              )}

              {/* --- Pagination Controls --- */}
              {!isLoading && totalPages > 1 && (
                 <div className="flex justify-center mt-10">
                   <div className="bg-white dark:bg-gray-900 rounded-full shadow-lg p-1 sm:p-2 flex items-center space-x-2 sm:space-x-4 transition-colors duration-300">
                     <button onClick={goToPreviousPage} disabled={currentPage === 0} className="p-2 sm:p-3 rounded-full bg-teal-500 dark:bg-teal-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-teal-600 dark:hover:bg-teal-500 transition-colors flex items-center focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-1 dark:focus:ring-offset-gray-900" aria-label="Previous page">
                       <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" /> <span className="ml-1 hidden sm:inline text-sm">Prev</span>
                     </button>
                     <div className="px-2 sm:px-4 py-1 sm:py-2"> <span className="font-medium text-sm sm:text-base text-gray-700 dark:text-gray-300"> Page {currentPage + 1} of {totalPages} </span> </div>
                     <button onClick={goToNextPage} disabled={currentPage >= totalPages - 1} className="p-2 sm:p-3 rounded-full bg-teal-500 dark:bg-teal-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-teal-600 dark:hover:bg-teal-500 transition-colors flex items-center focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-1 dark:focus:ring-offset-gray-900" aria-label="Next page">
                       <span className="mr-1 hidden sm:inline text-sm">Next</span> <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                     </button>
                   </div>
                 </div>
               )}
            </div> {/* End flex-1 results area */}
          </div> {/* End flex container for sidebar/results */}
        </div> {/* End max-w container */}
      </main>

      {/* --- Style block --- */}
      <style jsx>{`
        .max-h-48::-webkit-scrollbar { width: 6px; }
        .max-h-48::-webkit-scrollbar-track { background: transparent; }
        .max-h-48::-webkit-scrollbar-thumb { background-color: rgba(13, 148, 136, 0.4); border-radius: 20px; border: 3px solid transparent; }
        .dark .max-h-48::-webkit-scrollbar-thumb { background-color: rgba(45, 212, 191, 0.4); }
        .max-h-48::-webkit-scrollbar-thumb:hover { background-color: rgba(13, 148, 136, 0.6); }
        .dark .max-h-48::-webkit-scrollbar-thumb:hover { background-color: rgba(45, 212, 191, 0.6); }
        @keyframes gradientShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        .section-heading { animation: gradientShift 5s ease infinite; background-size: 200% 200%; }
      `}</style>
    </div>
  );
}