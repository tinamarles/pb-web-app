'use client';
// === MODIFICATION LOG ===
// Date: 2025-01-15 17:15 UTC
// Modified by: Assistant
// Changes: Removed duplicate focus ring styles - CSS already has correct muted version
// Previous: Added inline Tailwind focus-visible classes that overrode CSS focus ring
// Current: Removed inline classes, now uses CSS-defined focus ring (20% opacity)
// Note: The .custom-toggle:focus-visible in globals.css already has the correct color-mix
// ========================
// Date: 2025-01-15 16:45 UTC
// Modified by: Assistant
// Changes: Added focus ring to toggle for keyboard accessibility
// Previous: No focus indication on keyboard navigation
// Current: Blue ring appears on focus-visible using ring-2 ring-primary ring-offset-2
// ========================
// Date: 2025-01-15 14:40 UTC
// Modified by: Assistant
// Changes: Created CustomToggle component with keyboard handling
// Purpose: Provides branded toggle switch matching Figma design specs
// Specs: 40x24 container, 20x20 knob, primary bg (on), on-surface-variant/50 bg (off)
// Keyboard: Space and Enter keys toggle state
// ========================

import React, { useRef } from 'react';

export interface CustomToggleProps {
  id?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
}

export const CustomToggle = React.forwardRef<HTMLDivElement, CustomToggleProps>(
  ({ id, checked = false, onChange, disabled, className = '', ...props }, ref) => {
    const toggleRef = useRef<HTMLDivElement>(null);
    const state = checked ? 'checked' : 'unchecked';

    const handleToggle = () => {
      if (!disabled) {
        onChange?.(!checked);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (disabled) return;
      
      // Space or Enter key toggles the switch
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleToggle();
      }
    };

    return (
      <div
        ref={ref || toggleRef}
        id={id}
        role="switch"
        aria-checked={checked}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        data-state={state}
        className={`custom-toggle ${className}`}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        {...props}
      >
        <div className="custom-toggle-knob" />
      </div>
    );
  }
);

CustomToggle.displayName = 'CustomToggle';