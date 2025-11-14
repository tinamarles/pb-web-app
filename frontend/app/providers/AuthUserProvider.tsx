"use client";

import {
  useEffect,
  useState,
  createContext,
  useContext,
  ReactNode,
  useCallback, // NEW Added for isMemberUser wrapper
} from "react";
import { User, AuthUserContextType, isUser, isMemberUser as isMemberUserGuard } from "@/app/lib/definitions"; // Import your defined User type
import { snakeToCamel } from "@/app/lib/utils";
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
  const pathname = usePathname(); // Get the current path

  // NEW - Wrapper for isMemberUser to use with context
  // This wraps existing isMemberUser type guard so it can be called
  // without parameters (uses the current user from context)
  const isMemberUser = useCallback((): boolean => {
    if (!user) return false;
    return isMemberUserGuard(user); // Calls existing type guard from definitions
  }, [user]);

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

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push('/');
  };

  return (
    <AuthUserContext.Provider value={{ user, logout, isMemberUser }}>
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
