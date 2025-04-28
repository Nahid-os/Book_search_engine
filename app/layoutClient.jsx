"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import NavigationBar from "../components/NavigationBar"; 
import Footer from "../components/Footer"; 
import { useAppStore } from "./store/appStore"; 

export default function LayoutClient({ children }) {
  const pathname = usePathname();

  // Get auth check action from the store 
  const checkAuthStatus = useAppStore((state) => state.checkAuthStatus);

  // Trigger initial authentication check on mount
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]); // Dependency array ensures it runs once

  // --- Determine whether to show Navbar and Footer ---

  // Define routes where Nav/Footer should NEVER be shown
  const noNavFooterPaths = ["/auth/login", "/auth/register"];

  // Determine if the current path is one of the excluded paths
  const showNavFooter = !noNavFooterPaths.includes(pathname);

  // --- Render the Layout ---
  // The NavigationBar component itself will handle showing
  // the correct elements based on the isLoggedIn state from the store.

  return (
    <>
      {/* Render NavigationBar if not on an excluded path */}
      {showNavFooter && <NavigationBar />}

      {/* Add padding-top dynamically only when navbar is shown */}
      {/* Apply min-h-screen to ensure content area can fill height */}
      <main className={`min-h-screen ${showNavFooter ? "pt-16" : ""}`}>
        {/* Render the actual page content passed as children */}
        {children}
      </main>

      {/* Render Footer if not on an excluded path */}
      {showNavFooter && <Footer />}
    </>
  );
}