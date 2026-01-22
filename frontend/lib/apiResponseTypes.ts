//lib/apiResponseTypes.ts
/**
 * Django API Response Types (snake_case)
 *
 * These match EXACTLY what Django serializers send.
 * All fields use snake_case (backend convention).
 *
 * Django serializer behavior:**
 * - `blank=True, null=True` → Returns `null` → type: `string | null`
 * - `blank=True` → Returns `""` → type: `string`
 * - Required field → Always returns value → type: `string`
 *
 * The `?` should ONLY be used when:
 * - Field is **conditionally included** by serializer (e.g., only in certain contexts)
 * - Field is **not always sent** in the API response
 *
 **/

import * as C from "@/lib/constants";

/**
 * Generic Paginated Response
 * Used by: Django REST Framework's PageNumberPagination
 *
 * Wraps ANY list endpoint that uses pagination.
 * The pagination class adds these fields automatically.
 *
 * Example usage:
 * - DjangoPaginatedResponse<DjangoClubMember>
 * - DjangoPaginatedResponse<DjangoNotification>
 * - DjangoPaginatedResponse<DjangoAnnouncement>
 */
export interface DjangoPaginatedResponse<T> {
  count: number; // Total number of items across all pages
  next: string | null; // URL to next page (null if last page)
  previous: string | null; // URL to previous page (null if first page)
  results: T[]; // Array of items (your serializer data)
}

// ========================================
// BASE MODEL USER TYPES
// ========================================

/**
 * User info - contains the basic User Info that is
 *             used to display in cards, notifications etc.
 * Maps to:
 * - Backend:  users.UserInfoSerializer
 * - Frontend: type PersonInfo
 */
export interface DjangoUserInfo {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  username: string;
  profile_picture_url: string;
}
/**
 * Base User Fields (CustomUser model)
 * Maps to:
 * - Backend: users.CustomUserSerializer
 * - Frontend: type PublicUser
 */
export type DjangoUserBase = DjangoUserInfo & {
  // Django AbstractUser fields
  email: string;
  // CustomUser model fields
  skill_level: string | null; // DecimalField, null=True
  is_coach: boolean; // default=False
  home_phone: string; // CharField, blank=True
  mobile_phone: string; // CharField, blank=True
  work_phone: string; // CharField, blank=True
  location: string; // CharField, blank=True
  dob: string | null; // DateField, null=True, blank=True
  gender: number; // IntegerField, choices=Gender, default=Gender.UNSPECIFIED
  bio: string; // TextField, blank=True
  // Timestamps
  created_at: string; // DateTimeField, auto_now_add=True
  updated_at: string; // DateTimeField, auto_now=True
};

/**
 * Member User:
 * - backend: MemberUserSerializer
 * - frontend: type MemberUser
 */
export interface DjangoMemberUser extends DjangoUserBase {
  club_memberships: DjangoClubMembership[];
}

/**
 * User:
 * - backend: created by view users.UserDetailsView
 *            depending on whether the user has club_memberships:
 *            CustomUserSerializer -> DjangoUserBase
 *            MemberUserSerializer -> DjangoMemberUser
 * - frontend: type User
 */
export type DjangoUser = DjangoUserBase | DjangoMemberUser;

// ========================================
// APP PUBLIC TYPES
// ========================================
/**
 * Base Address Fields (Address model)
 * Maps to: public - AddressSerializer
 */
export interface DjangoAddress {
  id: number;
  address_line1: string;
  address_line2: string;
  city: string;
  state_province: string;
  postal_code: string;
  country: string;
}
// ========================================
// APP CLUBS TYPES
// ========================================
/**
/**
 * Basic Role Fields without permission flags
 * Maps to: 
 * - backend: RoleSerializer
 * - frontend: type Role
 * NOTE: for admin module a complete RoleSerializer will be required
 */
export interface DjangoRole {
  id: number;
  name: C.RoleTypeValue;
  description: string;
}

/**
 * Club Membership Types
 * Maps to:
 * - backend: clubs - ClubMembershipTypeSerializer
 * - frontend: type ClubMembershipType
 */
export interface DjangoClubMembershipType {
  id: number;
  name: string;
  description: string;
  registration_open_date: string | null; // Model has null=True, blank=True
  registration_close_date: string | null; // Model has null=True, blank=True
  requires_approval: boolean;
  annual_fee: string; // decimal field with default 0.00
  current_member_count: number;
  is_at_capacity: boolean;
  is_registration_open: boolean;
  created_at: string;
  updated_at: string;
}
/**
 * Club Membership Skill Level
 * Maps to:
 * - backend: clubs - ClubMembershipSkillLevelSerializer
 * - frontend: type ClubMembershipSkillLevel
 */
