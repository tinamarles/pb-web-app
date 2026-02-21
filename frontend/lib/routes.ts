// lib/routes.ts
// === MODIFICATION LOG ===
// Date: 2026-02-18
// Modified by: Assistant
// Changes: Created route helper utilities - DRY principle for URL generation
// Previous: Routes hard-coded in multiple places
// ========================

/**
 * Route Helper Utilities
 *
 * DEFINE ONCE, REUSE EVERYWHERE
 *
 * - Single source of truth for all route structures
 * - Type-safe route generation
 * - Easy to refactor if URL structure changes
 * - Self-documenting route names
 */

// ============================================================================
// ADMIN ROUTES
// ============================================================================

/**
 * Admin route helpers (parameterized)
 * Use these when you have the individual IDs
 */
export const adminRoutes = {
  /** Admin club events list */
  clubEvents: (clubId: number | string) => `/admin/${clubId}/events/list`,

  /** Admin event/league Update */
  eventUpdate: (clubId: number | string, leagueId: number | string) =>
    `/admin/${clubId}/events/${leagueId}/update`,

  /** Admin event/league Sessions */
  eventSessions: (clubId: number | string, leagueId: number | string) =>
    `/admin/${clubId}/events/${leagueId}/sessions`,

  /** Admin event member list (specific view) */
  eventMembersList: (clubId: number | string, leagueId: number | string) =>
    `/admin/${clubId}/events/${leagueId}/members/list`,

  /** Admin event member update */
  eventMemberUpdate: (
    clubId: number | string,
    leagueId: number | string,
    memberId: number | string,
  ) => `/admin/${clubId}/events/${leagueId}/members/${memberId}/update`,

  /** Admin event member attendance */
  eventMemberAttendance: (
    clubId: number | string,
    leagueId: number | string,
    memberId: number | string,
  ) => `/admin/${clubId}/events/${leagueId}/members/${memberId}/attendance`,

  /** Admin club settings */
  clubSettings: (clubId: number | string) => `/admin/${clubId}/settings`,
};

// ============================================================================
// OBJECT-BASED ROUTE HELPERS (convenience functions)
// ============================================================================

/**
 * Type for objects with nested participant structure (like AdminLeagueParticipant)
 * Adjust this based on your actual type definitions
 */
type ParticipantWithClubInfo = {
  id: number;
  leagueId: number;
  participant: {
    clubInfo: {
      id: number;
    };
  };
};

/**
 * Type for admin event objects
 */
type AdminEventLike = {
  id: number;
  clubInfo: {
    id: number;
  };
  isEvent: boolean;
};

/**
 * Get event member update route from participant object
 * @example getEventMemberUpdateRoute(member) // "/admin/1/events/5/members/10/update"
 */
export function getEventMemberUpdateRoute(
  member: ParticipantWithClubInfo,
): string {
  return adminRoutes.eventMemberUpdate(
    member.participant.clubInfo.id,
    member.leagueId,
    member.id,
  );
}

/**
 * Get event member attendance route from participant object
 * @example getEventMemberAttendanceRoute(member) // "/admin/1/events/5/members/10/attendance"
 */
export function getEventMemberAttendanceRoute(
  member: ParticipantWithClubInfo,
): string {
  return adminRoutes.eventMemberAttendance(
    member.participant.clubInfo.id,
    member.leagueId,
    member.id,
  );
}

/**
 * Get admin event details route from event object
 * @example getEventUpdateRoute(event) // "/admin/1/events/5/update"
 */
export function getEventUpdateRoute(event: AdminEventLike): string {
  return adminRoutes.eventUpdate(event.clubInfo.id, event.id);
}

/**
 * Get admin event members list route from event object
 * @example getAdminEventMembersRoute(event) // "/admin/1/events/5/members"
 */
export function getEventMembersListRoute(event: AdminEventLike): string {
  return adminRoutes.eventMembersList(event.clubInfo.id, event.id);
}
/**
 * Get event member update route from participant object
 * @example getEventMemberUpdateRoute(member) // "/admin/1/events/5/members/10/update"
 */
export function getEventSessionsRoute(event: AdminEventLike): string {
  return adminRoutes.eventSessions(event.clubInfo.id, event.id);
}
/**
 * CONDITIONAL ROUTE HELPER - Handles Events vs Leagues
 *
 * - If isEvent=true → Sessions view (/sessions)
 * - If isEvent=false (league) → Members list (/members/list)
 */
export function getAdminEventTabRoute(event: AdminEventLike): string {
  return event.isEvent
    ? adminRoutes.eventSessions(event.clubInfo.id, event.id)
    : adminRoutes.eventMembersList(event.clubInfo.id, event.id);
}
// ============================================================================
// PUBLIC ROUTES
// ============================================================================

/**
 * Public-facing route helpers
 */
export const publicRoutes = {
  /** Public club list */
  clubList: () => `/club/list`,
  /** Public club home */
  club: (clubId: number | string) => `/club/${clubId}/home`,

  /** Public club events list */
  clubEvents: (clubId: number | string) => `/club/${clubId}/events`,

  /** Public event details */
  event: (eventId: number | string) => `/event/${eventId}`,

  /** All events list */
  eventsList: () => `/event/list`,

  /** My activities */
  myActivities: () => `/event/my-activities`,

  /** My clubs */
  myClubs: () => `/event/my-clubs`,
};

// ============================================================================
// DASHBOARD ROUTES
// ============================================================================

/**
 * Dashboard route helpers
 */
export const dashboardRoutes = {
  /** Dashboard overview */
  overview: () => `/dashboard/overview`,

  /** Dashboard club details */
  clubDetails: () => `/dashboard/clubdetails`,

  /** Events dashboard */
  events: () => `/dashboard/events`,

  /** Leagues dashboard */
  leagues: () => `/dashboard/leagues`,
};

// ============================================================================
// PROFILE ROUTES
// ============================================================================

/**
 * Profile route helpers
 */
export const profileRoutes = {
  /** Profile details (main profile page) */
  details: () => `/profile/details`,

  /** Profile setup (onboarding) */
  setup: () => `/profile/setup`,

  /** Memberships */
  memberships: () => `/profile/memberships`,

  /** Account settings */
  accountSettings: () => `/profile/settings/account`,
};

// ============================================================================
// AUTH ROUTES
// ============================================================================

/**
 * Authentication route helpers
 */
export const authRoutes = {
  /** Login page */
  login: () => `/login`,

  /** Sign up page */
  signup: () => `/signup`,

  /** Logout (API endpoint) */
  logout: () => `/api/auth/logout`,
};

// ============================================================================
// FEED ROUTES
// ============================================================================

/**
 * Feed route helpers
 */
export const feedRoutes = {
  /** Discover feed */
  discover: () => `/feed/discover`,
};

// ============================================================================
// COMBINED EXPORT (convenience)
// ============================================================================

/**
 * All routes in one object
 * @example routes.admin.clubEvents(clubId)
 * @example routes.public.event(eventId)
 * @example routes.profile.details()
 */
export const routes = {
  admin: adminRoutes,
  public: publicRoutes,
  dashboard: dashboardRoutes,
  profile: profileRoutes,
  auth: authRoutes,
  feed: feedRoutes,
} as const;
