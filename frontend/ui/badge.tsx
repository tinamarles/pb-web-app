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
export type BadgeVariant = 
        "primary" | 
        "secondary" | 
        "tertiary" | 
        "outlined" | 
        "error" | 
        "accent1" | 
        "accent2" |
        "warning" |
        "success" |
        "info" |
        "default";

export type BadgeSize = "default" | "sm";

export interface BadgeProps extends React.ComponentProps<"span"> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  asChild?: boolean;
  label?: string;
  icon?: string;
}

export function Badge({
  className,
  variant = "primary",
  size = "default",
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
    variant === "accent1" && "badge-accent1",
    variant === "accent2" && "badge-accent2",
    variant === "outlined" && "badge-outlined",
    variant === "error" && "badge-error",
    variant === "warning" && "badge-warning",
    variant === "success" && "badge-success",
    variant === "default" && "badge-default",
    variant === "info" && "badge-info",
    // Size variant - sm for notification bell red dot
    size === "sm" && "badge-sm",
    
    className
  );

  // Determine what to render based on props
  const renderContent = () => {
    // Size="sm" is typically just a dot (no content)
    if (size === "sm") {
      return null;  // Empty badge - just a colored circle
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
        {icon && <Icon name={icon} size="sm"/>}
        {label && <span className='truncate'>{label}</span>}
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
