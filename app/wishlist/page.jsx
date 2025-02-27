// app/wishlist/page.jsx
"use client";

import { useState, useEffect } from "react";
import NavigationBar from "../../components/NavigationBar";
import Footer from "../../components/Footer";
import BookCard from "../../components/BookCard";
import SkeletonLoader from "../../components/SkeletonLoader";

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchWishlist() {
      try {
        const res = await fetch("http://localhost:3001/api/wishlist", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setWishlist(data.wishlist);
        } else {
          console.error("Failed to fetch wishlist");
        }
      } catch (error) {
        console.error("Error fetching wishlist:", error);
      }
      setIsLoading(false);
    }
    fetchWishlist();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      <NavigationBar />
      <main className="container mx-auto px-4 py-8 flex-grow">
        <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">
          My Wishlist
        </h1>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(3)
              .fill(null)
              .map((_, index) => (
                <div key={index} className="bg-white rounded shadow p-4">
                  <SkeletonLoader />
                </div>
              ))}
          </div>
        ) : wishlist.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlist.map((book, index) => (
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
          <p className="text-gray-600">Your wishlist is empty.</p>
        )}
      </main>
      <Footer />
    </div>
  );
}
