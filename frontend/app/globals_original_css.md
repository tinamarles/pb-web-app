@import "tailwindcss";
@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));

:root {
  --background: #ffffff;
  --foreground: #171717;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);


  
}
@theme {
  /* Primary Color 500: #2FA755 sea-green tailwindshades.com */
  --color-primary: oklch(64.396% 0.15884 149.61);
  --color-primary-50: oklch(84.623% 0.10496 153.76);
  --color-primary-100: oklch(82.755% 0.11738 153.62);
  --color-primary-200: oklch(79.409% 0.14374 151.97);
  --color-primary-300: oklch(76.03% 0.16587 150.84);
  --color-primary-400: oklch(72.195% 0.17984 149.44);
  --color-primary-500: oklch(64.396% 0.15884 149.61);
  --color-primary-600: oklch(54.012% 0.13062 149.89);
  --color-primary-700: oklch(43.105% 0.1007 150.36);
  --color-primary-800: oklch(31.76% 0.07093 150.25);
  --color-primary-900: oklch(18.973% 0.03378 151.93);
  --color-primary-950: oklch(11.255% 0.01612 153.28);

  /* Secondary Color 500: #374762 pickled-blue-wood */
  --color-secondary: oklch(39.617% 0.05042 260.64);
  --color-secondary-50: oklch(74.815% 0.04248 262.24);
  --color-secondary-100: oklch(70.896% 0.04985 261.29);
  --color-secondary-200: oklch(62.762% 0.06444 261.71);
  --color-secondary-300: oklch(54.952% 0.07419 260.22);
  --color-secondary-400: oklch(47.332% 0.06215 261.31);
  --color-secondary-500: oklch(39.617% 0.05042 260.64);
  --color-secondary-600: oklch(35.123% 0.04394 261.55);
  --color-secondary-700: oklch(30.427% 0.03556 261.92);
  --color-secondary-800: oklch(25.6% 0.02846 263.87);
  --color-secondary-900: oklch(20.733% 0.02019 258.34);
  --color-secondary-950: oklch(18.139% 0.0158 261.54);
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: Arial, Helvetica, sans-serif;
}
/*
 * Fixes for browser autofill styles that hijack form input colors.
 * This is a theme-aware solution that also corrects font size and box shadows.
 */

/* --- Light Theme (Default) --- */
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus,
input:-webkit-autofill:active {
  /* This large inset box-shadow covers the default autofill background. */
  -webkit-box-shadow: 0 0 0 1000px #f3f4f6 inset !important;
  
  /* Forces the text to match your light theme's text color. */
  -webkit-text-fill-color: #1f2937 !important;
  
  /* Forces the font size to inherit from the parent element. */
  font-size: inherit !important;

  /* This long transition time prevents the autofill from flickering. */
  transition: background-color 5000s ease-in-out 0s;
}

/* --- Dark Theme --- */
.dark input:-webkit-autofill,
.dark input:-webkit-autofill:hover,
.dark input:-webkit-autofill:focus,
.dark input:-webkit-autofill:active {
  /* This large inset box-shadow covers the default autofill background. */
  -webkit-box-shadow: 0 0 0 1000px #374151 inset !important;
  
  /* Forces the text to match your dark theme's text color. */
  -webkit-text-fill-color: #ffffff !important;
  
  /* Forces the font size to inherit from the parent element. */
  font-size: inherit !important;

  /* This long transition time prevents the autofill from flickering. */
  transition: background-color 5000s ease-in-out 0s;
}