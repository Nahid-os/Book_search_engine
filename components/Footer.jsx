import React from 'react';

const Footer = () => (
  <footer className="bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 transition-all duration-300 mt-12">
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-3 gap-8">
        <div>
          <h3 className="text-lg font-semibold mb-4">About Us</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Book Search Engine is your gateway to millions of books. Discover, explore, and find your next great read.</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
          <ul className="space-y-2">
            <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300">Home</a></li>
            <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300">Search</a></li>
            <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300">Categories</a></li>
            <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300">About Us</a></li>
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Email: info@booksearchengine.com</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Phone: (123) 456-7890</p>
        </div>
      </div>
      <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">&copy; 2024 Book Search Engine. All rights reserved.</p>
      </div>
    </div>
  </footer>
);

export default Footer;
