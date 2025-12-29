"use client";
// Button Component frontend/app/ui/button.tsx

import { Slot } from "@radix-ui/react-slot";
import { cn } from "./utils";
import { Icon } from "./icon";
import * as React from "react";
import Link from "next/link";
import type { LinkProps } from "next/link";

// Button variants using your CSS utilities system
export type ButtonVariant =
  | "filled"
  | "tonal"
  | "subtle"
  | "outlined"
  | "highlighted"
  | "dismiss"
  | "error"
  | "default";
export type ButtonSize = "sm" | "md" | "lg" | "cta";

// Base props shared by both button and link versions
export type BaseButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  label?: string;
  icon?: string;
  iconOnly?: boolean;
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
  active?: boolean;
};

// Button-specific props (when href is NOT provided)
type ButtonAsButtonProps = BaseButtonProps & {
  asChild?: boolean;
  href?: never;
  type?: "button" | "submit" | "reset";
} & Omit<React.ComponentProps<"button">, keyof BaseButtonProps>;

// Link-specific props (when href IS provided)
type ButtonAsLinkProps = BaseButtonProps & {
  asChild?: never;
  href: string;
  type?: never;
} & Omit<LinkProps, keyof BaseButtonProps | "href">;

// Union type: either button OR link, never both
export type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps;

export function Button(props: ButtonProps) {
  const {
    className,
    variant = "filled",
    size = "md",
    label,
    icon,
    iconOnly = false,
    children,
    ...restProps
  } = props; 

  // Type guards and destructuring
  const asChild = "asChild" in props ? props.asChild : false;
  const href = "href" in props ? props.href : undefined;
  const type = "type" in props ? props.type : "button";
  
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
    variant === "default" && "btn-default",

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
    // ✅ asChild + icon: Clone child and inject icon into its children
    if (asChild && resolvedIcon && children && React.isValidElement(children)) {
      const childElement = children as React.ReactElement<{ children?: React.ReactNode }>;
      return React.cloneElement(childElement, {}, 
        <>
          <Icon name={resolvedIcon} />
          {childElement.props.children}
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

    const content = renderContent();

  // Render as Link when href is provided
  if (href) {
    return (
      <Link
        href={href}
        data-slot="button"
        className={buttonClasses}
        {...(restProps as Omit<LinkProps, "href">)}
      >
        {content}
      </Link>
    );
  }

  // Render as Slot when asChild is true
  if (asChild) {
    return (
      <Slot
        data-slot="button"
        className={buttonClasses}
        {...restProps}
      >
        {content}
      </Slot>
    );
  }

  // Render as regular button
  return (
    <button
      data-slot="button"
      className={buttonClasses}
      type={type}
      {...(restProps as React.ComponentProps<"button">)}
    >
      {content}
    </button>
  );
}
