'use client';

import { useState, useRef, useEffect } from 'react';
import { Button, Icon, Avatar, MenuItem } from '@/app/ui';
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
 *   { type: 'fab', id: 'quick', icon: 'chevronup', label: 'Quick', onClick: handleFAB },
 *   { type: 'more', id: 'more', icon: 'menu', label: 'More', onClick: handleMore },
 * ]} />
 */
export function BottomNav({ items = [], className = '' }: BottomNavProps) {
  
  const { user } = useAuth();
  const [fabMenuOpen, setFabMenuOpen] = useState(false);
  const fabMenuRef = useRef<HTMLDivElement>(null);

  // Quick Actions menu items (same as header dropdown)
  const quickActionsItems = [
    { icon: 'calendar', label: 'View Your Schedule', href: '/schedule' },
    { icon: 'book-court', label: 'Book a Court', href: '/book_court' },
    { icon: 'matches', label: 'Record a Result', href: '/add_result' },
    { icon: 'send', label: 'Contact a Member', href: '/contact_member' },
  ];

  // Close FAB menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fabMenuOpen && fabMenuRef.current && !fabMenuRef.current.contains(event.target as Node)) {
        setFabMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [fabMenuOpen]);

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
            // For FAB: show dynamic icon based on menu state
            <Icon 
              name={isFAB ? (fabMenuOpen ? 'close' : 'chevronup') : item.icon} 
              className={isFAB ? 'icon-2xl': 'icon-lg'}  
            />
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
    
    // For FAB: Render as button with menu toggle
    if (isFAB) {
      return (
        <button
          key={item.id}
          className={`${baseClasses} ${fabClasses}`}
          onClick={() => setFabMenuOpen(!fabMenuOpen)}
          aria-label={item.label}
          aria-expanded={fabMenuOpen}
        >
          {content}
        </button>
      );
    }

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
    <>
    {/* FAB Dropdown Menu - Positioned above bottom nav */}
      {fabMenuOpen && (
        
        <div 
          ref={fabMenuRef}
          className="fixed flex flex-col gap-md bottom-[88px] left-1/2 -translate-x-1/2 z-50 bg-surface-container rounded-2xl shadow-lg min-w-content p-sm"
        >
          {quickActionsItems.map((action) => (
            <MenuItem
              key={action.href}
              icon={action.icon}
              iconBordered={true}
              label={action.label}
              href={action.href}
              context="dropdown"
              onClick={() => setFabMenuOpen(false)}
            />
          ))}
        </div>
       
      )}

      {/* Bottom Navigation Bar */}
      <nav className={`bottom-nav ${fabMenuOpen ? 'opacity-80' : ''} ${className}`}>
        {items.map((item) => renderNavItem(item))}
      </nav>
    </>
  );
}