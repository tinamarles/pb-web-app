"use client";

import { ThemeProvider } from "next-themes";
import { AuthUserProvider } from "./AuthUserProvider";

export function Providers({ children}: { children: React.ReactNode}) {
    return (
        <ThemeProvider 
            attribute={"data-theme"} 
            defaultTheme="light" 
            enableSystem={false}
            storageKey="theme"
        >
            <AuthUserProvider>
                {children}
            </AuthUserProvider>
        </ThemeProvider>
    )
}