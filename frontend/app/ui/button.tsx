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

  // Clean class combination using your CSS utilities
  const buttonClasses = cn(
    // Variant classes from your utilities.css

    variant === "filled" && "btn-filled",
    variant === "tonal" && "btn-tonal",
    variant === "subtle" && "btn-subtle",
    variant === "outlined" && "btn-outlined",
    variant === "error" && "btn-destructive",

    // Size classes from your utilities.css
    size === "sm" && "btn-sm",
    size === "md" && "btn-md",
    size === "lg" && "btn-lg",
    size === "cta" && "btn-cta",

    className
  );

  // Determine what to render based on props
  const renderContent = () => {
    // Icon-only button: render icon + children (usually sr-only text)
    if (iconOnly && icon) {
      return (
        <>
          <Icon name={icon} />
          {children}
        </>
      );
    }
    // If children are provided, use them (allows for custom content)
    if (children) {
      return children;
    }

    // If no label and no icon, render nothing
    if (!label && !icon) {
      return null;
    }

    // Combinations: Icon + Label, Label only, Icon only
    return (
      <>
        {icon && <Icon name={icon} />}
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
