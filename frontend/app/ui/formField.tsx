'use client';
// === MODIFICATION LOG ===
// Date: 2025-01-15 17:00 UTC
// Modified by: Assistant
// Changes: Fixed interactive elements by adding unique ID generation for checkbox/radio/toggle
// Previous: Components had no IDs, so labels weren't connected to inputs - couldn't click to toggle
// Current: Using React.useId() to generate unique IDs, now clicking labels properly triggers inputs
// ========================
// Date: 2025-01-15 15:00 UTC
// Modified by: Assistant
// Changes: Refactored FormField to support 6 variants with unified structure
// Previous: Had type-based switching for different input types
// New: Variant-based system (default, checkbox, radio, toggle, select, display)
// Structure: All variants use consistent container with gap-8, padding-12, flex-row
// ========================

import { memo, useId, useRef } from "react";
import { CustomSelect } from './customSelect';
import { Icon } from './icon';
import { Checkbox } from './checkbox';
import { RadioButton } from './radioButton';
import { CustomToggle } from './customToggle';
import { Button } from './button';

// Base props shared by all variants
interface BaseFormFieldProps {
  label: string;                    // Field label text
  sublabel?: string;                 // Optional secondary label
  icon?: string;                     // Leading icon (lucide icon name)
  error?: string;                    // Error message to display
  className?: string;                // Additional container CSS classes
  disabled?: boolean;                // Is field disabled
}

// Variant: default (editable inputs)
interface DefaultVariantProps extends BaseFormFieldProps {
  variant?: 'default';
  type: 'text' | 'email' | 'password' | 'tel' | 'date' | 'number' | 'textarea';
  name?: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  min?: string;
  max?: string;
  step?: string;
  textareaClassName?: string;
}

// Variant: checkbox
interface CheckboxVariantProps extends BaseFormFieldProps {
  variant: 'checkbox';
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  name?: string;
  placeholder?: string;  // Text to show inside the box (instead of label)
}

// Variant: radio
interface RadioVariantProps extends BaseFormFieldProps {
  variant: 'radio';
  name?: string;
  value?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}

// Variant: toggle
interface ToggleVariantProps extends BaseFormFieldProps {
  variant: 'toggle';
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  text?: string;                     // Display text (e.g., phone number, email)
}

// Variant: select
interface SelectVariantProps extends BaseFormFieldProps {
  variant: 'select';
  name?: string;
  value?: string;
  onChange?: (value: string) => void;
  options?: string[];
  placeholder?: string;
}

// Variant: display (read-only with edit button for mobile cards)
interface DisplayVariantProps extends BaseFormFieldProps {
  variant: 'display';
  text: string;                      // Display text
  onEdit?: () => void;               // Edit button handler
}

export type FormFieldProps =
  | DefaultVariantProps
  | CheckboxVariantProps
  | RadioVariantProps
  | ToggleVariantProps
  | SelectVariantProps
  | DisplayVariantProps;

