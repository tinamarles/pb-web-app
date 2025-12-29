import type { BaseButtonProps } from "./button";
import type { LogoProps } from "./logo";
import { BadgeVariant } from "./badge";

export type ButtonItem = Omit<BaseButtonProps, 'className' | 'children' | 'iconOnly' | 'asChild'> & {
  id?: string;
  onClick: () => void;
};

export interface LogoConfig extends LogoProps {
  href?: string; // Logo link destination - OPTIONAL
}

// Navigation button that uses Link for routing (no onClick handler needed)
export type NavigationButtonItem = Omit<BaseButtonProps, 'className' | 'children' | 'iconOnly' | 'asChild'> & {
  id?: string;
  href: string;
};

export interface SidebarItem {
  icon: string;
  label: string;
  href?: string;
  active?: boolean;
  badgeCount?: number;
  badgeVariant?: BadgeVariant;
  disabled?: boolean;
}

export interface SidebarSection {
  items: SidebarItem[];
  separator?: boolean; // Show separator before this section
}