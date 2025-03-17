// app/page.jsx
"use client";

import React, { useEffect, useState } from "react";
import SkeletonLoader from "../components/SkeletonLoader";
import FilterSidebar from "../components/FilterSidebar";
import BookCard from "../components/BookCard";
import HeroSection from "../components/HeroSection";
import FeaturedSection from "../components/FeaturedSection";

export default function BookSearchEngine() {
  const [isLoading, setIsLoading] = useState(true);
  const [books, setBooks] = useState([]);
  const [activeTab, setActiveTab] = useState("trending");
  const [expandedFilters, setExpandedFilters] = useState({});
  const [user, setUser] = useState(null);

  // On mount, fetch authentication status to automatically retrieve the logged-in user
  useEffect(() => {
    fetch("http://localhost:3001/api/auth/status", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.loggedIn) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      })
      .catch((error) =>
        console.error("Error fetching auth status:", error)
      );
  }, []);

  // Fetch trending books on initial load
  useEffect(() => {
    fetchTrendingBooks();
  }, []);

  // Function to fetch trending books
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

  // Function to fetch recommended books using the logged-in user's id
  const fetchRecommendedBooks = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:3001/api/recommendations", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        // data only has { recommendations: [...] }
        setBooks(data.recommendations);
      } else {
        console.error("Failed to fetch recommended books");
      }
    } catch (error) {
      console.error("Error fetching recommended books:", error);
    }
    setIsLoading(false);
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
          bookId={book.book_id || book._id} // Use either book_id or _id as the unique identifier
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
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-pink-100 dark:from-gray-900 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <HeroSection />
        <FeaturedSection />
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md transition-all duration-300 mt-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex">
              <button
                onClick={() => {
                  setActiveTab("trending");
                  fetchTrendingBooks();
                }}
                className={`px-6 py-3 text-sm font-medium transition-colors duration-300 ${
                  activeTab === "trending"
                    ? "text-pink-600 dark:text-pink-300 border-b-2 border-pink-600 dark:border-pink-300"
                    : "text-gray-500 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-300"
                }`}
              >
                Trending Books
              </button>
              <button
                onClick={() => {
                  setActiveTab("recommended");
                  fetchRecommendedBooks();
                }}
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
      </div>
    </div>
  );
}
