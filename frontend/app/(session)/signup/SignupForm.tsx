"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatBackendErrors } from "@/lib/utils";
import { useAutofillFix } from "@/lib/hooks";
import { Icon, Button } from "@/ui";

export function SignUpForm() {
  // Call the useAutoFillFix Hook to prevent the default browser behaviour for input fields
  useAutofillFix();

  const [username, setUsername] = useState(""); // username
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verifyPassword, setVerifyPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevents the browser from reloading the page
    setError(null); // Clear any previous errors
    setPasswordError(null);

    // Check if the passwords match
    if (password !== verifyPassword) {
      // if they do not match, update the error state
      setPasswordError("Passwords do not match.");
      return; // Stop the function from proceeding
    }

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const formattedError = formatBackendErrors(errorData);
        setError(formattedError);
        return; // Stop execution
      }

      // SignIn is successful. The route handler has already set the HTTPOnly cookie.
      // We now need to trigger a page refresh to make the middleware run.
      // The middleware will read the new cookie and handle the redirect to the profile-setup page
      router.refresh();
    } catch (err) {
      console.error("An unexpected error occurred:", err);
      setError("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <>
      <div
        className="w-full p-4
                  shrink-0 z-30
                  bg-surface-container-low
                  rounded-2xl
                  border border-outline-variant
                  min-h-5/6
                  shadow-2xl
                  "
      >
        <h1 className="headline-lg text-center text-primary py-4">
          Create your Pickle Hub account
        </h1>
        <form onSubmit={handleSubmit} noValidate className="space-y-2 text-md">
          {/* We now use the 'error' state from the AuthContext to display the message */}
          {error && (
            <div
              className="mt-4 p-4 
                            text-center 
                            rounded-md
                            bg-error text-on-error"
            >
              {error}
            </div>
          )}
          <div>
            <label
              htmlFor="username"
              className="block py-2 body-md
                              after:ml-0.5
                              after:text-error
                              after:content-['*']"
            >
              Username
            </label>
            <div className="input-field">
              <Icon
                name="user"
                className="icon-lg text-on-surface-variant/60"
              />
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
                placeholder="Choose a username"
                className="peer input-base has-icon
                        invalid:[&:not(:placeholder-shown):not(:focus)]:border-error
                        "
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="email"
              className="block py-2 body-md
                              after:ml-0.5
                              after:text-error
                              after:content-['*']"
            >
              Email
            </label>
            <div className="input-field">
              <Icon
                name="emailfilled"
                className="icon-lg text-on-surface-variant/60"
              />
              <input
                type="email"
                id="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                pattern="[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$"
                placeholder="example@mail.com"
                className="peer input-base has-icon
                        invalid:[&:not(:placeholder-shown):not(:focus)]:border-error
                        "
              />

              <span className="mt-2 hidden text-sm text-error peer-[&:not(:placeholder-shown):not(:focus):invalid]:block">
                <Icon name="warning" className="icon-md text-error" /> Please
                enter a valid email address
              </span>
            </div>
          </div>
          <div className="">
            <label
              htmlFor="password"
              className="block py-2 body-md
                              after:ml-0.5
                              after:text-error 
                              after:content-['*']"
            >
              Set Password
            </label>
            <div className="input-field">
              <Icon
                name="lock"
                className="icon-lg text-on-surface-variant/60"
              />
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="New Password"
                pattern=".{8,}"
                className="peer input-base has-icon 
                          invalid:[&:not(:placeholder-shown):not(:focus)]:border-error
                          "
              />
            </div>
          </div>
          <div className="">
            <label
              htmlFor="verifyPassword"
              className="block py-2 body-md"
            ></label>
            <div className="input-field">
              <Icon
                name="lock"
                className="icon-lg text-on-surface-variant/60"
              />
              <input
                type="password"
                id="verifyPassword"
                value={verifyPassword}
                onChange={(e) => setVerifyPassword(e.target.value)}
                required
                placeholder="Confirm password"
                className="peer input-base has-icon"
              />
            </div>
          </div>
          {/* Conditional rendering: Show the error message if the state has a value */}
          {passwordError && (
            <div className="flex justify-start gap-2 items-center text-sm text-error">
              <Icon name="warning" className="icon-md text-error" />{" "}
              {passwordError}
            </div>
          )}
          <Button
            type="submit"
            variant="filled"
            size="lg"
            label="Create Account"
            className="w-full mt-6 body-lg"
          />
        </form>
        <div className="mt-4 text-center">
          <p className="body-md">
            Already a member?{" "}
            <Link
              href="/login"
              className="body-md text-secondary hover:text-primary"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
