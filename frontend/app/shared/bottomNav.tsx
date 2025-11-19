'use client';

import { Button, Icon, Avatar } from '@/app/ui';
import Link from 'next/link';
import { useAuth } from '@/app/providers/AuthUserProvider';

export interface BottomNavItem {
  type: 'link' | 'fab' | 'more';
  id: string;
  icon: string;
  label: string;
  href?: string;          // For 'link' type
  onClick?: () => void;   // For 'fab' and 'more' types
  badge?: number;         // Optional notification badge
  active?: boolean;       // Is this item currently active?
}

export interface BottomNavProps {
  items?: BottomNavItem[];
  className?: string;
}

/**
 * BottomNav - Mobile bottom navigation bar component
 * 
 * This component creates an app-like bottom navigation bar with:
 * - Up to 5 navigation items
 * - Center FAB (Floating Action Button) support
 * - Active state indicators
 * - Notification badges
 * 
 * USAGE:
 * <BottomNav items={[
 *   { type: 'link', id: 'dashboard', icon: 'dashboard', label: 'Dashboard', href: '/dashboard' },
 *   { type: 'fab', id: 'quick', icon: 'add', label: 'Quick', onClick: handleFAB },
 *   { type: 'more', id: 'more', icon: 'menu', label: 'More', onClick: handleMore },
 * ]} />
 */
export function BottomNav({ items = [], className = '' }: BottomNavProps) {
  
  const { user } = useAuth();

  // RENDER INDIVIDUAL NAV ITEM
  const renderNavItem = (item: BottomNavItem) => {
    const isFAB = item.type === 'fab';
    const isMore = item.type === 'more';
    const baseClasses = `bottom-nav__item ${item.active ? 'active' : ''}`;
    const fabClasses = isFAB ? 'bottom-nav__item--fab' : '';
    
    // Build the content (icon/avatar + label)
    const content = (
      <>
        {/* Icon/Avatar with optional badge */}
        <div className="relative">
          {isMore && user ? (
            // Show user avatar for "More" button
            <Avatar 
              size="sm"
              src={user.profilePictureUrl || undefined}
              name={user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username}
              className="avatar-container"
            />
          ) : (
            <Icon name={item.icon} className="icon-lg" />
          )}
          {/* Badge */}
          {item.badge && item.badge > 0 && (
            <span className="bottom-nav__badge">{item.badge > 99 ? '99+' : item.badge}</span>
          )}
        </div>
        
        {/* Label (not shown for FAB) */}
        {!isFAB && <span className="bottom-nav__label">{item.label}</span>}
      </>
    );
    
    // For 'link' or 'more' with href: Render as Link
    if (item.href) {
      return (
        <Link
          key={item.id}
          href={item.href}
          className={`${baseClasses} ${fabClasses}`}
        >
          {content}
        </Link>
      );
    }
    
    // For FAB or items with onClick: Render as button
    return (
      <button
        key={item.id}
        className={`${baseClasses} ${fabClasses}`}
        onClick={item.onClick}
        aria-label={item.label}
      >
        {content}
      </button>
    );
  };

  return (
    <nav className={`bottom-nav ${className}`}>
      {items.map((item) => renderNavItem(item))}
    </nav>
  );
}