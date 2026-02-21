// frontend/lib/actions.ts
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createApiError, ApiError } from "./apiErrors";
import { snakeToCamel, camelToSnake } from "./utils";
import {
  MemberClub,
  ClubHome,
  AdminLeagueParticipant,
  Event,
  EligibleMember,
  AdminEventBase,
  AdminEvent,
  ClubMember,
  Feed,
  Notification,
  Announcement,
  AnnouncementCreate,
  AnnouncementUpdate,
  PaginatedResponse,
  ParticipationStatusChangeResponse,
  ClubListFilters,
  EventListFilters,
  SessionParticipants,
  UserActivities,
} from "./definitions";
import {
  DjangoPaginatedResponse,
  DjangoParticipationStatusChangeResponse,
  DjangoAdminLeagueParticipant,
  DjangoAdminEventBase,
  DjangoAdminEvent,
  DjangoEvent,
  DjangoEligibleMember,
  DjangoClubHome,
  DjangoClubMember,
  DjangoFeed,
  DjangoAnnouncement,
  DjangoAnnouncementCreate,
  DjangoAnnouncementUpdate,
  DjangoClubNested,
  DjangoSessionParticipants,
  DjangoUserActivities,
} from "./apiResponseTypes";

import {
  RoleTypeValue,
  SkillLevelValue,
  MembershipStatusValue,
} from "@/lib/constants";

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
  data: object,
): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_DJANGO_API_URL is not defined");
  }

  const headers = await getAuthHeaders();

  // ✅ FIX: Add trailing slash ONLY if no query params
  const url = fullEndpoint.includes("?")
    ? `${API_BASE_URL}/api/${fullEndpoint}` // No trailing slash with query params
    : `${API_BASE_URL}/api/${fullEndpoint}/`; // Trailing slash without query params

  const response = await fetch(url, {
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
 * Generic GET request WITHOUT authentication (for public endpoints)
 * @param endpoint - API endpoint (e.g., 'clubs', 'clubs/123')
 * @param cache - If true, uses 'force-cache'; if false/undefined, uses 'no-store' (default)
 * @returns Promise with typed response
 */
export async function getPublic<T>(
  endpoint: string,
  cache?: boolean,
): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_DJANGO_API_URL is not defined");
  }

  // ✅ FIX: Add trailing slash ONLY if no query params
  const url = endpoint.includes("?")
    ? `${API_BASE_URL}/api/${endpoint}` // No trailing slash with query params
    : `${API_BASE_URL}/api/${endpoint}/`; // Trailing slash without query params

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // ✅ Simple: true = force-cache, false/undefined = no-store
      cache: cache ? "force-cache" : "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${endpoint}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Generic GET request to Django API with Authentication required
 * @param endpoint - Django API endpoint (without /api/ prefix)
 * @param cache - If true, uses 'force-cache'; if false/undefined, uses 'no-store' (default)
 * @returns Promise with typed response data
 * @example await get<Club[]>('clubs', true) // Cache it!
 * @throws {ApiError} - Throws ApiError with status code, detail, and endpoint
 */
export async function get<T>(endpoint: string, cache?: boolean): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_DJANGO_API_URL is not defined");
  }

  const headers = await getAuthHeaders();

  // ✅ FIX: Add trailing slash ONLY if no query params
  const url = endpoint.includes("?")
    ? `${API_BASE_URL}/api/${endpoint}` // No trailing slash with query params
    : `${API_BASE_URL}/api/${endpoint}/`; // Trailing slash without query params
  console.log("actions - get with url: ", url);
  const response = await fetch(url, {
    // ✅ Simple: true = force-cache, false/undefined = no-store
    cache: cache ? "force-cache" : "no-store",
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    // ✅ Extract detail message from Django error response
    const detail =
      errorData.detail ||
      errorData.message ||
      response.statusText ||
      "An error occurred";

    // ✅ Throw ApiError with status code, detail, and endpoint
    throw createApiError(response.status, detail, endpoint);
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
  data: object,
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
        errorData,
      )}`,
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
 * @param filters - Optional filters (page, pageSize, search)
 * @param requireAuth - Whether authentication is required
 * @param cache - If true, uses 'force-cache'; if false/undefined, uses 'no-store' (default)
 * @returns Array of MemberClub objects
 * @example const clubs = await getClubs(filters, true, true);
 *
 * Backend: GET /api/clubs/
 * Serializer: NestedClubSerializer (returns MemberClub[])
 */
export const getClubs = cache(
  async (
    filters?: ClubListFilters,
    requireAuth: boolean = true,
    cache?: boolean,
  ) => {
    const params = new URLSearchParams();

    if (filters?.page) params.set("page", filters.page);
    if (filters?.pageSize) params.set("page_size", filters.pageSize);
    if (filters?.search) params.set("search", filters.search);

    const queryString = params.toString();
    const endpoint = `clubs${queryString ? `?${queryString}` : ""}`;
    const fetchFn = requireAuth ? get : getPublic;

    const apiData = await fetchFn<DjangoPaginatedResponse<DjangoClubNested>>(
      endpoint,
      cache,
    );
    return snakeToCamel(apiData) as PaginatedResponse<MemberClub>; // ✅ Returns paginated response
  },
);

/**
 * Get single club data (lightweight)
 *
 * @param clubId - Club ID
 * @param cache - If true, uses 'force-cache'; if false/undefined, uses 'no-store' (default)
 * @returns Single MemberClub object
 * @example const club = await getClub('345', true);
 *
 * Backend: GET /api/clubs/{id}/
 * Serializer: NestedClubSerializer (returns MemberClub)
 */
export const getClub = cache(async (clubId: string, cache?: boolean) => {
  const apiData = await get<unknown>(`clubs/${clubId}`, cache);
  return snakeToCamel(apiData) as MemberClub;
});

/**
 * Get club HOME TAB data
 *
 * @param clubId - Club ID
 * @param cache - If true, uses 'force-cache'; if false/undefined, uses 'no-store' (default)
 * @returns ClubHome object (extends MemberClub with home tab data)
 * @example const clubHome = await getClubHome('345', true);
 *
 * Backend: GET /api/clubs/{id}/home/
 * Serializer: ClubHomeSerializer
 * Returns: MemberClub fields + { latestAnnouncement, allAnnouncements, topMembers, nextEvent }
 */
export const getClubHome = cache(async (clubId: string, cache?: boolean) => {
  const apiData = await get<DjangoClubHome>(`clubs/${clubId}/home`, cache);
  return snakeToCamel(apiData) as ClubHome;
});

/**
 * Get club EVENTS TAB data
 *
 * @param clubId - Club ID
 * @param filters - Optional filters (type: 'league'|'event'|'all', status: 'upcoming'|'past'|'all')
 * @returns ClubEventsResponse { events: Event[], count: number }
 * @example const { events, count } = await getClubEvents('345', { type: 'league', status: 'upcoming' });
 *
 * Backend: GET /api/clubs/{id}/events/?type=league&status=upcoming
 * Serializer: LeagueSerializer
 */
export const getClubEvents = cache(
  async (
    clubId: string,
    filters?: EventListFilters,
    requireAuth: boolean = true,
    requireAdmin: boolean = false,
  ) => {
    const params = new URLSearchParams();

    if (filters?.type) params.set("type", filters.type);
    if (filters?.status) params.set("status", filters.status);
    if (filters?.page) params.set("page", filters.page);
    if (filters?.pageSize) params.set("page_size", filters.pageSize); // ← Converts to snake_case!
    // ← NEW: Add include_user_participation if true
    if (filters?.includeUserParticipation) {
      params.set("include_user_participation", "true");
    }
    // ✅ NEW: Add require_admin if true
    if (requireAdmin) {
      params.set("require_admin", "true");
    }

    const queryString = params.toString(); // ← CRITICAL! Convert params to string!
    const endpoint = `clubs/${clubId}/events${
      queryString ? `?${queryString}` : ""
    }`;
    const fetchFn = requireAuth ? get : getPublic;
    const apiData =
      await fetchFn<DjangoPaginatedResponse<DjangoEvent>>(endpoint);

    return snakeToCamel(apiData) as PaginatedResponse<Event>;
  },
);

/**
 * Get ADMIN club EVENTS List data
 *
 * @param clubId - Club ID
 * @returns AdminEventBase[]
 *
 * Backend: GET /api/admin-events/{id}/
 * Serializer: AdminLeagueListSerializer
 */
export const getAdminClubEvents = cache(
  async (clubId: string, requireAuth: boolean = true) => {
    const endpoint = `admin-events/${clubId}`;
    const fetchFn = requireAuth ? get : getPublic;
    const apiData = await fetchFn<DjangoAdminEventBase[]>(endpoint);

    return snakeToCamel(apiData) as AdminEventBase[];
  },
);

/**
 * Get ADMIN club EVENT Detail data
 *
 * @param clubId - Club ID
 * @param eventId - Event ID
 * @returns AdminEvent
 *
 * Backend: GET /api/admin-events/{id}/
 * Serializer: AdminLeagueListSerializer
 */
export const getAdminClubEvent = cache(
  async (
    clubId: string,
    eventId: string,
    requireAuth: boolean = true,
    cache?: boolean,
  ) => {
    const endpoint = `admin-events/${clubId}/${eventId}`;
    const fetchFn = requireAuth ? get : getPublic;
    const apiData = await fetchFn<DjangoAdminEvent>(endpoint, cache);

    return snakeToCamel(apiData) as AdminEvent;
  },
);

/**
 * Get ADMIN League Participants data
 *
 * @param eventId - Event ID
 * @returns
 *
 * Backend: GET /api/admin-leagues/{id}/participants/
 * Serializer: AdminLeagueParticipantSerializer
 */
export const getAdminLeagueParticipants = cache(
  async (eventId: string, requireAuth: boolean = true) => {
    const endpoint = `admin-leagues/${eventId}/participants`;
    const fetchFn = requireAuth ? get : getPublic;
    const apiData = await fetchFn<DjangoAdminLeagueParticipant[]>(endpoint);

    return snakeToCamel(apiData) as AdminLeagueParticipant[];
  },
);

/**
 * Get Eligible Members for adding to league
 *
 * @param leagueId - League ID
 * @param requireAuth - Whether authentication is required (default: true)
 * @param cache - Whether to cache the response (default: false)
 * @returns EligibleMember[]
 *
 * Backend: GET /api/leagues/{leagueId}/eligible-members/
 * Permissions: IsLeagueAdmin
 */
export const getEligibleMembers = cache(
  async (
    leagueId: number,
    requireAuth: boolean = true,
    useCache?: boolean,
  ): Promise<EligibleMember[]> => {
    const endpoint = `leagues/${leagueId}/eligible-members`;
    const fetchFn = requireAuth ? get : getPublic;
    const apiData = await fetchFn<DjangoEligibleMember[]>(endpoint, useCache);
    return snakeToCamel(apiData) as EligibleMember[];
  },
);

/**
 * Bulk add participants to league (with PENDING status)
 *
 * @param leagueId - League ID
 * @param memberIds - Array of ClubMembership IDs (just numbers: [1, 2, 3, ...])
 * @returns Created count (we ignore participants since router.refresh() will re-fetch)
 * 
 * Backend: POST /api/leagues/{leagueId}/participants/bulk-add/
 * Body: { member_ids: [1, 2, 3, ...] }
 * Response: { created: 5, participants: [...] }
 * Permissions: IsLeagueAdmin
 * 
 * // Step 1: Convert Frontend type (camelCase) → Django type (snake_case)
  const djangoData = camelToSnake(data) as DjangoAnnouncementCreate;

  // Step 2: POST to Django with Django type
  const apiData = await post<DjangoAnnouncement>("announcements", djangoData);

  // Step 3: Convert Django response (snake_case) → Frontend type (camelCase)
  return snakeToCamel(apiData) as Announcement;
 */
export async function addLeagueParticipants(
  leagueId: number,
  memberIds: number[],
): Promise<{ created: number }> {
  const endpoint = `leagues/${leagueId}/participants/bulk-add`;
  // ✅ Convert memberIds → member_ids (Django expects snake_case)
  const djangoData = camelToSnake({ memberIds }) as object;
  // ✅ Backend returns: { created: 5, participants: [...] }
  const apiData = await post<{ created: number }>(endpoint, djangoData);
  // ✅ No need for snakeToCamel - 'created' is the same in both conventions!
  return { created: apiData.created };
}

/**
 * Update participation status (PENDING → ACTIVE, ACTIVE → CANCELLED, etc.)
 *
 * @param participationId - LeagueParticipation ID
 * @param status - New status value
 * @returns Updated participants list + attendance change summary
 *
 * Backend endpoint: PATCH /api/leagues/participation/{id}/status/
 */
export async function updateParticipationStatus(
  participationId: number,
  status: number,
): Promise<ParticipationStatusChangeResponse> {
  const endpoint = `leagues/participation/${participationId}/status`;
  const djangoData = { status };

  // ✅ Backend returns snake_case
  const apiData = await patch<DjangoParticipationStatusChangeResponse>(
    endpoint,
    participationId,
    djangoData,
  );

  // ✅ Convert response from snake_case to camelCase
  return snakeToCamel(apiData) as ParticipationStatusChangeResponse;
}

/**
 * Get events from ALL clubs the user is a member of
 *
 * @param filters - Optional EventListFilters (type, status, page, pageSize)
 * @returns PaginatedResponse<Event> with results array and pagination metadata
 * @example
 * // Get all upcoming events from user's clubs
 * const response = await getMyClubsEvents({
 *   type: EventFilterType.EVENT,
 *   status: EventFilterStatus.UPCOMING,
 *   page: '1',
 *   pageSize: '20'
 * });
 *
 * Backend: GET /api/leagues/my-clubs/?type=event&status=upcoming
 * Serializer: LeagueSerializer
 *
 * 🎯 ADDED: 2026-01-28 - Server-side filtering to clubs where user is ACTIVE member
 *
 * AUTHENTICATION: ✅ Required (redirects to /login if not authenticated)
 *
 * PERFORMANCE:
 * - Server-side filtering (database does the work!)
 * - 2 queries (memberships + leagues)
 * - Scales to thousands of events
 * - Pagination works correctly (filters BEFORE paginating)
 *
 * WHY THIS EXISTS:
 * - "All Events" button on dashboard/overview
 * - Shows events from ALL clubs user is member of
 * - Client-side filtering would break with pagination!
 */
export const getMyClubsEvents = cache(
  async (filters?: EventListFilters): Promise<PaginatedResponse<Event>> => {
    const params = new URLSearchParams();

    if (filters?.type) params.set("type", filters.type);
    if (filters?.status) params.set("status", filters.status);
    if (filters?.page) params.set("page", filters.page);
    if (filters?.pageSize) params.set("page_size", filters.pageSize);

    // Note: includeUserParticipation is always true for this endpoint
    // Backend automatically includes user participation data

    const queryString = params.toString();
    const endpoint = `my-clubs-events${queryString ? `?${queryString}` : ""}`;

    const apiData = await get<DjangoPaginatedResponse<DjangoEvent>>(endpoint);
    return snakeToCamel(apiData) as PaginatedResponse<Event>;
  },
);

export const getUserActivities = cache(async (): Promise<UserActivities> => {
  const endpoint = `profile/activities`;

  const apiData = await get<DjangoUserActivities>(endpoint);
  return snakeToCamel(apiData) as UserActivities;
});

/**
 * Get Session Participants Data
 *
 * @param sessionId - Club ID
 * @returns SessionParticipants { session_id: number, participants: SessionParticipants[], count: number }
 * @example const { events, count } = await getClubEvents('345', { type: 'league', status: 'upcoming' });
 *
 * Backend: GET /api/clubs/{id}/events/?type=league&status=upcoming
 * Serializer: LeagueSerializer
 */
export const getSessionParticipants = cache(
  async (sessionId: string, requireAuth: boolean = true) => {
    const params = new URLSearchParams();

    const queryString = params.toString(); // ← CRITICAL! Convert params to string!
    const endpoint = `leagues/session/${sessionId}/participants${
      queryString ? `?${queryString}` : ""
    }`;
    console.log("calling Participants from Django with: ", endpoint);
    const fetchFn = requireAuth ? get : getPublic;
    const apiData = await fetchFn<DjangoSessionParticipants>(endpoint);

    return snakeToCamel(apiData) as SessionParticipants;
  },
);

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
export const getClubMembers = cache(
  async (
    clubId: string,
    filters?: {
      role?: RoleTypeValue; // ✅ Integer constant (1 | 2 | 3 | 4 | 5)
      level?: SkillLevelValue; // ✅ Integer constant (1 | 2 | 3 | 4 | 5 | 6 | 7)
      status?: MembershipStatusValue; // ✅ Integer constant (1 | 2 | 3 | 4)
      page?: string; // Pagination - can be any number string
      pageSize?: string; // Pagination - can be any number string
    },
  ) => {
    // Build query string
    const params = new URLSearchParams();

    // ✅ Convert integer constants to strings for URL query params
    if (filters?.role) params.set("role", filters.role.toString());
    if (filters?.level) params.set("level", filters.level.toString());
    if (filters?.status) params.set("status", filters.status.toString());

    // Pagination params are already strings
    if (filters?.page) params.set("page", filters.page);
    if (filters?.pageSize) params.set("page_size", filters.pageSize);

    const queryString = params.toString();
    const endpoint = `clubs/${clubId}/members${
      queryString ? `?${queryString}` : ""
    }`;

    const apiData =
      await get<DjangoPaginatedResponse<DjangoClubMember>>(endpoint);
    return snakeToCamel(apiData) as PaginatedResponse<ClubMember>;
  },
);

// ========================================
// EVENT/LEAGUE -SPECIFIC ACTIONS
// ========================================
/**
 * Get list of all events
 *
 * @returns Array of Event objects
 * @example const events = await getEvents();
 *
 * Backend: GET /api/leagues/ -> LeagueViewSet
 * Serializer: LeagueSerializer
 * apiResponseType: DjangoEvent (alias for DjangoLeague)
 */
export const getEvents = cache(
  async (filters?: EventListFilters, requireAuth: boolean = true) => {
    const params = new URLSearchParams();

    if (filters?.type) params.set("type", filters.type);
    if (filters?.status) params.set("status", filters.status);
    if (filters?.page) params.set("page", filters.page);
    if (filters?.pageSize) params.set("page_size", filters.pageSize); // ← Converts to snake_case!

    // ← NEW: Add include_user_participation if true
    if (filters?.includeUserParticipation) {
      params.set("include_user_participation", "true");
    }

    const queryString = params.toString();
    const endpoint = `leagues${queryString ? `?${queryString}` : ""}`;
    const fetchFn = requireAuth ? get : getPublic;
    const apiData =
      await fetchFn<DjangoPaginatedResponse<DjangoEvent>>(endpoint);
    return snakeToCamel(apiData) as PaginatedResponse<Event>; // ✅ Returns paginated response
  },
);

/**
 * Get single event data (lightweight)
 *
 * @param eventId - Event ID
 * @param cache - If true, uses 'force-cache'; if false/undefined, uses 'no-store' (default)
 * @returns Single Event object
 * @example const event = await getEvent('345', true); // Cache it!
 *
 * Backend: GET /api/leagues/{id}/
 * Serializer: LeagueDetailSerializer (returns Event)
 */
export const getEvent = cache(
  async (
    eventId: string,
    filters?: EventListFilters,
    requireAuth: boolean = true,
    cache?: boolean,
  ) => {
    const params = new URLSearchParams();
    if (filters?.includeUserParticipation) {
      params.set("include_user_participation", "true");
    }
    const queryString = params.toString();
    const endpoint = `leagues/${eventId}${
      queryString ? `?${queryString}` : ""
    }`;
    const fetchFn = requireAuth ? get : getPublic;
    const apiData = await fetchFn<DjangoEvent>(endpoint, cache);
    return snakeToCamel(apiData) as Event;
  },
);

// ========================================
// NOTIFICATIONS & ANNOUNCEMENTS
// ========================================

/**
 * Get unified notification feed (notifications + announcements merged)
 *
 * @returns NotificationFeedResponse with merged feed + badge counts
 * @example const { feed, badgeCount } = await getNotificationFeed();
 *
 * Backend: GET /api/feed/
 * Returns: { feed: FeedItem[], badgeCount: number, unreadNotifications: number, announcementCount: number }
 *
 * CRITICAL: Each item has feedType: 'notification' | 'announcement'
 * CRITICAL: Both types have notificationType field for badge counting
 */
export const getNotificationFeed = cache(async () => {
  const apiData = await get<DjangoFeed>("feed");
  return snakeToCamel(apiData) as Feed;
});

/**
 * Get all notifications (1-to-1 messages only)
 *
 * @returns Array of Notification objects
 * @example const notifications = await getNotifications();
 *
 * Backend: GET /api/notifications/
 * Returns: Notification[] (only notifications, excludes announcements)
 */
export const getNotifications = cache(async () => {
  const apiData = await get<unknown>("notifications");
  return snakeToCamel(apiData) as Notification[];
});

/**
 * Get all announcements (1-to-many broadcasts only)
 *
 * @returns Array of Announcement objects
 * @example const announcements = await getAnnouncements();
 *
 * Backend: GET /api/announcements/
 * Returns: Announcement[] (only announcements, excludes notifications)
 * NOTE: Automatically filtered to user's clubs, excludes expired
 */
export const getAnnouncements = cache(async () => {
  const apiData = await get<unknown>("announcements");
  return snakeToCamel(apiData) as Announcement[];
});

/**
 * Get specific announcement by ID
 *
 * @param id - Announcement ID
 * @returns Single Announcement object
 * @example const announcement = await getAnnouncement(123);
 *
 * Backend: GET /api/announcements/{id}/
 */
export const getAnnouncement = cache(async (id: number) => {
  const apiData = await get<unknown>(`announcements/${id}`);
  return snakeToCamel(apiData) as Announcement;
});

/**
 * Mark notification as read
 *
 * @param id - Notification ID
 * @returns Updated Notification object
 * @example await markNotificationAsRead(45);
 *
 * Backend: PATCH /api/notifications/{id}/
 * Body: { is_read: true }
 */
export async function markNotificationAsRead(
  id: number,
): Promise<Notification> {
  const apiData = await patch<unknown>("notifications", id, { is_read: true });
  return snakeToCamel(apiData) as Notification;
}

/**
 * Create new announcement (admin/captain only)
 *
 * @param data - AnnouncementCreate
 * @returns Announcement (camelCase)
 * @example await createAnnouncement({
 *   club: 123,
 *   title: "New rules",
 *   content: "..."
 * });
 *
 * Backend: POST /api/announcements/
 * CRITICAL: notification_type is AUTO-CALCULATED by backend (match → MATCH_ANNOUNCEMENT, league → LEAGUE_ANNOUNCEMENT, club → CLUB_ANNOUNCEMENT)
 */
export async function createAnnouncement(
  data: AnnouncementCreate,
): Promise<Announcement> {
  // Step 1: Convert Frontend type (camelCase) → Django type (snake_case)
  const djangoData = camelToSnake(data) as DjangoAnnouncementCreate;

  // Step 2: POST to Django with Django type
  const apiData = await post<DjangoAnnouncement>("announcements", djangoData);

  // Step 3: Convert Django response (snake_case) → Frontend type (camelCase)
  return snakeToCamel(apiData) as Announcement;
}

/**
 * Update announcement
 *
 * @param id - Announcement ID
 * @param data - Partial<AnnouncementUpdate> (camelCase)
 * @returns Announcement (camelCase)
 */
export async function updateAnnouncement(
  id: number,
  data: Partial<AnnouncementUpdate>,
): Promise<Announcement> {
  // Step 1: Convert Frontend type (camelCase) → Django type (snake_case)
  const djangoData = camelToSnake(data) as Partial<DjangoAnnouncementUpdate>;

  // Step 2: PATCH to Django with Django type
  const apiData = await patch<DjangoAnnouncement>(
    "announcements",
    id,
    djangoData,
  );

  // Step 3: Convert Django response (snake_case) → Frontend type (camelCase)
  return snakeToCamel(apiData) as Announcement;
}

/**
 * Delete announcement (admin/captain only)
 *
 * @param id - Announcement ID
 * @returns HTTP status code
 * @example await deleteAnnouncement(123);
 *
 * Backend: DELETE /api/announcements/{id}/
 */
export async function deleteAnnouncement(id: number): Promise<number> {
  return del("announcements", id);
}
