/**
 * Defines the main Navigation Bar component for the application.
 * Displays branding, navigation links, theme toggle, and user actions (login/logout),
 * adapting its content based on the user's authentication status managed by Zustand.
 */


"use client";

import { useState, useEffect } from "react";
import {
  Book,
  Search,
  Heart,
  LogOut,
  User,
  Moon,
  Sun,
  LayoutDashboard,
  LogIn, // <-- Import LogIn icon
} from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

// *** Import the COMBINED Zustand store hook ***
import { useAppStore } from "../app/store/appStore"; 

export default function NavigationBar() {
  const [darkMode, setDarkMode] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // --- Get state and actions from the COMBINED App store ---
  const {
    user,
    isLoggedIn,
    isLoadingAuth, // Use the specific loading flag for auth
    clearUser,
    lastDashboardPath, // Get dashboard path from the same store
  } = useAppStore();

  // Initialize dark mode from localStorage safely on the client
  useEffect(() => {
    // Ensure this runs only on the client
    if (typeof window !== "undefined") {
      const savedDarkMode = localStorage.getItem("darkMode") === "true";
      setDarkMode(savedDarkMode);
      // Apply class to the root element
      document.documentElement.classList.toggle("dark", savedDarkMode);
    }
  }, []); // Empty dependency array ensures it runs once on mount

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem("darkMode", String(newDarkMode));
    document.documentElement.classList.toggle("dark", newDarkMode);
  };

  // Updated Logout handler
  const handleLogout = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/auth/logout", {
        method: "POST",
        credentials: "include", // Important for session cookies
      });
      // Regardless of server response, clear user state and redirect
      if (!res.ok) {
        console.error("Logout request failed on server:", res.status);
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // *** Clear user state in the Zustand store ***
      clearUser();
      // Optionally reset the dashboard path in store on logout?
      // useAppStore.getState().setLastDashboardPath('/dashboard');
      // *** Redirect to the correct login page path ***
      router.push("/login");
    }
  };

  // Helper functions for active link styling
  const isActive = (href) => pathname === href;
  const isDashboardActive = () => pathname.startsWith("/dashboard");

  // Don't render anything meaningful until the auth status is loaded
  // This prevents flashing the wrong UI (e.g., showing Login briefly when logged in)
  if (isLoadingAuth) {
     return (
        <header className="fixed top-0 left-0 right-0 z-50 px-4 lg:px-6 h-16 flex items-center bg-white dark:bg-gray-900 shadow-lg">
             {/* Minimal header during auth load */}
             <div className="flex items-center justify-center mr-6">
                 <Book className="h-8 w-8 text-teal-600 dark:text-teal-400" />
                 <span className="ml-2 text-xl font-bold text-teal-600 dark:text-teal-400">
                     BookFinder
                 </span>
             </div>
             <div className="ml-auto flex items-center gap-3 sm:gap-4">
                {/* Placeholder for buttons */}
                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse hidden sm:block"></div>
             </div>
        </header>
     );
  }


  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 lg:px-6 h-16 flex items-center bg-white dark:bg-gray-900 shadow-lg transition-colors duration-300">
      {/* BookFinder logo links to home (or login if logged out) */}
      <Link
        className="flex items-center justify-center mr-6"
        href="/?view=home" 
      >
        <Book className="h-8 w-8 text-teal-600 dark:text-teal-400" />
        <span className="ml-2 text-xl font-bold text-teal-600 dark:text-teal-400">
          BookFinder
        </span>
      </Link>

      {/* Navigation items */}
      <nav className="ml-auto flex items-center gap-3 sm:gap-4">
        {/* --- Dark Mode Toggle (Always Visible) --- */}
        <button
          onClick={toggleDarkMode}
          className="text-gray-600 hover:text-teal-600 dark:text-gray-300 dark:hover:text-teal-400 transition-colors duration-200 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-600 focus:ring-offset-1 dark:focus:ring-offset-gray-900"
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {darkMode ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
        </button>

        {/* --- Logged-In User View --- */}
        {isLoggedIn && user && ( // Check if logged in AND user data exists
          <>
            {/* Dashboard Link */}
            <Link
              className={`p-1 rounded-full transition-colors duration-200 ${
                isDashboardActive()
                  ? "text-teal-600 bg-gray-100 dark:text-teal-400 dark:bg-gray-800"
                  : "text-gray-600 hover:text-teal-600 dark:text-gray-300 dark:hover:text-teal-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              href={lastDashboardPath || "/dashboard"}
              aria-current={isDashboardActive() ? "page" : undefined}
              title="Dashboard"
            >
              <LayoutDashboard className="h-6 w-6" />
              <span className="sr-only">Dashboard</span>
            </Link>

            {/* Wishlist Link */}
            <Link
              className={`p-1 rounded-full transition-colors duration-200 ${
                isActive("/wishlist")
                  ? "text-teal-600 bg-gray-100 dark:text-teal-400 dark:bg-gray-800"
                  : "text-gray-600 hover:text-teal-600 dark:text-gray-300 dark:hover:text-teal-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              href="/wishlist"
              aria-current={isActive("/wishlist") ? "page" : undefined}
              title="Wishlist"
            >
              <Heart className="h-6 w-6" />
              <span className="sr-only">Wishlist</span>
            </Link>

            {/* Search Link */}
            <Link
              className={`p-1 rounded-full transition-colors duration-200 ${
                isActive("/search")
                  ? "text-teal-600 bg-gray-100 dark:text-teal-400 dark:bg-gray-800"
                  : "text-gray-600 hover:text-teal-600 dark:text-gray-300 dark:hover:text-teal-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              href="/search"
              aria-current={isActive("/search") ? "page" : undefined}
              title="Search Books"
            >
              <Search className="h-6 w-6" />
              <span className="sr-only">Search</span>
            </Link>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="text-gray-600 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400 transition-colors duration-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-600 focus:ring-offset-1 dark:focus:ring-offset-gray-900"
              aria-label="Logout"
              title="Logout"
            >
              <LogOut className="h-6 w-6" />
              <span className="sr-only">Logout</span>
            </button>

            {/* Username Display */}
            <div
              className="hidden sm:flex items-center gap-2 bg-teal-50 dark:bg-teal-900/60 rounded-full px-3 py-1 transition-colors duration-200 cursor-default"
              title={`Logged in as ${user.username}`}
            >
              <User className="h-5 w-5 text-teal-600 dark:text-teal-400 flex-shrink-0" />
              <span className="text-sm font-medium text-teal-600 dark:text-teal-400 truncate">
                {/* *** Display the actual username *** */}
                {user.username}
              </span>
            </div>
          </>
        )}

        {/* --- Logged-Out User View --- */}
        {!isLoggedIn && ( // Show only if not logged in (isLoadingAuth handled above)
          <Link
            href="/login"
            className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-teal-600 dark:text-gray-300 dark:hover:text-teal-400 transition-colors duration-200 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-600 focus:ring-offset-1 dark:focus:ring-offset-gray-900"
            title="Login"
          >
            <LogIn className="h-5 w-5" />
            Login
          </Link>
        )}
      </nav>
    </header>
  );
}