"use client";

import { Notification } from "@/lib/definitions";
import { InvitationNotification } from "./InvitationNotification";

export interface PendingInvitationsProps {
  notifications: Notification[];
  onNotificationClick: (id: number) => void;
}

/**
 * PendingInvitations - Display event invitation notifications
 *
 * Receives notifications from AuthContext (already filtered to EVENT_INVITATION)
 * Shows simple notification items that open event details when clicked
 *
 * Usage:
 * ```tsx
 * const { notifications, markNotificationAsRead } = useAuth();
 * const eventInvitations = notifications.filter(
 *   n => n.type === NotificationType.EVENT_INVITATION && !n.isRead
 * );
 *
 * <PendingInvitations
 *   notifications={eventInvitations}
 *   onNotificationClick={(id) => markNotificationAsRead(id)}
 * />
 * ```
 */
export function PendingInvitations({
  notifications,
  onNotificationClick,
}: PendingInvitationsProps) {
  // Don't show section if no invitations
  if (notifications.length === 0) {
    return null;
  }

  return (
      <div className="grid-3 w-full overflow-hidden">
        {notifications.slice(0,3).map((notification) => (
          <InvitationNotification
            key={notification.id}
            notification={notification}
            onClick={() => onNotificationClick(notification.id)}
          />
        ))}
      </div>
    
  );
}
