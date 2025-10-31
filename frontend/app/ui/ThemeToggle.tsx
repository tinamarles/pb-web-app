"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";
import { Button } from "./button";

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
    <Button 
        variant="outlined" 
        size="md" 
        icon = {currentTheme === "dark" ? "sun" : "moon"}
        iconOnly
        onClick={toggleTheme}
        className="rounded-full"
    >
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

/*
{
              theme === themeOption.value ? (
                <Icon name="success" size="md" />
              ) : null
            }
*/
