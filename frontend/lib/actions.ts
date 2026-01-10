// frontend/lib/actions.ts
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { snakeToCamel } from "./utils";
import { 
    MemberClub, 
    ClubDetailHome, 
    ClubEventsResponse,
    ClubMembersResponse
  } from "./definitions";
import { 
  RoleTypeValue, 
  SkillLevelValue, 
  MembershipStatusValue 
} from '@/lib/constants';

const API_BASE_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL;

/**
 * Helper function to get authentication headers with JWT token
 * @returns Headers object with Authorization and Content-Type
 * @throws Error if no access token is found
 */
async function getAuthHeaders() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (!accessToken) {
    // ✅ Redirect to login instead of throwing error
    redirect("/login");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };
}

/**
 * Generic custom action PATCH (for non-standard endpoints like /set-preferred/, /archive/, etc.)
 * @param fullEndpoint - Complete endpoint path (e.g., 'clubs/membership/123/set-preferred')
 * @param data - Request body
 * @returns Promise with typed response
 * @example await customPatch<ClubMembership[]>('clubs/membership/3/set-preferred', { is_preferred_club: true })
 */
export async function customPatch<T>(
  fullEndpoint: string,
  data: object
): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_DJANGO_API_URL is not defined");
  }

  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE_URL}/api/${fullEndpoint}/`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(JSON.stringify(errorData));
  }

  return response.json();
}

/**
 * Generic GET request to Django API
 * @param endpoint - Django API endpoint (without /api/ prefix)
 * @returns Promise with typed response data
 * @example await get<Club[]>('clubs')
 */
export async function get<T>(endpoint: string): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_DJANGO_API_URL is not defined");
  }

  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE_URL}/api/${endpoint}/`, {
    cache: "no-store",
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Failed to fetch data from endpoint: /${endpoint}. ${JSON.stringify(
        errorData
      )}`
    );
  }

  return response.json();
}

/**
 * Generic POST request to Django API
 * @param endpoint - Django API endpoint (without /api/ prefix)
 * @param data - Request body data
 * @returns Promise with typed response data
 * @example await post<Club>('clubs', { name: 'New Club' })
 */
export async function post<T>(endpoint: string, data: object): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_DJANGO_API_URL is not defined");
  }

  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE_URL}/api/${endpoint}/`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(JSON.stringify(errorData));
  }

  return response.json();
}

/**
 * Generic PATCH request to Django API
 * @param endpoint - Django API endpoint (without /api/ prefix)
 * @param id - Resource ID
 * @param data - Partial update data
 * @returns Promise with typed response data
 * @example await patch<Club>('clubs', 123, { name: 'Updated Name' })
 */
