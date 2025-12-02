// === MODIFICATION LOG ===
// Date: 2025-10-28 UTC
// Created by: Assistant
// Changes: Created new custom Dropdown component (replacing ShadCN)
// Purpose: Full control over dropdown behavior and styling
// Features: Supports hover and click to open, click-away detection, CSS-driven styling
// ========================

'use client';

import { ReactNode, useState, useRef, useEffect } from 'react';

/**
 * Render function type for trigger prop
 */
export type TriggerRenderFunction = (isOpen: boolean) => ReactNode;
/**
 * Dropdown Props
 */
export interface DropdownProps {
  /** The trigger element (button, avatar, etc.) */
  trigger: ReactNode | ((isOpen: boolean) => ReactNode);
  /** Menu items to display in dropdown */
  children: ReactNode;
  /** Alignment of dropdown menu relative to trigger */
  align?: 'left' | 'right' | 'center';
  /** Position of dropdown menu relative to trigger */
  position?: 'bottom' | 'top';
  /** Enable hover to open (in addition to click) */
  hoverEnabled?: boolean;
  /** Delay in ms before opening on hover */
  hoverOpenDelay?: number;
  /** Delay in ms before closing on hover leave */
  hoverCloseDelay?: number;
  /** Additional CSS classes for the dropdown menu */
  menuClassName?: string;
}

/**
 * Get align class using switch pattern (Tailwind v4 JIT compatible)
 */
const getAlignClass = (align: 'left' | 'right' | 'center'): string => {
  switch (align) {
    case 'left': return 'dropdown-align-left';
    case 'right': return 'dropdown-align-right';
    case 'center': return 'dropdown-align-center';
    default: return 'dropdown-align-left';
  }
};

/**
 * Get position class using switch pattern (Tailwind v4 JIT compatible)
 */
const getPositionClass = (position: 'bottom' | 'top'): string => {
  switch (position) {
    case 'top': return 'dropdown-position-top';
    case 'bottom': return 'dropdown-position-bottom';
    default: return 'dropdown-position-bottom';
  }
};

/**
 * Dropdown Component
 * 
 * A custom dropdown menu component with full control over behavior and styling.
 * Opens on click/tap (mobile) and optionally on hover (desktop).
 * Uses CSS variables for all styling.
 * 
 * Features:
 * - Click to open/close
 * - Optional hover to open
 * - Click-away detection to close
 * - Keyboard support (Escape to close)
 * - Responsive positioning
 * 
 * @example
 * ```tsx
 * <Dropdown 
 *   trigger={<Button icon="menu" />}
 *   hoverEnabled={true}
 *   align="left"
 * >
 *   <MenuItem icon="user" label="Profile" />
 *   <MenuItem icon="settings" label="Settings" />
 * </Dropdown>
 * ```
 * 
 * @example
 * 
 * Usage for FAB 
 * ```
 * <Dropdown
 *  trigger={<Button icon="chevronup" variant="fab" />}
 *  position="top"          // Opens ABOVE trigger
 *  align="center"          // Centered horizontally
 *  hoverEnabled={false}    // Mobile - click only
 * >
 *
 *     <MenuItem icon="calendar" label="View Schedule" />
 *     <MenuItem icon="court" label="Book Court" />
 *  </Dropdown>
*/
export function Dropdown({
  trigger,
  children,
  align = 'left',
  position = 'bottom',
  hoverEnabled = true,
  hoverOpenDelay = 150,
  hoverCloseDelay = 300,
  menuClassName,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  // Handle Escape key to close
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen]);

  // Clear hover timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Toggle dropdown on click
  const handleClick = () => {
    setIsOpen(prev => !prev);
  };

  // Handle hover enter
  const handleMouseEnter = () => {
    if (!hoverEnabled) return;
    
    // Clear any pending close timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    
    // Open after delay
    hoverTimeoutRef.current = setTimeout(() => {
      setIsOpen(true);
    }, hoverOpenDelay);
  };

  // Handle hover leave
  const handleMouseLeave = () => {
    if (!hoverEnabled) return;
    
    // Clear any pending open timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    
    // Close after delay
    hoverTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, hoverCloseDelay);
  };

  return (
    <div
      ref={dropdownRef}
      className="dropdown-container"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Trigger */}
      <div 
        onClick={handleClick}
        className="dropdown-trigger"
      >
        {typeof trigger === 'function' ? trigger(isOpen) : trigger}
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={`dropdown-menu ${getAlignClass(align)} ${getPositionClass(position)} ${menuClassName || ''}`}>
          {children}
        </div>
      )}
    </div>
  );
}
