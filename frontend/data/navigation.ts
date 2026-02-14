// app/data/navigation.ts
import { NotificationType, NotificationTypeValue } from "@/lib/constants";
// ============================================
// TYPE DEFINITIONS
// ============================================

/**
 * Base navigation item interface
 * Flexible enough for sidebar items (required href) and action items (onClick)
 */
export interface NavItem {
  label: string;
  icon: string;
  href?: string; // Optional: some items have onClick instead
  disabled?: boolean; // Optional: disable navigation item
  onClick?: string; // Optional: action ID for items without href (e.g., "signout")
  badgeCount?: NotificationTypeValue | NotificationTypeValue[];
}

/**
 * Section interface for grouped navigation (e.g., More Menu)
 */
export interface NavSection {
  title: string; // Section title (e.g., "Settings", "Features")
  id: string; // Unique ID for the section
  items: NavItem[]; // Items in this section
  separator?: boolean; // ✅ NEW! Show separator before this section
}

/**
 * Footer link interface (simpler than NavItem)
 */
export interface FooterLink {
  label: string;
  href: string;
}

/**
 * Full navigation config (for typed exports)
 */
export interface NavigationConfig {
  profile: NavItem[];
  dashboard: NavItem[];
  admin?: NavItem[];
  feed?: NavItem[];
  club?: NavItem[];
}

// ============================================
// SIDEBAR NAVIGATION (Profile, Dashboard, Admin)
// ============================================

/**
 * PROFILE SIDEBAR NAVIGATION
 * Used in: /app/(sidebarLayout)/profile/* pages
 */
export const PROFILE_NAV_ITEMS: NavItem[] = [
  {
    label: "Profile",
    href: "/profile/details",
    icon: "profile",
  },
  {
    label: "Memberships",
    href: "/profile/memberships",
    icon: "memberships",
    badgeCount: [
      // Multiple membership-related types
      NotificationType.MEMBERSHIP_EXPIRING,
      NotificationType.MEMBERSHIP_RENEWED,
      NotificationType.RENEWAL_PERIOD_OPEN,
      NotificationType.MEMBERSHIP_APPROVED,
      NotificationType.MEMBERSHIP_REJECTED,
      NotificationType.MEMBERSHIP_SUSPENDED,
    ],
  },
  {
    label: "Performance",
    href: "/profile/performance",
    icon: "performance",
    badgeCount: [
      // Milestone notifications
      NotificationType.MILESTONE_GAMES_50,
      NotificationType.MILESTONE_GAMES_100,
      NotificationType.MILESTONE_GAMES_500,
      NotificationType.MILESTONE_WIN_STREAK,
      NotificationType.MILESTONE_RANK_IMPROVED,
    ],
  },
  {
    label: "Community",
    href: "/profile/community",
    icon: "community",
    badgeCount: [
      // Social notifications
      NotificationType.NEW_FOLLOWER,
      NotificationType.PARTNER_REQUEST,
    ],
  },
  {
    label: "Personal Blog",
    href: "/profile/blog",
    icon: "blog",
  },
  {
    label: "Settings",
    href: "/profile/settings/account",
    icon: "Settings",
  },
];

/**
 * DASHBOARD SIDEBAR NAVIGATION
 * Used in: /app/(sidebarLayout)/dashboard/* pages
 */
export const DASHBOARD_NAV_ITEMS: NavItem[] = [
  {
    label: "Overview",
    href: "/dashboard/overview",
    icon: "home",
  },
  {
    label: "Announcements",
    href: "/dashboard/announcements",
    icon: "announcements",
    badgeCount: NotificationType.CLUB_ANNOUNCEMENT,
  },
  {
    label: "Club Events",
    href: "/dashboard/events",
    icon: "events",
    badgeCount: NotificationType.EVENT_INVITATION,
  },
  {
    label: "Club Leagues",
    href: "/dashboard/leagues",
    icon: "leagues",
    badgeCount: [
      NotificationType.LEAGUE_ANNOUNCEMENT,
      NotificationType.LEAGUE_INVITATION,
      NotificationType.LEAGUE_RESULTS_POSTED,
      NotificationType.LEAGUE_SESSION_CANCELLED,
      NotificationType.LEAGUE_STANDINGS_UPDATED,
      NotificationType.LEAGUE_SESSION_REMINDER,
      NotificationType.LEAGUE_MATCH_SCHEDULED,
    ],
  },
  {
    label: "Leaderboard",
    href: "/dashboard/leaderboard",
    icon: "achievements",
  },
  {
    label: "Club Members",
    href: "/dashboard/members",
    icon: "members",
  },
  {
    label: "Club Details",
    href: "/dashboard/clubdetails",
    icon: "clubs",
  },
];
// ✅ ADD: Admin navigation items (conditionally rendered in sidebar)
export const DASHBOARD_ADMIN_ITEMS: NavItem[] = [
  {
    label: "Admin Dashboard",
    href: "/admin/[clubId]/settings",
    icon: "dashboard",
  },
];

