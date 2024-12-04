import React from 'react';

const SkeletonLoader = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-8 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
    <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded"></div>
    <div className="h-4 w-1/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
  </div>
);

export default SkeletonLoader;
