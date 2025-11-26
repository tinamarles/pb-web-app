// === MODIFICATION LOG ===
// Date: 2025-11-17 UTC
// Modified by: Assistant
// Changes: Added 'moremenu' context to MenuItem component
// - Updated MenuItemProps: context now includes 'moremenu'
// - Added moremenu rendering logic (uses .more-menu__item classes)
// - MorePage.tsx can now use <MenuItem context="moremenu"> instead of raw Links
// Previous: Only supported 'dropdown' and 'sidebar' contexts
// Reason: DRY principle - MorePage shouldn't duplicate MenuItem logic
// ========================

// === MODIFICATION LOG ===
// Date: 2025-11-17 UTC
// Modified by: Assistant
// Changes: Removed useless 'menu-item-disabled' class from className building (line 199)
// - CSS handles disabled state via :disabled pseudo-selector for buttons
// - CSS handles disabled state via [aria-disabled="true"] for links
// - The class 'menu-item-disabled' didn't exist in CSS anyway
// Previous: disabled ? 'menu-item-disabled' : '' (non-functional code)
// Reason: Bug fix - removing dead code, relying on CSS pseudo-selectors
// ========================

// === MODIFICATION LOG ===
// Date: 2025-11-13 UTC
// Modified by: Assistant
// Changes: Unified MenuItem and SidebarMenuItem into ONE component
// - Added 'context' prop to handle 'dropdown' vs 'sidebar' styling
// - Uses <Badge> component for badges/alerts (follows Guideline #20)
// - Removed onClick from <Link> (Q1 fix)
// - Uses appropriate CSS classes based on context
// Previous: Had two separate components (MenuItem and SidebarMenuItem) doing the same thing
// Reason: DRY principle - one menu item component for all contexts
// ========================

import { Icon } from "./icon";
import { Badge } from "./badge";
import { ReactNode } from "react";
import Link from "next/link";

/**
 * MenuItem Props
 */
export interface MenuItemProps {
  /** Optional icon name (from Icon component) */
  icon?: string;

  /** Show bordered frame around icon (dropdown context only) */
  iconBordered?: boolean;

  /** Menu item label text */
  label?: string;

  /** Context determines styling: 'dropdown' for menus, 'sidebar' for navigation */
  context?: "dropdown" | "sidebar" | "moremenu";

  /** Is this menu item currently active? (sidebar context only) */
  active?: boolean;

  /** Badge count (e.g., notification count) - uses Badge component */
  badgeCount?: number;

  /** Show alert icon (for warnings/errors) - uses Badge component with icon */
  showAlert?: boolean;

  /** Show trailing icon (chevron for sub-menus) */
  showTrailing?: boolean;

  /** Trailing icon name (defaults to 'chevronright') */
  trailingIcon?: string;

  /** Optional custom trailing element (dropdown context) */
  trailingItem?: ReactNode;

  /** Visual variant - 'danger' for destructive actions (dropdown context) */
  variant?: "default" | "danger";

  /** Click handler for button-style items */
  onClick?: () => void;

  /** Link href for navigation items */
  href?: string;

  /** Show separator line below this item (dropdown context) */
  separator?: boolean;

  /** Disabled state */
  disabled?: boolean;

  /** Additional CSS classes to apply to the menu item */
  className?: string;
}

/**
 * MenuItem Component
 *
 * A unified, reusable menu item component that works in dropdowns, sidebars, and mobile more menus.
 * Uses the 'context' prop to determine appropriate styling and behavior.
 *
 * Features:
 * - Works in dropdowns (context='dropdown'), sidebars (context='sidebar'), and more menus (context='moremenu')
 * - Supports both link and button modes
 * - Uses <Badge> component for badges and alerts (follows design system)
 * - Optional icons (leading and trailing)
 * - Active state styling (sidebar)
 * - Variant support for danger/destructive actions (dropdown)
 * - Uses CSS variables for all styling
 *
 * @example
 * ```tsx
 * // Dropdown menu item
 * <MenuItem
 *   context="dropdown"
 *   icon="user"
 *   label="Profile"
 *   href="/profile"
 *   iconBordered
 * />
 *
 * // Sidebar menu item with badge
 * <MenuItem
 *   context="sidebar"
 *   icon="memberships"
 *   label="Club Memberships"
 *   href="/memberships"
 *   badgeCount={12}
 *   active
 * />
 *
 * // More menu item with trailing icon
 * <MenuItem
 *   context="moremenu"
 *   icon="settings"
 *   label="Settings"
 *   href="/settings"
 *   showTrailing
 * />
 *
 * // Danger action
 * <MenuItem
 *   context="dropdown"
 *   icon="signout"
 *   label="Sign Out"
 *   variant="danger"
 *   onClick={handleSignOut}
 * />
 * ```
 */
