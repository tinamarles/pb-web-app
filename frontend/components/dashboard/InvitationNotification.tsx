"use client";

import { Notification } from "@/lib/definitions";
import { Button, Avatar } from "@/ui";
import { useRouter } from "next/navigation";

interface InvitationNotificationProps {
  notification: Notification;
  onClick: () => void;
}

/**
 * InvitationNotification - Display individual event invitation
 *
 * Shows notification with title/message and action buttons
 * Click "View Event" → marks read + navigates to event details
 * Click "Dismiss" → marks read + stays on page
 *
 * Example notification structure:
 * {
 *   id: 42,
 *   type: NotificationType.EVENT_INVITATION,
 *   title: "Event Invitation: Monday Night Round-Robin",
 *   message: "Sarah Thompson invited you to Monday Night Round-Robin at Spring Valley Courts",
 *   isRead: false,
 *   actionUrl: "/events/101",
 *   createdAt: "2025-12-26T14:30:00Z"
 * }
 */
export function InvitationNotification({
  notification,
  onClick,
}: InvitationNotificationProps) {
  const router = useRouter();

  const handleViewEvent = () => {
    onClick(); // Mark as read
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  const handleDismiss = () => {
    onClick(); // Mark as read (dismiss)
  };

  return (
    <div className="flex flex-col gap-md p-md bg-surface border border-outline rounded-md">
      {/* Icon */}
      <div className="flex items-center gap-sm">
        <Avatar
          size="sm"
          src={notification.senderInfo?.avatar}
          name={notification.senderInfo?.firstName}
        />
        <span className="single-line-base">
          {notification.senderInfo?.firstName}&nbsp;
          {notification.senderInfo?.lastName}
        </span>
      </div>

      {/* Content */}
      <div className="">
        <p className="title-sm emphasized truncate">{notification.title}</p>
        <p className="label-lg text-on-surface-variant truncate">
          {notification.message}
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-between gap-sm">
        <Button 
          variant="filled" 
          onClick={handleViewEvent}
          label="View Event"
          size="sm"
        />
        <Button 
          variant="outlined"
          icon="close"
          size='sm'
          onClick={handleDismiss}
          label="Dismiss"
          className="border-error text-error"
        />
      </div>
    </div>
  );
}
