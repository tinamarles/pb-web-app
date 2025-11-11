import type { ButtonProps } from "./button";
import type { LogoProps } from "./logo";

export interface ButtonItem extends ButtonProps {
  onClick: () => void; // Button click handler
}
export interface LogoConfig extends LogoProps {
  href?: string; // Logo link destination - OPTIONAL
}

// Navigation button that uses Link for routing (no onClick handler needed)
export interface NavigationButtonItem extends Omit<ButtonProps, 'onClick'> {
  href: string;                                                            // Navigation destination
}
