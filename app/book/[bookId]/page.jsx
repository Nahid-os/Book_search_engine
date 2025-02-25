"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Heart, Share2, Star } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

export default function BookDetails() {
  const { bookId } = useParams();
  const router = useRouter();
  const [book, setBook] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchBookDetails() {
      try {
        const res = await fetch(`http://localhost:3001/api/books/${bookId}`);
        if (!res.ok) {
          throw new Error("Failed to fetch book details");
        }
        const data = await res.json();
        setBook(data);
      } catch (error) {
        console.error(error);
      }
      setIsLoading(false);
    }
    fetchBookDetails();
  }, [bookId]);

  if (isLoading) {
    return <div className="p-4">Loading book details...</div>;
  }

  if (!book) {
    return <div className="p-4">Book not found.</div>;
  }

  return (
    <div className="bg-gradient-to-b from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900">
      <main className="container mx-auto px-4 py-8">
        <Link
          href="/"
          className="inline-flex items-center text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 mb-6"
        >
          <ChevronLeft className="h-5 w-5 mr-1" />
          Back
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-gray-200">
            {book.title || "Untitled Book"}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-4">
            By {book.authors || "Unknown Author"}
          </p>

          <div className="flex items-center mb-4">
            <div className="flex mr-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-6 w-6 ${
                    i < Math.round(book.average_rating)
                      ? "text-yellow-500"
                      : "text-gray-300 dark:text-gray-600"
                  }`}
                />
              ))}
            </div>
            <span className="text-gray-600 dark:text-gray-300">
              ({book.average_rating} - {book.ratings_count} ratings)
            </span>
          </div>

          <div className="flex flex-wrap gap-4 mb-6">
            {/* Example genre tags – adjust or remove if you have dynamic genres */}
            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm dark:bg-purple-900 dark:text-purple-200">
              Fantasy
            </span>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm dark:bg-blue-900 dark:text-blue-200">
              Adventure
            </span>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm dark:bg-green-900 dark:text-green-200">
              Young Adult
            </span>
          </div>

          <p className="text-gray-700 dark:text-gray-300 mb-6">
            {book.description || "No description available."}
          </p>

          {/* Display Additional Fields */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <h2 className="font-semibold text-gray-700 dark:text-gray-300">Publisher</h2>
              <p className="text-gray-600 dark:text-gray-400">{book.publisher || "Unknown Publisher"}</p>
            </div>
            <div>
              <h2 className="font-semibold text-gray-700 dark:text-gray-300">Publication Year</h2>
              <p className="text-gray-600 dark:text-gray-400">{book.publication_year || "Unknown Date"}</p>
            </div>
            <div>
              <h2 className="font-semibold text-gray-700 dark:text-gray-300">Pages</h2>
              <p className="text-gray-600 dark:text-gray-400">{book.num_pages || "N/A"}</p>
            </div>
            <div>
              <h2 className="font-semibold text-gray-700 dark:text-gray-300">ISBN-13</h2>
              <p className="text-gray-600 dark:text-gray-400">{book.isbn13 || "N/A"}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <button className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors dark:bg-purple-700 dark:hover:bg-purple-600">
              Add to Reading List
            </button>
            <button className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors dark:bg-pink-700 dark:hover:bg-pink-600">
              <Heart className="h-5 w-5 inline-block mr-2" />
              Add to Favorites
            </button>
            <button className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
              <Share2 className="h-5 w-5 inline-block mr-2" />
              Share
            </button>
          </div>
        </div>

        {/* Example "Similar Books" section – remove or adjust as needed */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">Similar Books</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, index) => (
              <Link href={`/book/${index + 2}`} key={index} className="block group">
                <div className="bg-purple-50 dark:bg-purple-900 p-4 rounded-lg transition-colors group-hover:bg-purple-100 dark:group-hover:bg-purple-800">
                  <h3 className="font-semibold text-lg mb-2 text-purple-800 dark:text-purple-200 group-hover:text-purple-900 dark:group-hover:text-purple-100">
                    The Dreamweaver&apos;s Tapestry
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">By Elara Moonwhisper</p>
                  <div className="flex items-center mb-2">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <Star className="h-4 w-4 text-gray-300 dark:text-gray-600" />
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">(4.2)</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    A mesmerizing tale of a young weaver who discovers her tapestries can alter reality...
                  </p>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-6 flex justify-between items-center">
            <button className="flex items-center text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300">
              <ChevronLeft className="h-5 w-5 mr-1" />
              Previous
            </button>
            <button className="flex items-center text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300">
              Next
              <ChevronRight className="h-5 w-5 ml-1" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