export interface DjangoClubMembershipSkillLevel {
  id: number;
  level: C.SkillLevelValue;
  description: string;
}
/**
 * Nested Club (Lightweight - for use in serializers)
 * Maps to:
 * - backend: clubs - NestedClubSerializer
 * - frontend: type MemberClub
 */
export interface DjangoClubNested {
  id: number;
  club_type: number;
  name: string;
  short_name: string;
  description: string;
  address: DjangoAddress | null;
  phone_number: string;
  email: string;
  website_url: string;
  logo_url: string;
  banner_url: string;
  autoapproval: boolean;
  member_count: number;
}
/**
 * Full Club (includes array of member_id)
 * Maps to:
 * - backend: clubs - ClubSerializer
 * - frontend: type Club
 */
export interface DjangoClub extends DjangoClubNested {
  members: number[];
  created_at: string;
  updated_at: string;
}

/**
 * Club Membership:
 * - part of MemberUserSerializer that extends the CustomUserSerializer with the club_memberships
 * - backend: clubs - ClubMembershipSerializer
 * - frontend: type ClubMembership
 */
export interface DjangoClubMembership {
  id: number;
  club: DjangoClubNested;
  roles: DjangoRole[]; // MTM never return NULL but returns empty [];
  type: DjangoClubMembershipType;
  levels: DjangoClubMembershipSkillLevel[]; // MTM never return NULL but returns empty [];
  membership_number: string;
  is_preferred_club: boolean;
  status: C.MembershipStatusValue;
  registration_start_date: string | null;
  registration_end_date: string | null;
  can_manage_club: boolean;
  can_manage_members: boolean;
  can_create_training: boolean;
  can_manage_leagues: boolean;
  can_manage_league_sessions: boolean;
  can_cancel_league_sessions: boolean;
  can_manage_courts: boolean;
}
/**
 * ==============================
 * Club Details
 * ==============================
 */
/**
 * Home Tab
 * backend: clubs - ClubHomeSerializer
 * frontend: ClubDetailHome
 */
export interface DjangoClubHome {
  club: DjangoModelInfo;
  latest_announcement: DjangoAnnouncement | null;
  top_members: DjangoTopMember[];
  next_event: DjangoLeague | null;
}

/**
 * Top Member - used for Club Home Page and is included in
 *              Members
 * Maps to: clubs.TopMemberSerializer
 * extends: CustomUserSerializer (type: DjangoUserBase)
 * is part of: ClubMemberSerializer
 */
export type DjangoTopMember = DjangoUserBase & {
  joined_date: string; // joined_date maps to created_at from ClubMembership
};

/**
 * Club Member - used to display Club Member List
 *               combines User data (from TopMemberSerializer) and Membership Data
 * Maps to: clubs - ClubMemberSerializer
 * NOTE: This is NOT the same as ClubMembershipSerializer which is used for
 *       the AuthUserProvider!!!
 *
 *       The response is wrapped by the DjangoPaginatedResponse
 */
export type DjangoClubMember = DjangoTopMember & {
  // ClubMembership fields
  membership_id: number;
  roles: DjangoRole[];
  levels: DjangoClubMembershipSkillLevel[];
  type: number; // id of ClubMembershipType
  status: C.MembershipStatusValue;
  created_at: string;
  is_preferred_club: boolean;
};

// ========================================
// APP LEAGUES TYPES
// ========================================

/**
 * Minimal club info (used inside league/event serializers)
 * Maps to: get_club_info() method in LeagueSerializer
 */
export interface DjangoClubInfo {
  id: number;
  name: string;
  logo_url: string;
}

/**
 * Next Occurrence (for events and recurring leagues)
 * Maps to:
 * - backend: leagues.NextOccurrenceSerializer
 * - frontend: type NextOccurrence
 *
 * Used inside DjangoLeague as next_occurrence field
 */
export interface DjangoNextOccurrence {
  date: string; // ISO date from session_date
  start_time: string; // Time format HH:MM from league_session.start_time
  end_time: string; // Time format HH:MM from league_session.end_time
  location_id: number; // From league_session.court_location.id
  location_name: string; // From league_session.court_location.name
  location_address: DjangoAddress; // Full address of location
}

/**
 * League/Event (unified type)
 * Maps to:
 * - backend: leagues.LeagueSerializer
 * - frontend: type Event
 *
 * UPDATED 2026-01-19:
 * - Removed flat next_session_* fields
 * - Added next_occurrence object (nested NextOccurrenceSerializer)
 * - club is now DjangoClubInfo (not DjangoModelInfo)
 * - Uses obj.next_occurrence @property (not prefetch)
 *
 * DESIGN:
 * - Works for BOTH events and leagues (is_event boolean)
 * - For recurring events: next_occurrence is earliest upcoming session
 * - For leagues: next_occurrence is next session
 * - participants_count differs:
 *   * Leagues: Total LeagueParticipation.ACTIVE count
 *   * Events: LeagueAttendance.ATTENDING count for next_occurrence
 */
