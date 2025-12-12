'use client';
// === MODIFICATION LOG ===
// Date: 2025-12-08 UTC
// Modified by: Assistant
// Changes: Created generic Select component (NOT tied to forms)
// Purpose: Reusable dropdown for clubs, leagues, members, notifications, etc.
// Features: Custom styling, icons/avatars in trigger + options, checkmark for selected
// Note: Different from CustomSelect which is tied to input-field/input-base form styling
// ========================

import { memo, useState, useRef, useEffect, useCallback, ReactNode, ReactElement } from "react";
import { Icon } from './icon';

export interface SelectOption<T = string> {
  value: T;
  label: string;
  icon?: ReactNode; // Avatar, Icon, or any React node
}

export interface SelectProps<T = string> {
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
  className?: string;
  triggerClassName?: string; // Custom styling for trigger button
  optionsClassName?: string; // Custom styling for options container
  disabled?: boolean;
}

export const Select = memo(function Select<T = string>({
  value,
  options,
  onChange,
  placeholder = "Select an option",
  className = "",
  triggerClassName = "",
  optionsClassName = "",
  disabled = false,
}: SelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);
  const listboxId = useRef(`listbox-${Math.random().toString(36).substr(2, 9)}`).current;

  // Find selected option
  const selectedOption = options.find(opt => opt.value === value);

  // Memoize handleOptionSelect
  const handleOptionSelect = useCallback((option: SelectOption<T>) => {
    if (disabled) return;
    onChange(option.value);
    setIsOpen(false);
    setHighlightedIndex(-1);
  }, [disabled, onChange]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setHighlightedIndex(prev => 
            prev < options.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          event.preventDefault();
          setHighlightedIndex(prev => 
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
      const highlightedElement = optionsRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: "nearest",
          behavior: "smooth"
        });
      }
    }
  }, [highlightedIndex]);

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    if (!isOpen) {
      const currentIndex = options.findIndex(opt => opt.value === value);
      setHighlightedIndex(currentIndex >= 0 ? currentIndex : -1);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger button */}
      <button
        type="button"
        className={`
          dropdown-button
          ${triggerClassName}
        `}
        onClick={handleToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleToggle();
          }
        }}
        disabled={disabled}
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-haspopup="listbox"
        aria-label="Select an option"
        aria-disabled={disabled}
      >
        {/* Icon + Label */}
        <div className="flex items-center gap-sm flex-1 min-w-0">
          {selectedOption?.icon}
          <span className=" body-sm truncate">
            {selectedOption?.label || placeholder}
          </span>
        </div>

        {/* Chevron */}
        <Icon 
          name='chevrondown' 
          size="lg"
          className={`transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`} 
        />
      </button>

      {/* Dropdown options */}
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div 
            className="fixed inset-0 z-40 sm:hidden" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Options container */}
          <div className={`
            select-dropdown
            rounded-md
            ${optionsClassName}
          `}>
            <div 
              ref={optionsRef}
              id={listboxId}
              role="listbox"
              className="select-options-list"
            >
              {options.map((option, index) => {
                const isHighlighted = highlightedIndex === index;
                const isSelected = value === option.value;
                
                // Build className using base + modifiers
                const optionClasses = [
                  "select-option p-0 pr-sm",
                  isHighlighted && "select-option--highlighted",
                  isSelected && "select-option--selected",
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <button
                    key={String(option.value)}
                    type="button"
                    className={`${optionClasses}`}
                    onClick={() => handleOptionSelect(option)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div className = "flex w-full items-center justify-between">
                      {/* Icon + Label */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {option.icon}
                        <span className="truncate">{option.label}</span>
                      </div>

                      {/* Checkmark if selected */}
                      {isSelected && (
                        <Icon name='success' size="sm" className="shrink-0" />
                      )}
                  </div> 
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}) as <T = string>(props: SelectProps<T>) => ReactElement;