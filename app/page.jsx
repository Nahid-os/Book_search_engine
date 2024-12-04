// page.jsx
"use client";
import React, { useState, useEffect } from 'react';
import NavigationBar from '../components/NavigationBar.jsx';
import SearchBar from '../components/SearchBar.jsx';
import SkeletonLoader from '../components/SkeletonLoader.jsx';
import FilterSidebar from '../components/FilterSidebar.jsx';
import BookCard from '../components/BookCard.jsx';
import HeroSection from '../components/HeroSection.jsx';
import FeaturedSection from '../components/FeaturedSection.jsx';
import Footer from '../components/Footer.jsx';

export default function BookSearchEngine() {
  const [isSearchView, setIsSearchView] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [books, setBooks] = useState([]);
  const [activeTab, setActiveTab] = useState('trending');
  const [expandedFilters, setExpandedFilters] = useState({});

  useEffect(() => {
    if (!isSearchView) {
      fetchTrendingBooks();
    }
  }, [isSearchView]);

  const fetchTrendingBooks = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/trending-books');
      if (response.ok) {
        const data = await response.json();
        setBooks(data);
      } else {
        console.error('Failed to fetch trending books');
      }
    } catch (error) {
      console.error('Error fetching trending books:', error);
    }
    setIsLoading(false);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery) return;

    setIsSearchView(true);
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/search-books?title=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setBooks(data);
      } else {
        console.error('Failed to fetch search results');
      }
    } catch (error) {
      console.error('Error fetching search results:', error);
    }
    setIsLoading(false);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const toggleFilter = (filter) => {
    setExpandedFilters(prev => ({ ...prev, [filter]: !prev[filter] }));
  };

  return (
    <div className={`min-h-screen flex flex-col bg-blue-50 dark:bg-gray-900 text-gray-700 dark:text-gray-200 transition-colors duration-300 ${isDarkMode ? 'dark' : ''}`}>
      <NavigationBar isDarkMode={isDarkMode} toggleTheme={toggleTheme} setIsSearchView={setIsSearchView} />

      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {isSearchView ? (
            <>
              <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} handleSearch={handleSearch} />
              <div className="flex space-x-8">
                <FilterSidebar expandedFilters={expandedFilters} toggleFilter={toggleFilter} />

                <div className="flex-grow space-y-6">
                  {isLoading ? (
                    Array(3).fill(null).map((_, index) => (
                      <div key={index} className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-750 rounded-lg shadow-md p-6 transition-all duration-300">
                        <SkeletonLoader />
                      </div>
                    ))
                  ) : (
                    books.map((book, index) => (
                      <BookCard
                        key={index}
                        title={book.title || "Untitled"}
                        author={book.authors || "Author"}
                        average_rating={book.average_rating}
                        ratings_count={book.ratings_count}
                        description={
                          book.description
                            ? `${book.description.slice(0, 150)}...`
                            : "A captivating story that you'll enjoy."
                        }
                      />
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <HeroSection />
              <FeaturedSection />

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md transition-all duration-300">
                <div className="border-b border-gray-200 dark:border-gray-700">
                  <nav className="flex">
                    <button
                      onClick={() => setActiveTab('trending')}
                      className={`px-6 py-3 text-sm font-medium transition-colors duration-300 ${
                        activeTab === 'trending'
                          ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      Trending Books
                    </button>
                    <button
                      onClick={() => setActiveTab('recommended')}
                      className={`px-6 py-3 text-sm font-medium transition-colors duration-300 ${
                        activeTab === 'recommended'
                          ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      Recommended for You
                    </button>
                  </nav>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-3 gap-6">
                    {isLoading ? (
                      Array(6).fill(null).map((_, index) => (
                        <div key={index} className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-750 rounded-lg shadow-md p-6 transition-all duration-300">
                          <SkeletonLoader />
                        </div>
                      ))
                    ) : (
                      books.map((book, index) => (
                        <BookCard
                          key={index}
                          title={book.title || "Untitled"}
                          author={book.authors || "Author"}
                          average_rating={book.average_rating}
                          ratings_count={book.ratings_count}
                          description={
                            book.description
                              ? `${book.description.slice(0, 150)}...`
                              : "A captivating story that you'll enjoy."
                          }
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
