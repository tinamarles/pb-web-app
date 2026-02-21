// frontend/lib/definitions.ts

import * as C from "@/lib/constants";
import { BadgeVariant } from "@/ui";

// Generic Type for dynamic route params
export type PageProps<
  TParams = Record<string, string>,
  TSearchParams = Record<string, string | string[]>,
> = {
  params: Promise<TParams>;
  searchParams?: Promise<TSearchParams>;
};

// 🎯 Empty object type (for when you don't need params or searchParams)
export type EmptyObject = Record<string, never>;

// Token Response delivered by JWT
export interface JWTResponse {
  access: string;
  refresh: string;
  user_role: string;
}

// +++ Core types using PascalCase for the interface names, singular nouns for data
export interface ModelInfo {
  id: number;
  name: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// +++ Filtering types
// NEW: Event list filters
export interface EventListFilters {
  type?: C.EventFilterTypeValue; // "event" | "league" | "all";
  status?: C.EventFilterStatusValue; // "upcoming" | "past" | "all";
  page?: string;
  pageSize?: string;
  includeUserParticipation?: boolean;
}

// NEW: Club list filters
export interface ClubListFilters {
  page?: string;
  pageSize?: string;
  search?: string;
}

/** Address
 * apiResponseType: DjangoAddress
 * backend: public.AddressSerializer
 */
export interface Address {
  id?: number;
  addressLine1: string;
  addressLine2: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  country: string;
}

/** Role
 * apiResponseType: DjangoRole
 * backend: clubs.RoleSerializer
 */
export interface Role {
  id: number;
  name: C.RoleTypeValue;
  description: string;
}

/** ClubMembershipType
 * apiResponseType: DjangoClubMembershipType
 * backend: clubs.ClubMembershipTypeSerializer
 */
export interface ClubMembershipType {
  id: number;
  name: string; // e.g., "Resident", "Non-Resident", "Junior"
  description: string; // always return in response; if blank=True -> ""
  registrationOpenDate: string | null;
  registrationCloseDate: string | null;
  requiresApproval: boolean;
  annualFee: string; // decimal field in Django
  currentMemberCount: number; // ✅ From @property
  isAtCapacity: boolean; // ✅ From @property
  isRegistrationOpen: boolean;
  createdAt: string;
  updatedAt: string;
}

/** ClubMembershipSkillLevel
 * apiResponseType: DjangoClubMembershipSkillLevel
 * backend: clubs.ClubMembershipSkillLevelSerializer
 */
export interface ClubMembershipSkillLevel {
  /* club.serializer sends fields = ['id', 'level', 'description']
    id = primaryKey
    level = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True, null=True)
  */
  id: number;
  level: C.SkillLevelValue;
  description: string;
}

/** MemberClub
 * apiResponseType: DjangoClubNested
 * backend: clubs.NestedClubSerializer
 */
export interface MemberClub {
  /* light-weight club that is used for a Club member. It
     does NOT include the array that contains all the members of 
     the club.
  */
  id: number;
  clubType: C.ClubTypeValue;
  name: string;
  shortName: string;
  description: string;
  address: Address | null;
  phoneNumber: string; // ✅ FIXED: Django has blank=True ONLY (not null=True)
  email: string; // ✅ FIXED: Django has blank=True ONLY (not null=True)
  websiteUrl: string; // ✅ FIXED: Django has blank=True ONLY (not null=True)
  logoUrl: string; // ✅ FIXED: Django has blank=True ONLY (not null=True)
  bannerUrl: string;
  autoapproval: boolean; // default=False in Django
  memberCount: number; // ✅ Added (calculated)
}
/** Club
 * apiResponseType: DjangoClub
 * backend: clubs.ClubSerializer
 */
export interface Club extends MemberClub {
  /* The complete Club object which extends MemberClub by having
     extra fields:
     - members: the array of id's of the users linked to that club
     - created_at
     - updated-at
  */
  members: number[]; // contains the user Id's of all club members
  createdAt: string;
  updatedAt: string;
}
/** ClubMembership
 * apiResponseType: DjangoClubMembership
 * backend: clubs.ClubMembershipSerializer
 */

export interface ClubMembership {
  id: number;
  club: MemberClub; // required in Django
  roles: Role[];
  type: ClubMembershipType;
  levels: ClubMembershipSkillLevel[];
  membershipNumber: string | null;
  isPreferredClub: boolean;
  status: C.MembershipStatusValue;
  registrationStartDate: string | null;
  registrationEndDate: string | null;
  // ✅ Aggregated permission flags from Django @property methods
  canManageClub: boolean;
  canManageMembers: boolean;
  canCreateTraining: boolean;
  canManageLeagues: boolean;
  canManageLeagueSessions: boolean;
  canCancelLeagueSessions: boolean;
  canManageCourts: boolean;
}
// +++ User-specific types: types for different user roles

/** UserInfo
 * apiResponseType: DjangoUserInfo
 * backend: users.UserInfoSerializer
 */
export interface UserInfo {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string; // Computed from firstName + lastName
  username: string;
  profilePictureUrl: string;
}
/** PublicUser
 * apiResponseType: DjangoUserBase
 * backend: clubs.CustomUserSerializer
 */
export interface PublicUser extends UserInfo {
  // Additional fields:
  // apiResponseType: DjangoUserBase
  // backend: users.CustomUserSerializer
  email: string; // Required but optional in response
  skillLevel: string | null; // decimal field in Django ✅ null=True - NULL OK
  isCoach: boolean;
  homePhone: string; // ✅ blank=True only - NO null!
  mobilePhone: string; // ✅ blank=True only - NO null!
  workPhone: string; // ✅ blank=True only - NO null!
  location: string; // ✅ blank=True only - NO null!
  dob: string | null; // ✅ null=True - NULL OK
  gender: C.GenderValue; // Has default, not null
  bio: string; // ✅ blank=True only - NO null!
  createdAt: string;
  updatedAt: string;
  // themePreference?: Theme;
}
/** MemberUser
 * apiResponseType: DjangoMemberUser
 * backend: clubs.MemberUserSerializer
 */
export interface MemberUser extends PublicUser {
  clubMemberships: ClubMembership[];
}
/** User
 * apiResponseType: DjangoUser
 * backend: users.UserDetailsView
 *          uses either CustomUserSerializer -> PublicUser
 *                      MemberUserSerializer -> MemberUser
 */
// The union type representing the possible API responses
export type User = PublicUser | MemberUser;

/**
 * =============================
 * Notifications
 * =============================
 */

export interface BaseFeedItem {
  id: number;
  notificationType: C.NotificationTypeValue;
  title: string;
  content: string;
  creatorInfo: UserInfo | null;
  club: ModelInfo | null;
  league: ModelInfo | null;
  match: Omit<ModelInfo, "name"> | null;
  actionUrl: string;
  actionLabel: string;
  createdAt: string; // ISO 8601 datetime
  updatedAt: string; // ISO 8601 datetime
  feedType: "notification" | "announcement"; // Added by serializer
}

/**
 * Notification - 1-to-1 notifications sent to specific users
 *
 * Backend: NotificationSerializer
 * Backend Type: DjangoNotification
 * Endpoint: GET /api/notifications/feed/ ??? -> /api/profile/feed (not yet implemented)
 *
 * CRITICAL NOTES:
 * - feedType is added by serializer (for unified feed)
 * - content field contains the message
 * - creatorInfo is the sender (can be null for system notifications)
 * - club/league/match are optional context (nested objects or null)
 */
export interface Notification extends BaseFeedItem {
  // === NOTIFICATION-SPECIFIC FIELDS ===
  isRead: boolean;
  readAt: string | null; // ISO 8601 datetime, null if not read yet
  metadata: Record<string, unknown>; // JSON field for additional data
}

/**
 * Announcement - Club-wide announcements (1-to-many broadcasts)
 *
 * Backend: AnnouncementSerializer
 * Backend Type: DjangoAnnouncement
 * Endpoint: GET /api/notifications/feed/ ??? -> /api/clubs/{id}/announcements
 *
 * CRITICAL NOTES:
 * - feedType is added by serializer (for unified feed)
 * - club is REQUIRED (all announcements belong to a club - NOT NULL!)
 * - league/match are OPTIONAL (narrow audience within club)
 * - Different from Notification which is 1-to-1 to specific user
 *
 * AUDIENCE LOGIC:
 * - club only → All club members see it
 * - club + league → Only league participants see it
 * - club + match → Only match participants see it
 */
export interface Announcement extends BaseFeedItem {
  // === ANNOUNCEMENT-SPECIFIC FIELDS ===
  imageUrl: string;
  isPinned: boolean;
  expiryDate: string | null; // ISO 8601 date, null = never expires
}

/**
 * FeedItem - Unified feed item (Notification OR Announcement)
 *
 * Backend Type: DjangoFeedItem
 *
 * USAGE:
 * Used by /api/feed/ endpoint which merges notifications + announcements
 * Check feedType to determine which type and render appropriate component
 */
export type FeedItem = Notification | Announcement;

/**
 * NotificationFeedResponse - Response from /api/feed/ endpoint
 *
 * Backend Type: DjangoFeed
 *
 * RETURNS:
 * - feed: Merged array of notifications + announcements
 * - badgeCount: Total unread count (notifications + announcements)
 * - unreadNotifications: Count of unread notifications only
 * - announcementCount: Count of announcements only
 */
export interface Feed {
  items: FeedItem[];
  badgeCount: number;
  unreadNotifications: number;
  announcementCount: number;
}

/**
 * Frontend input type for creating announcements
 * Used in forms, validation, etc.
 */
export interface AnnouncementCreate {
  club: number;
  league?: number | null;
  match?: number | null;
  title: string;
  content: string;
  imageUrl?: string;
  actionUrl?: string;
  actionLabel?: string;
  isPinned?: boolean;
  expiryDate?: string | null;
}

/**
 * Frontend input type for updating announcements
 * All fields optional (partial update)
 */
export interface AnnouncementUpdate {
  title?: string;
  content?: string;
  imageUrl?: string;
  actionUrl?: string;
  actionLabel?: string;
  isPinned?: boolean;
  expiryDate?: string | null;
}
/**
 * =============================
 * Courts and User Booking
 * =============================
 */
export interface CourtInfo {
  id: number;
  name: string;
  address: Address;
}
/**
 * =============================
 * User Activities
 * =============================
 */
export interface UserActivities {
  activities: ActivityItem[];
}

/**
 * Single activity item (either session or booking)
 */
export type ActivityItem = EventActivity | BookingActivity;

/**
 * Event activity (league/event session)
 * Uses minimal Event-like structure with Event type
 */
export interface EventActivity {
  type: typeof C.ActivityType.EVENT;

