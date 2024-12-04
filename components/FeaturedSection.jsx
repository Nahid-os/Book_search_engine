import React from 'react';
import { TrendingUp, BookOpen, BookmarkPlus } from 'lucide-react';

const FeaturedSection = () => (
  <div className="grid grid-cols-3 gap-8 mb-12">
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-all duration-300 hover:shadow-lg">
      <TrendingUp className="h-12 w-12 text-blue-500 mb-4" />
      <h2 className="text-2xl font-semibold mb-2">Trending Now</h2>
      <p className="text-gray-600 dark:text-gray-400">Discover the hottest books everyone's talking about</p>
    </div>
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-all duration-300 hover:shadow-lg">
      <BookOpen className="h-12 w-12 text-green-500 mb-4" />
      <h2 className="text-2xl font-semibold mb-2">Recommended for You</h2>
      <p className="text-gray-600 dark:text-gray-400">Personalized book suggestions based on your interests</p>
    </div>
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-all duration-300 hover:shadow-lg">
      <BookmarkPlus className="h-12 w-12 text-purple-500 mb-4" />
      <h2 className="text-2xl font-semibold mb-2">Genres</h2>
      <p className="text-gray-600 dark:text-gray-400">Explore books by your favorite genres and categories</p>
    </div>
  </div>
);

export default FeaturedSection;
