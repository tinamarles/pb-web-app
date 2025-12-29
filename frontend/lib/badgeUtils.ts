import { 
    NotificationTypeValue, 
    getWorstBadgeVariant } from "./constants";

import { BadgeVariant } from "@/ui";
import type { Notification } from "./definitions";

/**
 * Badge information returned by calculateBadge
 */
export interface BadgeInfo {
  count: number;
  variant: BadgeVariant;
}

/**
 * ONE centralized badge calculation function
 * Used by ALL navigation items (sidebar, bottom nav, more menu, etc.)
 * 
 * 🎯 LOGIC:
 * 1. Filter notifications by type(s) specified in badgeCount
 * 2. Count how many match
 * 3. Determine badge variant based on highest severity
 * 4. Return { count, variant } or null if no matches
 * 
 * 🎯 \"WORST WINS\" RULE:
 * - If multiple notification types, show the most severe variant
 * - Example: 2 warnings + 1 error → shows \"error\" variant with count 3
 * 
 * @param badgeCount - Notification type(s) to filter by (MISNOMER! This is a filter, not a count!)
 * @param notifications - All notifications for the current user
 * @returns Badge info (count + variant) or null if no notifications match
 * 
 * @example
 * // Single notification type
 * const badge = calculateBadge(NotificationType.MEMBERSHIP_EXPIRING, notifications);
 * // Returns: { count: 2, variant: \"warning\" }
 * 
 * @example
 * // Multiple notification types
 * const badge = calculateBadge(
 *   [NotificationType.LEAGUE_INVITATION, NotificationType.MATCH_REQUEST],
 *   notifications
 * );
 * // Returns: { count: 5, variant: \"default\" } (if all are default severity)
 * 
 * @example
 * // Mixed severities (worst wins!)
 * const badge = calculateBadge(
 *   [NotificationType.MEMBERSHIP_EXPIRING, NotificationType.MEMBERSHIP_REJECTED],
 *   notifications
 * );
 * // Returns: { count: 3, variant: \"error\" } (error > warning, so error wins)
 */
export function calculateBadge(
  badgeCount: NotificationTypeValue | NotificationTypeValue[] | undefined,
  notifications: Notification[]
): BadgeInfo | null {
  // No filter specified → no badge
  if (badgeCount === undefined) return null;
  
  // Convert to array for consistent processing
  const filters = Array.isArray(badgeCount) ? badgeCount : [badgeCount];
  
  // Filter notifications by type(s)
  const filtered = notifications.filter(n => 
    filters.includes(n.notificationType) && !n.isRead
  );
  
  // No matching notifications → no badge
  if (filtered.length === 0) return null;
  
  // Extract unique notification types from filtered notifications
  // (Must use actual filtered types, not badgeCount, because badgeCount is a filter spec
  // that may include types the user doesn't have! We need the worst variant of what's ACTUALLY there.)
  const uniqueTypes = Array.from(new Set(filtered.map(n => n.notificationType)));
  
  // Use existing helper from constants.ts to get worst variant!
  const variant = getWorstBadgeVariant(uniqueTypes);
  
  return {
    count: filtered.length,
    variant
  };
}

/**
 * Helper to check if badge should be shown
 * Useful for conditional rendering
 * 
 * @example
 * {shouldShowBadge(item.badgeCount, notifications) && (
 *   <Badge>...</Badge>
 * )}
 */
export function shouldShowBadge(
  badgeCount: NotificationTypeValue | NotificationTypeValue[] | undefined,
  notifications: Notification[]
): boolean {
  return calculateBadge(badgeCount, notifications) !== null;
}

