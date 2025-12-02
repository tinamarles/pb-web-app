"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "./button";
import { Icon } from "./icon";

export function ThemeToggle() {
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
    <>
      <Icon 
          name = {currentTheme === "dark" ? "sun" : "moon"}
          bordered
          size="md"
          onClick={toggleTheme}
      />
      <span className="sr-only">Toggle theme</span>
    </>
  );
}


