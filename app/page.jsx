"use client"; // Need this for useState and useRouter hooks

import { useState } from "react"; // Import useState
import { useRouter } from "next/navigation"; // Import useRouter
import { Search } from "lucide-react";
import Link from "next/link";
import { BookQuotes } from "./book-quotes"; 
import { FeatureCarousel } from "./feature-carousel"; 
export default function HomePage() {
  // --- State for the search input ---
  const [searchQuery, setSearchQuery] = useState("");
  // --- Router instance for navigation ---
  const router = useRouter();

  // --- Handler for input changes ---
  const handleSearchInputChange = (event) => {
    setSearchQuery(event.target.value);
  };

  // --- Handler for form submission ---
  const handleSearchSubmit = (event) => {
    event.preventDefault(); // Prevent default form submission (page reload)
    const trimmedQuery = searchQuery.trim(); // Remove leading/trailing whitespace

    if (trimmedQuery) {
      // Encode the query to make it URL-safe
      const encodedQuery = encodeURIComponent(trimmedQuery);
      // Redirect to the search page with the query parameter 'q'
      router.push(`/search?q=${encodedQuery}`);
    } else {
      // Optional: Handle empty search submission (e.g., do nothing, show message, focus input)
      console.log("Search query is empty.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-teal-50 to-blue-50 dark:from-teal-950 dark:to-blue-950">
      {/* Header/Footer are handled by LayoutClient */}

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-blue-600 dark:from-teal-400 dark:to-blue-400">
                  Discover Your Next Great Read
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-700 md:text-xl dark:text-gray-300">
                  Search millions of books, read reviews, and find your perfect match.
                  Start your literary journey today.
                </p>
              </div>
              {/* --- Updated Search Form --- */}
              <div className="w-full max-w-sm space-y-2">
                {/* Attach the onSubmit handler to the form */}
                <form onSubmit={handleSearchSubmit} className="flex space-x-2">
                  <input
                    className="flex h-10 w-full rounded-md border border-teal-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-teal-700 dark:bg-gray-800 dark:text-gray-50 dark:focus:ring-teal-400 dark:focus:ring-offset-gray-900"
                    placeholder="Search for books..."
                    type="search" // Use type="search" for better semantics
                    aria-label="Search for books"
                    value={searchQuery} // Bind input value to state
                    onChange={handleSearchInputChange} // Update state on change
                  />
                  <button
                    type="submit" // Default type for button inside form
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 dark:hover:bg-teal-800 dark:hover:text-gray-100 disabled:opacity-50 dark:focus:ring-teal-400 disabled:pointer-events-none dark:focus:ring-offset-gray-900 bg-teal-600 text-white hover:bg-teal-700 h-10 py-2 px-4"
                  >
                    <Search className="mr-2 h-4 w-4" />
                    Search
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* Book Quotes Section */}
        <section className="w-full py-16 bg-gradient-to-r from-teal-200 to-blue-200 dark:from-teal-800 dark:to-blue-800">
          <BookQuotes />
        </section>

        {/* Features Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-white dark:bg-gray-800">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold tracking-tighter md:text-3xl text-teal-800 dark:text-teal-200">
                Why Choose BookFinder
              </h2>
              <p className="mx-auto max-w-[600px] mt-2 text-gray-700 dark:text-gray-300">
                Discover the features that make our platform stand out.
              </p>
            </div>
            <FeatureCarousel />
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-blue-100 to-teal-100 dark:from-blue-900 dark:to-teal-900">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl text-teal-800 dark:text-teal-200">
                  Start Your Reading Adventure
                </h2>
                <p className="mx-auto max-w-[600px] text-gray-700 md:text-xl lg:text-base xl:text-xl dark:text-gray-300">
                  Join thousands of readers who have found their favorite books through BookFinder.
                </p>
              </div>
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 dark:hover:bg-teal-800 dark:hover:text-gray-100 disabled:opacity-50 dark:focus:ring-teal-400 disabled:pointer-events-none dark:focus:ring-offset-gray-900 bg-teal-600 text-white hover:bg-teal-700 h-10 py-2 px-4 w-auto sm:w-[200px]"
              >
                Sign Up Now
              </Link>
            </div>
          </div>
        </section>
      </main>
      {/* Footer is handled by LayoutClient */}
    </div>
  );
}