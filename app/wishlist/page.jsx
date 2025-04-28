"use client";

import { useState, useEffect, useRef, useCallback } from "react";
// Import useSearchParams
import { useRouter, useSearchParams } from "next/navigation";
import {
  Book, Search, Star, ChevronLeft, ChevronRight, Plus, Trash2, Edit,
  BookOpen, CheckCircle, X, MoreHorizontal, BookMarked, ChevronUp,
  ChevronDown, AlertTriangle, Image as ImageIcon, Loader2
} from "lucide-react";
import Link from "next/link";

// --- Constants ---
const API_BASE_URL = 'http://localhost:3001'; // Define Backend Base URL

// Default structure only, no localStorage keys needed
const defaultShelvesStructure = [
    { id: "all", name: "All Library Books", books: [] }, 
    { id: "favorites", name: "Favorites", description: "My absolute favorite books (rated 5 stars)", books: [] },
    { id: "want-to-read", name: "Want to Read", books: [] },
    { id: "read", name: "Read", books: [] },
];
const DEFAULT_SORT_OPTION = "date-added-desc";
const DEFAULT_SHELF_ID = "all";

// Helper to deep copy state
const deepCopy = (obj) => JSON.parse(JSON.stringify(obj));

// Helper function for API calls
const apiFetch = async (path, options = {}) => { // path is now relative to API_BASE_URL
    const url = `${API_BASE_URL}${path}`; // Construct full URL
    console.log(`API Fetch: ${options.method || 'GET'} ${url}`); // Log the fetch attempt
    const defaultOptions = {
        credentials: 'include', // Always send cookies
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    };
    const response = await fetch(url, { ...defaultOptions, ...options });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error - Failed to parse error response." }));
        console.error(`API Error Response (${response.status}) for ${url}:`, errorData); // Log error details
        const error = new Error(`API Error (${response.status}): ${errorData.error || response.statusText}`);
        error.status = response.status;
        error.data = errorData;
        throw error;
    }
    // For DELETE or other methods that might not return JSON body on success
    if (response.status === 204 || response.headers.get('content-length') === '0') {
        console.log(`API Success (No Content): ${options.method || 'GET'} ${url}`);
        return null;
    }
     try {
        const responseData = await response.json();
        console.log(`API Success: ${options.method || 'GET'} ${url}`, responseData);
        return responseData; // Assumes successful responses return JSON
     } catch (jsonError) {
         console.error(`API Error: Failed to parse JSON response for ${url}`, jsonError);
         throw new Error("API Error: Invalid JSON response from server.");
     }
};


