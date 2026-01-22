'use client';

import { useDashboard } from "@/providers/DashboardProvider";
import { useRouter } from "next/navigation";
import { useState, useEffect } from 'react';
import { EventListFilters } from "@/lib/definitions";
import { EventFilterType, EventFilterStatus } from "@/lib/constants";
import { Event } from "@/lib/definitions";
import { getClubEventsClient } from "@/lib/clientActions";
import { ClubEventsClient } from "../club/ClubEventsClient";

export function EventsPage() {

  // ========================================
  // STATE & DATA
  // ========================================
  const { currentMembership } = useDashboard();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const router = useRouter();
  const joinMode = true;

  useEffect(() => {
      async function fetchData() {
        // ✅ GUARD CLAUSE: Exit early if no data yet!
        if (!currentMembership?.club.id) {
          setLoading(false);
          return; // ← Exit early, safe!
        }
       
        try {
          // Returns PaginatedResponse<League>
          // build filters
          const filters: EventListFilters = {
              type: EventFilterType.EVENT,
              status: EventFilterStatus.UPCOMING,
              page: '1',
              pageSize: '20',
              includeUserParticipation: true
            }
          const response = await getClubEventsClient(
            currentMembership.club.id, // No error!
            filters
          );
          
          setEvents(response.results);  // ← Extract results array
          setTotalCount(response.count); // ← Total count from pagination
         
        } catch (error) {
          // Error was thrown! Parse the error message
          if (error instanceof Error && error.message.startsWith('[401]')) {
            // redirect
            router.push('/login');
          } else {
            // other error
            console.error('Failed to fetch:', error);
          }
           
        } finally {
          setLoading(false);
        }
      }
      
      fetchData();
    }, [currentMembership?.club.id, router]); // Empty array = fetch once on mount
  
    // Handle states...
    if (loading) return <div>Loading...</div>;
    if (!currentMembership) return <div>No club selected</div>;

    // ========================================
    // EVENT HANDLERS
    // ========================================

    // ========================================
    // Render Club Events List
    // ========================================

    return (
        <ClubEventsClient events={events} joinMode={joinMode} gridLimit={true}/>
    )
}