// ✅ ADD: Admin navigation items
export const ADMIN_NAV_ITEMS: NavItem[] = [
  { label: "Reports", href: "/admin/[clubId]/reports", icon: "chart" },
  { label: "Calendar", href: "/admin/[clubId]/schedule", icon: "calendar" },
  { label: "Events", href: "/admin/[clubId]/events/list", icon: "events" },
  {
    label: "Memberships",
    href: "/admin/[clubId]/memberships",
    icon: "memberships",
  },
  { label: "Members", href: "/admin/[clubId]/members", icon: "members" },
  {
    label: "Announcements",
    href: "/admin/[clubId]/announcements",
    icon: "announcements",
  },
  { label: "Settings", href: "/admin/[clubId]/settings", icon: "settings" },
];

// ✅ ADD: Feed navigation items (public users)
export const FEED_NAV_ITEMS: NavItem[] = [
  { label: "Discover", href: "/feed/discover", icon: "compass" },
  { label: "My Matches", href: "/feed/my-matches", icon: "matches" },
  { label: "Activity", href: "/feed/activity", icon: "activity" },
];

// ============================================
// MORE MENU SECTIONS (Mobile More Page)
// ============================================

/**
 * MORE MENU SECTIONS
 *
 * Organized into sections for better mobile UX:
 * - Settings: Account, privacy, notifications, appearance, home screen
 * - Features: Memberships, performance, community, blog
 * - Discover: Courts, coaches, drills, links
 * - Learn: Feature exploration
 */
export const MORE_MENU_SECTIONS: NavSection[] = [
  {
    title: "Settings",
    id: "settings",
    items: [
      {
        icon: "settings",
        label: "Account Settings",
        href: "/profile/settings/account",
      },
      {
        icon: "privacy",
        label: "Privacy Settings",
        href: "/profile/settings/privacy",
      },
      {
        icon: "preferences",
        label: "Preferences",
        href: "/profile/settings/preferences",
      },
    ],
  },
  {
    title: "Features",
    id: "features",
    separator: false,
    items: [
      {
        icon: "memberships",
        label: "Club Memberships",
        href: "/profile/memberships",
      },
      {
        icon: "performance",
        label: "Performance",
        href: "/profile/performance",
      },
      { icon: "community", label: "Community", href: "/profile/community" },
      { icon: "blog", label: "Personal Blog", href: "/profile/blog" },
    ],
  },
  {
    title: "Discover",
    id: "discover",
    separator: false,
    items: [
      { icon: "courts", label: "Courts", href: "/courts" },
      { icon: "coaches", label: "Coaches", href: "/coaches" },
      { icon: "library", label: "Drill Library", href: "/drills" },
      { icon: "links", label: "Useful Links", href: "/links" },
    ],
  },
  {
    title: "Learn",
    id: "learn",
    separator: false,
    items: [
      { icon: "sparkles", label: "Discover Our Features", href: "/explore" },
    ],
  },
];

/**
 * MORE MENU FOOTER LINKS
 * Used in: /app/(sidebarLayout)/more/page.tsx
 *
 * Simple footer links for legal/info pages
 */
export const MORE_MENU_FOOTER_LINKS: FooterLink[] = [
  { label: "About Pickle Hub", href: "/about" },
  { label: "Contact Us", href: "/contact" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
];

// ============================================
// CLUB DETAILS TABS NAVIGATION
// ============================================
// Definition for Tabs on Club Details page
// No icon, disabled, onClick and badgeCount required

export const CLUB_TAB_ITEMS: NavItem[] = [
  { label: "Home", icon: "", href: "/club/[clubId]/home" },
  { label: "Events", icon: "", href: "/club/[clubId]/events" },
  { label: "Members", icon: "", href: "/club/[clubId]/members" },
  { label: "Subscriptions", icon: "", href: "/club/[clubId]/subscriptions" },
];
// ============================================
// FULL NAVIGATION CONFIG (Optional Export)
// ============================================

/**
 * Combined navigation config for type-safe access
 * Usage: import { navigation } from '@/data/navigation';
 */
export const navigation: NavigationConfig = {
  profile: PROFILE_NAV_ITEMS,
  dashboard: DASHBOARD_NAV_ITEMS,
  admin: ADMIN_NAV_ITEMS,
  feed: FEED_NAV_ITEMS,
  club: CLUB_TAB_ITEMS,
};
