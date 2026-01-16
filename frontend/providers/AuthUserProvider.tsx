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
  FeedItem,
  Notification,
  Announcement
} from "@/lib/definitions"; // Import your defined User type
import { snakeToCamel } from "@/lib/utils";
import { useRouter, usePathname } from "next/navigation";

interface ApiResponse {
  notifications?: FeedItem[];
  unreadCount?: number;
  [key: string]: unknown;
}

// Define protected routes.
const PROTECTED_ROUTES = ["/dashboard", "/feed"];

// Create the context with a default value
const AuthUserContext = createContext<AuthUserContextType | null>(null);

// Define props for the provider component
interface AuthUserProviderProps {
  children: ReactNode;
}

// ✅ Type guard functions to narrow FeedItem union type
function isNotification(item: FeedItem): item is Notification {
  return item.feedType === 'notification';
}

function isAnnouncement(item: FeedItem): item is Announcement {
  return item.feedType === 'announcement';
}

export function AuthUserProvider({ children }: AuthUserProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<FeedItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const router = useRouter();
  const pathname = usePathname() || "/"; // Get the current path

  // EXTRACTED fetchUser function using useCallback
  const fetchUser = useCallback(async () => {
    const res = await fetch("/api/auth/user");

    if (res.ok) {
      // The API response contains all keys in snake_case format (eg. {'first_name': 'Sam'})
      // that need to be converted to camelCase keys to fit standard
      // JavaScript conventions
      const snakeCaseData = await res.json();
      // convert the snake_case keys of Django into camelCase
      const camelCaseData = snakeToCamel(snakeCaseData) as ApiResponse;

      // Extract notifications
      const notificationsData = camelCaseData.notifications || [];
      const unreadCountData = camelCaseData.unreadCount || 0;

      // Set state
      setNotifications(notificationsData);
      setUnreadCount(unreadCountData);

      // Remove from user object (so isUser check doesn't fail)
      delete camelCaseData.notifications;
      delete camelCaseData.unreadCount;

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

  const markNotificationAsRead = useCallback(async (notificationId: number) => {
    // Optimistic update - only update if it's a notification (has isRead field)
    setNotifications(prev => 
      prev.map(n => {
        // ✅ Use type guard to narrow FeedItem → Notification
        if (n.id === notificationId && isNotification(n)) {
          return { ...n, isRead: true };  // ✅ TypeScript knows n is Notification!
        }
        return n;
      })
    );
    
    // Check if was unread before updating count
    const item = notifications.find(n => n.id === notificationId);
    // ✅ Use type guard for narrowing
    const wasUnread = item && isNotification(item) && item.isRead === false;
    
    if (wasUnread) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    
    try {
      await fetch(`/api/notifications/${notificationId}/read`, { method: 'POST' });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Revert on error
      await fetchUser();
    }
  }, [notifications, fetchUser]);

  const dismissNotification = useCallback(async (notificationId: number) => {
    // Optimistic update - remove from list
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    
    // Check if was unread before updating count
    const item = notifications.find(n => n.id === notificationId);
    // ✅ Use type guard for narrowing
    const wasUnread = item && isNotification(item) && item.isRead === false;
    
    if (wasUnread) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    
    try {
      await fetch(`/api/notifications/${notificationId}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Error dismissing notification:', error);
      // Revert on error
      await fetchUser();
    }
  }, [notifications, fetchUser]);

  // Initial fetch on mount
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const logout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        setUser(null);
        console.log("🚪 LOGOUT: User set to null");
        // console.log('🚪 LOGOUT: Calling router.push("/")');
        // router.refresh(); // added 2025-12-01 cause it somehow got stuck on dashboard/member/page.tsx
        // router.push("/");
        // ✅ USE HARD NAVIGATION - bypasses Next.js router
        window.location.href = "/";
      }
    } catch (error) {
      console.log("🟢 ERROR in logout:", error);
    }
  };

  return (
    <AuthUserContext.Provider
      value={{ 
        user, 
        logout, 
        isMemberUser, 
        refetchUser: fetchUser,
        notifications,      // 👈 ADD
        unreadCount,        // 👈 ADD
        markNotificationAsRead,  // 👈 ADD
        dismissNotification      // 👈 ADD
      }}
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
