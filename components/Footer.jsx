/**
 * Defines the shared Footer component for the application.
 * Displays copyright information and links to external profiles (e.g., GitHub, LinkedIn).
 */

"use client"; // Marks this as a Next.js Client Component

import React from "react";
import Link from "next/link"; // Next.js component for client-side navigation/linking
import { Github, Linkedin } from "lucide-react"; // Icons for social links

/**
 * Renders the application footer.
 * Includes copyright notice and links to external sites.
 * @returns {JSX.Element} The footer component.
 */
const Footer = () => (
  // Footer container with padding, background color (supports dark mode), shadow, and transitions
  <footer className="py-6 bg-white dark:bg-gray-900 shadow-lg transition-colors duration-300">
    {/* Centered content container with max-width and padding */}
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
      {/* Flex layout for arranging content, responsive direction change */}
      <div className="flex flex-col sm:flex-row justify-between items-center">
        {/* Copyright text */}
        <p className="text-sm text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} Book Recommendation System. All rights reserved. {/* Dynamic year */}
        </p>
        {/* Navigation links container */}
        <nav className="flex gap-6 mt-4 sm:mt-0">
          {/* Link to GitHub repository */}
          <Link
            href="https://github.com/Nahid-os/Book_search_engine" 
            target="_blank" // Opens link in a new tab
            rel="noopener noreferrer" // Security best practice for target="_blank"
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-teal-600 dark:text-gray-400 dark:hover:text-teal-400 transition-colors duration-200"
            aria-label="View source code on GitHub"
          >
            <Github className="h-5 w-5" />
            GitHub
          </Link>
          {/* Link to LinkedIn profile */}
          <Link
            href="https://www.linkedin.com/in/nahid-001-nayan/" 
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-teal-600 dark:text-gray-400 dark:hover:text-teal-400 transition-colors duration-200"
            aria-label="View LinkedIn profile"
          >
            <Linkedin className="h-5 w-5" />
            LinkedIn
          </Link>
        </nav>
      </div>
    </div>
  </footer>
);

export default Footer;