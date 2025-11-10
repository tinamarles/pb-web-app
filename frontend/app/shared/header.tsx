// frontend/app/shared/header.tsx
// Figma Make components/layout/header.tsx

import { useState, memo, useCallback } from "react";
import {
  Button,
  Logo,
  Icon,
  // Search,
  Avatar,
  Dropdown,
  MenuItem,
} from "@/app/ui";

import { ButtonItem, LogoConfig } from "@/app/shared";
import { useAuth } from "@/app/providers/AuthUserProvider";

export interface HeaderProps {
  logo?: LogoConfig; // Logo configuration - OPTIONAL
  title?: string; // Header title text - OPTIONAL
  links?: LinkItem[]; // Navigation links - OPTIONAL
  buttons?: ButtonItem[]; // Action buttons - OPTIONAL
  showSearch?: boolean; // Show search functionality - OPTIONAL
  showHelp?: boolean; // Show help icon - OPTIONAL
  showNotifications?: boolean; // Show notifications icon - OPTIONAL
  showAvatar?: boolean; // Show avatar with dropdown - OPTIONAL
  className?: string; // Additional CSS classes - OPTIONAL
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
  icon: string; // Icon name
  label: string; // Item text
  url: string; // Destination URL
}

export const Header = memo(function Header({
  logo,
  title,
  links = [],
  buttons = [],
  showSearch = false,
  showHelp = false,
  showNotifications = false,
  showAvatar = false,
  className = "",
}: HeaderProps) {
  // Only keep mobile menu state - Dropdown component handles its own state
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { user, logout } = useAuth();

  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  const hasLinks = links.length > 0;
  const hasButtons = buttons.length > 0;
  const hasRightIcons =
    showSearch || showHelp || showNotifications || showAvatar;

  // Handle sign out
  const handleSignOut = useCallback(async () => {
    await logout();
  }, [logout]);

  // LOGO RENDER
  const renderLogo = () => {
    if (!logo || !logo.variant) return null;

    const logoElement = (
      <Logo size={logo.size || "md"} variant={logo.variant} />
    );

    if (logo.href) {
      return (
        <a href={logo.href} className="">
          {logoElement}
        </a>
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
      <Button key={link.href} asChild variant="subtle" size="md">
        <a
          href={link.href}
          className={`${link.active ? "active" : ""} ${
            link.disabled ? "disabled" : ""
          }`}
        >
          {link.icon && typeof link.icon === "string" && (
            <Icon name={link.icon} />
          )}
          {link.label}
        </a>
      </Button>
    );
  };

  // LINKS RENDER
  const renderLinks = (isMobile = false) => {
    if (!hasLinks) return null;

    return links.map((link) => renderNavItem(link));
  };

  // BUTTONS RENDER
  const renderButtons = (isMobile = false) => {
    if (!hasButtons) return null;

    // For mobile: icon-only buttons with subtle variant
    // For desktop: full buttons with icon + label
    if (isMobile) {
      return (
        <div className="header__actions-mobile">
          {buttons.map((button, index) => (
            <Button
              key={index}
              variant="subtle"
              size={button.size || "md"}
              onClick={button.onClick}
              disabled={button.disabled}
              icon={typeof button.icon === "string" ? button.icon : undefined}
            />
          ))}
        </div>
      );
    }

    // Desktop: return buttons directly with full icon + label
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

  // HELP ICON RENDER
  const renderHelpIcon = () => {
    if (!showHelp) return null;

    return (
      <a href="/help">
        <Button variant="subtle" size="md" icon="help" aria-label="Help" />
      </a>
    );
  };

  // SEARCH ICON RENDER
  const renderSearchIcon = () => {
    if (!showSearch) return null;

    return (
      <a href="/search">
        <Button variant="subtle" size="md" icon="search" aria-label="Search" />
      </a>
    );
  };

  // NOTIFICATIONS ICON RENDER
  const renderNotificationsIcon = () => {
    if (!showNotifications) return null;

    /* unreadNotifications is not yet implemented in backend 
    const unreadCount = user?.unreadNotifications || 0;
    const hasUnread = unreadCount > 0;
    */
    const hasUnread = 0;
    const unreadCount = 0;

    return (
      <div className="relative">
        <Button
          variant="subtle"
          size="md"
          icon="notifications"
          aria-label="Notifications"
        />
        {hasUnread && (
          <span
            className="absolute top-[6px] right-[6px] w-[8px] h-[8px] rounded-full bg-error"
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
        <MenuItem icon="user" label="Profile" href="/profile" />
        <MenuItem icon="settings" label="Settings" href="/settings" separator />

        <MenuItem
          icon="memberships"
          label="Club Memberships"
          href="/memberships"
        />
        <MenuItem icon="performance" label="Performance" href="/performance" />
        <MenuItem icon="community" label="Community" href="/community" />
        <MenuItem icon="blog" label="Personal Blog" href="/blog" separator />

        <MenuItem
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
      {/* Logo Container */}
      {logo && logo.variant && (
        <div className="header__logo">{renderLogo()}</div>
      )}

      {/* Links Container containing either Links or a Title */}
      <div className="header__links">
        {/* Title - not currently used*/}
        {title && (
          <div className="header__links__container">
            <h1 className="display-sm emphasized">{title}</h1>
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

      {/* Action Buttons - Desktop */}
      {hasButtons && !hasRightIcons && (
        <div className="header__actions">{renderButtons()}</div>
      )}

      {/* Mobile Hamburger Menu Button */}
      {hasLinks && (
        <div className="header__hamburger">
          <Button
            variant="subtle"
            size="md"
            onClick={toggleMenu}
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
      {hasLinks && isMenuOpen && (
        <div className="header__dropdown">
          <nav className="flex flex-col gap-sm">
            {/* Mobile Navigation Links */}
            {renderLinks(true)}

            {/* Mobile Search */}
            {showSearch && (
              <div className="pt-md">
                <Search placeholder="Search..." />
              </div>
            )}

            {/* Mobile Action Buttons */}
            {renderButtons(true)}
          </nav>
        </div>
      )}
    </header>
  );
});
