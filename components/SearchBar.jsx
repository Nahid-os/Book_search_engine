import React from 'react';

const SearchBar = ({ searchQuery, setSearchQuery, handleSearch }) => (
  <form onSubmit={handleSearch} className="mb-8">
    <div className="flex max-w-3xl mx-auto">
      <input
        type="text"
        placeholder="Search for books..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="flex-grow rounded-l-full border-2 border-blue-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-500 focus:border-transparent placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-300 py-3 px-6 text-lg"
      />
      <button type="submit" className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3 rounded-r-full transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 shadow-md text-lg font-semibold">
        Search
      </button>
    </div>
  </form>
);

export default SearchBar;

