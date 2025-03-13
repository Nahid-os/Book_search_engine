"use client";

import React, { useState } from "react";
import NavigationBar from "../components/NavigationBar";
import Footer from "../components/Footer";

export default function Providers({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const toggleTheme = () => setIsDarkMode((prev) => !prev);

  return (
    <div className={isDarkMode ? "dark" : ""}>
      {/* Render NavigationBar & pass the dark mode state */}
      <NavigationBar isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
      {/* Page content from layout's children */}
      {children}
      {/* Render Footer below */}
      <Footer />
    </div>
  );
}
