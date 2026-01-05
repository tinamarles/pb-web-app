// === MODIFICATION LOG ===
// Date: 2025-01-15 17:50 UTC
// Modified by: Assistant
// Changes: Use centralized Icon component instead of direct react-icons imports
// Previous: Imported MdRadioButtonChecked and MdOutlineRadioButtonUnchecked directly from react-icons/md
// Current: Uses <Icon name="radio-checked" /> and <Icon name="radio-unchecked" />
// Result: Follows design system - central icon control, consistent with all other components
// ========================

import React from 'react';
import { Icon } from './icon';

export interface RadioButtonProps {
  id?: string;
  name?: string;
  value?: string;
  checked?: boolean;
  onChange?: () => void;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
}

export const RadioButton = React.forwardRef<HTMLInputElement, RadioButtonProps>(
  ({ id, name, value, checked, onChange, disabled, className = '', ...props }, ref) => {

    return (
      <div className={`radio-wrapper ${className}`}>
        {/* Hidden native radio for keyboard handling */}
        <input
          ref={ref}
          type="radio"
          id={id}
          name={name}
          value={value}
          checked={checked}
          onChange={(e) => {
            if (e.target.checked) onChange?.();  // ← Only fire when becoming checked
          }}
          disabled={disabled}
          className="custom-radio"
          {...props}
        />
        
        {/* Material Design icon via centralized Icon component - 24x24 */}
        <label htmlFor={id} className="radio-label">
          <Icon 
            name={checked ? 'radio-checked' : 'radio-unchecked'} 
            size='sm'
          />
        </label>
        
      </div>
    );
  }
);

RadioButton.displayName = 'RadioButton';
