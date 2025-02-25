"use client";
import React, { useEffect, useState } from "react";
import NavigationBar from "../components/NavigationBar";
import SearchBar from "../components/SearchBar";
import SkeletonLoader from "../components/SkeletonLoader";
import FilterSidebar from "../components/FilterSidebar";
import BookCard from "../components/BookCard";
import HeroSection from "../components/HeroSection";
import FeaturedSection from "../components/FeaturedSection";
import Footer from "../components/Footer";

export default function BookSearchEngine() {
  const [isSearchView, setIsSearchView] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [books, setBooks] = useState([]);
  const [activeTab, setActiveTab] = useState("trending");
  const [expandedFilters, setExpandedFilters] = useState({});

  useEffect(() => {
    if (!isSearchView) {
      fetchTrendingBooks();
    }
  }, [isSearchView]);

  const fetchTrendingBooks = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:3001/api/trending-books");
      if (response.ok) {
        const data = await response.json();
        setBooks(data);
      } else {
        console.error("Failed to fetch trending books");
      }
    } catch (error) {
      console.error("Error fetching trending books:", error);
    }
    setIsLoading(false);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery) return;
    setIsSearchView(true);
    setIsLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3001/api/search-books?title=${encodeURIComponent(searchQuery)}`
      );
      if (response.ok) {
        const data = await response.json();
        setBooks(data);
      } else {
        console.error("Failed to fetch search results");
      }
    } catch (error) {
      console.error("Error fetching search results:", error);
    }
    setIsLoading(false);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const toggleFilter = (filter) => {
    setExpandedFilters((prev) => ({ ...prev, [filter]: !prev[filter] }));
  };

  // Helper function to render BookCards or skeleton loaders
  const renderBooks = (maxDescLength) => {
    if (isLoading) {
      return Array(3)
        .fill(null)
        .map((_, index) => (
          <div
            key={index}
            className="bg-white/80 dark:bg-gray-800/80 rounded-lg shadow-md p-6 transition-all duration-300"
          >
            <SkeletonLoader />
          </div>
        ));
    } else {
      return books.map((book, index) => (
        <BookCard
          key={index}
          bookId={book.book_id}
          title={book.title || "Untitled"}
          author={book.authors || "Author"}
          average_rating={book.average_rating}
          ratings_count={book.ratings_count}
          description={
            book.description
              ? `${book.description.slice(0, maxDescLength)}...`
              : "A captivating story that you'll enjoy."
          }
        />
      ));
    }
  };

  return (
    // Match the same gradient as Book Details: from-purple-100 to-pink-100
    <div
      className={`min-h-screen flex flex-col bg-gradient-to-b from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 ${
        isDarkMode ? "dark" : ""
      }`}
    >
      <NavigationBar
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        setIsSearchView={setIsSearchView}
      />

      <main className="container mx-auto px-4 py-8 flex-grow">
        {isSearchView ? (
          <>
            <SearchBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              handleSearch={handleSearch}
            />
            <div className="flex space-x-8">
              <FilterSidebar
                expandedFilters={expandedFilters}
                toggleFilter={toggleFilter}
              />
              <div className="flex-grow space-y-6">{renderBooks(200)}</div>
            </div>
          </>
        ) : (
          <>
            <HeroSection />
            <FeaturedSection />
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md transition-all duration-300 mt-6">
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex">
                  <button
                    onClick={() => setActiveTab("trending")}
                    className={`px-6 py-3 text-sm font-medium transition-colors duration-300 ${
                      activeTab === "trending"
                        ? "text-pink-600 dark:text-pink-300 border-b-2 border-pink-600 dark:border-pink-300"
                        : "text-gray-500 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-300"
                    }`}
                  >
                    Trending Books
                  </button>
                  <button
                    onClick={() => setActiveTab("recommended")}
                    className={`px-6 py-3 text-sm font-medium transition-colors duration-300 ${
                      activeTab === "recommended"
                        ? "text-pink-600 dark:text-pink-300 border-b-2 border-pink-600 dark:border-pink-300"
                        : "text-gray-500 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-300"
                    }`}
                  >
                    Recommended for You
                  </button>
                </nav>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {renderBooks(150)}
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
