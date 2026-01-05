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
import { CustomSelect } from "./customSelect";
import { Icon } from "./icon";
import { Checkbox } from "./checkbox";
import { RadioButton } from "./radioButton";
import { CustomToggle } from "./customToggle";
import { Button } from "./button";
import { useAutofillFix } from "@/lib/hooks";

// Base props shared by all variants
interface BaseFormFieldProps {
  label?: string; // Field label text
  sublabel?: string; // Optional secondary label
  topLabelExtra?: React.ReactNode; // Optional extra content on label line (e.g., "Forgot password?")
  icon?: string; // Leading icon (lucide icon name)
  error?: string; // Error message to display
  className?: string; // Additional container CSS classes
  disabled?: boolean; // Is field disabled
}

// ✅ UNIFIED PROPS INTERFACE - All variant-specific props are optional
export interface FormFieldProps extends BaseFormFieldProps {
  variant?: "default" | "checkbox" | "radio" | "toggle" | "select" | "display";

  // Default variant props
  type?: "text" | "email" | "password" | "tel" | "date" | "number" | "textarea";
  name?: string;
  value?: string;
  placeholder?: string;
  min?: string;
  max?: string;
  step?: string;
  textareaClassName?: string;

  // Checkbox/Radio/Toggle props
  checked?: boolean;
  onChange?: ((value: string) => void) | ((checked: boolean) => void);

  // Select props
  options?: string[];
  hideChevronOnMobile?: boolean;

  // Toggle props
  text?: string;

  // Display variant props
  onEdit?: () => void;
}

export const FormField = memo(function FormField(props: FormFieldProps) {
  useAutofillFix;

  const {
    label,
    sublabel,
    topLabelExtra,
    icon,
    error,
    className = "",
    disabled,
  } = props;

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
              onChange={
                props.onChange as ((checked: boolean) => void) | undefined
              }
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
              onChange={
                props.onChange as (() => void) | undefined
              }
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
              onChange={
                props.onChange as ((checked: boolean) => void) | undefined
              }
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
          onChange={props.onChange as ((value: string) => void) | undefined}
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

    // TEXTAREA
    if (props.type === "textarea") {
      return (
        <div className="input-field">
          {/* Leading icon (optional) */}
          {icon && <Icon name={icon} size="lg" />}

          {/* Textarea */}
          <textarea
            value={props.value || ""}
            name={props.name}
            placeholder={props.placeholder}
            onChange={(e) =>
              (props.onChange as ((value: string) => void) | undefined)?.(
                e.target.value
              )
            }
            disabled={disabled}
            className={`input-base ${icon ? "has-icon" : ""} resize-none ${
              props.textareaClassName || ""
            }`}
            rows={5}
          />
        </div>
      );
    }

    // ALL OTHER INPUT TYPES (text, email, password, tel, date, number)
    const isDateInput = props.type === "date";

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
          type={props.type}
          value={props.value || ""}
          name={props.name}
          placeholder={props.placeholder}
          min={props.min}
          max={props.max}
          step={props.step}
          onChange={(e) =>
            (props.onChange as ((value: string) => void) | undefined)?.(
              e.target.value
            )
          }
          disabled={disabled}
          className={`input-base ${icon ? "has-icon" : ""} ${
            props.type === "date" ? "date-input-custom" : ""
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
          {topLabelExtra && (
            <span className="input-field__top-label-extra">
              {topLabelExtra}
            </span>
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
