"use client";

import { useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { AuthUserProvider, useAuth } from "./AuthUserProvider";
import { DashboardProvider } from "./DashboardProvider";
import { setHandlerDependencies } from "@/shared";

// === MODIFICATION LOG ===
// Date: 2025-11-12
// Modified by: Assistant
// Changes: Added dependency injection for shared utils handlers
// - Import setHandlerDependencies and useAuthUser
// - Inject isMemberUser function into handlers when user changes
// - This allows handlers to check user type without circular imports
// ========================

/**
 * Inner Providers Component
 * This component has access to AuthUserProvider context
 * and injects dependencies into shared utils
 */
function InnerProviders({ children }: { children: React.ReactNode }) {
  const { user, isMemberUser } = useAuth();

  // Inject dependencies whenever user changes
  useEffect(() => {
    // Inject the isMemberUser function into shared utils
    // This allows handlers to check user type without importing AuthUserProvider
    setHandlerDependencies({ isMemberUser });

    console.log("🔧 [Providers] Injected dependencies into shared utils");
  }, [user, isMemberUser]);

  return <>{children}</>;
}

/**
 * Main Providers Component
 * Wraps the app with all necessary providers
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute={"data-theme"}
      defaultTheme="light"
      enableSystem={false}
      storageKey="theme"
    >
      <AuthUserProvider>
        <DashboardProvider>
          <InnerProviders>{children}</InnerProviders>
        </DashboardProvider>
      </AuthUserProvider>
    </ThemeProvider>
  );
}
