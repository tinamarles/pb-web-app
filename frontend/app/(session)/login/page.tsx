"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatBackendErrors } from "@/app/lib/utils";
import { useAutofillFix } from "@/app/lib/hooks";

import { Logo } from "@/app/ui/logo";

export default function LoginPage() {
  // Call the useAutoFillFix Hook to prevent the default browser behaviour for input fields
  useAutofillFix();

  const [identifier, setIdentifier] = useState(""); // username or email
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null); // Clear any previous errors

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ identifier, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const formattedError = formatBackendErrors(errorData);
        setError(formattedError);
        return; // Stop execution
      }

      // Login is successful. The route handler has already set the HTTPOnly cookie.
      // We now need to trigger a page refresh to make the middleware run.
      // The middleware will read the new cookie and handle the redirect.
      router.refresh();
    } catch (err) {
      console.error("An unexpected error occurred:", err);
      setError("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <>
      {/* Mobile: small app-icon, Tablet: medium full logo, Desktop: large full logo */}

      <Logo variant="app-icon" className="w-12 h-12 sm:hidden m-3" />
      <div className="hidden sm:block">
        <Logo variant="full" size="lg" className="m-3" />
      </div>
      <div
        className="w-full min-h-2/3
                  shrink-0
                  p-4"
      >
        <h1
          className="text-3xl 
                  my-8 
                  tracking-wide"
        >
          Sign in to Pickle Hub
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4 text-md">
          {/* We now use the 'error' state from the AuthContext to display the message */}
          {error && (
            <div className="mt-4 p-4 text-center rounded-md bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300">
              {error}
            </div>
          )}
          <div>
            <label
              htmlFor="identifier"
              className="block py-2
                              after:ml-0.5
                              after:text-red-500
                              after:content-['*']"
            >
              Username or Email
            </label>
            <div className="relative">
              <input
                type="text"
                id="identifier"
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                placeholder="Your Username or Email"
                className="peer block w-full 
                        rounded-md 
                        py-3 
                        pl-10
                        bg-gray-100 
                        dark:text-gray-800
                        placeholder:text-gray-400
                        shadow-sm/20 inset-shadow-2xs/10"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 peer-focus:text-gray-500"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M1.5 8.67v8.58a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3V8.67l-8.928 5.493a3 3 0 0 1-3.144 0L1.5 8.67Z" />
                <path d="M22.5 6.908V6.75a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3v.158l9.714 5.978a1.5 1.5 0 0 0 1.572 0L22.5 6.908Z" />
              </svg>
            </div>
          </div>
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="block
                                after:ml-0.5
                                after:text-red-500 
                                after:content-['*']"
              >
                Password
              </label>
              <p className="text-blue-500 py-2">Forgot password?</p>
            </div>
            <div className="relative">
              <input
                type="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="*************"
                className="peer block w-full 
                          rounded-md 
                          py-3 
                          pl-10
                          bg-gray-100 
                          dark:text-gray-800
                          placeholder:text-gray-400
                          shadow-sm/20 inset-shadow-2xs/10"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 peer-focus:text-gray-500"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
          <button
            type="submit"
            className="w-full 
                      flex 
                      justify-center 
                      py-2 px-4 
                      border border-transparent 
                      rounded-md 
                      shadow-sm 
                      text-white 
                      bg-blue-600 
                      hover:bg-blue-700 
                      focus:outline-none 
                      focus:ring-2 
                      focus:ring-offset-2 
                      focus:ring-blue-500 
                      disabled:opacity-50"
          >
            Sign In
          </button>
        </form>
      </div>
      <div className="mt-4 text-center">
        <p className="">
          Not a member?{" "}
          <Link
            href="/signup"
            className="font-semibold leading-6 text-blue-500 hover:text-indigo-500"
          >
            Create an account
          </Link>
        </p>
      </div>
    </>
  );
}
