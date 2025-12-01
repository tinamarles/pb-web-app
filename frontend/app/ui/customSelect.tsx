"use client";
import { memo, useState, useRef, useEffect, useCallback } from "react";
import { Icon } from "./icon";

// === MODIFICATION LOG ===
// Date: 2025-11-15 14:30 UTC
// Modified by: Assistant
// Changes: Added icon prop support for leading icons (e.g., location icon)
// Previous: Only had trailing chevron icon
// New: Supports optional leading icon via icon prop, wraps in input-field when present
// Purpose: Make CustomSelect fully reusable with leading + trailing icon support
// ========================

export interface CustomSelectProps {
  value: string; // Currently selected value
  options: string[]; // Available options
  onChange?: (value: string) => void; // Selection change handler - OPTIONAL
  placeholder?: string; // Placeholder text - OPTIONAL
  className?: string; // Additional CSS classes - OPTIONAL
  name?: string; // Field name attribute - OPTIONAL
  icon?: string; // Optional leading icon (e.g., "location") - OPTIONAL
  disabled?: boolean;
  hideChevronOnMobile?: boolean;
}

export const CustomSelect = memo(function CustomSelect({
  value,
  options,
  placeholder = "Select an option",
  onChange,
  className = "",
  name,
  icon,
  disabled = false,
  hideChevronOnMobile = false, // default: show chevron
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);
  const listboxId = useRef(`listbox-${Math.random().toString(36).substr(2, 9)}`).current;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOptionSelect = useCallback((option: string) => {
    if (disabled) return;
    onChange?.(option);
    setIsOpen(false);
    setHighlightedIndex(-1);
  }, [disabled, onChange]); // only recreates if these change

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          /* READABLE VERSION of the compact code below:
             
             function moveHighlightDown(prev) {
               const maxIndex = options.length - 1;  // Last item index
               
               if (prev < maxIndex) {
                 return prev + 1;  // Move down one position
               } else {
                 return 0;  // Wrap around to first item
               }
             }
             
             setHighlightedIndex(moveHighlightDown);
          */
          setHighlightedIndex((prev) =>
            prev < options.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          event.preventDefault();
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : options.length - 1
          );
          break;
        case "Enter":
          event.preventDefault();
          if (highlightedIndex >= 0) {
            handleOptionSelect(options[highlightedIndex]);
          }
          break;
        case "Escape":
          event.preventDefault();
          setIsOpen(false);
          setHighlightedIndex(-1);
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, highlightedIndex, options, handleOptionSelect]);

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0 && optionsRef.current) {
      const highlightedElement = optionsRef.current.children[
        highlightedIndex
      ] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }
  }, [highlightedIndex]);

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    if (!isOpen) {
      const currentIndex = options.indexOf(value);
      setHighlightedIndex(currentIndex >= 0 ? currentIndex : -1);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`${icon ? "input-field" : "relative"} ${className}`}
    >
      {/* Hidden native select for form compatibility */}
      <select
        name={name}
        value={value}
        onChange={() => {}}
        className="sr-only"
        tabIndex={-1}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      {/* Leading icon (outside trigger) */}
      {icon && <Icon name={icon} className="icon-lg text-on-surface-variant" />}

      {/* Custom select trigger */}
      <div
        className={`input-base cursor-pointer ${icon ? "has-icon" : ""}`}
        onClick={handleToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleToggle();
          }
        }}
        tabIndex={disabled ? -1 : 0}
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-haspopup="listbox"
        aria-label="Select an option"
        aria-disabled={disabled}
      >
        <span
          className={`${value ? "text-on-surface" : "text-on-surface-variant"}`}
        >
          {value || placeholder}
        </span>
        <Icon
          name="chevrondown"
          size="lg"
          className={`${
            hideChevronOnMobile ? "hidden sm:block" : ""
          } transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </div>

      {/* Custom dropdown options */}
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div
            className="fixed inset-0 z-40 sm:hidden"
            onClick={() => setIsOpen(false)}
          />

          {/* Options container - uses CSS class .select-dropdown */}
          <div className="select-dropdown">
            {/* Scrollable options list - uses CSS class .select-options-list */}
            <div
              ref={optionsRef}
              id={listboxId}
              className="select-options-list"
              role="listbox"
            >
              {options.map((option, index) => {
                // Determine modifier classes based on state
                const isHighlighted = highlightedIndex === index;
                const isSelected = value === option;

                // Build className using base + modifiers
                const optionClasses = [
                  "select-option",
                  isHighlighted && "select-option--highlighted",
                  isSelected && "select-option--selected",
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <div
                    key={option}
                    className={optionClasses}
                    onClick={() => handleOptionSelect(option)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <span>{option}</span>
                    {isSelected && (
                      /* Icon inherits color from parent - no hardcoded text color! */
                      <Icon name="success" className="icon-sm" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
});
