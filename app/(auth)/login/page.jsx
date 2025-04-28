// app/(auth)/login/page.jsx

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { useAppStore } from "../../store/appStore"; 
export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get("registered") === "true";

  const setUser = useAppStore((state) => state.setUser);

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState(
    justRegistered ? "Account created successfully! Please log in." : ""
  );

  useEffect(() => {
    let timer;
    if (successMessage) {
      timer = setTimeout(() => setSuccessMessage(""), 5000);
    }
    return () => clearTimeout(timer);
  }, [successMessage]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    if (serverError) setServerError("");
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Email is invalid";
    if (!formData.password) newErrors.password = "Password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setServerError("");
    setSuccessMessage("");

    try {
      const response = await fetch("http://localhost:3001/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      // Attempt to parse JSON response body, useful for both success and error cases
      const data = await response.json();

      // --- MODIFIED ERROR HANDLING ---
      if (!response.ok) {
        // Handle expected API errors (e.g., 401 Unauthorized, 400 Bad Request)
        setServerError(data.message || `Login failed (status: ${response.status})`);
        // Clear password field on failed login attempt for security
        setFormData(prev => ({ ...prev, password: '' }));
        // Do NOT throw an error here for expected API failures
      } else {
        // SUCCESS CASE: Response is OK (2xx)
        if (data.user) {
          setUser(data.user); // Update global state
          router.push("/"); // Redirect on success
        } else {
          // Handle case where login succeeded (200 OK) but user data is missing
          console.warn("Login response OK, but user data missing from response.");
          setServerError("Login succeeded but user data could not be loaded. Please try refreshing.");
        }
      }
    } catch (error) {
      // --- CATCH UNEXPECTED ERRORS ---
      // Catches network errors, JSON parsing errors, etc.
      console.error("Unexpected Login Error:", error); // Log only genuinely unexpected errors
      setServerError("An unexpected network or server error occurred. Please try again.");
       // Also clear password field here
      setFormData(prev => ({ ...prev, password: '' }));
    } finally {
      setIsLoading(false); // Ensure loading state is reset
    }
  };

  // --- JSX Rendering ---
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-100 via-blue-50 to-teal-100 dark:from-teal-950 dark:via-blue-950 dark:to-cyan-950 p-4 transition-colors duration-300">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-500 to-blue-500 p-6 text-white">
            <h1 className="text-3xl font-bold text-center">Welcome Back</h1>
            <p className="text-center mt-2 text-teal-100">Log in to access your bookshelf</p>
          </div>

          {/* Form Section */}
          <div className="p-6 sm:p-8">
            {/* Server Error Display */}
            {serverError && (
              <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm transition-opacity duration-300">
                {serverError}
              </div>
            )}

            {/* Success Message Display */}
            {successMessage && (
              <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-sm transition-opacity duration-300">
                {successMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              {/* Email Input Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-3 py-3 border ${
                      errors.email ? "border-red-500 focus:ring-red-500" : "border-gray-300 dark:border-gray-700 focus:ring-teal-500 dark:focus:ring-teal-600"
                    } rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 transition-colors`}
                    placeholder="your.email@example.com"
                    autoComplete="email"
                    required
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "email-error" : undefined}
                  />
                </div>
                {errors.email && <p id="email-error" className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              {/* Password Input Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-12 py-3 border ${
                      errors.password ? "border-red-500 focus:ring-red-500" : "border-gray-300 dark:border-gray-700 focus:ring-teal-500 dark:focus:ring-teal-600"
                    } rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 transition-colors`}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? "password-error" : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && <p id="password-error" className="text-red-500 text-sm mt-1">{errors.password}</p>}
              </div>

              {/* Remember me & Forgot Password */}
              <div className="flex items-center justify-between text-sm">
                 <div className="flex items-center">
                   <input
                     id="remember-me"
                     name="remember-me"
                     type="checkbox"
                     className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-700"
                   />
                   <label htmlFor="remember-me" className="ml-2 block text-gray-700 dark:text-gray-300">
                     Remember me
                   </label>
                 </div>
                 {/* Optional Forgot Password Link */}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-all duration-300 flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? ( /* Loading Spinner */ <><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Logging In...</> ) : ( "Log In" )}
              </button>
            </form>

            {/* Link to Registration Page */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Don't have an account?{" "}
                <Link href="/register" className="font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 hover:underline">
                  Sign up here
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer Text */}
        <div className="mt-8 text-center text-gray-600 dark:text-gray-400 text-xs">
          <p>© {new Date().getFullYear()} Book Search App. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}