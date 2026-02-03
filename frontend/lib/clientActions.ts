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
  League,
  Event,
  PaginatedResponse,
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
  requireAuth: boolean = true
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
    const error = await response.json().catch(() => ({}));
    throw new Error(
      `[${response.status}] ${error.error || "Failed to fetch events"}`
    );
  }

  return response.json();
}

export async function getSessionParticipantsClient(
  sessionId: number,
  requireAuth: boolean = true
): Promise<SessionParticipants> {
  const params = new URLSearchParams();

  // ✅ Add requireAuth param to query string
  if (!requireAuth) params.set("requireAuth", "false");

  const response = await fetch(
    `/api/session/${sessionId}/participants?${params}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      `[${response.status}] ${error.error || "Failed to fetch events"}`
    );
  }

  return response.json();
}

// Add more client-side fetch functions as needed...