  // Event/League info (subset of Next.js Event type)
  event: {
    id: number;
    name: string;
    fee: string | null; // decimal field in Django
    clubInfo: ClubInfo;
    captainInfo: UserInfo | null;
    imageUrl: string;
    tags?: Tag[]; // has to be optional because currently backend does not send tags!
    userIsCaptain: boolean;
    userIsParticipant: boolean;
    minimumSkillLevel: C.SkillLevelValue | null;
    recurringDays: C.DayOfWeekValue[];
    isEvent: boolean;
  };

  // Session occurrence info
  session: Session; // NOTE: Session type has slightly changed
}

/**
 * Court booking activity
 */
export interface BookingActivity {
  type: typeof C.ActivityType.BOOKING;
  event: {
    id: number;
    bookingType: C.BookingTypeValue;
    captainInfo: UserInfo; // not null -> has to have a value
    userIsOrganizer: boolean;
    courtNumber: string;
    withPlayers: UserInfo[];
    externalBookingReference: string;
    notes: string;
    fee: string | null;
  };
  session: Session;
}

export type EventCardSession = Session & {
  courtNumber?: string;
};

export type EventCardType = {
  type: C.ActivityTypeValue;
  eventInfo: {
    id: number;
    name: string;
    fee: string | null; // decimal field in Django
    avatarUrl: string;
    avatarName: string;
    imageUrl: string;
    tags?: Tag[]; // has to be optional because currently backend does not send tags!
    userIsCaptain: boolean;
    userIsParticipant: boolean;
    recurringDays: C.DayOfWeekValue[];
    isEvent: boolean;
  };
  sessionInfo?: EventCardSession;
};

/**
 * Week data structure for weekly view
 * NOTE: Uses ActivityItem directly (no conversion needed!)
 */
export interface WeekData {
  startDate: Date; // Monday
  endDate: Date; // Sunday
  days: Array<{
    date: Date;
    dayOfWeek: C.DayOfWeekValue; // ✅ Use constant type instead of number!
    activities: ActivityItem[];
    hasActivities: boolean;
  }>;
}

/**
 * =============================
 * Club Detail
 * =============================
 */

/* +++++ HOME TAB +++++ */

// maps to: DjangoTopMember
// used in Home Tab
export interface TopMember extends PublicUser {
  joinedDate: string;
}

/**
 * ClubHome - Club home tab data
 * apiResponseType: DjangoClubHome
 * backend: clubs.ClubHomeSerializer
 *
 * UPDATED 2026-01-19:
 * - nextEvent now uses League (not EventLight alias)
 */
export interface ClubHome {
  club: ModelInfo;
  latestAnnouncement: Announcement | null;
  topMembers: TopMember[];
  nextEvent: League | null; // ⚡ CHANGED: Use League directly
}

/* +++++ MEMBERS TAB +++++ */
// maps to: DjangoClubMember
// used in Members Tab
export type ClubMember = TopMember & {
  membershipId: number;
  clubInfo: ClubInfo;
  roles: Role[];
  levels: ClubMembershipSkillLevel[];
  type: number;
  status: C.MembershipStatusValue;
  createdAt: string;
  isPreferredClub: boolean;
};

/* +++++ EVENTS TAB +++++ */
// maps to: DjangoLeague
// used in Events Tab
/**
 * ClubInfo - minimal club info used in league/event cards
 * apiResponseType: DjangoClubInfo
 * backend: leagues.LeagueSerializer.get_club_info()
 */
export interface ClubInfo {
  id: number;
  name: string;
  logoUrl: string;
}

/**
 * NextOccurrence - next session info for events/leagues
 * apiResponseType: DjangoNextOccurrence
 * backend: leagues.NextOccurrenceSerializer based on SessionOccurrence model
 */
export interface Session {
  id: number;
  date: string; // ISO date
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  //locationId: number;
  //locationName: string;
  //locationAddress: Address;
  courtInfo: CourtInfo;
  participantsCount: number;
  userAttendanceStatus: C.LeagueAttendanceStatusValue | null;
  registrationOpen: boolean;
  maxParticipants: number | null;
}

/**
 * LeagueSession -> based on model LeagueSession (not SessionOccurrence)
 */

export interface LeagueSession {
  id: number;
  courtLocationInfo: CourtInfo;
  courtsUsed: number;
  dayOfWeek: C.DayOfWeekValue;
  startTime: string | null;
  endTime: string | null;
  recurrenceType: C.RecurrenceTypeValue;
  recurrenceInterval: number;
  activeFrom: string | null;
  activeUntil: string | null;
  isActive: boolean;
}
// Type for participant data
export type Participant = UserInfo & {
  skillLevel: string | null; // DecimalField, null=True
};

// API Response type
export interface SessionParticipants {
  sessionId: number;
  participants: Participant[];
  count: number;
}
/**
 * League/Event (unified type)
 * apiResponseType: DjangoLeague
 * backend: leagues.LeagueSerializer
 *
 * UPDATED 2026-01-19:
 * - Removed flat nextSession* fields
 * - Added nextSession object
 * - club changed to clubInfo (includes logo)
 */
export interface League {
  id: number;
  name: string;
  description: string;
  isEvent: boolean;
  clubInfo: ClubInfo; // ⚡ CHANGED: Full object with logo
  captainInfo: UserInfo;
  minimumSkillLevel: C.SkillLevelValue | null;
  nextSession: Session | null; // ⚡ NEW: Nested object
  oneTimeSessionInfo: Session | null;
  maxParticipants: number | null;
  fee: string | null; // decimal field in Django
  allowReserves: boolean;
  participantsCount: number;
  startDate: string;
  endDate: string;
  imageUrl: string;
  leagueType: C.LeagueTypeValue;
  recurringDays: C.DayOfWeekValue[];
  isRecurring: boolean;
  isActive: boolean; // ✅ Added based on is_active property in Django model
  upcomingSessions?: Session[];
  userHasUpcomingSessions?: boolean;
  userNextSessionId?: number | null;