export async function patch<T>(
  endpoint: string,
  id: number,
  data: object
): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_DJANGO_API_URL is not defined");
  }

  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE_URL}/api/${endpoint}/${id}/`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(JSON.stringify(errorData));
  }

  return response.json();
}

/**
 * Generic DELETE request to Django API
 * @param endpoint - Django API endpoint (without /api/ prefix)
 * @param id - Resource ID
 * @returns Promise with HTTP status code
 * @example await del('clubs', 123)
 */
export async function del(endpoint: string, id: number): Promise<number> {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_DJANGO_API_URL is not defined");
  }

  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE_URL}/api/${endpoint}/${id}/`, {
    method: "DELETE",
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Failed to delete record from endpoint: /${endpoint}/${id}. ${JSON.stringify(
        errorData
      )}`
    );
  }

  return response.status;
}

/**
 * Check if Django backend is reachable
 * @returns Promise<boolean> - true if backend is healthy
 */
export async function checkBackendHealth(): Promise<boolean> {
  if (!API_BASE_URL) {
    return false;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/`, {
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch (error) {
    console.error("Backend health check failed:", error);
    return false;
  }
}

// ========================================
// CLUB-SPECIFIC ACTIONS
// ========================================

/**
 * Get list of all clubs (lightweight data)
 * 
 * @returns Array of MemberClub objects
 * @example const clubs = await getClubs();
 * 
 * Backend: GET /api/clubs/
 * Serializer: NestedClubSerializer (returns MemberClub[])
 */
export const getClubs = cache(async () => {
  const apiData = await get<unknown>('clubs');
  return snakeToCamel(apiData) as MemberClub[];
});

/**
 * Get single club data (lightweight)
 * 
 * @param clubId - Club ID
 * @returns Single MemberClub object
 * @example const club = await getClub('345');
 * 
 * Backend: GET /api/clubs/{id}/
 * Serializer: NestedClubSerializer (returns MemberClub)
 */
export const getClub = cache(async (clubId: string) => {
  const apiData = await get<unknown>(`clubs/${clubId}`);
  return snakeToCamel(apiData) as MemberClub;
});

/**
 * Get club HOME TAB data
 * 
 * @param clubId - Club ID
 * @returns ClubDetailHome object (extends MemberClub with home tab data)
 * @example const clubHome = await getClubHome('345');
 * 
 * Backend: GET /api/clubs/{id}/home/
 * Serializer: ClubDetailHomeSerializer
 * Returns: MemberClub fields + { latestAnnouncement, allAnnouncements, topMembers, nextEvent }
 */
export const getClubHome = cache(async (clubId: string) => {
  const apiData = await get<unknown>(`clubs/${clubId}/home`);
  return snakeToCamel(apiData) as ClubDetailHome;
});

/**
 * Get club EVENTS TAB data
 * 
 * @param clubId - Club ID
 * @param filters - Optional filters (type: 'league'|'event'|'all', status: 'upcoming'|'past'|'all')
 * @returns ClubEventsResponse { events: League[], count: number }
 * @example const { events, count } = await getClubEvents('345', { type: 'league', status: 'upcoming' });
 * 
 * Backend: GET /api/clubs/{id}/events/?type=league&status=upcoming
 * Serializer: LeagueSerializer
 */
export const getClubEvents = cache(async (
  clubId: string,
  filters?: {
    type?: 'league' | 'event' | 'all';
    status?: 'upcoming' | 'past' | 'all';
  }
) => {
  // Build query string
  const params = new URLSearchParams();
  if (filters?.type) params.set('type', filters.type);
  if (filters?.status) params.set('status', filters.status);
  
  const queryString = params.toString();
  const endpoint = `clubs/${clubId}/events${queryString ? `?${queryString}` : ''}`;
  
  const apiData = await get<unknown>(endpoint);
  return snakeToCamel(apiData) as ClubEventsResponse;
});

/**
 * Get club MEMBERS TAB data (paginated, filterable)
 * 
 * @param clubId - Club ID
 * @param filters - Optional filters (role, level, status, page, pageSize)
 * @returns ClubMembersResponse { count, next, previous, results: ClubMember[] }
 * @example const { results, count } = await getClubMembers('345', { role: RoleType.COACH, page: '2' });
 * 
 * Backend: GET /api/clubs/{id}/members/?role=2&page=2
 * Serializer: ClubMemberSerializer (paginated)
 * 
 * IMPORTANT: role, level, and status use INTEGER constants!
 * - role: RoleTypeValue (from constants.ts)
 * - level: SkillLevelValue (from constants.ts)
 * - status: MembershipStatusValue (from constants.ts)
 */
export const getClubMembers = cache(async (
  clubId: string,
  filters?: {
    role?: RoleTypeValue;  // ✅ Integer constant (1 | 2 | 3 | 4 | 5)
    level?: SkillLevelValue;  // ✅ Integer constant (1 | 2 | 3 | 4 | 5 | 6 | 7)
    status?: MembershipStatusValue;  // ✅ Integer constant (1 | 2 | 3 | 4)
    page?: string;  // Pagination - can be any number string
    pageSize?: string;  // Pagination - can be any number string
  }
) => {
  // Build query string
  const params = new URLSearchParams();
  
  // ✅ Convert integer constants to strings for URL query params
  if (filters?.role) params.set('role', filters.role.toString());
  if (filters?.level) params.set('level', filters.level.toString());
  if (filters?.status) params.set('status', filters.status.toString());
  
  // Pagination params are already strings
  if (filters?.page) params.set('page', filters.page);
  if (filters?.pageSize) params.set('page_size', filters.pageSize);
  
  const queryString = params.toString();
  const endpoint = `clubs/${clubId}/members${queryString ? `?${queryString}` : ''}`;
  
  const apiData = await get<unknown>(endpoint);
  return snakeToCamel(apiData) as ClubMembersResponse;
});
