"use client";
// frontend/app/shared/header.tsx
// Figma Make components/layout/header.tsx
import Link from "next/link";
import { useRouter } from "next/navigation"; // add to imports
import { useState, memo, useCallback } from "react";
import {
  Button,
  ButtonItem,
  Badge,
  NavigationButtonItem,
  Logo,
  LogoConfig,
  Icon,
  Search,
  Avatar,
  Dropdown,
  MenuItem,
} from "@/ui";

import { useAuth } from "@/providers/AuthUserProvider";

export interface HeaderProps {
  logo?: LogoConfig; // Logo configuration - OPTIONAL
  title?: string; // Header title text - OPTIONAL
  links?: LinkItem[]; // Navigation links - OPTIONAL
  buttons?: ButtonItem[]; // Action buttons - OPTIONAL
  navigationButtons?: NavigationButtonItem[]; // Link-based buttons with no onClick handlers - OPTIONAL
  showSearch?: boolean; // Show search functionality - OPTIONAL
  showHelp?: boolean; // Show help icon - OPTIONAL
  showNotifications?: boolean; // Show notifications icon - OPTIONAL
  showAvatar?: boolean; // Show avatar with dropdown - OPTIONAL
  className?: string; // Additional CSS classes - OPTIONAL
  back?: boolean; // Show back button instead of logo on mobile/tablet - OPTIONAL
  backHref?: string; // Where to navigate when back button is clicked - OPTIONAL
}

export interface LinkItem {
  label: string; // Link text
  href: string; // Link destination (empty if has submenu)
  active?: boolean; // Is this link currently active? - OPTIONAL
  icon?: string; // Icon name from your unified system (case-insensitive) - OPTIONAL
  disabled?: boolean; // Is this link disabled? - OPTIONAL
  submenu?: SubmenuItem[]; // Submenu items - OPTIONAL
}

export interface SubmenuItem {
  icon?: string; // Icon name
  label: string; // Item text
  url: string; // Destination URL
}

