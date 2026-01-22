// Module data - TypeScript version for reliable imports
// This simulates the expected API response. In reality, the result will not be an array as the component <Module> will
// fetch the data for the relevant Module by id={id} and the response will be a single object.

// ═══════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════
// Think of these as "blueprints" that tell TypeScript what shape your data has

import { SubmenuItem } from "@/shared";

// Navigation item structure
interface NavigationItem {
  icon?: string;
  label: string;
  url: string;
  submenu?: SubmenuItem[]; // "[]" means it's an ARRAY of SubmenuItems
}

// Action button structure
interface ActionItem {
  id: string;
  label: string;
  variant: string;
  size: string;
  icon?: string;
  onClick: string;
}

// Navigation button structure (for Link-based buttons, no onClick handler)
interface NavigationButtonItem {
  id: string;
  label?: string;
  variant: string;
  size: string;
  icon?: string;
  href: string;
}
// Main module configuration structure
// "export" means other files can import and use this type
export interface ModuleConfig {
  id: number;
  type: string;
  title?: string | null; // "|" means "OR" - can be string OR null
  showLogo: boolean; // Show logo in header (mutually exclusive with showBack)
  showBack?: boolean; // Show back button in header (mutually exclusive with showLogo)
  backHref?: string; // Where to navigate when back button is clicked
  navigation: NavigationItem[];
  search?: boolean;
  help?: boolean;
  notifications?: boolean;
  avatar?: boolean;
  actions: ActionItem[];
  navigationButtons?: NavigationButtonItem[]; // NEW: Navigation buttons (with hrefs, not handlers)
}

// ═══════════════════════════════════════════════════════════════════
// THE ACTUAL DATA
// ═══════════════════════════════════════════════════════════════════
// ": ModuleConfig[]" tells TypeScript: "this is an array of ModuleConfig objects"
// Now TypeScript will check that every object matches the ModuleConfig blueprint!

