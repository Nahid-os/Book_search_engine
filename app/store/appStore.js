// Defines the main Zustand store for application-wide state management.

import { create } from 'zustand'; // Import the Zustand state management library

// Function to update the store's state.
export const useAppStore = create((set, get) => ({
  // --- Dashboard State ---
  lastDashboardPath: '/dashboard', // Initial default value for dashboard path
  setLastDashboardPath: (path) => set({ lastDashboardPath: path }),

  // --- Auth State ---
  user: null, // Holds the logged-in user object, or null
  isLoggedIn: false, // Convenience boolean flag for login status
  isLoadingAuth: true, // Start in loading state until the first auth check is done

  // --- Auth Actions ---

  // Action to set user data (e.g., after login or successful status check)
  setUser: (userData) => set({ user: userData, isLoggedIn: !!userData, isLoadingAuth: false }),

  // Action to clear user data (e.g., after logout or failed status check)
  clearUser: () => set({ user: null, isLoggedIn: false, isLoadingAuth: false }),

  // Async action to check authentication status with the backend API
  checkAuthStatus: async () => {

    if (!get().isLoadingAuth) {
        set({ isLoadingAuth: true }); // Set loading before the fetch
    }

    try {
      const response = await fetch("http://localhost:3001/api/auth/status", { 
        method: "GET",
        credentials: "include", // Crucial for sending session cookies
      });

      // If response is not OK (e.g., 401 Unauthorized, 500 Server Error), treat as logged out
      if (!response.ok) {
        console.warn(`Auth status check failed with status: ${response.status}`);
        get().clearUser(); // Use get() to call another action within the store
        return; // Stop execution here
      }

      const data = await response.json();

      if (data.loggedIn && data.user) {
        // Backend confirms logged in and provides user data
        get().setUser(data.user); // Use get() to call another action
        // console.log('App Store: User is logged in', data.user);
      } else {
        // Backend says not logged in, or user data is missing
        get().clearUser(); // Use get() to call another action
        // console.log('App Store: User is not logged in');
      }
    } catch (error) {
      console.error("App Store: Error during checkAuthStatus:", error);
      // Ensure logged-out state in case of network errors or JSON parsing issues
      get().clearUser();
    }
  },
}));

