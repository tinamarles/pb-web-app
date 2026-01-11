// frontend/lib/definitions.ts

import * as C from "@/lib/constants";

// Generic Type for dynamic route params
export type PageProps<
  TParams = Record<string, string>,
  TSearchParams = Record<string, string | string[]>
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

export interface Address {
  /* public.serializer sends fields = '__all__'

    id = primaryKey
    address_line1 = models.CharField(max_length=255)
    address_line2 = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100)
    state_province = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)
    country = models.CharField(max_length=100)
  */
  id?: number;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  stateProvince: string;
  postalCode: string;
  country: string;
}

export interface Role {
  id?: number;
  name: C.RoleTypeValue; // needs to change to name: RoleTypeValue (from constants.ts)
  description?: string | null;
}

export interface ClubMembershipType {
  id?: number;
  name: string; // e.g., "Resident", "Non-Resident", "Junior"
  description?: string; // ✅ FIXED: Django has blank=True ONLY (not null=True)
  requiresApproval?: boolean;
  registrationOpenDate?: string | null;
  registrationCloseDate?: string | null;
  currentMemberCount?: number; // ✅ From @property
  isAtCapacity?: boolean; // ✅ From @property
  annualFee?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClubMembershipSkillLevel {
  /* club.serializer sends fields = ['id', 'level', 'description']
    id = primaryKey
    level = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True, null=True)
  */
  id?: number;
  level: C.SkillLevelValue;
  description?: string;
}

/* Lightweight club type for listing clubs */
export interface ClubListItem {
  id: number;
  name: string;
  shortName?: string;
  clubType: C.ClubTypeValue;
  logoUrl?: string;
  bannerUrl?: string; // ✅ Added
  city?: string | null; // ✅ Added (from address)
  memberCount: number; // ✅ Added (calculated)
}

export interface MemberClub {
  /* light-weight club that is used for a Club member. It
     does NOT include the array that contains all the members of 
     the club.
  */
  id: number;
  name: string;
  clubType: C.ClubTypeValue;
  bannerUrl?: string;
  shortName?: string;
  description?: string; // ✅ FIXED: Django has blank=True ONLY (not null=True)
  phoneNumber?: string; // ✅ FIXED: Django has blank=True ONLY (not null=True)
  email?: string; // ✅ FIXED: Django has blank=True ONLY (not null=True)
  websiteUrl?: string; // ✅ FIXED: Django has blank=True ONLY (not null=True)
  logoUrl?: string; // ✅ FIXED: Django has blank=True ONLY (not null=True)
  address?: Address | null; // ✅ FIXED: Django ForeignKey with null=True, blank=True
  autoapproval: boolean; // default=False in Django
  memberCount: number; // ✅ Added (calculated)
}

export interface Club extends MemberClub {
  /* The complete Club object which extends MemberClub by having
     extra fields:
     - members: the array of id's of the users linked to that club
     - created_at
     - updated-at
  */
  members?: number[]; // contains the user Id's of all club members
  createdAt?: string;
  updatedAt?: string;
}

export interface ClubMembership {
  id?: number;
  club: MemberClub; // required in Django
  roles: Role[];
  type: ClubMembershipType;
  levels: ClubMembershipSkillLevel[];
  membershipNumber?: string | null;
  isPreferredClub: boolean;
  status: C.MembershipStatusValue;
  registrationStartDate?: string | null;
  registrationEndDate?: string | null;
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

// PublicUser has no club membership and matches CustomUser
// serializer

/* UPDATED VERSION due to changes of character fields */
export interface PublicUser {
  id?: number;
  username: string;
  firstName?: string; // Django AbstractUser has blank=True
  lastName?: string; // Django AbstractUser has blank=True
  email?: string; // Required but optional in response
  profilePictureUrl?: string; // ✅ blank=True only - NO null!
  skillLevel?: number | null; // ✅ null=True - NULL OK
  isCoach?: boolean;
  homePhone?: string; // ✅ blank=True only - NO null!
  mobilePhone?: string; // ✅ blank=True only - NO null!
  workPhone?: string; // ✅ blank=True only - NO null!
  location?: string; // ✅ blank=True only - NO null!
  dob?: string | null; // ✅ null=True - NULL OK
  gender: C.GenderValue; // Has default, not null
  bio?: string; // ✅ blank=True only - NO null!
  createdAt?: string;
  updatedAt?: string;
  // themePreference?: Theme;
  // unreadNotifications?: number;
}

export interface MemberUser extends PublicUser {
  clubMemberships: ClubMembership[];
}

// The union type representing the possible API responses
export type User = PublicUser | MemberUser;

// +++ Notifications +++
export interface Notification {
  id: number;
  notificationType: C.NotificationTypeValue;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string | null; // ISO 8601 format, null if unread
  actionUrl?: string;
  actionLabel?: string | null; // Label for action button (e.g., "View Match")

  // Related objects (ForeignKeys serialized as nested objects)
  club?: {
    id: number;
    name: string;
  } | null;

  league?: {
    id: number;
    name: string;
  } | null;

  match?: {
    id: number;
    // Additional match fields as needed
  } | null;

