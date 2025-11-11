// frontend/app/ui/avatar.tsx
// Figma Make: components/ui-brand/avatar.tsx

import { memo } from "react";
import { Icon } from "./icon";
import Image from "next/image";

/**
 * Smart Avatar Component - Auto-determines what to display
 * 
 * Display Priority:
 * 1. If `src` is provided → shows image
 * 2. If `name` is provided → shows initials
 * 3. Otherwise → shows generic profile icon
 * 
 * Usage Examples:
 * <Avatar src={user?.avatarUrl} name={`${user?.firstName} ${user?.lastName}`} />
 * <Avatar name="John Doe" /> // Shows "JD"
 * <Avatar /> // Shows generic icon
 */
export interface AvatarProps {
  /** Avatar size variants */
  size?: "xl" | "lg" | "md" | "sm";
  /** Avatar image source URL - takes priority if provided */
  src?: string;
  /** User name for initials generation - used if no src */
  name?: string;
  /** Additional CSS classes */
  className?: string;
}

export const Avatar = memo(function Avatar({
  size = "lg",
  src,
  name,
  className = "",
}: AvatarProps) {
  // Clean size class mapping - all styling handled in CSS
  const avatarSizeClass = `avatar-${size}`;

  // Generate initials from name (2 characters max)
  const getInitials = (fullName: string): string => {
    const trimmed = fullName.trim();
    if (!trimmed) return "";
    
    return trimmed
      .split(" ")
      .filter(word => word.length > 0) // Remove empty strings
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Smart rendering - priority based on what props are available
  const renderAvatarContent = () => {
    // Priority 1: If src is provided, show image
    if (src) {
      return (
        <Image
          src={src}
          alt={name ? `${name}'s avatar` : "User avatar"}
          className="w-full h-full object-cover"
        />
      );
    }

    // Priority 2: If name is provided, show initials
    if (name) {
      const initials = getInitials(name);
      if (initials) {
        return (
          <span className="avatar-text">
            {initials}
          </span>
        );
      }
    }

    // Priority 3: Fallback to generic icon
    return <Icon name='profile' className="avatar-icon" />;
  };

  return (
    <div className={`${avatarSizeClass} ${className}`}>
      {renderAvatarContent()}
    </div>
  );
});