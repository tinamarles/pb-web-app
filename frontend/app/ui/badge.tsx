import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from './utils';
import { Icon } from './icon';

// === MODIFICATION LOG ===
// Date: 
// Modified by: 
// Changes: 
// Previous: 
// Root cause: 
// ========================

// Badge variants using CSS utilities system
export type BadgeVariant = "primary" | "secondary" | "tertiary" | "outlined" | "destructive";

export interface BadgeProps extends React.ComponentProps<"span"> {
  variant?: BadgeVariant;
  asChild?: boolean;
  label?: string;
  icon?: string;
}

export function Badge({
  className,
  variant = "primary",
  asChild = false,
  label,
  icon,
  children,
  ...props
}: BadgeProps) {
  const Comp = asChild ? Slot : "span";

  // Clean class combination using your CSS utilities
  const badgeClasses = cn("badge",
    // Variant classes from your utilities.css
    variant === "primary" && "badge-primary",
    variant === "secondary" && "badge-secondary", 
    variant === "tertiary" && "badge-tertiary",
    variant === "outlined" && "badge-outlined",
    variant === "destructive" && "badge-destructive",
    
    className
  );

  // Determine what to render based on props
  const renderContent = () => {
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
    <Comp
      data-slot="badge"
      className={badgeClasses}
      {...props}
    >
      {renderContent()}
    </Comp>
  );

}