  senderInfo?: {
    id: number;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  // Additional flexible data (e.g., milestone details, match scores)
  metadata?: Record<string, unknown>;
}

/**
 * Announcement - Club-wide announcements (1-to-many broadcasts)
 *
 * CRITICAL NOTES:
 * - club is REQUIRED (all announcements belong to a club)
 * - league/match are OPTIONAL (narrow audience within club)
 * - Different from Notification which is 1-to-1 to specific user
 *
 * AUDIENCE LOGIC:
 * - club only → All club members see it
 * - club + league → Only league participants see it
 * - club + match → Only match participants see it
 */
export interface Announcement {
  id: number;
  notificationType: C.NotificationTypeValue; // Type of announcement
  club: number; // REQUIRED - club ID (always set)
  clubName: string; // Club name for display
  league: number | null; // OPTIONAL - league ID (filters audience)
  leagueName: string | null; // League name for display
  match: number | null; // OPTIONAL - match ID (filters audience)
  matchName: string | null; // Match name/description for display
  createdBy: number | null; // User ID who created it
  createdByName: string | null; // Creator name for display
  title: string;
  content: string;
  imageUrl: string | null; // Optional announcement image
  actionUrl: string | null; // CTA button link
  actionLabel: string | null; // CTA button text
  isPinned: boolean; // Pinned announcements show first
  expiryDate: string | null; // ISO 8601 date, null = never expires
  createdAt: string; // ISO 8601 datetime
  updatedAt: string; // ISO 8601 datetime
}

/**
 * FeedItem - Unified feed item (Notification OR Announcement)
 *
 * USAGE:
 * Used by /api/feed/ endpoint which merges notifications + announcements
 * Check feedType to determine which type and render appropriate component
 */
export type FeedItem =
  | (Notification & { feedType: "notification" })
  | (Announcement & { feedType: "announcement" });

/**
 * NotificationFeedResponse - Response from /api/feed/ endpoint
 *
 * RETURNS:
 * - feed: Merged array of notifications + announcements
 * - badgeCount: Total unread count (notifications + announcements)
 * - unreadNotifications: Count of unread notifications only
 * - announcementCount: Count of announcements only
 */
export interface NotificationFeedResponse {
  feed: FeedItem[];
  badgeCount: number;
  unreadNotifications: number;
  announcementCount: number;
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

// ==================================================================================
// CLUB DETAIL TYPES (for club tabs)
// Maps to Django: clubs.serializers.ClubDetailHomeSerializer, ClubMemberSerializer
// ==================================================================================

/**
 * ClubMember - Combined User + ClubMembership data for members tab
 *
 * Backend: ClubMemberSerializer
 * Used in: GET /api/clubs/{id}/members/, GET /api/clubs/{id}/home/
 */
export interface ClubMember {
  // User fields (from member)
  id: number;
  firstName: string;
  lastName: string;
  profilePictureUrl?: string;
  email: string;
  location?: string;
  // ClubMembership fields
  membershipId: number;
  roles: Role[];
  levels: ClubMembershipSkillLevel[];
  type: ClubMembershipType;
  status: C.MembershipStatusValue;
  joinedAt?: string;
  isPreferredClub: boolean;
}

/**
 * ClubDetailHome - Extends MemberClub with home tab specific data
 *
 * Backend: ClubDetailHomeSerializer
 * Used in: GET /api/clubs/{id}/home/
 *
 * NOTE: Serializer flattens the structure so all MemberClub fields + home tab fields
 * are at the top level (no nested 'club' object)
 */
export interface ClubDetailHome extends MemberClub {
  latestAnnouncement?: Notification | null;
  allAnnouncements?: Notification[];
  topMembers?: ClubMember[];
  nextEvent?: League | null;
  // photos?: Photo[];  // TODO: When photo model is implemented
}

/**
 * ClubEventsResponse - Response from events tab endpoint
 *
 * Backend: GET /api/clubs/{id}/events/
 * Returns: { events: League[], count: number }
 */
export interface ClubEventsResponse {
  events: League[];
  count: number;
}

/**
 * ClubMembersResponse - Paginated response from members tab endpoint
 *
 * Backend: GET /api/clubs/{id}/members/
 * Returns: Django REST Framework paginated response
 */
export interface ClubMembersResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ClubMember[];
}

// ==================================================================================
// LEAGUE/EVENT TYPES (placeholder - needs to be defined properly)
// Maps to Django: leagues.models.League
// ==================================================================================

/**
 * League - Event or League data
 *
 * TEMPORARY: This is a placeholder! Needs to be properly defined
 * when implementing the leagues module
 */
export interface League {
  id: number;
  club: number; // Club ID reference
  name: string;
  description?: string;
  isEvent: boolean;
  imageUrl?: string;
  maxSpotsPerSession?: number;
  allowWaitlist: boolean;
  registrationOpensHoursBefore?: number;
  registrationClosesHoursBefore?: number;
  leagueType: C.LeagueTypeValue;
  minimumSkillLevel?: C.SkillLevelValue;
  captainInfo: {
    id: number;
    firstName: string;
    lastName: string;
    avatar?: string;
  } | null;
  startDate: string;
  endDate?: string;
  registrationOpen: boolean;
  maxParticipants?: number;
  allowReserves: boolean;
  isActive: boolean;
  participantsCount: number;
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
