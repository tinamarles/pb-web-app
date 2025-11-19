export interface NavItem {
  label: string;
  href: string;
  icon: string;
}

export interface NavigationConfig {
  profile: NavItem[];
  dashboard: NavItem[];
  admin?: NavItem[];
}

// ============================================
// PROFILE NAVIGATION
// ============================================
export const PROFILE_NAV_ITEMS: NavItem[] = [
  { 
    label: 'Profile', 
    href: '/profile', 
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

// ============================================
// DASHBOARD NAVIGATION
// ============================================
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

// ============================================
// ADMIN NAVIGATION (Future)
// ============================================
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
// FULL NAVIGATION CONFIG (Optional Export)
// ============================================
export const navigation: NavigationConfig = {
  profile: PROFILE_NAV_ITEMS,
  dashboard: DASHBOARD_NAV_ITEMS,
  admin: ADMIN_NAV_ITEMS,
};