export const FormField = memo(function FormField(props: FormFieldProps) {
  const { label, sublabel, icon, error, className = "", disabled } = props;
  
  // Generate unique ID for connecting labels to inputs
  const generatedId = useId();
  
  // Ref for date input to trigger calendar picker programmatically
  const dateInputRef = useRef<HTMLInputElement>(null);

  const renderField = () => {
    // VARIANT: checkbox
    if (props.variant === 'checkbox') {
      return (
        <div className="input-field">
          {/* Leading icon (optional) */}
          {icon && (
            <Icon 
              name={icon}
              size="lg" 
            />
          )}
          
          {/* Main content - use placeholder if provided, otherwise use label */}
          <div className={`input-base ${icon ? 'has-icon' : ''}`}>
            <label htmlFor={generatedId} >
              {props.placeholder || label}
            </label>

            {/* Trailing checkbox */}
            <Checkbox
              id={generatedId}
              checked={props.checked}
              onChange={props.onChange}
              disabled={disabled}
              className="cursor-pointer"
            />
          </div>
        </div>
      );
    }

    // VARIANT: radio
    if (props.variant === 'radio') {
      return (
        <div className="input-field">
          {/* Leading icon (optional) */}
          {icon && (
            <Icon 
              name={icon} 
              size="lg" 
            />
          )}
          
          {/* Main content - label */}
          <div className={`input-base ${icon ? 'has-icon' : ''}`}>
            <label htmlFor={generatedId} className="form-field__content text-on-surface cursor-pointer">
              {label}
            </label>
          
            {/* Trailing radio button */}
            <RadioButton
              id={generatedId}
              name={props.name}
              value={props.value}
              checked={props.checked}
              onChange={props.onChange}
              disabled={disabled}
            />
          </div>
        </div>
      );
    }

    // VARIANT: toggle
    if (props.variant === 'toggle') {
      return (
        <div className="form-field-input flex items-center gap-[var(--px-8)] p-[var(--px-12)] bg-surface-container-lowest rounded-[var(--radius-md)] border border-outline">
          {/* Leading icon (optional) */}
          {icon && (
            <Icon 
              name={icon} 
              className="icon-lg text-on-surface-variant flex-shrink-0" 
            />
          )}
          
          {/* Main content - label and optional text */}
          <div className="flex-1 min-w-0 flex flex-col gap-xs">
            <label htmlFor={generatedId} className="body-md text-on-surface cursor-pointer">
              {label}
            </label>
            {props.text && (
              <span className="body-sm text-on-surface-variant">
                {props.text}
              </span>
            )}
          </div>
          
          {/* Trailing toggle */}
          <CustomToggle
            id={generatedId}
            checked={props.checked}
            onChange={props.onChange}
            disabled={disabled}
          />
        </div>
      );
    }

    // VARIANT: select
    if (props.variant === 'select') {
      return (
        <CustomSelect
          value={props.value || ''}
          options={props.options || []}
          onChange={props.onChange}
          name={props.name}
          placeholder={props.placeholder || "Select an option"}
          icon={icon}
          disabled={disabled}
        />
      );
    }

    // VARIANT: display (read-only with edit button)
    if (props.variant === 'display') {
      return (
        <div className="form-field-input flex items-center gap-[var(--px-8)] p-[var(--px-12)] bg-surface-container-lowest rounded-[var(--radius-md)] border border-outline">
          {/* Leading icon (optional) */}
          {icon && (
            <Icon 
              name={icon} 
              className="icon-lg text-on-surface-variant flex-shrink-0" 
            />
          )}
          
          {/* Main content - display text */}
          <div className="flex-1 min-w-0">
            <span className="form-field__content text-on-surface">
              {props.text}
            </span>
          </div>
          
          {/* Trailing edit button */}
          {props.onEdit && (
            <Button
              variant="subtle"
              size="sm"
              onClick={props.onEdit}
              aria-label="Edit field"
              icon="edit"
            />
             
          )}
        </div>
      );
    }

    // VARIANT: default (editable inputs - text, email, password, tel, date, number, textarea)
    const defaultProps = props as DefaultVariantProps;
    
    // TEXTAREA
    if (defaultProps.type === 'textarea') {
      return (
        <div className="form-field-input flex items-start gap-[var(--px-8)] p-[var(--px-12)] bg-surface-container-lowest rounded-[var(--radius-md)] border border-outline">
          {/* Leading icon (optional) */}
          {icon && (
            <Icon 
              name={icon} 
              className="icon-lg text-on-surface-variant flex-shrink-0 mt-[2px]" 
            />
          )}
          
          {/* Textarea */}
          <textarea
            value={defaultProps.value || ''}
            name={defaultProps.name}
            placeholder={defaultProps.placeholder}
            onChange={(e) => defaultProps.onChange?.(e.target.value)}
            disabled={disabled}
            className={`form-field__content flex-1 min-w-0 bg-transparent border-none outline-none text-on-surface placeholder:text-on-surface-variant resize-none ${defaultProps.textareaClassName || ''}`}
            rows={3}
          />
        </div>
      );
    }

    // ALL OTHER INPUT TYPES (text, email, password, tel, date, number)
    const isDateInput = defaultProps.type === 'date';

    return (
      <div className="form-field-input flex items-center gap-[var(--px-8)] p-[var(--px-12)] bg-surface-container-lowest rounded-[var(--radius-md)] border border-outline">
        {/* Leading icon (optional) */}
        {icon && (
          <Icon 
            name={icon} 
            className="icon-lg text-on-surface-variant flex-shrink-0 cursor-pointer" 
            onClick={() => {
              console.log('📅 Calendar icon clicked!');
              // For date inputs, clicking the icon triggers a click on the input
              // (showPicker() doesn't work in iframe environments due to security)
              if (isDateInput && dateInputRef.current) {
                console.log('Triggering input click...', dateInputRef.current);
                dateInputRef.current.click();
              }
            }}
          />
        )}
        
        {/* Input */}
        <input
          ref={isDateInput ? dateInputRef : undefined}
          type={defaultProps.type}
          value={defaultProps.value || ''}
          name={defaultProps.name}
          placeholder={defaultProps.placeholder}
          min={defaultProps.min}
          max={defaultProps.max}
          step={defaultProps.step}
          onChange={(e) => defaultProps.onChange?.(e.target.value)}
          disabled={disabled}
          className={`form-field__content flex-1 min-w-0 bg-transparent border-none outline-none text-on-surface placeholder:text-on-surface-variant ${defaultProps.type === 'date' ? 'date-input-custom' : ''}`}
        />
      </div>
    );
  };

  // Show top label for default, select, display, AND checkbox variants
  // (checkbox will show placeholder inside the box, but needs top label for grid alignment)
  const showTopLabel = !props.variant || props.variant === 'default' || props.variant === 'select' || props.variant === 'display' || props.variant === 'checkbox';

  return (
    <div className={`flex flex-col gap-sm ${className}`}>
      {/* Label (for default, select, display, checkbox variants) */}
      {showTopLabel && (
        <div className="flex items-baseline gap-xs">
          <label className="form-field__top-label">
            {label}
          </label>
          {sublabel && (
            <span className="form-field__sub-label">
              {sublabel}
            </span>
          )}
        </div>
      )}

      {/* Field */}
      <div className="flex flex-col gap-sm">
        {renderField()}
        
        {/* Error Message Container */}
        <div className="h-4">
          {error && (
            <span className="label-sm text-error">
              {error}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});