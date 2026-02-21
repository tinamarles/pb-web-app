"use client";
import { AdminEventBase } from "@/lib/definitions";
import { DataTable } from "@/ui";
import { EmptyState } from "@/components/EmptyState";
import { useDashboard } from "@/providers/DashboardProvider";
import { eventsTableConfig } from "@/data/tableConfig";
import { useMemo } from "react";

/**
 * This component is used by
 * - Club Details - Event Tab: app/club/[clubId]/events
 * - Dashboard - Club Events: app/(sidebarLayout)/dashboard/events
 * - Dashboard - Club Leagues: app/(sidebarLayout)/dashboard/leagues
 * - Resources > Events & Leagues: app/event/list
 */
interface AdminEventsListProps {
  events: AdminEventBase[];
}

export function AdminEventsList({
  events,
}: AdminEventsListProps) {

  // ========================================
  // STATE & DATA
  // ========================================
  
  const { currentMembership } = useDashboard();
  const eventsAvailable = events.length > 0;

  // ========================================
  // DATA FILTERING BASED ON USER ROLE
  // ========================================
  
  const tableData = useMemo(() => {
    // Check if user has admin/organizer permissions
    // These permission fields come from ClubMembership backend
    const canManageAllEvents = 
      currentMembership?.canManageLeagues || 
      currentMembership?.canManageClub;
    
    if (canManageAllEvents) {
      // ✅ Admin/Organizer: Show ALL events
      // - Row highlighting helps identify their own events (via rowClassifier)
      // - Actions disabled for events they don't captain (via action.disabled)
      return events;
    } else {
      // ✅ Captain: Show ONLY their events
      // - All actions enabled (all rows are theirs)
      // - No highlighting needed (all rows are theirs anyway)
      // - Cleaner UX (don't show events they can't manage)
      return events.filter(event => event.userIsCaptain);
    }
  }, [events, currentMembership]);
  
  // ========================================
  // FUNCTIONS & COMPONENTS
  // ========================================
  
  const AdminEventList = () => {
    return (
      
        <DataTable
          config={eventsTableConfig}
          data={tableData}
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