export interface DjangoLeague {
  id: number;
  name: string;
  description: string;
  is_event: boolean;
  club_info: DjangoClubInfo; // ⚡ CHANGED: Full object with logo
  captain_info: DjangoUserInfo;
  minimum_skill_level: C.SkillLevelValue | null;
  next_occurrence: DjangoNextOccurrence | null; // ⚡ NEW: Nested object
  max_participants: number | null;
  fee: string | null; // decimal field
  allow_reserves: boolean;
  participants_count: number; // Smart count (leagues vs events)
  start_date: string;
  end_date: string;
  image_url: string;
  league_type: C.LeagueTypeValue;
  recurring_days: number[];
  upcoming_occurrences: DjangoNextOccurrence[];

  // Optional user-specific fields (only when include_user_participation=true)
  user_is_captain?: boolean;
  user_is_participant?: boolean;
}

export type DjangoEvent = DjangoLeague

// ========================================
// APP NOTIFICATIONS TYPES
// ========================================

/**
 * Model Info (basic type to pass id and name)
 * - backend: any get_* method
 * - frontend: type ModelInfo
 */
export interface DjangoModelInfo {
  id: number;
  name: string;
}
/**
 * Base FeedItem (contains all the common Fields of Notification and Announcement)
 * Maps to:
 * - backend: clubs - BaseFeedItemSerializer
 * - frontend: type BaseFeedItem
 */
export interface DjangoBaseFeedItem {
  id: number;
  notification_type: C.NotificationTypeValue;
  title: string;
  content: string;
  creator_info: DjangoUserInfo | null;
  club: DjangoModelInfo | null; // required for Announcement but not for Notifications
  league: DjangoModelInfo | null;
  match: Omit<DjangoModelInfo, "name"> | null;
  action_url: string;
  action_label: string;
  created_at: string;
  updated_at: string;
  feed_type: string;
}
/**
 * Notification
 * - backend: NotificationSerializer
 * - frontend: type Notification
 */
export interface DjangoNotification extends DjangoBaseFeedItem {
  is_read: boolean;
  read_at: string | null;
  metadata: Record<string, unknown>;
}
/**
 * Announcement
 * - backend: AnnouncementSerializer
 * - frontend: type Announcement
 */
export interface DjangoAnnouncement extends DjangoBaseFeedItem {
  image_url: string;
  is_pinned: boolean;
  expiry_date: string | null; // it has a default value though
}
/**
 * FeedItem:
 * - backend: created by view notifications.notification_feed
 *            notification_data = NotificationSerializer
 *            announcement_data = AnnouncementSerializer
 * - frontend: type FeedItem
 */
export type DjangoFeedItem = DjangoNotification | DjangoAnnouncement;
/**
 * API Endpoint: api/feed
 * view: notification_feed
 * Response:
 * - 'items': DjangoFeedItem (DjangoNotification | DjangoAnnouncement) [] ... array
 * - 'badge_count': number
 * - 'unread_notifications': number
 * - 'announcement_count': number
 *
 * frontend: type NotificationFeedResponse
 */
export interface DjangoFeed {
  items: DjangoFeedItem[];
  badge_count: number;
  unread_notifications: number;
  announcement_count: number;
}

/**
 * Django input type for creating announcements
 * Used when POSTing to /api/announcements/
 */
export interface DjangoAnnouncementCreate {
  club: number; // Required: Club ID
  league?: number | null; // Optional: Narrows to league members
  match?: number | null; // Optional: Narrows to match participants
  title: string; // Required: Announcement title
  content: string; // Required: Announcement content
  image_url?: string; // Optional: Image URL
  action_url?: string; // Optional: CTA URL
  action_label?: string; // Optional: CTA button text
  is_pinned?: boolean; // Optional: Pin to top (default: false)
  expiry_date?: string | null; // Optional: Expiry date (ISO format)
  // ❌ DO NOT include:
  // - id (auto-generated by backend)
  // - notification_type (auto-calculated by backend)
  // - creator_info (set from request.user)
  // - created_at / updated_at (auto-generated)
  // - feed_type (not a model field)
}

/**
 * Django input type for updating announcements
 * Used when PATCHing to /api/announcements/{id}/
 * All fields optional (partial update)
 */
export interface DjangoAnnouncementUpdate {
  title?: string;
  content?: string;
  image_url?: string;
  action_url?: string;
  action_label?: string;
  is_pinned?: boolean;
  expiry_date?: string | null;
  // ❌ DO NOT include:
  // - club, league, match (cannot be changed after creation)
  // - notification_type (auto-recalculated on save)
}
