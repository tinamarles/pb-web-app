"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatBackendErrors } from "@/app/lib/utils";
import { useAutofillFix } from "@/app/lib/hooks";
import { Icon, Button } from "@/app/ui";

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

      {/* <Logo variant="app-icon" className="w-12 h-12 sm:hidden m-3" /> 
      <div className="hidden sm:block">
        <Logo variant="full" size="lg" className="m-3" />
      </div> */}
      <div
        className="w-full p-4 
                  shrink-0 z-30
                  bg-surface-container-low 
                  rounded-2xl 
                  border border-outline-variant 
                  min-h-5/6
                  shadow-2xl"
      >
        <h1
          className="headline-lg text-primary py-4"
        >
          Sign in to Pickle Hub
        </h1>
        <form onSubmit={handleSubmit} className="space-y-8 text-md">
          {/* We now use the 'error' state from the AuthContext to display the message */}
          {error && (
            <div className="mt-4 p-4 
                            text-center 
                            rounded-md 
                            bg-error text-on-error">
              {error}
            </div>
          )}
          <div>
            <label
              htmlFor="identifier"
              className="block py-2 body-md
                              after:ml-0.5
                              after:text-error
                              after:content-['*']"
            >
              Username or Email
            </label>
            
            <div className="input-field">
              <Icon name="emailfilled" className="icon-lg text-on-surface-variant/60" />
              <input
                type="text"
                id="identifier"
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                autoFocus
                placeholder="Your Username or Email"
                className="peer input-base has-icon"
              />
            </div>
          </div>
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="block body-md
                                after:ml-0.5
                                after:text-error 
                                after:content-['*']"
              >
                Password
              </label>
              <p className="body-md text-secondary py-2">Forgot password?</p>
            </div>
            <div className="input-field">
              <Icon name="lock" className="icon-lg text-on-surface-variant/60 fill-current" />
              <input
                type="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="*************"
                className="peer input-base has-icon"
              />
              
            </div>
          </div>
          <Button 
              type='submit'
              variant='filled'
              size='lg'
              label='Sign In' 
              className='w-full mt-6 body-md' />
        </form>
        <div className="mt-6 p-lg text-center">
        <p className="body-md">
          Not a member?{" "}
          <Link
            href="/signup"
            className="body-md text-secondary hover:text-primary"
          >
            Create an account
          </Link>
        </p>
      </div>
      </div>
      
    </>
  );
}
