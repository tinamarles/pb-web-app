"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null; // avoid hydration mismatch

  // Determine the effective theme for the icon
  const currentTheme =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;

  const toggleTheme = () => {
    if (currentTheme === "dark") {
      setTheme("light");
    } else {
      setTheme("dark");
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-md hover:text-primary"
    >
      {currentTheme === "dark" ? (
        <SunIcon className="h-6 w-6 rounded-full text-on-primary hover:text-primary hover:bg-surface transition-colors" />
      ) : (
        <MoonIcon className="h-6 w-6 rounded-full text-on-primary hover:text-primary hover:bg-surface transition-colors" />
      )}
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
