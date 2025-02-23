// NavigationBar.jsx
import React from 'react';
import { Home, Search, BookmarkPlus, User, Sun, Moon } from 'lucide-react';
import Link from 'next/link';

const NavigationBar = ({ isDarkMode, toggleTheme, setIsSearchView }) => (
  <header className="bg-white dark:bg-gray-800 shadow-md transition-all duration-300">
    <div className="max-w-7xl mx-auto px-4 py-4">
      <nav className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button onClick={() => setIsSearchView(false)} className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 flex items-center transition-colors duration-300">
            <Home className="h-5 w-5 mr-2" /> Home
          </button>
          <button onClick={() => setIsSearchView(true)} className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 flex items-center transition-colors duration-300">
            <Search className="h-5 w-5 mr-2" /> Search
          </button>
          <button className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 flex items-center transition-colors duration-300">
            <BookmarkPlus className="h-5 w-5 mr-2" /> Wishlist
          </button>
        </div>
        <div className="flex items-center space-x-4">
          <button onClick={toggleTheme} className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors duration-300">
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <Link href="/login">
            <button className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 flex items-center transition-colors duration-300">
              <User className="h-5 w-5 mr-2" /> Login / Sign Up
            </button>
          </Link>
        </div>
      </nav>
    </div>
  </header>
);

export default NavigationBar;