export function MenuItem({
  icon,
  iconBordered = true,
  label,
  context = "dropdown",
  active = false,
  badgeCount,
  showAlert = false,
  showTrailing = false,
  trailingIcon = "chevronright",
  trailingItem,
  variant = "default",
  onClick,
  href,
  separator = false,
  disabled = false,
  className = "",
}: MenuItemProps) {
  // Build appropriate content based on context
  const content =
    context === "sidebar" ? (
      // SIDEBAR CONTEXT: icon + label + optional trailing/badge/alert
      <>
        {/* Leading Icon with Badge/Alert positioned on it */}
        {icon && (
          <div className="relative">
            <Icon name={icon} size="xl" bordered={iconBordered} />
            {/* Badge (notification count) - positioned on icon */}
            {badgeCount !== undefined && badgeCount > 0 && (
              <span className="sidebar__badge">{badgeCount}</span>
            )}

            {/* Alert Icon - positioned on icon */}
            {showAlert && (
              <span className="sidebar__badge bg-error text-on-error">!</span>
            )}
          </div>
        )}

        {/* Label */}
        <span className="label-lg">{label}</span>

        {/* Trailing Icon (chevron for sub-menu) */}
        {showTrailing && (
          <div className="sidebar__trailing">
            <Icon name={trailingIcon} className="icon-sm" />
          </div>
        )}
      </>
    ) : context === "moremenu" ? (
      // MOREMENU CONTEXT: icon + label + optional trailing/badge/alert
      <>
        {/* Leading Icon with Badge/Alert positioned on it */}
        {icon && (
          <div className="relative">
            <Icon name={icon} size="xl" bordered={iconBordered} />
            {/* Badge (notification count) - positioned on icon */}
            {badgeCount !== undefined && badgeCount > 0 && (
              <span className="more-menu__badge">{badgeCount}</span>
            )}

            {/* Alert Icon - positioned on icon */}
            {showAlert && (
              <span className="more-menu__badge bg-error text-on-error">!</span>
            )}
          </div>
        )}

        {/* Label */}
        <span className="more-menu__item-label">{label}</span>

        {/* Trailing Icon (chevron for sub-menu) */}
        {showTrailing && (
          <div className="more-menu__item-trailing">
            <Icon name={trailingIcon} className="icon-sm" />
          </div>
        )}
      </>
    ) : (
      // DROPDOWN CONTEXT: icon + label + optional trailingItem
      <>
        {icon && (
          <div className="relative">
            <Icon name={icon} size="lg" bordered={iconBordered}/>
          </div>
        )}
        <span className="menu-item-label">{label}</span>
        {trailingItem && (
          <div className="menu-item-trailing">{trailingItem}</div>
        )}
      </>
    );

  // Build appropriate className based on context
  const itemClasses =
    context === "sidebar"
      ? `sidebar__item ${active ? "active" : ""} ${className}`
      : context === "moremenu"
      ? `more-menu__item ${className}`
      : ["menu-item", `menu-item-${variant}`, className]
          .filter(Boolean)
          .join(" ");

  // Render as Link or button based on href
  const itemContent = href ? (
    <Link href={href} 
        className={itemClasses} 
        aria-disabled={disabled}>
      {content}
    </Link>
  ) : (
    <button
      onClick={onClick}
      disabled={disabled}
      className={itemClasses}
      type="button"
    >
      {content}
    </button>
  );

  // For dropdown context, wrap with separator support
  if (context === "dropdown") {
    return (
      <div
        className={
          separator
            ? "menu-item-wrapper menu-item-separator"
            : "menu-item-wrapper"
        }
      >
        {itemContent}
      </div>
    );
  }

  // For sidebar context, return item directly
  return itemContent;
}
