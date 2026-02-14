"use client";
import { useRouter } from "next/navigation";
import { Event } from "@/lib/definitions";
import { Button, DataTable, DataTableProps } from "@/ui";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/providers/AuthUserProvider";
import { useDashboard } from "@/providers/DashboardProvider";
import { eventsTableConfig } from "@/data/tableConfig";
import { toast } from "sonner";
import { useMemo } from "react";

/**
 * This component is used by
 * - Club Details - Event Tab: app/club/[clubId]/events
 * - Dashboard - Club Events: app/(sidebarLayout)/dashboard/events
 * - Dashboard - Club Leagues: app/(sidebarLayout)/dashboard/leagues
 * - Resources > Events & Leagues: app/event/list
 */
interface AdminEventsListProps {
  events: Event[];
}

export function AdminEventsList({
  events,
}: AdminEventsListProps) {

  // ========================================
  // STATE & DATA
  // ========================================
  const router = useRouter();
  const { user } = useAuth();
  const { currentMembership } = useDashboard();
  const eventsAvailable = events.length > 0;

  // ========================================
  // FUNCTIONS & COMPONENTS
  // ========================================
  
  const AdminEventList = () => {
    return (
      
        <DataTable
          config={eventsTableConfig}
          data={events}
        />
      
    );
  }
  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="container p-0 mx-auto">
      {eventsAvailable ? (
        <AdminEventList />
      ) : (
        <EmptyState
          icon="events"
          title="No Activities to show!"
          description="Events and leagues will appear here once created."
          className="text-on-surface bg-surface-container-lowest rounded-md"
        />
      )}
    </div>
  );
}