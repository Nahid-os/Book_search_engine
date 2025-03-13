"use client";

import React, { useEffect } from "react";
import { Home, Search, BookmarkPlus, User, Sun, Moon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const NavigationBar = ({ isDarkMode, toggleTheme }) => {
  const router = useRouter();

  // Check auth status (optional, kept for logging purposes)
  useEffect(() => {
    async function checkAuthStatus() {
      try {
        const res = await fetch("http://localhost:3001/api/auth/status", {
          credentials: "include",
        });
        const data = await res.json();
        console.log("Auth status:", data);
      } catch (error) {
        console.error("Error checking auth status:", error);
      }
    }
    checkAuthStatus();
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        router.push("/login");
      } else {
        console.error("Logout failed");
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <nav className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 flex items-center transition-colors duration-300"
              prefetch
            >
              <Home className="h-5 w-5 mr-2" /> Home
            </Link>
            <Link
              href="/search"
              className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 flex items-center transition-colors duration-300"
              prefetch
            >
              <Search className="h-5 w-5 mr-2" /> Search
            </Link>
            <Link
              href="/wishlist"
              className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 flex items-center transition-colors duration-300"
              prefetch
            >
              <BookmarkPlus className="h-5 w-5 mr-2" /> Wishlist
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {typeof toggleTheme === "function" && (
              <button
                onClick={toggleTheme}
                className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors duration-300"
                aria-label="Toggle Theme"
              >
                {isDarkMode ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </button>
            )}
            <button
              onClick={handleLogout}
              className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 flex items-center transition-colors duration-300"
            >
              Logout
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default NavigationBar;
