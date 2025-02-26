// NavigationBar.jsx
"use client";

import React, { useEffect, useState } from "react";
import { Home, Search, BookmarkPlus, User, Sun, Moon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const NavigationBar = ({ isDarkMode, toggleTheme, setIsSearchView }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function checkAuthStatus() {
      try {
        const res = await fetch("http://localhost:3001/api/auth/status", {
          credentials: "include",
        });
        const data = await res.json();
        console.log("Auth status:", data);
        setIsLoggedIn(data.loggedIn);
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
        setIsLoggedIn(false);
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
            <button
              onClick={() => setIsSearchView(false)}
              className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 flex items-center transition-colors duration-300"
            >
              <Home className="h-5 w-5 mr-2" /> Home
            </button>
            <button
              onClick={() => setIsSearchView(true)}
              className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 flex items-center transition-colors duration-300"
            >
              <Search className="h-5 w-5 mr-2" /> Search
            </button>
            <button className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 flex items-center transition-colors duration-300">
              <BookmarkPlus className="h-5 w-5 mr-2" /> Wishlist
            </button>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors duration-300"
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 flex items-center transition-colors duration-300"
              >
                Logout
              </button>
            ) : (
              <Link href="/login">
                <button className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 flex items-center transition-colors duration-300">
                  <User className="h-5 w-5 mr-2" /> Login / Sign Up
                </button>
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default NavigationBar;
