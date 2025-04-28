"use client"

import { useEffect, useState } from "react"
import { Quote } from "lucide-react"

// Array of inspiring book quotes
const quotes = [
  {
    text: "A reader lives a thousand lives before he dies. The man who never reads lives only one.",
    author: "George R.R. Martin",
  },
  {
    text: "Books are a uniquely portable magic.",
    author: "Stephen King",
  },
  {
    text: "I have always imagined that Paradise will be a kind of library.",
    author: "Jorge Luis Borges",
  },
  {
    text: "The more that you read, the more things you will know. The more that you learn, the more places you'll go.",
    author: "Dr. Seuss",
  },
  {
    text: "A book is a dream that you hold in your hand.",
    author: "Neil Gaiman",
  },
  {
    text: "Reading is an exercise in empathy; an exercise in walking in someone else's shoes for a while.",
    author: "Malorie Blackman",
  },
  {
    text: "Books are the mirrors of the soul.",
    author: "Virginia Woolf",
  },
  {
    text: "Reading is to the mind what exercise is to the body.",
    author: "Joseph Addison",
  },
]

export function BookQuotes() {
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Function to cycle through quotes
    const cycleQuotes = () => {
      // Start fade out
      setIsVisible(false)

      // After fade out completes, change quote and fade in
      const timeout = setTimeout(() => {
        setCurrentQuoteIndex((prevIndex) => (prevIndex + 1) % quotes.length)
        setIsVisible(true)
      }, 1000) // Match this with the CSS transition duration

      return () => clearTimeout(timeout)
    }

    // Set interval to change quotes
    const interval = setInterval(cycleQuotes, 6000) // 6 seconds per quote (5s display + 1s transition)

    // Clean up interval on component unmount
    return () => clearInterval(interval)
  }, [])

  const currentQuote = quotes[currentQuoteIndex]

  return (
    <section className="w-full py-16 bg-gradient-to-r from-teal-200 to-blue-200 dark:from-teal-800 dark:to-blue-800">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="flex flex-col items-center justify-center text-center">
          <Quote className="h-12 w-12 text-teal-600 dark:text-teal-400 mb-6" />
          <div className="h-40 flex items-center justify-center">
            <div
              className={`max-w-3xl transition-opacity duration-1000 ease-in-out ${
                isVisible ? "opacity-100" : "opacity-0"
              }`}
            >
              <p className="text-xl md:text-2xl lg:text-3xl font-serif italic text-gray-800 dark:text-gray-200 mb-4">
                "{currentQuote.text}"
              </p>
              <p className="text-md md:text-lg font-medium text-teal-700 dark:text-teal-300">— {currentQuote.author}</p>
            </div>
          </div>
          <div className="flex mt-8 space-x-2">
            {quotes.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setIsVisible(false)
                  setTimeout(() => {
                    setCurrentQuoteIndex(index)
                    setIsVisible(true)
                  }, 1000)
                }}
                className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                  currentQuoteIndex === index ? "bg-teal-600 dark:bg-teal-400" : "bg-gray-300 dark:bg-gray-600"
                }`}
                aria-label={`View quote ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

