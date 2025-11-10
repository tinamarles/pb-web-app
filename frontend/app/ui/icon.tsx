import {
  Home,
  LayoutDashboard,
  User,
  Settings,
  ChartLine,
  BookUser,
  Users,
  Trophy,
  Bell,
  Search,
  Menu,
  X,
  Plus,
  Upload,
  Download,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Info,
  LogOut,
  LogIn,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Star,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Lock,
  Play,
  Sparkles,
  Send,
  BarChart3,
  MessageCircle,
  Quote,
  Camera,
  Smartphone,
  Sun,
  Moon,
  Palette,
  LandPlot,
  Goal,
  Sword,
  Rocket,
  Zap,
  CalendarClock,
  Swords,
  Library,
  Link,
  NotebookPen,
  MessageCircleQuestionMark,
} from "lucide-react";

import { 
  SlSocialFacebook,
  SlSocialTwitter,
  SlSocialInstagram,
  SlSocialLinkedin
 } from "react-icons/sl";


/**
 * Central Icon System - Maps unified business names to Lucide components
 *
 * This approach provides:
 * - Consistent naming across the app ("Performance" vs "ChartLine")
 * - Central control over which Lucide icons to use
 * - Type safety for icon names
 * - Easy swapping of icons (change once, applies everywhere)
 *
 * Usage:
 * <Icon name="Dashboard" className="icon-md" />
 * <Icon name="Performance" />
 */

const iconMap = {
  // Navigation & Dashboard
  dashboard: LayoutDashboard,
  home: Home,
  profile: User,
  user: User,
  settings: Settings,
  performance: ChartLine,
  memberships: BookUser,
  community: Users,
  achievements: Trophy,
  courts: LandPlot,
  clubs: Goal,
  leagues: Sword,
  coaches: Rocket,

  // Default fallback
  default: Star,

  // Actions & Interface
  notifications: Bell,
  search: Search,
  menu: Menu,
  close: X,
  add: Plus,
  upload: Upload,
  download: Download,
  edit: Edit,
  delete: Trash2,
  signout: LogOut,
  signin: LogIn,
  help: MessageCircleQuestionMark,

  // Form & Input Icons
  calendar: Calendar,
  location: MapPin,
  phone: Phone,
  email: Mail,
  password: Lock,
  camera: Camera,

  // Navigation & Communication
  sparkles: Sparkles,
  send: Send,
  chart: BarChart3,
  message: MessageCircle,
  quote: Quote,
  smartphone: Smartphone,
  zap: Zap,

  // Resources & Content
  library: Library,
  links: Link,
  blog: NotebookPen,

  // Quick Actions
  bookcourt: CalendarClock,
  matches: Swords,

  // Visibility & State
  show: Eye,
  hide: EyeOff,
  success: Check,
  warning: AlertCircle,
  info: Info,

  // Navigation Arrows
  chevrondown: ChevronDown,
  chevronup: ChevronUp,
  chevronright: ChevronRight,
  chevronleft: ChevronLeft,
  arrowright: ArrowRight,

  // Media Controls
  play: Play,

  // Social Media
  facebook: SlSocialFacebook,
  twitter: SlSocialTwitter,
  instagram: SlSocialInstagram,
  linkedin: SlSocialLinkedin,

  // Light Dark Scheme
  sun: Sun,
  moon: Moon,
  palette: Palette,
} as const;

/**
 * Export the icon map type for use in other interfaces
 */
export type IconName = keyof typeof iconMap;

/**
 * Icon sizes - matches design system tokens
 */
export type IconSize = "sm" | "md" | "lg" | "xl";

/**
 * Icon component props
 */
export interface IconProps {
  /** Your unified icon name (case-insensitive) */
  name: string;
  /** CSS classes - for additional styling (merged with size classes) */
  className?: string;
  /** Icon size - applies correct icon-* class and bordered frame size if bordered=true */
  size?: IconSize;
  /** Wrap icon in circular border frame - uses .icon-bordered class from globals.css */
  bordered?: boolean;
}

/**
 * Icon component - renders the correct Lucide icon based on your unified naming
 *
 * @param name - Your business logic icon name (e.g., "performance", "dashboard", or legacy "Performance")
 * @param className - CSS classes for additional styling (merged with size)
 * @param size - Icon size (sm, md, lg, xl) - applies icon-* class and bordered frame sizing
 * @param bordered - When true, wraps icon in .icon-bordered frame with correct size (uses CSS from globals.css)
 *
 * @example
 * // Icon with size - applies icon-md class
 * <Icon name="user" size="md" />
 *
 * // Icon with border - applies icon-sm to icon and icon-bordered-sm to frame (24x24 for 16px icon)
 * <Icon name="user" size="sm" bordered />
 *
 * // Legacy usage with className still works
 * <Icon name="user" className="icon-md" />
 */
export function Icon({
  name,
  className = "",
  size,
  bordered = false,
}: IconProps) {
  // Smart normalization: convert any casing to lowercase for lookup
  const normalizedName = name.toLowerCase() as keyof typeof iconMap;
  const IconComponent = iconMap[normalizedName];

  // Build icon classes: size prop takes precedence, then className, with merge
  const sizeClass = size ? `icon-${size}` : "";
  const iconClasses = [sizeClass, className].filter(Boolean).join(" ");

  // Safety check - fallback to a default icon if the component is undefined
  if (!IconComponent) {
    console.warn(
      `Icon "${name}" (normalized: "${normalizedName}") not found in iconMap. Using Star as fallback.`
    );
    const FallbackIcon = iconMap["default"];

    if (bordered) {
      // const borderedClass = size ? `icon-bordered icon-bordered-${size}` : 'icon-bordered';
      const borderedClass = "icon-bordered";
      return (
        <div className={borderedClass}>
          <FallbackIcon strokeWidth={1.5} className={iconClasses} />
        </div>
      );
    }
    return <FallbackIcon strokeWidth={1.5} className={iconClasses} />;
  }

  // Render with border frame if requested
  if (bordered) {
    // Apply size-specific border frame class if size prop provided
    const borderedClass = size
      ? `icon-bordered icon-bordered-${size}`
      : "icon-bordered";
    return (
      <div className={borderedClass}>
        <IconComponent strokeWidth={1.5} className={iconClasses} />
      </div>
    );
  }

  return <IconComponent strokeWidth={1.5} className={iconClasses} />;
}
