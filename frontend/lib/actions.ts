// frontend/lib/actions.ts
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { snakeToCamel, camelToSnake } from "./utils";
import {
  MemberClub,
  ClubHome,
  League,
  Event,
  ClubMember,
  Feed,
  Notification,
  Announcement,
  AnnouncementCreate,
  AnnouncementUpdate,
  PaginatedResponse,
  ClubListFilters,
  EventListFilters,
} from "./definitions";
import {
  DjangoPaginatedResponse,
  DjangoLeague,
  DjangoEvent,
  DjangoClubHome,
  DjangoClubMember,
  DjangoFeed,
  DjangoAnnouncement,
  DjangoAnnouncementCreate,
  DjangoAnnouncementUpdate,
  DjangoClubNested,
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
  data: object
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
 * @returns Promise with typed response
 */
export async function getPublic<T>(endpoint: string): Promise<T> {
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
      // ✅ No cache for public data to stay fresh
      cache: "no-store",
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
 * @returns Promise with typed response data
 * @example await get<Club[]>('clubs')
 */
export async function get<T>(endpoint: string): Promise<T> {
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
export const getClubs = cache(
  async (filters?: ClubListFilters, requireAuth: boolean = true) => {
    const params = new URLSearchParams();

    if (filters?.page) params.set("page", filters.page);
    if (filters?.pageSize) params.set("page_size", filters.pageSize);
    if (filters?.search) params.set("search", filters.search);

    const queryString = params.toString();
    const endpoint = `clubs${queryString ? `?${queryString}` : ""}`;
    const fetchFn = requireAuth ? get : getPublic;

    const apiData = await fetchFn<DjangoPaginatedResponse<DjangoClubNested>>(
      endpoint
    );
    return snakeToCamel(apiData) as PaginatedResponse<MemberClub>; // ✅ Returns paginated response
  }
);

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
 * @returns ClubHome object (extends MemberClub with home tab data)
 * @example const clubHome = await getClubHome('345');
 *
 * Backend: GET /api/clubs/{id}/home/
 * Serializer: ClubHomeSerializer
 * Returns: MemberClub fields + { latestAnnouncement, allAnnouncements, topMembers, nextEvent }
 */
export const getClubHome = cache(async (clubId: string) => {
  const apiData = await get<DjangoClubHome>(`clubs/${clubId}/home`);
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
    requireAuth: boolean = true
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

    const queryString = params.toString(); // ← CRITICAL! Convert params to string!
    const endpoint = `clubs/${clubId}/events${
      queryString ? `?${queryString}` : ""
    }`;
    const fetchFn = requireAuth ? get : getPublic;
    const apiData = await fetchFn<DjangoPaginatedResponse<DjangoEvent>>(
      endpoint
    );

    return snakeToCamel(apiData) as PaginatedResponse<Event>;
  }
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
    }
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

    const apiData = await get<DjangoPaginatedResponse<DjangoClubMember>>(
      endpoint
    );
    return snakeToCamel(apiData) as PaginatedResponse<ClubMember>;
  }
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
    const apiData = await fetchFn<DjangoPaginatedResponse<DjangoEvent>>(
      endpoint
    );
    return snakeToCamel(apiData) as PaginatedResponse<Event>; // ✅ Returns paginated response
  }
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
  id: number
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
  data: AnnouncementCreate
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
  data: Partial<AnnouncementUpdate>
): Promise<Announcement> {
  // Step 1: Convert Frontend type (camelCase) → Django type (snake_case)
  const djangoData = camelToSnake(data) as Partial<DjangoAnnouncementUpdate>;

  // Step 2: PATCH to Django with Django type
  const apiData = await patch<DjangoAnnouncement>(
    "announcements",
    id,
    djangoData
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
