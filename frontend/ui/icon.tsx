import {
  Home,
  LayoutDashboard,
  User,
  Settings,
  ChartLine,
  BookUser,
  Users,
  Trophy,
  Bell, BellPlus,
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
  AlertCircle, AlertTriangle,
  Info,
  LogOut,
  LogIn,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  ArrowRight, ArrowLeft,
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
  ShieldUser,
  UserLock,
  CalendarCog,
  Wrench,
  RotateCw,

} from "lucide-react";

import { 
  SlSocialFacebook,
  SlSocialTwitter,
  SlSocialInstagram,
  SlSocialLinkedin
 } from "react-icons/sl";

 import { 
  IoIosMail,
  IoIosLock,
  IoMdPerson,
  IoMdRadioButtonOn,
  IoMdRadioButtonOff
 } from "react-icons/io";

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
  user: IoMdPerson,
  settings: Settings,
  performance: ChartLine,
  memberships: BookUser,
  community: Users,
  members: Users,
  achievements: Trophy,
  courts: LandPlot,
  clubs: Goal,
  leagues: Sword,
  coaches: Rocket,
  privacy: ShieldUser,
  preferences: Wrench,
  'account-settings': UserLock,
  'add-notification': BellPlus,

  // Default fallback
  default: Star,
  // Form Controls - Radio Buttons
  'radio-checked': IoMdRadioButtonOn,
  'radio-unchecked': IoMdRadioButtonOff,

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
  emailfilled: IoIosMail,
  password: Lock,
  lock: IoIosLock,
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
  'court-schedule': CalendarCog,
  matches: Swords,

  // Visibility & State
  show: Eye,
  hide: EyeOff,
  success: Check,
  warning: AlertCircle,
  error: AlertTriangle,
  info: Info,
  reset: RotateCw,

  // Navigation Arrows
  chevrondown: ChevronDown,
  chevronup: ChevronUp,
  chevronright: ChevronRight,
  chevronleft: ChevronLeft,
  arrowright: ArrowRight,
  arrowleft: ArrowLeft,

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
export type IconSize = "sm" | "md" | "lg" | "xl" | "2xl" | "5xl";

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
  /** Click handler for interactive icons */
  onClick?: () => void;
  /** tabIndex - so tab behaviour can be controlled from the Caller whether the icon is tab-able */
  tabIndex?: number;
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
  onClick,
  tabIndex,
}: IconProps) {
  // Smart normalization: convert any casing to lowercase for lookup
  const normalizedName = name.toLowerCase() as keyof typeof iconMap;
  const IconComponent = iconMap[normalizedName];

  // Build icon classes: size prop takes precedence, then className, with merge
  const sizeClass = size ? `icon-${size}` : "";
  const iconClasses = [sizeClass, className].filter(Boolean).join(" ");

  // Check if this is a Material Design icon (from react-icons/md)
  const isMaterialDesignIcon = normalizedName.startsWith('radio-');
  
  const iconStrokeWidth = size === '5xl' ? 3 : 1.5;

  // Extract icon size from className for Material Design icons
  // MD icons need numeric size prop, Lucide icons use CSS classes
  let numericSize = 24; // default
  if (isMaterialDesignIcon) {
    // Check size prop first, then className
    const sizeToCheck = size || iconClasses;
    if (sizeToCheck.includes('icon-5xl')) numericSize = 80;
    else if (sizeToCheck.includes('icon-2xl')) numericSize = 32;
    else if (sizeToCheck.includes('icon-xl')) numericSize = 24;
    else if (sizeToCheck.includes('icon-lg')) numericSize = 20;
    else if (sizeToCheck.includes('icon-md')) numericSize = 18;
    else if (sizeToCheck.includes('icon-sm')) numericSize = 16;
  }
  
  // Radio icons from react-icons have ~20x20 paths in 24x24 viewBox, so scale them up
  // to fill the space and make focus rings tight (scale 1.2x: 20px → 24px)
  const radioScaleClass = normalizedName.startsWith('radio-') ? 'scale-[1.2]' : '';
  const finalIconClasses = [iconClasses, radioScaleClass].filter(Boolean).join(' ');
  
  // Material Design icons need size prop (number), Lucide icons use strokeWidth
  const iconProps = isMaterialDesignIcon 
    ? { size: numericSize, className: finalIconClasses }
    : { strokeWidth: iconStrokeWidth, className: iconClasses };
  // Helper function at the top of the component (or outside it)
  const getBorderedClasses = (size?: IconSize): string => {
    if (!size) return 'icon-bordered';
    
    switch (size) {
      case 'sm': return 'icon-bordered icon-bordered-sm';
      case 'md': return 'icon-bordered icon-bordered-md';
      case 'lg': return 'icon-bordered icon-bordered-lg';
      case 'xl': return 'icon-bordered icon-bordered-xl';
      case '2xl': return 'icon-bordered icon-bordered-2xl';
      case '5xl': return 'icon-bordered icon-bordered-5xl';
      default: return 'icon-bordered';
    }
  };
  // Safety check - fallback to a default icon if the component is undefined
  if (!IconComponent) {
    console.warn(
      `Icon "${name}" (normalized: "${normalizedName}") not found in iconMap. Using Star as fallback.`
    );
    const FallbackIcon = iconMap["default"];

    if (bordered) {
      // const borderedClass = size ? `icon-bordered icon-bordered-${size}` : 'icon-bordered';
      const borderedClass = getBorderedClasses(size);
      const finalBorderedClass = [borderedClass, className].filter(Boolean).join(' ');
      return (
        <div className={finalBorderedClass} onClick={onClick}>
          <FallbackIcon strokeWidth={1.5} className={iconClasses} />
        </div>
      );
    }
    // If onClick provided, wrap in clickable container
    if (onClick) {
      return (
        <span onClick={onClick} 
            className="inline-flex items-center cursor-pointer" 
            role="button" 
            tabIndex={tabIndex ?? -1}>
          <FallbackIcon strokeWidth={1.5} className={iconClasses} />
        </span>
      );
    }

    return <FallbackIcon strokeWidth={1.5} className={iconClasses} />;
  }

  // Render with border frame if requested
  if (bordered) {
    // Apply size-specific border frame class if size prop provided
    const borderedClass = getBorderedClasses(size);
    const finalBorderedClass = [borderedClass, className].filter(Boolean).join(' ');
    
  

    return (
      <div className={finalBorderedClass} onClick={onClick}>
        <IconComponent {...iconProps} />
      </div>
    );
  }

  // If onClick provided, wrap in clickable container for better click handling
  if (onClick) {
    return (
      <span onClick={onClick} 
          className="inline-flex items-center cursor-pointer" 
          role="button" 
          tabIndex={tabIndex ?? -1}>
        <IconComponent {...iconProps} />
      </span>
    );
  }

  return <IconComponent {...iconProps} />;
}
