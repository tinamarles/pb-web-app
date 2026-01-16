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

import type { League, PaginatedResponse } from './definitions';

/**
 * Fetch club events from the client side
 * 
 * @param clubId - Club ID
 * @param type - Filter by event type ('event' | 'league' | 'all')
 * @param status - Filter by status ('upcoming' | 'past' | 'all')
 * @param page - Which page to fetch (default: 1)
 * @param pageSize - Number of results per page (default: backend default, usually 20)
 * @returns PaginatedResponse<League> with results array and pagination metadata
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
  type: 'event' | 'league' | 'all' = 'all',
  status: 'upcoming' | 'past' | 'all' = 'all',
  page: number = 1,
  pageSize?: number,  // Optional - uses backend default if not specified
  includeUserParticipation: boolean = false
): Promise<PaginatedResponse<League>> {
    
  const params = new URLSearchParams({
    type,
    status,
    page: page.toString(),
  });

  // Only add pageSize if explicitly provided
  if (pageSize !== undefined) {
    params.set('pageSize', pageSize.toString());
  }

  if (includeUserParticipation) {
    params.set('includeUserParticipation', 'true');
  }

  const response = await fetch(`/api/club/${clubId}/events?${params}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to fetch events');
  }

  return response.json();
}

// Add more client-side fetch functions as needed...