export const apiResponseModule: ModuleConfig[] = [
  {
    id: 1,
    type: "landing",
    title: null,
    showLogo: true,
    navigation: [
      {
        icon: "sparkles",
        label: "Discover",
        url: "",
        submenu: [
          {
            icon: "clubs",
            label: "Clubs",
            url: "/club/list",
          },
          {
            icon: "courts",
            label: "Courts",
            url: "/courts",
          },
          {
            icon: "events",
            label: "Events & Leagues",
            url: "/event/list",
          },
          {
            icon: "coaches",
            label: "Coaches",
            url: "/coaches",
          },
          {
            icon: "library",
            label: "Drill Library",
            url: "/drills",
          },
          {
            icon: "links",
            label: "Useful Links",
            url: "/links",
          },
        ],
      },
      {
        icon: "zap",
        label: "Quick Actions",
        url: "",
        submenu: [
          {
            icon: "calendar",
            label: "View Your Schedule",
            url: "/schedule",
          },
          {
            icon: "book-court",
            label: "Book a Court",
            url: "/book_court",
          },
          {
            icon: "matches",
            label: "Record a Result",
            url: "/add_result",
          },
          {
            icon: "send",
            label: "Contact a Member",
            url: "/contact_member",
          },
        ],
      },
    ],
    search: true,
    help: true,
    actions: [],
    navigationButtons: [
      {
        id: "login",
        label: "Sign In",
        variant: "outlined",
        size: "md",
        href: "/login",
      },
      {
        id: "signup",
        label: "Sign Up",
        variant: "filled",
        size: "md",
        href: "/signup",
      },
    ],
  },
  {
    id: 2,
    type: "dashboard",
    title: "Dashboard",
    showLogo: true,
    showBack: true, // Show back button on mobile/tablet instead of logo
    navigation: [
      {
        icon: "dashboard",
        label: "Dashboard",
        url: "/dashboard/overview",
      },
      {
        icon: "sparkles",
        label: "Discover",
        url: "",
        submenu: [
          {
            icon: "clubs",
            label: "Clubs",
            url: "/club/list",
          },
          {
            icon: "courts",
            label: "Courts",
            url: "/courts",
          },
          {
            icon: "events",
            label: "Events & Leagues",
            url: "/event/list",
          },
          {
            icon: "coaches",
            label: "Coaches",
            url: "/coaches",
          },
          {
            icon: "library",
            label: "Drill Library",
            url: "/drills",
          },
          {
            icon: "links",
            label: "Useful Links",
            url: "/links",
          },
        ],
      },
      {
        icon: "zap",
        label: "Quick Actions",
        url: "",
        submenu: [
          {
            icon: "calendar",
            label: "View Your Schedule",
            url: "/schedule",
          },
          {
            icon: "book-court",
            label: "Book a Court",
            url: "/book_court",
          },
          {
            icon: "matches",
            label: "Record a Result",
            url: "/add_result",
          },
          {
            icon: "send",
            label: "Contact a Member",
            url: "/contact_member",
          },
        ],
      },
    ],
    search: true,
    help: true,
    notifications: true,
    avatar: true,
    actions: [],
  },
  {
    id: 3,
    type: "auth",
    title: null,
    showLogo: true,
    navigation: [],
    search: false,
    help: true,
    actions: [],
    navigationButtons: [
      {
        id: "home",
        label: "Home",
        variant: "subtle",
        size: "md",
        href: "/",
      },
    ],
  },
  {
    id: 4,
    type: "profile",
    showLogo: true,
    showBack: true, // Show back button on mobile/tablet instead of logo
    navigation: [
      {
        icon: "dashboard",
        label: "Dashboard",
        url: "/dashboard/overview",
      },
      {
        icon: "sparkles",
        label: "Discover",
        url: "",
        submenu: [
          {
            icon: "clubs",
            label: "Clubs",
            url: "/club/list",
          },
          {
            icon: "courts",
            label: "Courts",
            url: "/courts",
          },
          {
            icon: "events",
            label: "Events & Leagues",
            url: "/event/list",
          },
          {
            icon: "coaches",
            label: "Coaches",
            url: "/coaches",
          },
          {
            icon: "library",
            label: "Drill Library",
            url: "/drills",
          },
          {
            icon: "links",
            label: "Useful Links",
            url: "/links",
          },
        ],
      },
      {
        icon: "zap",
        label: "Quick Actions",
        url: "",
        submenu: [
          {
            icon: "calendar",
            label: "View Your Schedule",
            url: "/schedule",
          },
          {
            icon: "book-court",
            label: "Book a Court",
            url: "/book_court",
          },
          {
            icon: "matches",
            label: "Record a Result",
            url: "/add_result",
          },
          {
            icon: "send",
            label: "Contact a Member",
            url: "/contact_member",
          },
        ],
      },
    ],
    search: true,
    help: true,
    notifications: true,
    avatar: true,
    actions: [],
  },
  {
    id: 5,
    type: "admin",
    title: "Admin Panel",
    showLogo: true,
    navigation: [
      {
        icon: "community",
        label: "Users",
        url: "/admin/users",
      },
      {
        icon: "settings",
        label: "Settings",
        url: "/admin/settings",
      },
      {
        icon: "performance",
        label: "Analytics",
        url: "/admin/analytics",
      },
    ],
    search: true,
    actions: [
      {
        id: "export",
        label: "Export Data",
        variant: "tonal",
        size: "sm",
        icon: "download",
        onClick: "handleExport",
      },
      {
        id: "signout",
        label: "Sign Out",
        variant: "subtle",
        size: "md",
        icon: "signout",
        onClick: "handleSignOut",
      },
    ],
  },
  {
    id: 8,
    type: "default",
    title: null,
    showLogo: true,
    showBack: true,
    navigation: [
      {
        icon: "dashboard",
        label: "Dashboard",
        url: "/dashboard/overview",
      },
      {
        icon: "sparkles",
        label: "Discover",
        url: "",
        submenu: [
          {
            icon: "clubs",
            label: "Clubs",
            url: "/club/list",
          },
          {
            icon: "courts",
            label: "Courts",
            url: "/courts",
          },
          {
            icon: "events",
            label: "Events & Leagues",
            url: "/event/list",
          },
          {
            icon: "coaches",
            label: "Coaches",
            url: "/coaches",
          },
          {
            icon: "library",
            label: "Drill Library",
            url: "/drills",
          },
          {
            icon: "links",
            label: "Useful Links",
            url: "/links",
          },
        ],
      },
      {
        icon: "zap",
        label: "Quick Actions",
        url: "",
        submenu: [
          {
            icon: "calendar",
            label: "View Your Schedule",
            url: "/schedule",
          },
          {
            icon: "book-court",
            label: "Book a Court",
            url: "/book_court",
          },
          {
            icon: "matches",
            label: "Record a Result",
            url: "/add_result",
          },
          {
            icon: "send",
            label: "Contact a Member",
            url: "/contact_member",
          },
        ],
      },
    ],
    search: true,
    help: true,
    notifications: true,
    avatar: true,
    actions: [],
  },
];

export default apiResponseModule;
