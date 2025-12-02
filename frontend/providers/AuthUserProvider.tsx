"use client";

import {
  useEffect,
  useState,
  createContext,
  useContext,
  ReactNode,
  useMemo,
  useCallback, // NEW Added for isMemberUser wrapper
} from "react";
import {
  User,
  AuthUserContextType,
  isUser,
  isMemberUser as isMemberUserGuard,
} from "@/lib/definitions"; // Import your defined User type
import { snakeToCamel } from "@/lib/utils";
import { useRouter, usePathname } from "next/navigation";

// Define protected routes.
const PROTECTED_ROUTES = ["/dashboard"];

// Create the context with a default value
const AuthUserContext = createContext<AuthUserContextType | null>(null);

// Define props for the provider component
interface AuthUserProviderProps {
  children: ReactNode;
}

export function AuthUserProvider({ children }: AuthUserProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const pathname = usePathname() || '/'; // Get the current path

  // EXTRACTED fetchUser function using useCallback
  const fetchUser = useCallback(async () => {
    const res = await fetch("/api/auth/user");

    if (res.ok) {
      // The API response contains all keys in snake_case format (eg. {'first_name': 'Sam'})
      // that need to be converted to camelCase keys to fit standard
      // JavaScript conventions
      const snakeCaseData = await res.json();
      // convert the snake_case keys of Django into camelCase
      const camelCaseData = snakeToCamel(snakeCaseData);
      // Using typeguard check if camelCaseData has the correct format
      let userData: User | null = null;
      if (isUser(camelCaseData)) {
        userData = camelCaseData;
      } else {
        // Handle the case where the data is not a User
        console.error("Received data does not conform to User interface.");
      }
      setUser(userData);
    } else {
      console.log("fetch to api/auth/user did not return ok", res);
      setUser(null);
      if (PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
        router.push("/");
      }
    }
  }, [pathname, router]); // Dependencies for useCallback

  // NEW - Wrapper for isMemberUser to use with context
  // This wraps existing isMemberUser type guard so it can be called
  // without parameters (uses the current user from context)
  const isMemberUser = useMemo(() => {
    if (!user) return false;
    return isMemberUserGuard(user); // Calls existing type guard from definitions
  }, [user]);

  /*
  useEffect(() => {
    const fetchUser = async () => {
      const res = await fetch("/api/auth/user");
      
      if (res.ok) {
        // The API response contains all keys in snake_case format (eg. {'first_name': 'Sam'})
        // that need to be converted to camelCase keys to fit standard
        // JavaScript conventions
        const snakeCaseData = await res.json();
        // convert the snake_case keys of Django into camelCase
        const camelCaseData = snakeToCamel(snakeCaseData);
        // Using typeguard check if camelCaseData has the correct
        // format
        let userData: User | null = null; // Declare the variable in the parent scope and initialize with null
        if (isUser(camelCaseData)) {
          userData = camelCaseData;
        } else {
          // Handle the case where the data is not an APIUser
          console.error("Received data does not conform to APIUser interface.");
        }
        setUser(userData);
      } else {
        console.log('fetch to api/auth/user did not return ok', res);
        setUser(null);
        if (PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
          router.push("/");
        }
      }
    };
    fetchUser(); // this will load the current authorized user's data into the context
  }, [pathname, router]);
  */

  // Initial fetch on mount
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const logout = async () => {
    console.log('🟢 A. logout() function started');
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      console.log('🟢 B. API call completed:', response.status);

      if (response.ok) {
        console.log('🟢 C. response=OK');
        setUser(null);
        console.log('🚪 LOGOUT: User set to null');
        // console.log('🚪 LOGOUT: Calling router.push("/")');
        // router.refresh(); // added 2025-12-01 cause it somehow got stuck on dashboard/member/page.tsx
        // router.push("/");
        // ✅ USE HARD NAVIGATION - bypasses Next.js router
        console.log('🟢 LOGOUT: Calling window.location.href');
        window.location.href = '/';
        console.log('❌ LOGOUT: After window.location.href (should NEVER see this)');
      }
    
    } catch (error) {
      console.log('🟢 ERROR in logout:', error);
    }
  };

  return (
    <AuthUserContext.Provider
      value={{ user, logout, isMemberUser, refetchUser: fetchUser }}
    >
      {children}
    </AuthUserContext.Provider>
  );
}

// Create a custom hook for easy access to the context
export const useAuth = () => {
  const context = useContext(AuthUserContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
