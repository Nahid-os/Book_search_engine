/**
 * Footer component for the BookFinder application.
 * Provides company information, navigation links, social media connections,
 * and copyright information in a responsive layout.
 */

"use client"

import Link from "next/link"
import { Github, Linkedin, Facebook, Instagram, Twitter, Mail, Phone, MapPin, ArrowRight } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-gradient-to-r from-teal-50 to-blue-50 dark:from-teal-950 dark:to-blue-950 shadow-lg transition-colors duration-300">
      {/* Main footer content section */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Company information section with logo and contact details */}
          <div>
            <div className="flex items-center mb-4">
              <span className="text-2xl font-bold text-teal-600 dark:text-teal-400">BookFinder</span>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Discover your next great read with our personalized book recommendation system.
            </p>
            {/* Contact information with icons */}
            <div className="space-y-2">
              {/* Physical address */}
              <div className="flex items-center text-gray-600 dark:text-gray-300">
                <MapPin className="h-5 w-5 mr-2 text-teal-600 dark:text-teal-400" />
                <span>123 Reading Lane, Bookville, BK 12345</span>
              </div>
              {/* Phone number */}
              <div className="flex items-center text-gray-600 dark:text-gray-300">
                <Phone className="h-5 w-5 mr-2 text-teal-600 dark:text-teal-400" />
                <span>(555) 123-4567</span>
              </div>
              {/* Email address */}
              <div className="flex items-center text-gray-600 dark:text-gray-300">
                <Mail className="h-5 w-5 mr-2 text-teal-600 dark:text-teal-400" />
                <span>contact@bookfinder.example</span>
              </div>
            </div>
          </div>

          {/* Quick links navigation section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {/* Home page link */}
              <li>
                <Link
                  href="/?view=home"
                  className="text-gray-600 hover:text-teal-600 dark:text-gray-300 dark:hover:text-teal-400 transition-colors flex items-center"
                >
                  <ArrowRight className="h-4 w-4 mr-1" />
                  Home
                </Link>
              </li>
              {/* Browse Books link */}
              <li>
                <Link
                  href="#"
                  className="text-gray-600 hover:text-teal-600 dark:text-gray-300 dark:hover:text-teal-400 transition-colors flex items-center"
                >
                  <ArrowRight className="h-4 w-4 mr-1" />
                  Browse Books
                </Link>
              </li>
              {/* Sign Up link */}
              <li>
                <Link
                  href="/register"
                  className="text-gray-600 hover:text-teal-600 dark:text-gray-300 dark:hover:text-teal-400 transition-colors flex items-center"
                >
                  <ArrowRight className="h-4 w-4 mr-1" />
                  Sign Up
                </Link>
              </li>
              {/* Login link */}
              <li>
                <Link
                  href="/login"
                  className="text-gray-600 hover:text-teal-600 dark:text-gray-300 dark:hover:text-teal-400 transition-colors flex items-center"
                >
                  <ArrowRight className="h-4 w-4 mr-1" />
                  Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Social media connection section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Connect With Us</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Follow us on social media for book recommendations, reading challenges, and literary events.
            </p>
            {/* Social media icons with links */}
            <div className="flex space-x-4">
              {/* Facebook link */}
              <Link
                href="#"
                className="p-2 bg-white dark:bg-gray-800 rounded-full text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors shadow-sm"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </Link>
              {/* Instagram link */}
              <Link
                href="#"
                className="p-2 bg-white dark:bg-gray-800 rounded-full text-pink-600 hover:bg-pink-100 dark:hover:bg-pink-900/30 transition-colors shadow-sm"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </Link>
              {/* Twitter link */}
              <Link
                href="#"
                className="p-2 bg-white dark:bg-gray-800 rounded-full text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors shadow-sm"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </Link>
              {/* GitHub link - points to actual repository */}
              <Link
                href="https://github.com/Nahid-os/Book_search_engine"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-white dark:bg-gray-800 rounded-full text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-sm"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </Link>
              {/* LinkedIn link - points to actual profile */}
              <Link
                href="https://www.linkedin.com/in/nahid-001-nayan/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-white dark:bg-gray-800 rounded-full text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors shadow-sm"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar with copyright and legal links */}
      <div className="border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            {/* Copyright notice with dynamic year */}
            <p className="text-sm text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()} BookFinder. All rights reserved.
            </p>
            {/* Legal links */}
            <div className="flex gap-6 mt-4 sm:mt-0">
              <Link
                href="#"
                className="text-sm text-gray-500 hover:text-teal-600 dark:text-gray-400 dark:hover:text-teal-400 transition-colors duration-200"
              >
                Privacy Policy
              </Link>
              <Link
                href="#"
                className="text-sm text-gray-500 hover:text-teal-600 dark:text-gray-400 dark:hover:text-teal-400 transition-colors duration-200"
              >
                Terms of Service
              </Link>
              <Link
                href="#"
                className="text-sm text-gray-500 hover:text-teal-600 dark:text-gray-400 dark:hover:text-teal-400 transition-colors duration-200"
              >
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Animation styles for icon hover effects */}
      <style jsx>{`
        /* Pulse animation for social media icons on hover */
        @keyframes pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
          }
        }
        
        /* Apply animation to svg icons inside links on hover */
        footer a:hover svg {
          animation: pulse 1s infinite;
        }
      `}</style>
    </footer>
  )
}

export default Footer
