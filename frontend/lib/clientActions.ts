/**
 * Client-side data fetching functions
 *
 * These are used by Client Components to fetch data from Next.js API routes.
 *
 * DO NOT use actions.ts from Client Components - it uses cookies() and redirect()
 * which are server-only functions!
 *
 * Pattern: Client Component → clientActions.ts → API Route → Django
 */

import type {
  EligibleMember,
  Event,
  PaginatedResponse,
  ParticipationUpdateResponse,
  SessionParticipants,
} from "./definitions";
import { EventListFilters } from "./definitions";
/**
 * Fetch club events from the client side
 *
 * @param clubId - Club ID
 * @param type - Filter by event type ('event' | 'league' | 'all')
 * @param status - Filter by status ('upcoming' | 'past' | 'all')
 * @param page - Which page to fetch (default: 1)
 * @param pageSize - Number of results per page (default: backend default, usually 20)
 * @returns PaginatedResponse<Event> with results array and pagination metadata
 *
 * @example
 * // Dashboard overview - only 4 events
 * const { results, count } = await getClubEventsClient(clubId, 'event', 'upcoming', 1, 4);
 *
 * // Events page - show all with default pagination
 * const { results, count } = await getClubEventsClient(clubId, 'event', 'upcoming', 1, 20);
 */
export async function getClubEventsClient(
  clubId: number,
  filters?: EventListFilters, // ✅ Filter object
  requireAuth: boolean = true, // TODO: remove and make optional; will be set to false if no value is provided
): Promise<PaginatedResponse<Event>> {
  const params = new URLSearchParams();

  // Add filters if provided
  if (filters?.type) params.set("type", filters.type);
  if (filters?.status) params.set("status", filters.status);
  if (filters?.page) params.set("page", filters.page);
  if (filters?.pageSize) params.set("pageSize", filters.pageSize);
  if (filters?.includeUserParticipation) {
    params.set("includeUserParticipation", "true");
  }

  // ✅ Add requireAuth param to query string
  if (!requireAuth) params.set("requireAuth", "false");

  const response = await fetch(`/api/club/${clubId}/events?${params}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    // Parse error from handleApiErrorInRoute
    const errorData = await response.json().catch(() => ({
      error: "Failed to fetch Club Events",
    }));

    // Still throw for component error handling
    const error = new Error(errorData.detail || errorData.error);
    (error as any).errorData = errorData;
    throw error;
  }

  return response.json();
}

export async function getSessionParticipantsClient(
  sessionId: number,
  requireAuth: boolean = true,
): Promise<SessionParticipants> {
  const params = new URLSearchParams();

  // ✅ Add requireAuth param to query string
  if (!requireAuth) params.set("requireAuth", "false");

  const response = await fetch(
    `/api/session/${sessionId}/participants?${params}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    },
  );

  if (!response.ok) {
    // Parse error from handleApiErrorInRoute
    const errorData = await response.json().catch(() => ({
      error: "Failed to fetch Session Participants",
    }));

    // Still throw for component error handling
    const error = new Error(errorData.detail || errorData.error);
    (error as any).errorData = errorData;
    throw error;
  }

  return response.json();
}

/**
 * Get eligible members for adding to league
 *
 * @param leagueId - League ID
 * @param requireAuth - Whether authentication is required (default: true)
 * @returns Promise<EligibleMember[]>
 */
export async function getEligibleMembersClient(
  leagueId: number,
  requireAuth: boolean = true,
): Promise<EligibleMember[]> {
  const params = new URLSearchParams();

  // ✅ Add requireAuth param to query string
  if (!requireAuth) params.set("requireAuth", "false");

  const response = await fetch(
    `/api/league/${leagueId}/eligible-members?${params}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    },
  );

  if (!response.ok) {
    // Parse error from handleApiErrorInRoute
    const errorData = await response.json().catch(() => ({
      error: "Failed to fetch eligible members",
    }));

    // Still throw for component error handling
    const error = new Error(errorData.detail || errorData.error);
    (error as any).errorData = errorData;
    throw error;
  }

  return response.json();
}

/**
 * Bulk add participants to league
 *
 * @param leagueId - League ID
 * @param memberIds - Array of ClubMembership IDs
 * @returns Promise with created count (participants ignored, router.refresh() will re-fetch)
 */
export async function addLeagueParticipantsClient(
  leagueId: number,
  memberIds: number[],
): Promise<{ created: number }> {
  const response = await fetch(
    `/api/league/${leagueId}/participants/bulk-add`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberIds }),
    },
  );

  if (!response.ok) {
    // Parse error from handleApiErrorInRoute
    const errorData = await response.json().catch(() => ({
      error: "Failed to add League Participants",
    }));

    // Still throw for component error handling
    const error = new Error(errorData.detail || errorData.error);
    (error as any).errorData = errorData;
    throw error;
  }

  const data = await response.json();
  // ✅ Backend sends participants too, but we only need created count
  // router.refresh() will re-fetch all participants anyway!
  return { created: data.created };
}

/**
 * Update league participation status
 *
 * Pattern: Client Component → clientActions.ts → API Route → Django
 *
 * @param participationId - LeagueParticipation ID
 * @param status - New status (integer constant from LeagueParticipationStatus)
 * @returns Updated participant data + attendance changes summary
 *
 * @example
 * // Activate a pending member
 * const result = await updateParticipationStatusClient(71, LeagueParticipationStatus.ACTIVE);
 * // result.attendanceChanges[0].message: "Created 21 attendance records"
 *
 * // Set member on holiday
 * const result = await updateParticipationStatusClient(71, LeagueParticipationStatus.HOLIDAY);
 * // result.attendanceChanges[0].message: "Updated 21 attendance records"
 */
export async function updateParticipationStatusClient(
  participationId: number,
  status: number,
): Promise<ParticipationUpdateResponse> {
  const response = await fetch(
    `/api/league/participation/${participationId}/status`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    },
  );

  if (!response.ok) {
    // Parse error from handleApiErrorInRoute
    const errorData = await response.json().catch(() => ({
      error: "Failed to update Participation Status",
    }));

    // Still throw for component error handling
    const error = new Error(errorData.detail || errorData.error);
    (error as any).errorData = errorData;
    throw error;
  }

  return response.json();
}
// Add more client-side fetch functions as needed...
