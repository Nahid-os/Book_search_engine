/**
 * Error boundary component specifically designed to catch
 * dynamic import ('chunk') loading errors and trigger a page refresh.
 */

import React from "react";

/**
 * A React Error Boundary that detects JavaScript chunk loading errors
 * (often occurring after deployments) and automatically reloads the page
 * to attempt fetching the latest code chunks.
 */
class ChunkErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasChunkError: false }; // State to track if a chunk error occurred
  }

  /**
   * Lifecycle method to update state when a descendant component throws an error.
   * Specifically checks if the error is a ChunkLoadError.
   * @param {Error} error - The error thrown by a descendant component.
   * @returns {object|null} State update object or null.
   */
  static getDerivedStateFromError(error) {
    // Check if the error name indicates a chunk loading failure
    if (error && error.name === "ChunkLoadError") {
      return { hasChunkError: true };
    }
    // Return null if it's not a chunk load error, letting other boundaries handle it
    return null;
  }

  /**
   * Lifecycle method called after an error has been thrown by a descendant component.
   * Used here primarily for logging the error details.
   * @param {Error} error - The error that was thrown.
   * @param {object} info - An object with componentStack key containing information about which component threw the error.
   */
  componentDidCatch(error, info) {
    // Log the specific chunk load error for debugging purposes
    if (error.name === "ChunkLoadError") {
        console.error("ChunkLoadError caught by boundary:", error, info.componentStack);
    }
    // Could potentially log other errors here too if getDerivedStateFromError returned null for them
  }

  /**
   * Lifecycle method called after component updates.
   * If a chunk error was detected, trigger a page reload.
   */
  componentDidUpdate(prevProps, prevState) {
    // If the component just transitioned into the error state
    if (this.state.hasChunkError && !prevState.hasChunkError) {
      // Force a page reload to fetch potentially updated code chunks
      window.location.reload();
    }
  }

  /**
   * Renders the children components or null (briefly, before reload) if a chunk error occurred.
   */
  render() {
    if (this.state.hasChunkError) {
      // Render nothing while the page is about to reload.
      // A fallback UI could be rendered here if desired (e.g., "Loading new version...").
      return null;
    }
    // If no chunk error, render the children components as usual.
    return this.props.children;
  }
}

export default ChunkErrorBoundary;