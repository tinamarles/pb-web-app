// === MODIFICATION LOG ===
// Date: 2025-01-09 (jet lag edition ☕)
// Created by: Assistant
// Purpose: Responsive button wrapper for different mobile/desktop configurations
// Why: Allows different size, label, icon per breakpoint while respecting Button component API
// Fix: Proper discriminated union types to match Button's union type (button vs link)
// ========================

import { Button, type ButtonVariant, type ButtonSize } from "./button";
import type { LinkProps } from "next/link";

export interface ResponsiveButtonConfig {
  size?: ButtonSize;
  label?: string;
  icon?: string;
  iconOnly?: boolean;
}

// Base props shared by both versions
export type BaseResponsiveProps = {
  variant?: ButtonVariant;
  className?: string;
  children?: React.ReactNode;
  mobile: ResponsiveButtonConfig;
  desktop: ResponsiveButtonConfig;
 
};

// Button version (no href)
type ResponsiveButtonAsButtonProps = BaseResponsiveProps & {
  asChild?: boolean;
  href?: never;
  type?: "button" | "submit" | "reset";
} & Omit<
    React.ComponentProps<"button">,
    keyof BaseResponsiveProps | "size" | "label" | "icon" | "iconOnly"
  >;

// Link version (with href)
type ResponsiveButtonAsLinkProps = BaseResponsiveProps & {
  asChild?: never;
  href: string;
  type?: never;
} & Omit<
    LinkProps,
    keyof BaseResponsiveProps | "href" | "size" | "label" | "icon" | "iconOnly"
  >;

// Union: either button OR link
export type ResponsiveButtonProps =
  | ResponsiveButtonAsButtonProps
  | ResponsiveButtonAsLinkProps;

/**
 * ResponsiveButton - Renders different Button configurations for mobile vs desktop
 *
 * @example
 * <ResponsiveButton
 *   mobile={{ size: 'sm', label: 'Admin', icon: 'settings' }}
 *   desktop={{ size: 'md', label: 'Admin Dashboard', icon: 'settings' }}
 *   variant="primary"
 *   onClick={handleClick}
 * />
 */
export function ResponsiveButton(props: ResponsiveButtonProps) {
  const { mobile, desktop, ...sharedProps } = props;

  return (
    <>
      {/* Mobile Version */}
      <div className="sm:hidden">
        <Button
          {...sharedProps}
          size={mobile.size ?? "sm"}
          label={mobile.label}
          icon={mobile.icon}
          iconOnly={mobile.iconOnly}
        />
      </div>

      {/* Desktop/Tablet Version */}
      <div className="hidden sm:block">
        <Button
          {...sharedProps}
          size={desktop.size ?? "md"}
          label={desktop.label}
          icon={desktop.icon}
          iconOnly={desktop.iconOnly}
        />
      </div>
      
    </>
  );
}
