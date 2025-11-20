// app/data/navigation.ts
// === MODIFICATION LOG ===
// Date: 2025-11-20 UTC
// Modified by: Assistant
// Changes: MERGED Figma and Next.js navigation.ts versions
// Purpose: Single file supporting BOTH sidebar nav (profile/dashboard) AND MorePage sections
// Previous: Two separate incompatible versions causing type conflicts
// New: Flexible NavItem interface, all navigation data in one place
// ========================

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
  href?: string;          // Optional: some items have onClick instead
  disabled?: boolean;     // Optional: disable navigation item
  onClick?: string;       // Optional: action ID for items without href (e.g., "signout")
}

/**
 * Section interface for grouped navigation (e.g., More Menu)
 */
export interface NavSection {
  title: string;          // Section title (e.g., "Settings", "Features")
  id: string;             // Unique ID for the section
  items: NavItem[];       // Items in this section
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
    label: 'Profile', 
    href: '/profile/details', 
    icon: 'User' 
  },
  { 
    label: 'Memberships', 
    href: '/profile/memberships', 
    icon: 'memberships' 
  },
  { 
    label: 'Performance', 
    href: '/profile/performance', 
    icon: 'performance' 
  },
  { 
    label: 'Community', 
    href: '/profile/community', 
    icon: 'community' 
  },
  { 
    label: 'Personal Blog', 
    href: '/profile/blog', 
    icon: 'blog' 
  },
  { 
    label: 'Settings', 
    href: '/profile/settings/account', 
    icon: 'Settings' 
  },
];

/**
 * DASHBOARD SIDEBAR NAVIGATION
 * Used in: /app/(sidebarLayout)/dashboard/* pages
 */
export const DASHBOARD_NAV_ITEMS: NavItem[] = [
  { 
    label: 'Overview', 
    href: '/dashboard', 
    icon: 'dashboard' 
  },
  { 
    label: 'Club Notifications', 
    href: '/dashboard/notifications', 
    icon: 'notifications' 
  },
  { 
    label: 'Club Leagues', 
    href: '/dashboard/leagues', 
    icon: 'leagues' 
  },
  { 
    label: 'Leaderboard', 
    href: '/dashboard/leaderboard', 
    icon: 'achievements' 
  },
  { 
    label: 'Club Members', 
    href: '/dashboard/members', 
    icon: 'Users' 
  },
  { 
    label: 'Club Details', 
    href: '/dashboard/clubdetails', 
    icon: 'show' 
  },
];

/**
 * ADMIN SIDEBAR NAVIGATION (Future)
 * Used in: /app/(sidebarLayout)/admin/* pages
 */
export const ADMIN_NAV_ITEMS: NavItem[] = [
  { 
    label: 'Manage Members', 
    href: '/admin/club/users', 
    icon: 'Users' 
  },
  { 
    label: 'Add Notification', 
    href: '/admin/club/notification', 
    icon: 'add-notification' 
  },
  { 
    label: 'Court Schedule', 
    href: '/admin/club/courts', 
    icon: 'court-schedule' 
  },
  { 
    label: 'Manage Leagues', 
    href: '/admin/club/leagues', 
    icon: 'leagues' 
  },
];

// ============================================
// MORE MENU SECTIONS (Mobile More Page)
// ============================================

/**
 * MORE MENU SECTIONS
 * Used in: /app/(sidebarLayout)/more/page.tsx
 * 
 * Organized into sections for better mobile UX:
 * - Settings: Account, privacy, notifications, appearance, home screen
 * - Features: Memberships, performance, community, blog
 * - Resources: Courts, coaches, drills, links
 * - Learn: Feature exploration
 */
export const MORE_MENU_SECTIONS: NavSection[] = [
  {
    title: 'Settings',
    id: 'settings',
    items: [
      { icon: 'settings', label: 'Account Settings', href: '/profile/settings/account' },
      { icon: 'privacy', label: 'Privacy Settings', href: '/profile/settings/privacy' },
      { icon: 'preferences', label: 'Preferences', href: '/profile/settings/preferences' },
    ]
  },
  {
    title: 'Features',
    id: 'features',
    items: [
      { icon: 'memberships', label: 'Club Memberships', href: '/profile/memberships' },
      { icon: 'performance', label: 'Performance', href: '/profile/performance' },
      { icon: 'community', label: 'Community', href: '/profile/community' },
      { icon: 'blog', label: 'Personal Blog', href: '/profile/blog' },
    ]
  },
  {
    title: 'Resources',
    id: 'resources',
    items: [
      { icon: 'courts', label: 'Courts', href: '/courts' },
      { icon: 'coaches', label: 'Coaches', href: '/coaches' },
      { icon: 'library', label: 'Drill Library', href: '/drills' },
      { icon: 'links', label: 'Useful Links', href: '/links' },
    ]
  },
  {
    title: 'Learn',
    id: 'learn',
    items: [
      { icon: 'sparkles', label: 'Explore Our Features', href: '/explore' },
    ]
  },
];

/**
 * MORE MENU FOOTER LINKS
 * Used in: /app/(sidebarLayout)/more/page.tsx
 * 
 * Simple footer links for legal/info pages
 */
export const MORE_MENU_FOOTER_LINKS: FooterLink[] = [
  { label: 'About Pickle Hub', href: '/about' },
  { label: 'Contact Us', href: '/contact' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
];

// ============================================
// FULL NAVIGATION CONFIG (Optional Export)
// ============================================

/**
 * Combined navigation config for type-safe access
 * Usage: import { navigation } from '@/app/data/navigation';
 */
export const navigation: NavigationConfig = {
  profile: PROFILE_NAV_ITEMS,
  dashboard: DASHBOARD_NAV_ITEMS,
  admin: ADMIN_NAV_ITEMS,
};

// ============================================
// USAGE EXAMPLES
// ============================================

/**
 * SIDEBAR USAGE:
 * 
 * import { PROFILE_NAV_ITEMS, DASHBOARD_NAV_ITEMS } from '@/app/data/navigation';
 * 
 * const items = isProfilePage ? PROFILE_NAV_ITEMS : DASHBOARD_NAV_ITEMS;
 * items.map(item => <MenuItem href={item.href} icon={item.icon} label={item.label} />)
 */

/**
 * MORE PAGE USAGE:
 * 
 * import { MORE_MENU_SECTIONS, MORE_MENU_FOOTER_LINKS } from '@/app/data/navigation';
 * 
 * {MORE_MENU_SECTIONS.map((section) => (
 *   <div key={section.id}>
 *     <h2>{section.title}</h2>
 *     {section.items.map((item) => (
 *       <MenuItem 
 *         key={item.href || item.label}
 *         href={item.href}
 *         icon={item.icon}
 *         label={item.label}
 *         disabled={item.disabled}
 *       />
 *     ))}
 *   </div>
 * ))}
 */
