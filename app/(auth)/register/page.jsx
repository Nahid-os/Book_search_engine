// app/(auth)/register/page.jsx

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, UserPlus, Mail, Lock } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  // Handles input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (serverError) {
      setServerError("");
    }
  };

  // Client-side form validation
  const validateForm = () => {
    const newErrors = {};
    if (!formData.username.trim()) newErrors.username = "Username is required";
    else if (formData.username.length < 3) newErrors.username = "Username must be at least 3 characters";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Email is invalid";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handles form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setServerError("");

    try {
      const response = await fetch("http://localhost:3001/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        // credentials: "include", // Only needed if using cookies cross-origin
      });

      // Try to parse JSON regardless of status code, as error messages are often in the body
      const data = await response.json();

      // --- MODIFIED ERROR HANDLING ---
      if (!response.ok) {
        // If response is not OK (4xx, 5xx), handle it directly
        // Use the message from the backend response body (data.message)
        setServerError(data.message || `Registration failed (status: ${response.status})`);
      } else {
        // SUCCESS CASE: Response is OK (2xx)
        // Redirect to login page, adding query param for success message display
        router.push("/login?registered=true"); 
      }
    } catch (error) {
      // --- CATCH UNEXPECTED ERRORS ---
      // This block now primarily catches network errors (fetch failed)
      // or errors during response.json() if the response wasn't valid JSON.
      console.error("Unexpected registration error:", error); // Log only truly unexpected errors
      setServerError("An unexpected network or server error occurred. Please try again later.");
    } finally {
      setIsLoading(false); // Ensure loading state is always reset
    }
  };

  // --- JSX  ---
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-100 via-blue-50 to-teal-100 dark:from-teal-950 dark:via-blue-950 dark:to-cyan-950 p-4 transition-colors duration-300">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-500 to-blue-500 p-6 text-white">
            <h1 className="text-3xl font-bold text-center">Create Account</h1>
            <p className="text-center mt-2 text-teal-100">Join our book lovers community</p>
          </div>

          {/* Form Section */}
          <div className="p-6 sm:p-8">
            {/* Server Error Display */}
            {serverError && (
              <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm transition-opacity duration-300">
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
               {/* Username Input Field */}
               <div className="space-y-2">
                 <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                   Username
                 </label>
                 <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <UserPlus className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                   </div>
                   <input
                     id="username"
                     name="username"
                     type="text"
                     value={formData.username}
                     onChange={handleChange}
                     className={`block w-full pl-10 pr-3 py-3 border ${
                       errors.username ? "border-red-500 focus:ring-red-500" : "border-gray-300 dark:border-gray-700 focus:ring-teal-500 dark:focus:ring-teal-600"
                     } rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 transition-colors`}
                     placeholder="Choose a unique username"
                     required
                     aria-invalid={!!errors.username}
                     aria-describedby={errors.username ? "username-error" : undefined}
                   />
                 </div>
                 {errors.username && <p id="username-error" className="text-red-500 text-sm mt-1">{errors.username}</p>}
               </div>

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
                    placeholder="Enter your email address"
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
                     placeholder="Create a strong password"
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

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-all duration-300 flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </button>
            </form>

            {/* Link to Login Page */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Already have an account?{" "}
                {}
                <Link href="/login" className="font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 hover:underline">
                  Log in here
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-8 text-center text-gray-600 dark:text-gray-400 text-xs">
          <p>By creating an account, you agree to our</p>
          <p className="mt-1">
            <Link href="/terms" className="text-teal-600 dark:text-teal-400 hover:underline">Terms of Service</Link>
             & <Link href="/privacy" className="text-teal-600 dark:text-teal-400 hover:underline">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}