export default function WishlistPage() {
    const router = useRouter();
    // --- Get Search Params ---
    const searchParams = useSearchParams();

    // --- State Variables ---
    const [shelves, setShelves] = useState([]); // Holds custom shelves fetched from API
    const [booksData, setBooksData] = useState([]); // Holds userBookData fetched from API
    const [combinedShelves, setCombinedShelves] = useState(defaultShelvesStructure); // Derived state for UI

    // --- UI Control State Initialized from URL or Defaults ---
    const [activeShelfId, setActiveShelfId] = useState(() => searchParams.get('shelf') || DEFAULT_SHELF_ID);
    const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') || "");
    const [sortOption, setSortOption] = useState(() => searchParams.get('sort') || DEFAULT_SORT_OPTION);
    const [filterStatus, setFilterStatus] = useState(() => searchParams.get('status') || null);
    // Keep current page starting at 0, reset logic will handle it
    const [currentPage, setCurrentPage] = useState(0);

    // Other UI State
    const [isAddingShelf, setIsAddingShelf] = useState(false);
    const [newShelfName, setNewShelfName] = useState("");
    const [newShelfDescription, setNewShelfDescription] = useState("");
    const [editingBook, setEditingBook] = useState(null);
    const [showMobileShelfMenu, setShowMobileShelfMenu] = useState(false);
    const [openDropdownId, setOpenDropdownId] = useState(null);
    const dropdownRef = useRef(null);

    // --- Ref to Track Initial Mount for URL Update Logic ---
    const isInitialMount = useRef(true);

    // Loading/Error State
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false); // For API mutations
    const [error, setError] = useState(null);

    const booksPerPage = 6;

    // --- Fetch Initial Library Data ---
    const fetchLibraryData = useCallback(async (showLoading = true) => {
        if(showLoading) setIsLoading(true);
        setError(null);
        try {
            const data = await apiFetch('/api/library');
            console.log("Fetched library data:", data);
            if (data && Array.isArray(data.shelves) && Array.isArray(data.books)) {
                setShelves(data.shelves);
                setBooksData(data.books);
            } else {
                throw new Error("Invalid data structure received from library API.");
            }
        } catch (err) {
            console.error("Error in fetchLibraryData catch block:", err);
            setError(err.message || "Failed to load library data.");
            if (err.status === 401) {
                setError("Authentication error. Please log in again.");
            }
            setShelves([]);
            setBooksData([]);
        } finally {
             if(showLoading) setIsLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); 
    useEffect(() => {
        fetchLibraryData(); // Fetch on initial mount
    }, [fetchLibraryData]);


    // --- Derive Combined Shelves for UI ---
    useEffect(() => {
        const allShelfStructures = [
            ...defaultShelvesStructure.map(s => ({ ...s, books: [] })),
            ...shelves.map(s => ({ ...s, id: s._id, books: [] }))
        ];
         const uniqueShelfStructures = allShelfStructures.reduce((acc, current) => {
             if (!acc.some(item => item.id === current.id)) { acc.push(current); }
             return acc;
         }, []);

        booksData.forEach(book => {
            // Ensure book.bookId exists, otherwise use book.id or a fallback
            const standardizedBook = { ...book, id: book.bookId || book.id || `book-${Math.random()}` };
            const allShelf = uniqueShelfStructures.find(s => s.id === 'all');
            if (allShelf && !allShelf.books.some(b => b.id === standardizedBook.id)) {
                allShelf.books.push(standardizedBook);
            }
            const statusShelf = uniqueShelfStructures.find(s => s.id === standardizedBook.readingStatus);
            if (statusShelf && !statusShelf.books.some(b => b.id === standardizedBook.id)) {
                statusShelf.books.push(standardizedBook);
            }
            if (standardizedBook.userRating === 5) {
                const favShelf = uniqueShelfStructures.find(s => s.id === 'favorites');
                if (favShelf && !favShelf.books.some(b => b.id === standardizedBook.id)) {
                    favShelf.books.push(standardizedBook);
                }
            }
            if (standardizedBook.customShelfIds && Array.isArray(standardizedBook.customShelfIds)) {
                standardizedBook.customShelfIds.forEach(shelfId => {
                    const customShelf = uniqueShelfStructures.find(s => s.id === shelfId);
                    if (customShelf && !customShelf.books.some(b => b.id === standardizedBook.id)) {
                        customShelf.books.push(standardizedBook);
                    }
                });
            }
        });
        setCombinedShelves(uniqueShelfStructures);
    }, [shelves, booksData]);


    // --- Effect to Update URL Query Params When State Changes ---
    useEffect(() => {
        // Skip the very first render to avoid overwriting initial params from URL
        if (isInitialMount.current) {
            isInitialMount.current = false; // Mark initial mount as complete
            return;
        }

        const params = new URLSearchParams();

        // Add params only if they differ from the default
        if (activeShelfId && activeShelfId !== DEFAULT_SHELF_ID) {
            params.set('shelf', activeShelfId);
        } else {
             params.delete('shelf'); // Keep URL clean
        }
        if (searchQuery) {
            params.set('q', searchQuery);
        } else {
             params.delete('q');
        }
        if (sortOption && sortOption !== DEFAULT_SORT_OPTION) {
            params.set('sort', sortOption);
        } else {
             params.delete('sort');
        }
        if (filterStatus) {
            params.set('status', filterStatus);
        } else {
             params.delete('status');
        }
        // Add current page to params if not the first page
        const queryString = params.toString();
        // Construct the target path with query string if it exists
        const newPath = queryString ? `/wishlist?${queryString}` : '/wishlist';

        // Get current browser path to prevent unnecessary replaces
        const currentPath = window.location.pathname + window.location.search;

        if (currentPath !== newPath) {
             console.log("Updating URL to:", newPath); // Debug log
            // Use replace to avoid bloating browser history
            router.replace(newPath, { scroll: false }); // scroll: false prevents page jump
        }
    // Dependency array: Run effect when these state values change
    }, [activeShelfId, searchQuery, sortOption, filterStatus, router]); // Add router


    // --- Click Outside Handler for Dropdown ---
    useEffect(() => {
        function handleClickOutside(event) {
            if (openDropdownId !== null && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                const triggerButton = document.getElementById(`dropdown-trigger-${openDropdownId}`);
                if (!triggerButton || !triggerButton.contains(event.target)) { setOpenDropdownId(null); }
            }
        }
        if (openDropdownId !== null) { document.addEventListener("mousedown", handleClickOutside); }
        else { document.removeEventListener("mousedown", handleClickOutside); }
        return () => { document.removeEventListener("mousedown", handleClickOutside); };
    }, [openDropdownId]);

    // --- Helper Format Authors (using data from backend) ---
     const formatAuthors = (book) => {
          // Prioritize authorDetails if available
          if (book?.authorDetails && Array.isArray(book.authorDetails) && book.authorDetails.length > 0) {
               return book.authorDetails.map(a => a?.name).filter(Boolean).join(', ');
          }
          // Fallback to book.authors
          if(book?.authors && Array.isArray(book.authors) && book.authors.length > 0) {
              // Handle potential nested structure or direct string array
              return book.authors.map(a => (typeof a === 'string' ? a : a?.name)).filter(Boolean).join(', ');
          }
         return "Author Unknown";
     };

    // --- Shelf Management (API Calls) ---
    const handleAddShelf = async () => {
        if (newShelfName.trim() === "") return;
        setIsUpdating(true); setError(null);
        try {
            await apiFetch('/api/shelves', {
                method: 'POST',
                body: JSON.stringify({ name: newShelfName, description: newShelfDescription }),
            });
            await fetchLibraryData(false); // Re-fetch
            setNewShelfName(""); setNewShelfDescription(""); setIsAddingShelf(false);
        } catch (err) {
            console.error("Error adding shelf:", err);
            setError(err.message || "Failed to add shelf.");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDeleteShelf = async (shelfId, shelfName) => {
        if (!window.confirm(`Delete shelf "${shelfName}"? Books won't be removed from your library.`)) return;
        setIsUpdating(true); setError(null);
        try {
            await apiFetch(`/api/shelves/${shelfId}`, { method: 'DELETE' });
            await fetchLibraryData(false); // Re-fetch
            // If the deleted shelf was active, switch to 'all'
            if (activeShelfId === shelfId) {
                 setActiveShelfId(DEFAULT_SHELF_ID); // Use default constant
            }
        } catch (err) {
            console.error("Error deleting shelf:", err);
            setError(err.message || "Failed to delete shelf.");
        } finally {
            setIsUpdating(false);
        }
    };

    // --- Book Management (API Calls) ---
    const handleRemoveBook = async (bookId, bookTitle) => {
         if (!window.confirm(`Remove "${bookTitle || 'this book'}" from your library/wishlist?`)) return;
         setIsUpdating(true); setError(null);
         try {
             await apiFetch(`/api/library/books/${bookId}`, { method: 'DELETE' });
             await fetchLibraryData(false); // Re-fetch
             setOpenDropdownId(null);
         } catch (err) {
             console.error("Error removing book:", err);
             setError(err.message || "Failed to remove book.");
         } finally {
             setIsUpdating(false);
         }
     };

    const handleUpdateBookAttribute = async (bookId, attribute, value) => {
        setIsUpdating(true); setError(null); setOpenDropdownId(null);
        const payload = { [attribute]: value };
        try {
            await apiFetch(`/api/library/books/${bookId}`, {
                method: 'PATCH',
                body: JSON.stringify(payload),
            });
             await fetchLibraryData(false); // Re-fetch to get confirmed data
             if (attribute === 'notes' && editingBook?.id === bookId) setEditingBook(null); // Close modal only if updating the currently edited book
        } catch (err) {
            console.error(`Error updating ${attribute}:`, err);
            setError(err.message || `Failed to update ${attribute}.`);
            // Rollback optimistic update here if implemented
        } finally {
            setIsUpdating(false);
        }
    };

    const handleUpdateReadingStatus = (bookId, status) => handleUpdateBookAttribute(bookId, 'readingStatus', status);
    const handleUpdateRating = (bookId, rating) => handleUpdateBookAttribute(bookId, 'userRating', rating);
    const handleUpdateNotes = (bookId, notes) => handleUpdateBookAttribute(bookId, 'notes', notes);

    const handleAddToShelf = async (bookId, shelfId) => {
         setIsUpdating(true); setError(null); setOpenDropdownId(null);
         try {
             await apiFetch(`/api/library/books/${bookId}/shelves`, {
                 method: 'POST',
                 body: JSON.stringify({ shelfId }),
             });
              await fetchLibraryData(false); // Re-fetch
         } catch (err) {
             console.error("Error adding book to shelf:", err);
             setError(err.message || "Failed to add book to shelf.");
         } finally {
             setIsUpdating(false);
         }
     };

     // Function to remove book from a specific custom shelf
      const handleRemoveFromCustomShelf = async (bookId, shelfId) => {
         setIsUpdating(true); setError(null); setOpenDropdownId(null);
          try {
              await apiFetch(`/api/library/books/${bookId}/shelves/${shelfId}`, {
                  method: 'DELETE',
              });
               await fetchLibraryData(false); // Re-fetch
          } catch (err) {
              console.error("Error removing book from shelf:", err);
              setError(err.message || "Failed to remove book from shelf.");
          } finally {
              setIsUpdating(false);
          }
      };

    // --- Filtering, Sorting, Pagination (Uses derived combinedShelves state) ---
    const currentShelf = combinedShelves.find((shelf) => shelf.id === activeShelfId) || combinedShelves.find(s => s.id === 'all') || { id: 'all', name: 'All Library Books', books: [] };
    const filteredBooks = currentShelf.books.filter((book) =>
        (searchQuery === "" || book.title?.toLowerCase().includes(searchQuery.toLowerCase()) || formatAuthors(book)?.toLowerCase().includes(searchQuery.toLowerCase())) &&
        (filterStatus === null || book.readingStatus === filterStatus)
    );
    const sortedBooks = [...filteredBooks].sort((a, b) => {
        switch (sortOption) {
            case "title-asc": return (a.title || "").localeCompare(b.title || "");
            case "title-desc": return (b.title || "").localeCompare(a.title || "");
            case "author-asc": return (formatAuthors(a) || "").localeCompare(formatAuthors(b) || "");
            case "author-desc": return (formatAuthors(b) || "").localeCompare(formatAuthors(a) || "");
            case "rating-high": return (b.userRating || 0) - (a.userRating || 0);
            case "date-added-asc": return new Date(a.dateAdded || 0).getTime() - new Date(b.dateAdded || 0).getTime();
            case "date-added-desc": default: return new Date(b.dateAdded || 0).getTime() - new Date(a.dateAdded || 0).getTime();
        }
    });
    const totalPages = Math.ceil(sortedBooks.length / booksPerPage);
    // Ensure currentPage is valid AFTER totalPages is calculated
     const validatedCurrentPage = totalPages > 0 ? Math.max(0, Math.min(currentPage, totalPages - 1)) : 0;
    // Slice using the validated page number
    const currentBooks = sortedBooks.slice(validatedCurrentPage * booksPerPage, (validatedCurrentPage + 1) * booksPerPage);

    // --- Effect to Correct Page Number If It Becomes Invalid ---
     useEffect(() => {
         // If the calculated validated page is different from the current state, update the state
         if (currentPage !== validatedCurrentPage && !isLoading) { // Avoid resetting during load
              console.log(`Page validation: Current ${currentPage}, Validated ${validatedCurrentPage}, Total ${totalPages}. Resetting page state.`);
              setCurrentPage(validatedCurrentPage);
         }
     }, [currentPage, validatedCurrentPage, isLoading]); // Depend on state, validated calculation, and loading status

     // --- Effect to Reset Page Number to 0 on Filter/Sort/Shelf Changes ---
     useEffect(() => {
         // Reset page only AFTER the initial mount/URL read is complete
         // And only if filters/shelf actually changed
         if (!isInitialMount.current && !isLoading) {
             console.log("Filters/shelf changed, resetting current page to 0");
              setCurrentPage(0);
         }
     // Run when filters change, but NOT on currentPage itself
     }, [activeShelfId, searchQuery, filterStatus, sortOption, isLoading]);


    const goToPreviousPage = () => setCurrentPage((prev) => Math.max(0, prev - 1));
    const goToNextPage = () => setCurrentPage((prev) => Math.min(totalPages > 0 ? totalPages - 1 : 0, prev + 1));
    // Prevent default form submission which causes full page reload
    const handleSearch = (e) => { e.preventDefault(); /* Search state update handles filtering */ };

    // --- Status Mappings & Stats Calc  ---
    const statusIcons = { "want-to-read": <BookMarked className="h-5 w-5 text-blue-500" />, read: <CheckCircle className="h-5 w-5 text-green-500" />, dnf: <X className="h-5 w-5 text-red-500" /> };
    const statusText = { "want-to-read": "Want to Read", read: "Read", dnf: "Did Not Finish" };
    const allBooksForStats = combinedShelves.find(s => s.id === 'all')?.books || [];
    const totalBooksCount = allBooksForStats.length;
    const readCount = allBooksForStats.filter(book => book.readingStatus === "read").length;
    const wantToReadCount = allBooksForStats.filter(book => book.readingStatus === "want-to-read").length;

    // --- Image Error Handling ---
    const handleImageError = (event) => { event.target.style.display='none'; const p=event.target.nextElementSibling; if(p?.classList.contains('placeholder-icon-container')) p.style.display='flex'; event.target.onerror=null; };

    // --- Navigation & Dropdown Toggle  ---
    const handleViewDetails = (bookId) => router.push(`/book/${bookId}`);
    const toggleDropdown = (bookId, event) => { event.stopPropagation(); setOpenDropdownId(prevId => (prevId === bookId ? null : bookId)); };


    // --- Render Component ---
    // (JSX Structure remains largely the same, ensure input/select values use the state variables)
    return (
        // REMOVED the conditional dark class here. Tailwind dark: variants will rely on <html> class.
        <div className={`flex flex-col min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-green-50 dark:from-teal-950 dark:via-blue-950 dark:to-cyan-950 transition-colors duration-300`}>
            {/* Updating Indicator */}
            {isUpdating && (
                <div className="fixed top-4 right-4 z-[100] bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 px-3 py-1 rounded-full text-xs flex items-center shadow animate-pulse">
                    <Loader2 className="h-3 w-3 mr-1 animate-spin"/> Updating...
                </div>
            )}
            <main className="flex-1 p-4 md:p-6 lg:p-8 w-full">
                <div className="max-w-[1400px] mx-auto">
                    <section className="mb-8">
                        {/* Title */}
                        <h1 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-600 dark:from-teal-400 dark:to-blue-400 inline-block section-heading">
                            My Library
                        </h1>
                        {/* Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                           {/* Stat Blocks  */}
                           <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-4 flex flex-col items-center justify-center text-center transition-colors duration-300">
                               <div className="text-3xl font-bold text-teal-600 dark:text-teal-400 mb-1">{totalBooksCount}</div>
                               <div className="text-sm text-gray-600 dark:text-gray-400">Total Books</div>
                           </div>
                           <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-4 flex flex-col items-center justify-center text-center transition-colors duration-300">
                               <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">{readCount}</div>
                               <div className="text-sm text-gray-600 dark:text-gray-400">Books Read</div>
                           </div>
                           <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-4 flex flex-col items-center justify-center text-center transition-colors duration-300">
                               <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">{wantToReadCount}</div>
                               <div className="text-sm text-gray-600 dark:text-gray-400">Want to Read</div>
                           </div>
                        </div>
                        {/* Error Display  */}
                        {error && !isLoading && (
                            <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded-lg flex items-center gap-3" role="alert">
                                <AlertTriangle className="h-6 w-6 flex-shrink-0"/>
                                <div><p className="font-bold">Error</p><p>{error}</p></div>
                            </div>
                        )}
                        {/* Mobile Shelf Selector */}
                        <div className="md:hidden mb-4">
                             <button onClick={() => setShowMobileShelfMenu(!showMobileShelfMenu)} className="w-full flex items-center justify-between gap-2 bg-white dark:bg-gray-900 p-3 rounded-lg shadow-md text-gray-700 dark:text-gray-300 font-medium transition-colors duration-300">
                                 <div className="flex items-center truncate">
                                     <BookOpen className="h-5 w-5 mr-2 text-teal-600 dark:text-teal-400 flex-shrink-0" />
                                     <span className="truncate">{combinedShelves.find(s => s.id === activeShelfId)?.name || 'Select Shelf'}</span>
                                 </div>
                                 {showMobileShelfMenu ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                             </button>
                            {showMobileShelfMenu && (
                                <div className="mt-2 bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden transition-colors duration-300">
                                    {combinedShelves.map((shelf) => (
                                        <button key={shelf.id} onClick={() => { setActiveShelfId(shelf.id); setShowMobileShelfMenu(false); }} className={`w-full text-left p-3 flex items-center justify-between ${activeShelfId === shelf.id ? "bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"} transition-colors duration-200`}>
                                            <div className="flex items-center truncate">
                                                <BookOpen className="h-5 w-5 mr-2 flex-shrink-0" />
                                                <span className="truncate">{shelf.name}</span>
                                            </div>
                                            <span className="text-sm text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">{shelf.books.length}</span>
                                        </button>
                                    ))}
                                    <button onClick={() => { setIsAddingShelf(true); setShowMobileShelfMenu(false); }} className="w-full text-left p-3 flex items-center text-teal-600 dark:text-teal-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200">
                                        <Plus className="h-5 w-5 mr-2" /> Add New Shelf
                                    </button>
                                </div>
                            )}
                        </div>
                    </section>

                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Sidebar  */}
                        <aside className="hidden md:block w-64 flex-shrink-0">
                            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-4 sticky top-4 transition-colors duration-300">
                                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">My Shelves</h2>
                                {/* Shelves List */}
                                <div className="space-y-1">
                                    {combinedShelves.map((shelf) => (
                                        <div key={shelf.id} className="relative group flex items-center">
                                            <button onClick={() => setActiveShelfId(shelf.id)} className={`w-full text-left p-2 rounded-lg flex items-center justify-between ${activeShelfId === shelf.id ? "bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"} transition-colors duration-200`}>
                                                <div className="flex items-center truncate">
                                                    <BookOpen className="h-5 w-5 mr-2 flex-shrink-0" />
                                                    <span className="truncate" title={shelf.name}>{shelf.name}</span>
                                                </div>
                                                <span className="text-sm text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">{shelf.books.length}</span>
                                            </button>
                                            {/* Delete button */}
                                            {!["all", "favorites", "want-to-read", "read"].includes(shelf.id) && (
                                                <button onClick={() => handleDeleteShelf(shelf.id, shelf.name)} disabled={isUpdating} className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 z-10 disabled:opacity-30 disabled:cursor-not-allowed" title={`Delete shelf "${shelf.name}"`} aria-label={`Delete shelf "${shelf.name}"`} >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                {/* Add New Shelf Section  */}
                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    {isAddingShelf ? (
                                        <div className="space-y-3">
                                            <input type="text" placeholder="Shelf name" value={newShelfName} onChange={(e) => setNewShelfName(e.target.value)} className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors duration-300 focus:ring-teal-500" />
                                            <input type="text" placeholder="Description (optional)" value={newShelfDescription} onChange={(e) => setNewShelfDescription(e.target.value)} className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors duration-300 focus:ring-teal-500" />
                                            <div className="flex gap-2">
                                                <button onClick={handleAddShelf} disabled={isUpdating} className="flex-1 bg-teal-600 text-white rounded-lg p-2 hover:bg-teal-700 transition-colors disabled:opacity-50">Add</button>
                                                <button onClick={() => { setIsAddingShelf(false); setNewShelfName(""); setNewShelfDescription(""); }} disabled={isUpdating} className="flex-1 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg p-2 hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors disabled:opacity-50">Cancel</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button onClick={() => setIsAddingShelf(true)} className="w-full flex items-center justify-center gap-2 bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 p-2 rounded-lg hover:bg-teal-200 dark:hover:bg-teal-800 transition-colors">
                                            <Plus className="h-5 w-5" /> Add New Shelf
                                        </button>
                                    )}
                                </div>
                            </div>
                        </aside>

                        {/* Main Book List Area  */}
                        <div className="flex-1">
                            {/* Search/Filter Bar */}
                            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-4 mb-6 transition-colors duration-300">
                                <div className="flex flex-col sm:flex-row gap-4">
                                    {/* Ensure onSubmit={handleSearch} is present */}
                                    <form onSubmit={handleSearch} className="flex-1">
                                        <div className="relative">
                                            {/* Use searchQuery state for value */}
                                            <input type="text" placeholder={`Search in ${currentShelf.name}...`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors duration-300 focus:ring-teal-500" />
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        </div>
                                    </form>
                                    <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                                        {/* Use filterStatus state for value */}
                                        <select value={filterStatus || ""} onChange={(e) => setFilterStatus(e.target.value || null)} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors duration-300 flex-grow sm:flex-grow-0 focus:ring-teal-500">
                                            <option value="">All Statuses</option>
                                            <option value="want-to-read">Want to Read</option>
                                            <option value="read">Read</option>
                                            <option value="dnf">Did Not Finish</option>
                                        </select>
                                        {/* Use sortOption state for value */}
                                        <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors duration-300 flex-grow sm:flex-grow-0 focus:ring-teal-500">
                                            <option value="date-added-desc">Date Added (Newest)</option>
                                            <option value="date-added-asc">Date Added (Oldest)</option>
                                            <option value="title-asc">Title (A-Z)</option>
                                            <option value="title-desc">Title (Z-A)</option>
                                            <option value="author-asc">Author (A-Z)</option>
                                            <option value="author-desc">Author (Z-A)</option>
                                            <option value="rating-high">My Rating (High-Low)</option>
                                        </select>
                                    </div>
                                </div>
                                {currentShelf.description && <div className="mt-3 text-sm text-gray-600 dark:text-gray-400 italic">{currentShelf.description}</div>}
                            </div>

                            {/* Loading State  */}
                            {isLoading && (
                                <div className="space-y-4">
                                    {Array(3).fill(null).map((_, index) => (
                                        <div key={index} className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow-md flex gap-4 animate-pulse">
                                            <div className="w-full md:w-32 h-48 bg-gray-300 dark:bg-gray-700 rounded flex-shrink-0"></div>
                                            <div className="flex-1 space-y-3">
                                                <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
                                                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
                                                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div>
                                                <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mt-4"></div>
                                                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full mt-4"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Book List or Empty State */}
                            {/* Use currentBooks which is derived from state */ }
                            {!isLoading && currentBooks.length > 0 ? (
                                <div className="space-y-4">
                                    {/* Map over currentBooks */}
                                    {currentBooks.map((book) => {
                                        const bookId = book.id || book.bookId; // Use consistent ID
                                        const coverImageUrl = book.isbn13 ? `https://covers.openlibrary.org/b/isbn/${book.isbn13}-M.jpg` : (book.cover_id ? `https://covers.openlibrary.org/b/id/${book.cover_id}-M.jpg` : null);
                                        const isDropdownOpen = openDropdownId === bookId;
                                        const bookTitle = book.title || "Untitled";
                                        const bookAuthor = formatAuthors(book);

                                        return (
                                            // --- Book Item Card ---
                                            <div key={bookId} className="bg-white dark:bg-gray-900 p-4 md:p-5 rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
                                                <div className="flex flex-col md:flex-row gap-4">
                                                    {/* Cover */}
                                                    <div className="w-full md:w-32 h-48 bg-gray-200 dark:bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0 relative overflow-hidden transition-colors duration-300">
                                                        {coverImageUrl ? ( <img src={coverImageUrl} alt={`Cover of ${bookTitle}`} className="w-full h-full object-cover" onError={handleImageError} loading="lazy"/> ) : null }
                                                        <div className={`placeholder-icon-container absolute inset-0 items-center justify-center bg-gray-200 dark:bg-gray-800 ${coverImageUrl ? 'hidden' : 'flex'}`} style={coverImageUrl ? {display: 'none'} : {display: 'flex'}}>
                                                            <Book className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                                                        </div>
                                                    </div>
                                                    {/* Details */}
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-start">
                                                            {/* Info */}
                                                            <div>
                                                                <h3 onClick={() => handleViewDetails(bookId)} className="text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-200 mb-1 cursor-pointer hover:text-teal-600 dark:hover:text-teal-400 transition-colors duration-200">{bookTitle}</h3>
                                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">by {bookAuthor}</p>
                                                            </div>
                                                            {/* Actions */}
                                                            <div className="flex items-start gap-1 md:gap-2 flex-shrink-0 relative">
                                                                {/* Status Badge */}
                                                                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-xs transition-colors duration-300" title={statusText[book.readingStatus] || 'Unknown Status'}>
                                                                    {statusIcons[book.readingStatus] || <BookMarked className="h-5 w-5 text-gray-500"/>}
                                                                    <span className="hidden sm:inline">{statusText[book.readingStatus] || 'Unknown'}</span>
                                                                </div>
                                                                {/* Dropdown Trigger */}
                                                                <button id={`dropdown-trigger-${bookId}`} onClick={(e) => toggleDropdown(bookId, e)} disabled={isUpdating} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 disabled:opacity-50" aria-haspopup="true" aria-expanded={isDropdownOpen}>
                                                                    <MoreHorizontal className="h-5 w-5 text-gray-500" />
                                                                </button>
                                                                {/* --- Dropdown Menu  --- */}
                                                                {isDropdownOpen && (
                                                                    <div ref={dropdownRef} onClick={(e) => e.stopPropagation()} className="absolute right-0 mt-8 w-56 bg-white dark:bg-gray-900 rounded-lg shadow-lg z-20 border border-gray-200 dark:border-gray-700 overflow-y-auto max-h-80" role="menu" aria-orientation="vertical" aria-labelledby={`dropdown-trigger-${bookId}`}>
                                                                        <div className="py-1" role="none">
                                                                            {/* Edit Notes */}
                                                                            <button onClick={() => { setEditingBook(book); setOpenDropdownId(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center transition-colors duration-200" role="menuitem"> <Edit className="h-4 w-4 mr-2" /> Edit Notes </button>
                                                                            {/* Status */}
                                                                            <div className="px-4 pt-2 pb-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase" role="separator">Status</div>
                                                                            {Object.entries(statusText).map(([statusId, text]) => (
                                                                                <button key={statusId} onClick={() => handleUpdateReadingStatus(bookId, statusId)} disabled={isUpdating} className={`w-full text-left px-4 py-2 text-sm flex items-center ${book.readingStatus === statusId ? 'bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'} transition-colors duration-200 disabled:opacity-50`} role="menuitem"> {statusIcons[statusId]} <span className="ml-2">{text}</span> </button>
                                                                            ))}
                                                                            {/* Add to Shelf */}
                                                                            <div className="px-4 pt-2 pb-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase" role="separator">Add to Custom Shelf</div>
                                                                            {combinedShelves .filter(shelf => !["all", "want-to-read", "read", "favorites"].includes(shelf.id) && !book.customShelfIds?.includes(shelf.id)) .map(shelf => ( <button key={shelf.id} onClick={() => handleAddToShelf(bookId, shelf.id)} disabled={isUpdating} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center transition-colors duration-200 disabled:opacity-50" role="menuitem"> <Plus className="h-4 w-4 mr-2" /> {shelf.name} </button> ))}
                                                                            {combinedShelves.filter(shelf => !["all", "want-to-read", "read", "favorites"].includes(shelf.id) && !book.customShelfIds?.includes(shelf.id)).length === 0 && ( <div className="px-4 py-2 text-sm text-gray-400 italic">On all custom shelves</div> )}
                                                                             {/* Remove from Shelf */}
                                                                              <div className="px-4 pt-2 pb-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase" role="separator">Remove from Custom Shelf</div>
                                                                              {book.customShelfIds?.length > 0 ? combinedShelves .filter(shelf => book.customShelfIds.includes(shelf.id)) .map(shelf => ( <button key={shelf.id} onClick={() => handleRemoveFromCustomShelf(bookId, shelf.id)} disabled={isUpdating} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center transition-colors duration-200 disabled:opacity-50" role="menuitem"> <X className="h-4 w-4 mr-2" /> {shelf.name} </button> )) : <div className="px-4 py-2 text-sm text-gray-400 italic">Not on any custom shelves</div> }
                                                                            {/* Remove from Library */}
                                                                            <div className="border-t border-gray-200 dark:border-gray-700 mt-1 pt-1" role="separator"></div>
                                                                            <button onClick={() => handleRemoveBook(bookId, bookTitle)} disabled={isUpdating} className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center transition-colors duration-200 disabled:opacity-50" role="menuitem"> <Trash2 className="h-4 w-4 mr-2" /> Remove from Library </button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {/* Genre/Date */}
                                                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 items-center">
                                                            {book.genre && <span className="bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 px-2 py-0.5 rounded-md text-xs font-medium transition-colors duration-300">{book.genre}</span>}
                                                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">Added: {new Date(book.dateAdded || Date.now()).toLocaleDateString()}</span>
                                                        </div>
                                                        {/* Ratings */}
                                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3">
                                                            {/* User Rating */}
                                                            <div className="flex items-center">
                                                                <div className="text-sm text-gray-600 dark:text-gray-400 mr-2">My Rating:</div>
                                                                <div className="flex">
                                                                    {[1, 2, 3, 4, 5].map((star) => ( <button key={star} onClick={() => handleUpdateRating(bookId, star)} disabled={isUpdating} className="focus:outline-none p-0.5 disabled:opacity-50" title={`Rate ${star} star${star > 1 ? 's' : ''}`}> <Star className={`h-5 w-5 transition-colors duration-150 ${ (book.userRating || 0) >= star ? "text-yellow-400 fill-current" : "text-gray-300 dark:text-gray-600 hover:text-yellow-300" }`} /> </button> ))}
                                                                    {book.userRating && ( <button onClick={() => handleUpdateRating(bookId, null)} disabled={isUpdating} className="ml-1 focus:outline-none p-0.5 text-gray-400 hover:text-red-500 disabled:opacity-50" title="Clear rating"> <X className="h-4 w-4" /> </button> )}
                                                                </div>
                                                            </div>
                                                            {/* Community Rating */}
                                                            {book.rating > 0 && ( <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center" title="Community Rating"> <Star className="h-4 w-4 text-yellow-500 mr-1" /> <span>{book.rating.toFixed(1)} ({book.numRatings?.toLocaleString() || 0})</span> </div> )}
                                                        </div>
                                                        {/* Notes */}
                                                        {book.notes && ( <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors duration-300 max-h-28 overflow-y-auto"> <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex justify-between items-center"> Notes <button onClick={() => { setEditingBook(book); setOpenDropdownId(null); } } disabled={isUpdating} className="text-xs text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"><Edit className="h-3 w-3 inline mr-1"/>Edit</button> </div> <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">{book.notes}</p> </div> )}
                                                        {!book.notes && ( <button onClick={() => { setEditingBook({...book, notes: ''}); setOpenDropdownId(null); }} disabled={isUpdating} className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 disabled:opacity-50"> <Edit className="h-4 w-4" /> Add Notes </button> )}
                                                    </div>
                                                </div>
                                            </div>
                                            // --- End Book Item Card ---
                                        );
                                    })}
                                </div>
                            ) : (
                                /* Empty State  */
                                !isLoading && !error && (
                                     <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-md text-center transition-colors duration-300">
                                         {searchQuery || filterStatus ? (
                                             <div>
                                                 <p className="text-gray-700 dark:text-gray-300 text-lg mb-4">No books found matching filters in this shelf.</p>
                                                 <button onClick={() => { setSearchQuery(""); setFilterStatus(null); }} className="px-4 py-2 bg-teal-500 text-white rounded-full hover:bg-teal-600 transition-colors duration-300">Clear Filters/Search</button>
                                             </div>
                                         ) : activeShelfId !== 'all' && currentShelf.books.length === 0 ? (
                                             <div>
                                                 <p className="text-gray-700 dark:text-gray-300 text-lg mb-4">This shelf is empty.</p>
                                                 <p className="text-gray-600 dark:text-gray-400 mb-4">Add books using the menu on each book in the main list.</p>
                                             </div>
                                         ) : ( // Absolute empty state
                                             <div>
                                                 <BookOpen className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500 mb-4" />
                                                 <p className="text-gray-700 dark:text-gray-300 text-lg mb-4">Your library is empty.</p>
                                                 <p className="text-gray-600 dark:text-gray-400 mb-4">Add books from search!</p>
                                                 <Link href="/search" className="px-4 py-2 bg-teal-500 text-white rounded-full hover:bg-teal-600 transition-colors duration-300 inline-block">Browse Books</Link>
                                             </div>
                                         )}
                                     </div>
                                )
                            )}

                            {/* Pagination  */}
                            {/* Use validatedCurrentPage for display and disabling buttons */ }
                            {!isLoading && totalPages > 1 && (
                                <div className="flex justify-center mt-10">
                                    <div className="bg-white dark:bg-gray-900 rounded-full shadow-lg p-2 flex items-center space-x-4 transition-colors duration-300">
                                        <button onClick={goToPreviousPage} disabled={validatedCurrentPage === 0 || isUpdating} className="p-3 rounded-full bg-teal-500 dark:bg-teal-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-teal-600 dark:hover:bg-teal-500 transition-colors flex items-center" aria-label="Previous page">
                                            <ChevronLeft className="h-5 w-5" /><span className="ml-1 hidden sm:inline">Previous</span>
                                        </button>
                                        <div className="px-4 py-2"><span className="font-medium text-gray-700 dark:text-gray-300">Page {validatedCurrentPage + 1} of {totalPages}</span></div>
                                        <button onClick={goToNextPage} disabled={validatedCurrentPage >= totalPages - 1 || isUpdating} className="p-3 rounded-full bg-teal-500 dark:bg-teal-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-teal-600 dark:hover:bg-teal-500 transition-colors flex items-center" aria-label="Next page">
                                            <span className="mr-1 hidden sm:inline">Next</span><ChevronRight className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div> {/* End Main Content Area */}
                    </div> {/* End Flex container for sidebar+content */}
                </div> {/* End Max Width Container */}
            </main>

            {/* Edit Notes Modal  */}
            {editingBook && (
                 <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50" onClick={() => !isUpdating && setEditingBook(null)}>
                     <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full p-6 transition-colors duration-300" onClick={(e) => e.stopPropagation()}>
                         <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Edit Notes for "{editingBook.title}"</h3>
                         <textarea
                             value={editingBook.notes || ""}
                             onChange={(e) => setEditingBook(prev => prev ? { ...prev, notes: e.target.value } : null)} // Local update for typing
                             className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 min-h-[150px] transition-colors duration-300 focus:ring-2 focus:ring-teal-500"
                             placeholder="Add your notes about this book..."
                             autoFocus
                             disabled={isUpdating}
                         />
                         <div className="flex justify-end gap-3 mt-4">
                             <button onClick={() => setEditingBook(null)} disabled={isUpdating} className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors disabled:opacity-50">Cancel</button>
                             <button
                                 onClick={() => { if (editingBook) { handleUpdateNotes(editingBook.id || editingBook.bookId, editingBook.notes || ""); } }} // Use standardized ID
                                 disabled={isUpdating}
                                 className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                             >
                                 {isUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
                                 Save Notes
                             </button>
                         </div>
                     </div>
                 </div>
            )}

            {/* Animation Style */}
            <style jsx>{`
                @keyframes gradientShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
                .section-heading { animation: gradientShift 5s ease infinite; background-size: 200% 200%; }
            `}</style>
        </div> // End Root Container
    );
}