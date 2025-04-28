"use client"

import { useState, useEffect } from "react"
import { Zap, Star, Users, BookOpen, Globe, Shield } from "lucide-react"

// Array of features
const features = [
  {
    icon: Zap,
    color: "yellow",
    title: "Lightning-Fast Search",
    description: "Find the books you're looking for in seconds with our powerful search engine.",
  },
  {
    icon: Star,
    color: "green",
    title: "Personalized Recommendations",
    description: "Get book suggestions tailored to your reading preferences and history.",
  },
  {
    icon: Users,
    color: "blue",
    title: "Community Reviews",
    description: "Read honest reviews from a community of book lovers to guide your choices.",
  },
  {
    icon: BookOpen,
    color: "purple",
    title: "Extensive Library",
    description: "Access millions of titles across all genres, from classics to the latest releases.",
  },
  {
    icon: Globe,
    color: "pink",
    title: "Global Bookstores",
    description: "Compare prices from bookstores worldwide to find the best deals.",
  },
  {
    icon: Shield,
    color: "orange",
    title: "Secure Wishlist",
    description: "Save your favorite books to your wishlist and get notified about price drops.",
  },
]

export function FeatureCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const [direction, setDirection] = useState("right")

  // Function to get color classes based on the color name
  const getColorClasses = (colorName) => {
    const colorMap = {
      yellow: "bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400",
      green: "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400",
      blue: "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400",
      purple: "bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400",
      pink: "bg-pink-100 dark:bg-pink-900 text-pink-600 dark:text-pink-400",
      orange: "bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400",
    }
    return colorMap[colorName] || colorMap.purple
  }

  useEffect(() => {
    // Function to cycle through features
    const cycleFeatures = () => {
      // Start fade out
      setIsVisible(false)

      // After fade out completes, change feature and fade in
      const timeout = setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % features.length)
        setDirection("right")
        setIsVisible(true)
      }, 800) // Match this with the CSS transition duration

      return () => clearTimeout(timeout)
    }

    // Set interval to change features
    const interval = setInterval(cycleFeatures, 5000) // 5 seconds per feature

    // Clean up interval on component unmount
    return () => clearInterval(interval)
  }, [])

  const currentFeature = features[currentIndex]
  const Icon = currentFeature.icon

  const goToFeature = (index) => {
    if (index === currentIndex) return

    setIsVisible(false)
    setDirection(index > currentIndex ? "right" : "left")

    setTimeout(() => {
      setCurrentIndex(index)
      setIsVisible(true)
    }, 800)
  }

  const goToPrevious = () => {
    setIsVisible(false)
    setDirection("left")

    setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex - 1 + features.length) % features.length)
      setIsVisible(true)
    }, 800)
  }

  const goToNext = () => {
    setIsVisible(false)
    setDirection("right")

    setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % features.length)
      setIsVisible(true)
    }, 800)
  }

  const slideClasses = `
    transform transition-all duration-800 ease-in-out
    ${isVisible ? "opacity-100 translate-x-0" : `opacity-0 ${direction === "right" ? "-translate-x-10" : "translate-x-10"}`}
  `

  return (
    <div className="relative max-w-3xl mx-auto">
      {/* Feature display */}
      <div className="min-h-[300px] flex items-center justify-center">
        <div className={slideClasses}>
          <div className="flex flex-col items-center space-y-4 text-center p-6 bg-white dark:bg-gray-700 rounded-xl shadow-lg">
            <div className={`p-4 rounded-full ${getColorClasses(currentFeature.color)}`}>
              <Icon className="h-12 w-12" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200">{currentFeature.title}</h3>
            <p className="text-gray-600 dark:text-gray-300 max-w-md">{currentFeature.description}</p>
          </div>
        </div>
      </div>

      {/* Navigation arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 bg-white dark:bg-gray-700 rounded-full p-2 shadow-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
        aria-label="Previous feature"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-teal-600 dark:text-teal-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={goToNext}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 bg-white dark:bg-gray-700 rounded-full p-2 shadow-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
        aria-label="Next feature"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-teal-600 dark:text-teal-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Navigation dots */}
      <div className="flex justify-center mt-8 space-x-3">
        {features.map((_, index) => (
          <button
            key={index}
            onClick={() => goToFeature(index)}
            className={`w-3 h-3 rounded-full transition-colors duration-300 ${
              currentIndex === index
                ? "bg-teal-600 dark:bg-teal-400"
                : "bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500"
            }`}
            aria-label={`View feature ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

