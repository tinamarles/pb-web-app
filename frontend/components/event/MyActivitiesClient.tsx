"use client";

// ========================
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthUserProvider";
import { ActivityItem } from "@/lib/definitions";
import { Button } from "@/ui";
import { EmptyState } from "../EmptyState";
import { EventCard } from "./EventCard";
import { EventAction, EventActionType, EventCardModes } from "@/lib/constants";
import { toast } from "sonner";

interface MyActivitiesClientProps {
  activities: ActivityItem[];
}

export function MyActivitiesClient({ activities }: MyActivitiesClientProps) {
  // ========================================
  // STATE & DATA
  // ========================================
  const router = useRouter();
  const { user } = useAuth();

  // 🎯 Filter clubs the user is a member of
  // const memberships = isMemberUser ? (user as MemberUser).clubMemberships : [];

  const activitiesAvailable = activities.length > 0;

  // ========================================
  // EVENT HANDLERS
  // ========================================

  // ========================================
  // FUNCTIONS & COMPONENTS
  // ========================================

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="container p-0 mx-auto">
      {activitiesAvailable ? (
        <h2 className="subheading-md text-primary">
          Activities to show: {activities.length}
        </h2>
      ) : (
        <EmptyState
          icon="events"
          title="No Activities to show!"
          description="You do not have any activities yet. "
          className="text-on-surface bg-surface-container-lowest rounded-md"
          actionLabel="Join an event"
          actionIcon="add"
          href="/event/list"
        />
      )}
    </div>
  );
}
