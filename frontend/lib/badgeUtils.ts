import { 
    NotificationTypeValue, 
    getWorstBadgeVariant,
    NotificationTypeBadgeVariant } from "./constants";

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

/**
 * Get badge variant for a specific club membership
 * Shows ONLY error/warning notifications related to this club
 * 
 * 🎯 USE CASE: Display warning/error badge next to club name in memberships list
 * 
 * 🎯 LOGIC:
 * 1. Filter notifications for this specific club (by club.id)
 * 2. Keep only unread notifications
 * 3. Keep only error or warning severity
 * 4. Return worst variant (error > warning) if any found
 * 
 * @param clubId - The club ID to filter notifications by
 * @param notifications - All notifications for the current user
 * @returns Badge variant ("error" or "warning") or null if no critical notifications
 * 
 * @example
 * // In memberships list
 * const badgeVariant = getMembershipBadgeVariant(membership.club.id, notifications);
 * {badgeVariant && (
 *   <Badge variant={badgeVariant} iconOnly>
 *     <Icon name="alert-triangle" />
 *   </Badge>
 * )}
 */
export function getMembershipBadgeVariant(
  clubId: number | undefined,
  notifications: Notification[]
): BadgeVariant | null {
  // Filter notifications for this specific club
  const clubNotifications = notifications.filter(n => 
    n.club?.id === clubId && !n.isRead
  );
  
  // No notifications for this club → no badge
  if (clubNotifications.length === 0) return null;
  
  // Filter for only error/warning severity notifications
  const criticalNotifications = clubNotifications.filter(n => {
    const variant = NotificationTypeBadgeVariant[n.notificationType];
    return variant === 'error' || variant === 'warning';
  });
  
  // No critical notifications → no badge
  if (criticalNotifications.length === 0) return null;
  
  // Extract unique notification types from critical notifications
  const uniqueTypes = Array.from(new Set(criticalNotifications.map(n => n.notificationType)));
  
  // Use existing helper to get worst variant (error > warning)
  return getWorstBadgeVariant(uniqueTypes);
}

/**
 * Get full notification details for a specific club membership
 * Shows ONLY error/warning notifications related to this club
 * 
 * 🎯 USE CASE: Display detailed notification information in MembershipDetails component
 * 
 * 🎯 LOGIC:
 * 1. Filter notifications for this specific club (by club.id)
 * 2. Keep only unread notifications
 * 3. Keep only error or warning severity
 * 4. Return array of notification details if any found
 * 
 * @param clubId - The club ID to filter notifications by (can be undefined)
 * @param notifications - All notifications for the current user
 * @returns Array of notification details or null if no critical notifications
 * 
 * @example
 * // In MembershipDetails component
 * const notificationInfo = getMembershipNotificationInfo(membership.club.id, notifications);
 * {notificationInfo && (
 *   <div>
 *     <Badge variant={notificationInfo.variant} iconOnly>
 *       <Icon name="alert-triangle" />
 *     </Badge>
 *     <p>{notificationInfo.message}</p>
 *   </div>
 * )}
 */
export function getMembershipNotificationInfo(
  clubId: number | undefined,
  notifications: Notification[]
): { variant: BadgeVariant, message: string }[] | null {
  // No club ID → no badge
  if (!clubId) return null;
  
  // Filter notifications for this specific club
  const clubNotifications = notifications.filter(n => 
    n.club?.id === clubId && !n.isRead
  );
  
  // No notifications for this club → no badge
  if (clubNotifications.length === 0) return null;
  
  // Filter for only error/warning severity notifications
  const criticalNotifications = clubNotifications.filter(n => {
    const variant = NotificationTypeBadgeVariant[n.notificationType];
    return variant === 'error' || variant === 'warning';
  });
  
  // No critical notifications → no badge
  if (criticalNotifications.length === 0) return null;
  
  // Extract unique notification types from critical notifications
  const uniqueTypes = Array.from(new Set(criticalNotifications.map(n => n.notificationType)));
  
  // Use existing helper to get worst variant (error > warning)
  const variant = getWorstBadgeVariant(uniqueTypes);
  
  // Get the message of the first critical notification
  const message = criticalNotifications[0].message;
  
  return criticalNotifications.map(n => ({ variant, message: n.message }));
}