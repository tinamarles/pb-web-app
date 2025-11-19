// === MODIFICATION LOG ===
// Date: 2025-01-15 17:30 UTC
// Modified by: Assistant
// Changes: Removed ALL inline styles and tailwind classes - pure CSS approach
// Previous: Complex component with Icon, inline styles, <style jsx>, tailwind classes
// Current: Simple native checkbox with .custom-checkbox CSS class from globals.css
// Note: ALL styling (size, colors, focus ring, hover, checked state) handled by CSS
// ========================

import React from 'react';

export interface CheckboxProps {
  id?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ id, checked, onChange, disabled, className = '', ...props }, ref) => {
    return (
      <input
        ref={ref}
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange?.(e.target.checked)}
        disabled={disabled}
        className={`custom-checkbox ${className}`}
        {...props}
      />
    );
  }
);

Checkbox.displayName = 'Checkbox';
