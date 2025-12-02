"use client";
// Button Component frontend/app/ui/button.tsx

import { Slot } from "@radix-ui/react-slot";
import { cn } from "./utils";
import { Icon } from "./icon";

// Button variants using your CSS utilities system
export type ButtonVariant =
  | "filled"
  | "tonal"
  | "subtle"
  | "outlined"
  | "highlighted"
  | "dismiss"
  | "error";
export type ButtonSize = "sm" | "md" | "lg" | "cta";

export interface ButtonProps extends React.ComponentProps<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
  label?: string;
  icon?: string;
  iconOnly?: boolean;
}

export function Button({
  className,
  variant = "filled",
  size = "md",
  asChild = false,
  label,
  icon,
  iconOnly = false,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  // Auto-apply icon="close" for dismiss variant if no icon provided
  const resolvedIcon = icon ?? (variant === "dismiss" ? "close" : undefined);

  // Clean class combination using your CSS utilities
  const buttonClasses = cn(
    // Variant classes from your utilities.css

    variant === "filled" && "btn-filled",
    variant === "tonal" && "btn-tonal",
    variant === "subtle" && "btn-subtle",
    variant === "outlined" && "btn-outlined",
    variant === "highlighted" && "btn-highlighted",
    variant === "error" && "btn-destructive",
    variant === "dismiss" && "btn-dismiss",

    // Size classes from your utilities.css
    size === "sm" && "btn-sm",
    size === "md" && "btn-md",
    size === "lg" && "btn-lg",
    size === "cta" && "btn-cta",

    // Icon-only styling: remove padding for circular icon buttons
    iconOnly && "p-0",

    className
  );

  // Determine what to render based on props
  const renderContent = () => {
    // Icon-only button: render icon + children (usually sr-only text)
    if (iconOnly && resolvedIcon) {
      return (
        <>
          <Icon name={resolvedIcon} />
          {children}
        </>
      );
    }
    // If children are provided, use them (allows for custom content)
    if (children) {
      return children;
    }

    // If no label and no icon, render nothing
    if (!label && !resolvedIcon) {
      return null;
    }

    // Combinations: Icon + Label, Label only, Icon only
    return (
      <>
        {resolvedIcon && <Icon name={resolvedIcon} />}
        {label}
      </>
    );
  };

  return (
    <Comp data-slot="button" className={buttonClasses} {...props}>
      {renderContent()}
    </Comp>
  );
}