  // Optional user-specific fields (only when requested)
  userIsCaptain?: boolean;
  userIsParticipant?: boolean;
}

/**
 * EventLight - Alias for backwards compatibility
 * Now just references League (they're the same!)
 */
export type EventLight = League;

/**
 * Event - based on League plus additional fields that
 *         will be added in future for tags, join logic etc.
 * Used by <EventCard> component
 *
 * NOTES:
 * Tag.category -> needs to become a constant!!
 * userStatus.joinReason -> needs to become a constant!?
 */
export interface Tag {
  id?: number;
  slug?: string; // 'beginner', 'women-only'
  name: string; // 'Beginner', 'Women Only'
  category?: "SKILL" | "DEMOGRAPHIC" | "ACCESS" | "SPECIAL";
  color: BadgeVariant;
}

export type Event = League & {
  tags?: Tag[];
  userStatus?: {
    isMember: boolean;
    isParticipant: boolean;
    isCaptain: boolean;
    canJoin: boolean;
    joinReason?: string;
    calculatedPrice?: number;
  };
};

/**
 * ADMIN EVENT TYPES
 */

export interface AdminEventBase {
  id: number;
  name: string;
  isEvent: boolean;
  clubInfo: ClubInfo; // ⚡ CHANGED: Full object with logo
  captainInfo: UserInfo;
  minimumSkillLevel: C.SkillLevelValue | null;
  maxParticipants: number | null;
  participantsCount: number;
  fee: string | null; // decimal field in Django
  startDate: string;
  endDate: string;
  isActive: boolean; // ✅ Added based on is_active property in Django model
  userIsCaptain: boolean;
}

export type AdminEvent = AdminEventBase & {
  description: string;
  imageUrl: string;
  allowReserves: boolean;
  registrationOpensHoursBefore: number;
  registrationClosesHoursBefore: number;
  registrationStartDate: string | null;
  registrationEndDate: string | null;
  leagueType: C.LeagueTypeValue;
  defaultGenerationFormat: C.GenerationFormatValue;
  leagueSessions: LeagueSession[];
};

export interface AdminLeagueParticipant {
  id: number;
  leagueId: number;
  participant: ClubMember;
  status: C.LeagueParticipationStatusValue;
  joinedAt: string;
  leftAt: string | null;
  captainNotes: string;
  excludeFromRankings: boolean;
}

/**
 * Eligible Member for adding to league
 * Returned from /api/leagues/{leagueId}/eligible-members/
 */
export interface EligibleMember {
  id: number; // ClubMembership ID
  userInfo: UserInfo;
  email: string;
  status: C.MembershipStatusValue; // Club membership status
}

/** Update Participation Status
 * Returned from /api/leagues/participation/{memberId}/status
 */
export interface ParticipationStatusChangeResponse {
  participants: AdminLeagueParticipant[];
  attendanceChanges: AttendanceChange[];
}

/**
 * Attendance change record (from Django API)
 */
export interface AttendanceChange {
  participationId: number;
  attendanceCreated?: number;    // ✅ Now camelCase after conversion!
  attendanceDeleted?: number;
  attendanceUpdated?: number;
  message: string;
}

// ⚡ Helper to check if event is recurring (frontend-side)
export function isRecurring(event: Event): boolean {
  return event.recurringDays && event.recurringDays.length > 0;
}

// +++ Form specific types
export interface LoginFormValues {
  identifier: string;
  password: string;
}
export interface SignUpFormValues {
  username: string;
  email: string;
  password: string;
}

export interface ClubFormValues {
  name: string;
  description: string;
  // etc.
}
// +++ Utility functions and context types

// Custom type guard to determine if the user is a member
export function isMemberUser(user: User): user is MemberUser {
  return "clubMemberships" in user;
}

export function isUser(data: unknown): data is User {
  // the name APIUser will change to conform to best practice
  // naming conventions
  return (
    typeof data === "object" &&
    data !== null &&
    "id" in data &&
    typeof (data as User).id === "number" &&
    "username" in data &&
    typeof (data as User).username === "string"
    // Add checks for all required properties and their types
  );
}

// AuthContext type
export interface AuthUserContextType {
  user: User | null;
  logout: () => Promise<void>;
  isMemberUser: boolean; // NEW
  refetchUser: () => Promise<void>; // NEW
  notifications: FeedItem[]; // ← ADD
  unreadCount: number; // ← ADD
  markNotificationAsRead: (notificationId: number) => Promise<void>; // ← ADD
  dismissNotification: (notificationId: number) => Promise<void>; // ← ADD
}
