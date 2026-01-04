"use client";
import { memo, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/providers/AuthUserProvider";
import { Header, HeaderProps, LinkItem } from "./header";
import { BottomNav, BottomNavItem } from "./bottomNav";
import { Footer } from "./footer";
import { ModuleConfig, apiResponseModule } from "@/data/apiResponseModule";
import {
  ButtonVariant,
  ButtonSize,
  ButtonItem,
  NavigationButtonItem,
  LogoConfig,
} from "@/ui";

// Import action handlers for dynamic function calling
import { executeAction } from "./utils";
import { ModuleProps } from "./types";

export const Module = memo(function Module({
  type,
  children,
  title,
}: ModuleProps) {
  // Added functionality to ensure mobile versions use a bottomNav Bar

  const { user, isMemberUser } = useAuth();
  const pathname = usePathname() || "/";
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport (< 1024px = lg breakpoint)
  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      const isMobileViewport = width < 1024;

      setIsMobile(isMobileViewport);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // 🆕 ADD THIS: Dynamic title based on pathname
  const getDynamicTitle = (): string | undefined => {
    if (!isMobile) return undefined; // Title only on mobile

    // 1. Explicit title prop takes priority
    if (title) return title;

    // 2. Pathname-based dynamic titles
    if (pathname.startsWith("/dashboard")) return "Dashboard";
    if (pathname.startsWith("/profile")) return "Profile";
    if (pathname.startsWith("/admin")) return "Admin Dashboard";

    // 3. Fallback to moduleData.title
    const moduleData = getModuleData(type);
    return moduleData.title || undefined;
  };
  // Determine if we should show bottom nav
  const shouldShowBottomNav = isMobile && !!user;

  // 1. Get data from TypeScript config based on type
  const getModuleData = (moduleType: string): ModuleConfig => {
    const config = apiResponseModule.find((m) => m.type === moduleType);
    if (config) {
      return config;
    }

    const fallbackConfig = apiResponseModule.find((m) => m.type === "landing");

    if (!fallbackConfig) {
      console.error("❌ Critical: No landing fallback found, using default");
      // Should never happen with our TypeScript data, but safety first
      return {
        id: 0,
        type: "default",
        title: null,
        showLogo: true,
        navigation: [],
        search: false,
        actions: [],
      };
    }

    return fallbackConfig;
  };

  // 2. Dynamic action handler - delegates to utils/action-handlers
  const handleAction = (actionId: string) => {
    executeAction(actionId);
  };

  // 3. Prep headerProps with JSON data
  const prepHeaderProps = (): HeaderProps => {
    const moduleData = getModuleData(type);

    // Convert JSON navigation to LinkItem[] format (with submenu support)
    const links: LinkItem[] = (moduleData.navigation || []).map((nav) => ({
      label: nav.label || "Unknown",
      href: nav.url || "#",
      icon: nav.icon || undefined, // Pass string icon name, not component
      active: false,
      disabled: false,
      submenu: nav.submenu
        ? nav.submenu.map((sub) => ({
            icon: sub.icon,
            label: sub.label,
            url: sub.url,
          }))
        : undefined,
    }));

    // Convert JSON actions to ButtonItem[] format with onClick handlers
    const buttons: ButtonItem[] = (moduleData.actions || []).map((action) => ({
      label: action.label || "Action",
      variant: (action.variant as ButtonVariant) || "subtle",
      size: (action.size as ButtonSize) || "md",
      icon: action.icon || undefined,
      onClick: () => handleAction(action.onClick || "unknown"),
      // disabled: action.disabled || false
    }));

    // Convert JSON navigationButtons to NavigationButtonItem[] format (no onClick, just href)
    const navigationButtons: NavigationButtonItem[] = (
      moduleData.navigationButtons || []
    ).map((navBtn) => ({
      label: navBtn.label,
      variant: (navBtn.variant as ButtonVariant) || "subtle",
      size: (navBtn.size as ButtonSize) || "md",
      icon: navBtn.icon || undefined,
      href: navBtn.href,
    }));

    // Determine logo configuration
    // showLogo and showBack are mutually exclusive
    let logoConfig: LogoConfig | undefined = undefined;
    if (moduleData.showBack) {
      // Show back button instead of logo on mobile/tablet (handled via back prop)
      // Desktop still shows logo
      logoConfig = {
        variant: isMobile ? "icon-only" : "full",
        size: "md",
        href: "/",
      };
    } else if (moduleData.showLogo) {
      // Show logo - mobile shows icon only, desktop shows full
      logoConfig = {
        variant: isMobile ? "icon-only" : "full",
        size: "md",
        href: "/",
      };
    }

    // Build header configuration
    // MOBILE + LOGGED IN: No hamburger menu, no avatar dropdown (handled by bottom nav)
    // Otherwise: Standard header
    const headerProps: HeaderProps = {
      logo: logoConfig,
      title: getDynamicTitle(), // ✅ Use dynamic title instead!
      links: shouldShowBottomNav ? [] : links, // Mobile logged in: no nav links
      buttons: shouldShowBottomNav ? [] : buttons, // Mobile logged in: no action buttons
      navigationButtons: shouldShowBottomNav ? [] : navigationButtons, // Mobile logged in: no nav buttons
      showSearch: moduleData.search || false,
      showHelp: moduleData.help || false,
      showNotifications: moduleData.notifications || false,
      showAvatar: shouldShowBottomNav ? false : moduleData.avatar || false, // Mobile logged in: no avatar
      back: moduleData.showBack || false, // Show back button (mobile/tablet only)
      backHref: moduleData.backHref, // Where to navigate when back button is clicked
    };

    return headerProps;
  };
  // Resolve dashboard href based on membership
  const resolvedDashboardHref = isMemberUser
    ? "/dashboard/overview"
    : "/feed/discover";

  // 4. Prep bottomNav props (only for mobile + logged in)
  // Active state is detected here using pathname before passing to BottomNav
  const buildBottomNavItems = (): BottomNavItem[] => {
    return [
      {
        type: "link",
        id: "dashboard",
        icon: "dashboard",
        label: "Dashboard",
        href: resolvedDashboardHref,
        active: pathname === resolvedDashboardHref,
      },
      {
        type: "link",
        id: "leagues",
        icon: "leagues",
        label: "Leagues",
        href: "/leagues",
        active: pathname === "/leagues",
      },
      {
        type: "fab",
        id: "quick-actions",
        icon: "add",
        label: "Quick Actions",
        // onClick removed - BottomNav component now handles FAB menu toggle internally
      },
      {
        type: "link",
        id: "clubs",
        icon: "clubs",
        label: "Clubs",
        href: "/club/list",
        active: pathname === "/club/list",
      },
      {
        type: "more",
        id: "more",
        icon: "menu", // This will be replaced with user avatar in BottomNav
        label: "More",
        // href: "/more",
        // active: pathname === "/more",
      },
    ];
  };

  // 5. Render Module with Header and Footer
  const headerProps = prepHeaderProps();
  const bottomNavItems = shouldShowBottomNav ? buildBottomNavItems() : [];

  // Client render
  return (
    <div className="module-container">
      <Header {...headerProps} />
      <main className="page">{children}</main>
      {/* Mobile + Logged In: Show BottomNav instead of Footer */}
      {shouldShowBottomNav ? <BottomNav items={bottomNavItems} /> : <Footer />}
    </div>
  );
});
