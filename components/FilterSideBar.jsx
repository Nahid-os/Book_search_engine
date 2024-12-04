import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const FilterSidebar = ({ expandedFilters, toggleFilter }) => (
  <div className="w-64 flex-shrink-0">
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 transition-all duration-300 sticky top-4">
      <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Filters</h2>
      <div className="space-y-4">
        {['Genre', 'Rating', 'Publication Year'].map((filter) => (
          <div key={filter} className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <button onClick={() => toggleFilter(filter)} className="flex justify-between items-center w-full text-left focus:outline-none">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{filter}</span>
              {expandedFilters[filter] ? <ChevronUp className="h-4 w-4 text-gray-500 dark:text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />}
            </button>
            {expandedFilters[filter] && (
              <div className="mt-2 space-y-2">
                {/* Filter options like Genre checkboxes, Rating slider, etc. */}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default FilterSidebar;
