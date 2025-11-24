"use client";
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
import { CustomSelect, CustomSelectProps } from "./customSelect";
import { Icon } from "./icon";
import { Checkbox, CheckboxProps } from "./checkbox";
import { RadioButton, RadioButtonProps } from "./radioButton";
import { CustomToggle, CustomToggleProps } from "./customToggle";
import { Button } from "./button";
import { useAutofillFix } from "@/app/lib/hooks";

// Base props shared by all variants
interface BaseFormFieldProps {
  label: string; // Field label text
  sublabel?: string; // Optional secondary label
  icon?: string; // Leading icon (lucide icon name)
  error?: string; // Error message to display
  className?: string; // Additional container CSS classes
  disabled?: boolean; // Is field disabled
}

// Variant: default (editable inputs)
interface DefaultVariantProps extends BaseFormFieldProps {
  variant?: "default";
  type: "text" | "email" | "password" | "tel" | "date" | "number" | "textarea";
  name?: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  min?: string;
  max?: string;
  step?: string;
  textareaClassName?: string;
}
/*
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
*/

// Each variant extends Base + the actual component props
interface SelectVariantProps
  extends BaseFormFieldProps,
    Omit<CustomSelectProps, "className"> {
  // Omit className - FormField controls it
  variant: "select";
}

interface ToggleVariantProps
  extends BaseFormFieldProps,
    Omit<CustomToggleProps, "className"> {
  variant: "toggle";
  text?: string;
}

interface RadioVariantProps
  extends BaseFormFieldProps,
    Omit<RadioButtonProps, "className"> {
  variant: "radio";
}

interface CheckboxVariantProps
  extends BaseFormFieldProps,
    Omit<CheckboxProps, "className"> {
  variant: "checkbox";
  placeholder?: string;
}

// Variant: display (read-only with edit button for mobile cards)
interface DisplayVariantProps extends BaseFormFieldProps {
  variant: "display";
  text: string; // Display text
  onEdit?: () => void; // Edit button handler
}

export type FormFieldProps =
  | DefaultVariantProps
  | CheckboxVariantProps
  | RadioVariantProps
  | ToggleVariantProps
  | SelectVariantProps
  | DisplayVariantProps;

export const FormField = memo(function FormField(props: FormFieldProps) {
  useAutofillFix;

  const { label, sublabel, icon, error, className = "", disabled } = props;

  // Generate unique ID for connecting labels to inputs
  const generatedId = useId();

  // Ref for date input to trigger calendar picker programmatically
  const dateInputRef = useRef<HTMLInputElement>(null);

  const renderField = () => {
    // VARIANT: checkbox
    if (props.variant === "checkbox") {
      return (
        <div className="input-field">
          {/* Leading icon (optional) */}
          {icon && <Icon name={icon} size="lg" />}

          {/* Main content - use placeholder if provided, otherwise use label */}
          <div className={`input-base ${icon ? "has-icon" : ""}`}>
            <label htmlFor={generatedId}>{props.placeholder || label}</label>

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
    if (props.variant === "radio") {
      return (
        <div className="input-field">
          {/* Leading icon (optional) */}
          {icon && <Icon name={icon} size="lg" />}

          {/* Main content - label */}
          <div className={`input-base ${icon ? "has-icon" : ""}`}>
            <label htmlFor={generatedId} className="cursor-pointer">
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
    if (props.variant === "toggle") {
      return (
        <div className="input-field">
          {/* Leading icon (optional) */}
          {icon && <Icon name={icon} size="lg" />}

          {/* Main content - label and optional text */}
          <div className={`input-base ${icon ? "has-icon" : ""}`}>
            <div className="flex flex-col gap-xs">
              <label
                htmlFor={generatedId}
                className="body-md text-on-surface cursor-pointer"
              >
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
        </div>
      );
    }

    // VARIANT: select
    if (props.variant === "select") {
      return (
        <CustomSelect
          value={props.value || ""}
          options={props.options || []}
          onChange={props.onChange}
          name={props.name}
          placeholder={props.placeholder || "Select an option"}
          icon={icon}
          disabled={disabled}
          hideChevronOnMobile={props.hideChevronOnMobile}
        />
      );
    }

    // VARIANT: display (read-only with edit button)
    if (props.variant === "display") {
      return (
        <div className="input-field">
          {/* Leading icon (optional) */}
          {icon && <Icon name={icon} size="lg" />}

          {/* Main content - display text */}
          <div className={`input-base ${icon ? "has-icon" : ""}`}>
            <span className="">{props.text}</span>

            {/* Trailing edit button */}
            {props.onEdit && (
              <Button
                variant="subtle"
                size="sm"
                onClick={props.onEdit}
                aria-label="Edit field"
                icon="edit"
                className="input-field__display-button"
              />
            )}
          </div>
        </div>
      );
    }

    // VARIANT: default (editable inputs - text, email, password, tel, date, number, textarea)
    const defaultProps = props as DefaultVariantProps;

    // TEXTAREA
    if (defaultProps.type === "textarea") {
      return (
        <div className="input-field">
          {/* Leading icon (optional) */}
          {icon && <Icon name={icon} size="lg" />}

          {/* Textarea */}
          <textarea
            value={defaultProps.value || ""}
            name={defaultProps.name}
            placeholder={defaultProps.placeholder}
            onChange={(e) => defaultProps.onChange?.(e.target.value)}
            disabled={disabled}
            className={`input-base ${icon ? "has-icon" : ""} resize-none ${
              defaultProps.textareaClassName || ""
            }`}
            rows={5}
          />
        </div>
      );
    }

    // ALL OTHER INPUT TYPES (text, email, password, tel, date, number)
    const isDateInput = defaultProps.type === "date";

    return (
      <div className="input-field">
        {/* Leading icon (optional) */}
        {icon && (
          <Icon
            name={icon}
            size="lg"
            className="cursor-pointer"
            onClick={() => {
              if (isDateInput && dateInputRef.current) {
                dateInputRef.current.click();
              }
            }}
          />
        )}

        {/* Input */}
        <input
          ref={isDateInput ? dateInputRef : undefined}
          type={defaultProps.type}
          value={defaultProps.value || ""}
          name={defaultProps.name}
          placeholder={defaultProps.placeholder}
          min={defaultProps.min}
          max={defaultProps.max}
          step={defaultProps.step}
          onChange={(e) => defaultProps.onChange?.(e.target.value)}
          disabled={disabled}
          className={`input-base ${icon ? "has-icon" : ""} ${
            defaultProps.type === "date" ? "date-input-custom" : ""
          }`}
        />
      </div>
    );
  };

  // Show top label for default, select, display, AND checkbox variants
  // (checkbox will show placeholder inside the box, but needs top label for grid alignment)
  const showTopLabel =
    !props.variant ||
    props.variant === "default" ||
    props.variant === "select" ||
    props.variant === "display" ||
    props.variant === "checkbox";

  return (
    <div className={`flex flex-col gap-sm ${className}`}>
      {/* Label (for default, select, display, checkbox variants) */}
      {showTopLabel && (
        <div className="flex items-baseline gap-xs">
          <label className="input-field__top-label">{label}</label>
          {sublabel && (
            <span className="input-field__sub-label">{sublabel}</span>
          )}
        </div>
      )}

      {/* Field */}
      <div className="flex flex-col mb-4">
        {renderField()}

        {/* Error Message Container */}

        {error && (
          <div className="h-4">
            <span className="label-sm text-error">{error}</span>
          </div>
        )}
      </div>
    </div>
  );
});
