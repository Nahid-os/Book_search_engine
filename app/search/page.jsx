// app/search/page.jsx
"use client";

import { useState } from "react";
import SearchBar from "../../components/SearchBar";
import BookCard from "../../components/BookCard";

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery) return;
    setIsLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3001/api/search-books?title=${encodeURIComponent(searchQuery)}`
      );
      if (response.ok) {
        const data = await response.json();
        setBooks(data);
      } else {
        console.error("Failed to fetch search results", response.status);
      }
    } catch (error) {
      console.error("Error fetching search results:", error);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
      <main className="container mx-auto px-4 py-8 flex-grow">
        <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">
          Search Books
        </h1>
        <SearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          handleSearch={handleSearch}
        />
        {isLoading ? (
          <p className="text-center text-gray-600 dark:text-gray-300">Loading...</p>
        ) : books.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((book, index) => (
              <BookCard
                key={index}
                bookId={book.book_id}
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
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-600 dark:text-gray-300">
            No results found. Try a different search.
          </p>
        )}
      </main>
    </div>
  );
}
