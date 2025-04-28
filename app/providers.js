// app/providers.jsx
"use client";

import React, { useState } from "react";

export default function Providers({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  return <div className={isDarkMode ? "dark" : ""}>{children}</div>;
}
