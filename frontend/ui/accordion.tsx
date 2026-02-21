"use client";
// Accordion Component - frontend/ui/accordion.tsx

import * as React from "react";
import { Icon } from "./icon";
import { cn } from "./utils";

/**
 * Accordion Item Props
 */
export interface AccordionItemProps {
  /** Unique identifier for the accordion item */
  value: string;
  /** Title shown in the header (always visible) */
  title: string;
  /** Content shown when expanded */
  children: React.ReactNode;
  /** Optional CSS classes for the item container */
  className?: string;
  /** Optional CSS classes for the header */
  headerClassName?: string;
  /** Optional CSS classes for the content */
  contentClassName?: string;
  /** Disable this item */
  disabled?: boolean;
}

/**
 * Accordion Props
 */
export interface AccordionProps {
  /** Type of accordion behavior */
  type?: "single" | "multiple";
  /** Default open items (controlled by value strings) */
  defaultValue?: string | string[];
  /** Controlled open items */
  value?: string | string[];
  /** Callback when items are toggled */
  onValueChange?: (value: string | string[]) => void;
  /** Children must be AccordionItem components */
  children: React.ReactNode;
  /** Optional CSS classes for the accordion container */
  className?: string;
  /** Allow all items to be collapsed (only applies to type="single") */
  collapsible?: boolean;
}

/**
 * AccordionItem Component
 *
 * Must be used inside an Accordion component.
 *
 * @example
 * <AccordionItem value="details" title="Event Details">
 *   <p>Event content here...</p>
 * </AccordionItem>
 */
export function AccordionItem({
  value,
  title,
  children,
  className,
  headerClassName,
  contentClassName,
  disabled = false,
}: AccordionItemProps) {
  const context = React.useContext(AccordionContext);

  if (!context) {
    throw new Error("AccordionItem must be used within an Accordion");
  }

  const { openItems, toggleItem } = context;
  const isOpen = openItems.includes(value);

  const handleToggle = () => {
    if (!disabled) {
      toggleItem(value);
    }
  };

  return (
    <div className={cn("accordion-item", className)}>
      <button
        type="button"
        className={cn(
          "accordion-header",
          disabled && "accordion-header-disabled",
          headerClassName,
        )}
        onClick={handleToggle}
        disabled={disabled}
        aria-expanded={isOpen}
        aria-controls={`accordion-content-${value}`}
      >
        <span className="accordion-title">{title}</span>
        <Icon
          name="chevrondown"
          size="md"
          className={cn(
            "accordion-chevron",
            isOpen && "accordion-chevron-open",
          )}
        />
      </button>
      <div
        id={`accordion-content-${value}`}
        className={cn(
          "accordion-content",
          isOpen && "accordion-content-open",
          contentClassName,
        )}
        aria-hidden={!isOpen}
      >
        <div className="accordion-content-inner">{children}</div>
      </div>
    </div>
  );
}

/**
 * Accordion Context
 */
interface AccordionContextValue {
  openItems: string[];
  toggleItem: (value: string) => void;
}

const AccordionContext = React.createContext<AccordionContextValue | null>(
  null,
);

/**
 * Accordion Component
 *
 * A collapsible content component following your design system.
 * Supports single or multiple items open at once.
 *
 * @example
 * // Single item open at a time
 * <Accordion type="single" defaultValue="details">
 *   <AccordionItem value="details" title="Event Details">
 *     <p>Content here</p>
 *   </AccordionItem>
 *   <AccordionItem value="schedule" title="Schedule">
 *     <p>More content</p>
 *   </AccordionItem>
 * </Accordion>
 *
 * @example
 * // Multiple items can be open
 * <Accordion type="multiple" defaultValue={["details", "schedule"]}>
 *   <AccordionItem value="details" title="Event Details">
 *     <p>Content here</p>
 *   </AccordionItem>
 *   <AccordionItem value="schedule" title="Schedule">
 *     <p>More content</p>
 *   </AccordionItem>
 * </Accordion>
 */
export function Accordion({
  type = "single",
  defaultValue,
  value: controlledValue,
  onValueChange,
  children,
  className,
  collapsible = true,
}: AccordionProps) {
  // Initialize state based on controlled vs uncontrolled
  const [internalValue, setInternalValue] = React.useState<string[]>(() => {
    if (defaultValue) {
      return Array.isArray(defaultValue) ? defaultValue : [defaultValue];
    }
    return [];
  });

  // Use controlled value if provided, otherwise use internal state
  const openItems = React.useMemo(() => {
    if (controlledValue !== undefined) {
      return Array.isArray(controlledValue)
        ? controlledValue
        : [controlledValue];
    }
    return internalValue;
  }, [controlledValue, internalValue]);

  const toggleItem = React.useCallback(
    (value: string) => {
      let newValue: string[];

      if (type === "single") {
        // Single mode: only one item can be open
        if (openItems.includes(value)) {
          // Closing the open item
          newValue = collapsible ? [] : openItems;
        } else {
          // Opening a new item (closes others)
          newValue = [value];
        }
      } else {
        // Multiple mode: toggle the item
        if (openItems.includes(value)) {
          newValue = openItems.filter((item) => item !== value);
        } else {
          newValue = [...openItems, value];
        }
      }

      // Update state
      if (controlledValue === undefined) {
        setInternalValue(newValue);
      }

      // Call onChange callback
      if (onValueChange) {
        const callbackValue = type === "single" ? newValue[0] || "" : newValue;
        onValueChange(callbackValue);
      }
    },
    [type, openItems, collapsible, controlledValue, onValueChange],
  );

  const contextValue = React.useMemo(
    () => ({ openItems, toggleItem }),
    [openItems, toggleItem],
  );

  return (
    <AccordionContext.Provider value={contextValue}>
      <div className={cn("accordion", className)}>{children}</div>
    </AccordionContext.Provider>
  );
}
