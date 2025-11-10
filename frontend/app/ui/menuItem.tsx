// === MODIFICATION LOG ===
// Date: 2025-10-28 20:45 UTC
// Modified by: Assistant
// Changes: Added className prop to MenuItemProps to allow custom styling overrides
// Previous: No className prop - couldn't customize individual menu items (e.g., text color)
// Impact: All components now accept className for extensibility (per Guidelines requirement)
// Usage: <MenuItem icon="signout" label="Sign Out" className="text-error" />
// ========================
// Date: 2025-10-28 19:30 UTC
// Modified by: Assistant
// Changes: Changed Icon to use size="md" prop instead of className="icon-md"
// Previous: Icon used className which didn't auto-size the bordered frame
// Impact: Icon bordered frames now auto-size to 26px (18px icon + 8px) - fixes user Issue #2
// ========================
// Date: 2025-10-28 17:45 UTC
// Modified by: Assistant
// Changes: Removed iconShowBorder prop - now uses simplified Icon component API
// Previous: Had iconShowBorder prop that was redundant with iconBordered
// Impact: Cleaner API, follows simplified Icon component changes
// ========================
// Date: 2025-10-28 UTC
// Created by: Assistant
// Changes: Created new MenuItem component for custom dropdown menus
// Purpose: Reusable menu item with icon, label, and trailing item support
// Features: Supports links, buttons, separators, variants (default/danger)
// ========================

import { Icon } from './icon';
import { ReactNode } from 'react';

/**
 * MenuItem Props
 */
export interface MenuItemProps {
  /** Optional icon name (from Icon component) */
  icon?: string;
  /** Show bordered frame around icon - uses .icon-bordered class */
  iconBordered?: boolean;
  /** Menu item label text */
  label?: string;
  /** Optional trailing element (e.g., chevron, badge, shortcut) */
  trailingItem?: ReactNode;
  /** Visual variant - 'danger' for destructive actions like Sign Out */
  variant?: 'default' | 'danger';
  /** Click handler for button-style items */
  onClick?: () => void;
  /** Link href for navigation items */
  href?: string;
  /** Show separator line below this item */
  separator?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Additional CSS classes to apply to the menu item */
  className?: string;
}

/**
 * MenuItem Component
 * 
 * A reusable menu item component for dropdowns and menus.
 * Supports both link and button modes, with optional icons and trailing content.
 * Uses CSS variables for all styling to maintain design system consistency.
 * 
 * @example
 * ```tsx
 * <MenuItem icon="user" label="Profile" href="/profile" />
 * <MenuItem icon="settings" label="Settings" separator />
 * <MenuItem icon="signout" label="Sign Out" variant="danger" onClick={handleSignOut} />
 * <MenuItem icon="signout" label="Sign Out" className="text-error" iconBordered={false} />
 * ```
 */
export function MenuItem({
  icon,
  iconBordered = true,
  label,
  trailingItem,
  variant = 'default',
  onClick,
  href,
  separator = false,
  disabled = false,
  className = '',
}: MenuItemProps) {
  
  // Shared content structure
  const content = (
    <>
      {icon && (
        <div className="menu-item-icon">
          <Icon 
            name={icon} 
            size="lg"
            bordered={iconBordered}
          />
        </div>
      )}
      <span className="menu-item-label">{label}</span>
      {trailingItem && (
        <div className="menu-item-trailing">
          {trailingItem}
        </div>
      )}
    </>
  );

  // Build className: base classes + variant + disabled + custom className
  const itemClasses = [
    'menu-item',
    `menu-item-${variant}`,
    disabled ? 'menu-item-disabled' : '',
    className
  ].filter(Boolean).join(' ');

  // Wrapper with separator
  const itemContent = href ? (
    <a
      href={href}
      className={itemClasses}
      aria-disabled={disabled}
    >
      {content}
    </a>
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

  return (
    <div className={separator ? 'menu-item-wrapper menu-item-separator' : 'menu-item-wrapper'}>
      {itemContent}
    </div>
  );
}