export const Header = memo(function Header({
  logo,
  title,
  links = [],
  buttons = [],
  navigationButtons = [],
  showSearch = false,
  showHelp = false,
  showNotifications = false,
  showAvatar = false,
  className = "",
  back = false,
  backHref = "",
}: HeaderProps) {
  // Only keep mobile menu state - Dropdown component handles its own state
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { user, logout, unreadCount } = useAuth();

  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  const hasLinks = links.length > 0;
  const hasButtons = buttons.length > 0;
  const hasNavigationButtons = navigationButtons.length > 0;
  const hasRightIcons =
    showSearch || showHelp || showNotifications || showAvatar;

  // Handle sign out
  const handleSignOut = async () => {
    console.log("🔴 1. handleSignOut CALLED");
    try {
      await logout();
      console.log("🔴 2. logout() COMPLETED");
    } catch (error) {
      console.log("🔴 ERROR in logout:", error);
    }
    console.log(
      "🔴 3. After logout (should never reach here if redirect worked)"
    );
  };

  const router = useRouter();

  // Handle back button click
  const handleBack = useCallback(() => {
    if (backHref) {
      // Navigate to specific URL (client-side, no reload)
      router.push(backHref);
    } else {
      // Go back in browser history
      router.back();
    }
  }, [backHref, router]);

  // LOGO RENDER
  const renderLogo = () => {
    if (!logo || !logo.variant) return null;

    const logoElement = (
      <Logo size={logo.size || "md"} variant={logo.variant} />
    );

    if (logo.href) {
      return (
        <Link href={logo.href} className="">
          {logoElement}
        </Link>
      );
    }

    return <div className="">{logoElement}</div>;
  };

  // NAVIGATION ITEM RENDER (with or without dropdown)
  const renderNavItem = (link: LinkItem) => {
    const hasSubmenu = link.submenu && link.submenu.length > 0;

    if (hasSubmenu) {
      // Link with submenu - use Dropdown component
      return (
        <Dropdown
          key={link.label}
          trigger={
            <Button
              variant="subtle"
              size="md"
              className={`${link.active ? "active" : ""} ${
                link.disabled ? "disabled" : ""
              }`}
            >
              {link.icon && <Icon name={link.icon} />}
              {link.label}
              <Icon name="chevrondown" className="icon-sm" />
            </Button>
          }
          align="left"
          hoverEnabled={true}
        >
          {link.submenu!.map((item) => (
            <MenuItem
              context="dropdown"
              key={item.url}
              icon={item.icon}
              label={item.label}
              href={item.url}
            />
          ))}
        </Dropdown>
      );
    }

    // Regular link without submenu
    return (
      <Button
        key={link.href}
        variant="subtle"
        size="md"
        href={link.href}
        icon={link.icon}
        label={link.label}
        className={`${link.active ? "active" : ""} ${
          link.disabled ? "disabled" : ""
        }`}
      />
    );
  };

  // LINKS RENDER
  const renderLinks = () => {
    if (!hasLinks) return null;

    return links.map((link) => renderNavItem(link));
  };

  // BUTTONS RENDER
  const renderButtons = () => {
    if (!hasButtons) return null;

    // For mobile: icon-only buttons with subtle variant
    // For desktop: full buttons with icon + label

    return buttons.map((button, index) => (
      <Button
        key={index}
        variant={button.variant || "filled"}
        size={button.size || "md"}
        onClick={button.onClick}
        disabled={button.disabled}
        icon={typeof button.icon === "string" ? button.icon : undefined}
        label={button.label}
      />
    ));
  };

  // NAVIGATION BUTTONS RENDER
  const renderNavigationButtons = () => {
    if (!navigationButtons.length) return null;

    return navigationButtons.map((button, index) => (
      <Button
        key={button.id || index}
        variant={button.variant || "filled"}
        size={button.size || "md"}
        href={button.href} // ✅ Pass href directly!
        icon={button.icon}
        label={button.label}
        disabled={button.disabled}
      />
    ));
  };

  // HELP ICON RENDER
  const renderHelpIcon = () => {
    if (!showHelp) return null;

    return (
      <Link href="/help">
        <Button variant="subtle" size="md" icon="help" aria-label="Help" />
      </Link>
    );
  };

  // SEARCH ICON RENDER
  const renderSearchIcon = () => {
    if (!showSearch) return null;

    return (
      <Link href="/search">
        <Button variant="subtle" size="md" icon="search" aria-label="Search" />
      </Link>
    );
  };

  // NOTIFICATIONS ICON RENDER
  const renderNotificationsIcon = () => {
    if (!showNotifications) return null;

    /* unreadNotifications is not yet implemented in backend 
    const unreadCount = user?.unreadNotifications || 0;
    const hasUnread = unreadCount > 0;
    */
    const hasUnread = unreadCount > 0;

    return (
      <div className="relative">
        <Button
          variant="subtle"
          size="md"
          icon="notifications"
          aria-label={`Notifications${
            hasUnread ? ` (${unreadCount} unread)` : ""
          }`}
        />
        {hasUnread && (
          <Badge
            variant="error"
            size="sm"
            className="absolute top-[6px] right-[6px]"
            aria-label={`${unreadCount} unread notifications`}
          />
        )}
      </div>
    );
  };

  // AVATAR DROPDOWN RENDER
  const renderAvatarDropdown = () => {
    if (!showAvatar || !user) return null;

    return (
      <Dropdown
        trigger={
          <button
            className="rounded-full bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label="User menu"
          >
            <Avatar
              size="sm"
              className="avatar-container"
              src={user.profilePictureUrl || undefined}
              name={
                user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user.username
              }
            />
          </button>
        }
        align="right"
        hoverEnabled={true}
      >
        <MenuItem
          context="dropdown"
          icon="add"
          label="Create Event"
          href="/event/create"
        />
        <MenuItem
          context="dropdown"
          icon="add"
          label="Create a Club"
          href="/club/create"
          separator
        />
        <MenuItem
          context="dropdown"
          icon="profile"
          label="Profile"
          href="/profile/details"
        />
        <MenuItem
          context="dropdown"
          icon="settings"
          label="Settings"
          href="/profile/settings"
          separator
        />
        <MenuItem
          context="dropdown"
          icon="memberships"
          label="Memberships"
          href="/profile/memberships"
        />
        <MenuItem
          context="dropdown"
          icon="performance"
          label="Performance"
          href="/profile/performance"
        />
        <MenuItem
          context="dropdown"
          icon="community"
          label="Community"
          href="/profile/community"
        />
        <MenuItem
          context="dropdown"
          icon="blog"
          label="Personal Blog"
          href="/profile/blog"
          separator
        />

        {/* Sign Out Button - Centered */}
        <MenuItem
          context="dropdown"
          icon="signout"
          iconBordered={false}
          label="Sign Out"
          onClick={handleSignOut}
          className="text-primary"
        />
      </Dropdown>
    );
  };

  return (
    <header className={`header ${className}`}>
      {/* Logo Container - Desktop shows logo, Mobile/Tablet shows back button if back=true */}
      {logo && logo.variant && !back && (
        <div className="header__logo">{renderLogo()}</div>
      )}

      {/* Back Button - Mobile/Tablet only */}
      {back && backHref && (
        <div className="header__logo lg:hidden">
          <Button
            variant="subtle"
            size="md"
            aria-label="Go back"
            href={backHref}
            icon="arrowleft"
          />
        </div>
      )}

      {/* Back Button fallback (no backHref) - Mobile/Tablet only */}
      {back && !backHref && (
        <div className="header__logo lg:hidden">
          <Button
            variant="subtle"
            size="md"
            onClick={handleBack}
            icon="arrowleft"
            aria-label="Go back"
          />
        </div>
      )}

      {/* Logo for Desktop when back=true */}
      {logo && logo.variant && back && (
        <div className="header__logo hidden lg:flex">{renderLogo()}</div>
      )}

      {/* Links Container containing either Links or a Title */}
      <div className="header__links">
        {/* Title - Mobile only, centered */}
        {title && (
          <div className="header__title">
            <h1 className="">{title}</h1>
          </div>
        )}

        {/* Navigation Links - Desktop */}
        {hasLinks && (
          <nav className="header__links__container">{renderLinks()}</nav>
        )}
      </div>

      {/* Right Side Icons Container */}
      {hasRightIcons && (
        <div className="flex items-center gap-xs">
          {/* Search - Desktop Only */}
          {/* 
          {showSearch && (
            <div className="header__search">
              <Search placeholder="Search..." />
            </div>
          )}
          */}

          {/* Search Icon */}
          {renderSearchIcon()}

          {/* Help Icon */}
          {renderHelpIcon()}

          {/* Notifications Icon */}
          {renderNotificationsIcon()}

          {/* Avatar Dropdown */}
          {renderAvatarDropdown()}
        </div>
      )}

      {/* Action Buttons - Desktop - show alongside right icons OR alone */}
      {hasButtons && <div className="header__actions">{renderButtons()}</div>}

      {/* Navigation Buttons - Desktop - show alongside right icons OR alone */}
      {navigationButtons && (
        <div className="header__actions">{renderNavigationButtons()}</div>
      )}

      {/* Mobile Hamburger Menu Button */}
      {(hasLinks || hasNavigationButtons) && (
        <div className="header__hamburger">
          <Button
            variant="subtle"
            size="md"
            onClick={toggleMenu}
            className="bg-surface-container/80"
            icon={isMenuOpen ? "close" : "menu"}
            aria-label="Toggle navigation menu"
          />
        </div>
      )}

      {/* Mobile Actions (when no links) */}
      {!hasLinks && hasButtons && (
        <div className="lg:hidden ml-auto">{renderButtons()}</div>
      )}

      {/* Mobile Navigation Dropdown */}
      {(hasLinks || navigationButtons) && isMenuOpen && (
        <div className="header__dropdown">
          {/* Mobile Search - uses .header__search (CSS makes it visible + centered in dropdown) */}
          {showSearch && (
            <div className="header__search">
              <Search placeholder="Search..." />
            </div>
          )}
          {/* Mobile Navigation Links - uses same .header__links__container (CSS makes it flex-col in dropdown) */}
          {hasLinks && (
            <nav className="header__links__container">{renderLinks()}</nav>
          )}

          {/* Mobile Buttons (both Nav buttons and Action buttons) - uses same .header__actions (CSS makes it flex-col centered in dropdown) */}
          {(navigationButtons || hasButtons) && (
            <div className="header__actions">
              {renderNavigationButtons()}
              {renderButtons()}
            </div>
          )}
        </div>
      )}
    </header>
  );
});
