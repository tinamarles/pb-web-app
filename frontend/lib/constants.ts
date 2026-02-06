// lib/constants.ts
// =====================================================
// CRITICAL: Keep in sync with Django constants.py!
// Backend file: backend/public/constants.py
// Last synced: 2025-12-07
// =====================================================

// =====================================================
// FILTERING 
// =====================================================

// NEW: Event/League filter constants
export const EventFilterType = {
  ALL: "all",
  EVENT: "event",
  LEAGUE: "league",
} as const;

export type EventFilterTypeValue =
  (typeof EventFilterType)[keyof typeof EventFilterType];

export const EventFilterStatus = {
  ALL: "all",
  UPCOMING: "upcoming",
  PAST: "past",
} as const;

export type EventFilterStatusValue =
  (typeof EventFilterStatus)[keyof typeof EventFilterStatus];

// Helper functions for selects/dropdowns
export function getEventFilterTypeOptions(): EventFilterTypeValue[] {
  return [EventFilterType.ALL, EventFilterType.EVENT, EventFilterType.LEAGUE];
}

export function getEventFilterStatusOptions(): EventFilterStatusValue[] {
  return [
    EventFilterStatus.ALL,
    EventFilterStatus.UPCOMING,
    EventFilterStatus.PAST,
  ];
}

// =====================================================
// EVENTS & LEAGUES
// =====================================================

export const EventAction = {
  VIEW_DETAILS: "VIEW_DETAILS",
  JOIN: "JOIN",
  ACCEPT: "ACCEPT",
  DECLINE: "DECLINE",
  CHECK_IN: "CHECK_IN",
  MANAGE_ATTENDEES: "MANAGE_ATTENDEES",
  MY_MATCHES: "MY_MATCHES",
  MESSAGE_HOST: "MESSAGE_HOST",
  CANCEL: "CANCEL",
  SESSION_SCHEDULE: "SESSION_SCHEDULE",
} as const;

export type EventActionType = (typeof EventAction)[keyof typeof EventAction];

/**
 * Calendar view modes
 */
export const CalendarViewMode = {
  GRID: "grid",
  DAILY: "daily",
  WEEKLY: "weekly",
} as const;

export type CalendarViewModeType = (typeof CalendarViewMode)[keyof typeof CalendarViewMode];

export const SessionAction = {
  JOIN: "JOIN",
  PLAYERS: "PLAYERS",
  CANCEL: "CANCEL",
  CHECK_IN: "CHECK_IN",
  MANAGE_ATTENDEES: "MANAGE_ATTENDEES",
  MY_MATCHES: "MY_MATCHES",
  SESSION_SCHEDULE: "SESSION_SCHEDULE",
} as const;

export type SessionActionType =
  (typeof SessionAction)[keyof typeof SessionAction];

export const EventCardModes = {
  DASHBOARD_TODAY: "dashboard-today",
  DASHBOARD_UPCOMING: "dashboard-upcoming",
  DASHBOARD_PENDING: "dashboard-pending",
  CLUB_HOME: "club-home",
  CLUB_EVENTS: "club-events",
  MY_CLUB_EVENTS: "my-club-events",
  CLUB_EVENTS_JOIN: "club-events-join",
  ALL_EVENTS: "all-events",
  BROWSE: "browse",
  EVENT_DETAIL: "event-detail",
  ACTIVITY: "activity",
} as const;

export type EventCardModeType =
  (typeof EventCardModes)[keyof typeof EventCardModes];

// Helper
export const isDashboardMode = (mode: EventCardModeType): boolean => {
  return mode.startsWith("dashboard") || mode === "club-events";
};

export const ActivityType = {
  EVENT: "event",
  BOOKING: "booking",
} as const;

export type ActivityTypeValue =
  (typeof ActivityType)[keyof typeof ActivityType];

// Labels for display (if needed)
export const ActivityTypeLabels: Record<ActivityTypeValue, string> = {
  [ActivityType.EVENT]: "Event",
  [ActivityType.BOOKING]: "Booking",
};

// =====================================================
// USER & CLUB MODULE
// =====================================================

/**
 * Gender values
 * Maps to Django: public.constants.Gender
 */

import type { BadgeVariant } from "@/ui";

export const ClubType = {
  PERSONAL: 1,
  OFFICIAL: 2,
} as const;

export type ClubTypeValue = (typeof ClubType)[keyof typeof ClubType];

export const ClubTypeLabels: Record<ClubTypeValue, string> = {
  [ClubType.PERSONAL]: "Personal Club",
  [ClubType.OFFICIAL]: "Official Club",
};

// Reverse mapping: label → value (for form submissions)
export const ClubTypeValues: Record<string, ClubTypeValue> = {
  Personal: ClubType.PERSONAL,
  Official: ClubType.OFFICIAL,
};

export const Gender = {
  FEMALE: 1,
  MALE: 2,
  UNSPECIFIED: 3,
} as const;

export type GenderValue = (typeof Gender)[keyof typeof Gender];

export const GenderLabels: Record<GenderValue, string> = {
  [Gender.FEMALE]: "Female",
  [Gender.MALE]: "Male",
  [Gender.UNSPECIFIED]: "Unspecified",
};

// Reverse mapping: label → value (for form submissions)
export const GenderValues: Record<string, GenderValue> = {
  Female: Gender.FEMALE,
  Male: Gender.MALE,
  Unspecified: Gender.UNSPECIFIED,
  Other: Gender.UNSPECIFIED, // Alias for backwards compatibility
};

/**
 * Club Membership Status
 * Maps to Django: public.constants.MembershipStatus
 */
export const MembershipStatus = {
  PENDING: 1,
  ACTIVE: 2,
  SUSPENDED: 3,
  CANCELLED: 4,
  BLOCKED: 5,
  EXPIRED: 6,
} as const;

export type MembershipStatusValue =
  (typeof MembershipStatus)[keyof typeof MembershipStatus];

export const MembershipStatusLabels: Record<MembershipStatusValue, string> = {
  [MembershipStatus.PENDING]: "Pending",
  [MembershipStatus.ACTIVE]: "Active",
  [MembershipStatus.SUSPENDED]: "Suspended",
  [MembershipStatus.CANCELLED]: "Cancelled",
  [MembershipStatus.BLOCKED]: "Blocked",
  [MembershipStatus.EXPIRED]: "Expired",
};

// Reverse mapping: label → value (for form submissions)
export const MembershipStatusValues: Record<string, MembershipStatusValue> = {
  Pending: MembershipStatus.PENDING,
  Active: MembershipStatus.ACTIVE,
  Suspended: MembershipStatus.SUSPENDED,
  Cancelled: MembershipStatus.CANCELLED,
  Blocked: MembershipStatus.BLOCKED,
  Expired: MembershipStatus.EXPIRED,
};

/**
 * Skill Level (Club membership assessment)
 * Maps to Django: public.constants.SkillLevel
 */
export const SkillLevel = {
  OPEN: 1,
  INTERMEDIATE_PLUS: 2,
  ADVANCED_PLUS: 3,
} as const;

export type SkillLevelValue = (typeof SkillLevel)[keyof typeof SkillLevel];

export const SkillLevelLabels: Record<SkillLevelValue, string> = {
  [SkillLevel.OPEN]: "All Levels",
  [SkillLevel.INTERMEDIATE_PLUS]: "3.5+ (Advanced Intermediate)",
  [SkillLevel.ADVANCED_PLUS]: "4.0+ (Advanced)",
};

// Reverse mapping: label → value (for form submissions)
export const SkillLevelValues: Record<string, SkillLevelValue> = {
  "Open (Not Assessed)": SkillLevel.OPEN,
  "3.5+ (Advanced Intermediate)": SkillLevel.INTERMEDIATE_PLUS,
  "4.0+ (Advanced)": SkillLevel.ADVANCED_PLUS,
};

/**
 * Registration Status
 * Maps to Django: public.constants.RegistrationStatus
 */
export const RegistrationStatus = {
  OPEN: 1,
  WAITLIST: 2,
  CLOSED: 3,
} as const;

export type RegistrationStatusValue =
  (typeof RegistrationStatus)[keyof typeof RegistrationStatus];

export const RegistrationStatusLabels: Record<RegistrationStatusValue, string> =
  {
    [RegistrationStatus.OPEN]: "Open",
    [RegistrationStatus.WAITLIST]: "Waitlist",
    [RegistrationStatus.CLOSED]: "Closed",
  };

// Reverse mapping: label → value (for form submissions)
export const RegistrationStatusValues: Record<string, RegistrationStatusValue> =
  {
    Open: RegistrationStatus.OPEN,
    Waitlist: RegistrationStatus.WAITLIST,
    Closed: RegistrationStatus.CLOSED,
  };

/**
 * Role Type
 * Maps to Django: public.constants.RoleType
 */
export const RoleType = {
  ADMIN: 1,
  ORGANIZER: 2,
  CAPTAIN: 3,
  INSTRUCTOR: 4,
  MEMBER: 5,
} as const;

export type RoleTypeValue = (typeof RoleType)[keyof typeof RoleType];

export const RoleTypeLabels: Record<RoleTypeValue, string> = {
  [RoleType.ADMIN]: "Admin",
  [RoleType.ORGANIZER]: "Organizer",
  [RoleType.CAPTAIN]: "Captain",
  [RoleType.INSTRUCTOR]: "Instructor",
  [RoleType.MEMBER]: "Club Member",
};

// Reverse mapping: label → value (for form submissions)
export const RoleTypeValues: Record<string, RoleTypeValue> = {
  Admin: RoleType.ADMIN,
  Organizer: RoleType.ORGANIZER,
  Captain: RoleType.CAPTAIN,
  Instructor: RoleType.INSTRUCTOR,
  "Club Member": RoleType.MEMBER,
};

export const RoleBadgeVariants: Record<RoleTypeValue, BadgeVariant> = {
  [RoleType.ADMIN]: "primary",
  [RoleType.CAPTAIN]: "secondary",
  [RoleType.INSTRUCTOR]: "tertiary",
  [RoleType.ORGANIZER]: "accent2", // Use outlined instead
  [RoleType.MEMBER]: "accent1", // Use outlined instead
};

// =====================================================
// LEAGUE MODULE
// =====================================================

/**
 * League Type
 * Maps to Django: public.constants.LeagueType
 */
export const LeagueType = {
  STANDARD: 1,
  TEAM: 2,
  MLP: 3,
} as const;

export type LeagueTypeValue = (typeof LeagueType)[keyof typeof LeagueType];

export const LeagueTypeLabels: Record<LeagueTypeValue, string> = {
  [LeagueType.STANDARD]: "Standard (Rotating Partners)",
  [LeagueType.TEAM]: "Team-Based (Fixed 2-Player Teams)",
  [LeagueType.MLP]: "MLP (Fixed 4+ Player Teams)",
};

// Reverse mapping: label → value (for form submissions)
export const LeagueTypeValues: Record<string, LeagueTypeValue> = {
  "Standard (Rotating Partners)": LeagueType.STANDARD,
  "Team-Based (Fixed 2-Player Teams)": LeagueType.TEAM,
  "MLP (Fixed 4+ Player Teams)": LeagueType.MLP,
};

/**
 * Generation Format (How matches are generated)
 * Maps to Django: public.constants.GenerationFormat
 * Used in League.default_generation_format and Match.generation_format
 */
export const GenerationFormat = {
  ROUND_ROBIN: 1,
  KING_OF_COURT: 2,
  MANUAL: 3,
} as const;

export type GenerationFormatValue =
  (typeof GenerationFormat)[keyof typeof GenerationFormat];

export const GenerationFormatLabels: Record<GenerationFormatValue, string> = {
  [GenerationFormat.ROUND_ROBIN]: "Round-Robin",
  [GenerationFormat.KING_OF_COURT]: "King of the Court",
  [GenerationFormat.MANUAL]: "Manual Entry",
};

// Reverse mapping: label → value (for form submissions)
export const GenerationFormatValues: Record<string, GenerationFormatValue> = {
  "Round-Robin": GenerationFormat.ROUND_ROBIN,
  "King of the Court": GenerationFormat.KING_OF_COURT,
  "Manual Entry": GenerationFormat.MANUAL,
};

/**
 * League Participation Status
 * Maps to Django: public.constants.LeagueParticipationStatus
 */
export const LeagueParticipationStatus = {
  ACTIVE: 1,
  RESERVE: 2,
  INJURED: 3,
  HOLIDAY: 4,
  DROPPED: 5,
} as const;

export type LeagueParticipationStatusValue =
  (typeof LeagueParticipationStatus)[keyof typeof LeagueParticipationStatus];

export const LeagueParticipationStatusLabels: Record<
  LeagueParticipationStatusValue,
  string
> = {
  [LeagueParticipationStatus.ACTIVE]: "Active",
  [LeagueParticipationStatus.RESERVE]: "Reserve - Waiting for spot",
  [LeagueParticipationStatus.INJURED]: "Injured - Temporarily out",
  [LeagueParticipationStatus.HOLIDAY]: "On Holiday - Temporarily out",
  [LeagueParticipationStatus.DROPPED]: "Dropped Out",
};

// Reverse mapping: label → value (for form submissions)
export const LeagueParticipationStatusValues: Record<
  string,
  LeagueParticipationStatusValue
> = {
  Active: LeagueParticipationStatus.ACTIVE,
  "Reserve - Waiting for spot": LeagueParticipationStatus.RESERVE,
  "Injured - Temporarily out": LeagueParticipationStatus.INJURED,
  "On Holiday - Temporarily out": LeagueParticipationStatus.HOLIDAY,
  "Dropped Out": LeagueParticipationStatus.DROPPED,
};

/**
 * Day of Week
 * Maps to Django: public.constants.DayOfWeek
 * Shared between League and Courts modules
 */
export const DayOfWeek = {
  MONDAY: 0,
  TUESDAY: 1,
  WEDNESDAY: 2,
  THURSDAY: 3,
  FRIDAY: 4,
  SATURDAY: 5,
  SUNDAY: 6,
} as const;

export type DayOfWeekValue = (typeof DayOfWeek)[keyof typeof DayOfWeek];

/**
 * Short day labels (single letter)
 * Used for compact UI displays like day indicators
 */
export const DayOfWeekShort: Record<DayOfWeekValue, string> = {
  [DayOfWeek.MONDAY]: "M",
  [DayOfWeek.TUESDAY]: "T",
  [DayOfWeek.WEDNESDAY]: "W",
  [DayOfWeek.THURSDAY]: "T",
  [DayOfWeek.FRIDAY]: "F",
  [DayOfWeek.SATURDAY]: "S",
  [DayOfWeek.SUNDAY]: "S",
};

export const DayOfWeekLabels: Record<DayOfWeekValue, string> = {
  [DayOfWeek.MONDAY]: "Monday",
  [DayOfWeek.TUESDAY]: "Tuesday",
  [DayOfWeek.WEDNESDAY]: "Wednesday",
  [DayOfWeek.THURSDAY]: "Thursday",
  [DayOfWeek.FRIDAY]: "Friday",
  [DayOfWeek.SATURDAY]: "Saturday",
  [DayOfWeek.SUNDAY]: "Sunday",
};

// Reverse mapping: label → value (for form submissions)
export const DayOfWeekValues: Record<string, DayOfWeekValue> = {
  Monday: DayOfWeek.MONDAY,
  Tuesday: DayOfWeek.TUESDAY,
  Wednesday: DayOfWeek.WEDNESDAY,
  Thursday: DayOfWeek.THURSDAY,
  Friday: DayOfWeek.FRIDAY,
  Saturday: DayOfWeek.SATURDAY,
  Sunday: DayOfWeek.SUNDAY,
};
/** ========================================
 * DAY OF WEEK CONVERSION HELPERS
 * ========================================
 * 
 * CRITICAL: JavaScript's Date.getDay() uses different numbering!
 * - JavaScript .getDay(): 0=Sunday, 1=Monday, 2=Tuesday, ..., 6=Saturday
 * - Our DayOfWeek constant: 0=Monday, 1=Tuesday, ..., 6=Sunday
 * 
 * WHY: Our system follows ISO 8601 / European standard (Monday = start of week)
 *      Future: Will support user preference for week start day
 * 
 * ALWAYS use these helpers when working with JavaScript Date objects!
 */

/**
 * Convert JavaScript Date.getDay() to our DayOfWeek constant
 * @param date - JavaScript Date object
 * @returns DayOfWeekValue (0=Monday, 1=Tuesday, ..., 6=Sunday)
 * 
 * @example
 * const monday = new Date('2026-02-09');  // Monday
 * const ourDay = jsDateToDayOfWeek(monday);  // Returns 0 (DayOfWeek.MONDAY)
 */
export function jsDateToDayOfWeek(date: Date): DayOfWeekValue {
  const jsDay = date.getDay();  // 0=Sun, 1=Mon, 2=Tue, ..., 6=Sat
  
  // Convert: JS Sunday (0) → Our Sunday (6)
  if (jsDay === 0) return DayOfWeek.SUNDAY;
  
  // Convert: JS Mon-Sat (1-6) → Our Mon-Sat (0-5)
  return (jsDay - 1) as DayOfWeekValue;
}

/**
 * Convert our DayOfWeek constant to JavaScript Date.getDay() format
 * @param dayOfWeek - Our DayOfWeekValue (0=Monday, ..., 6=Sunday)
 * @returns JavaScript day number (0=Sunday, 1=Monday, ..., 6=Saturday)
 * 
 * @example
 * const jsDay = dayOfWeekToJsDay(DayOfWeek.MONDAY);  // Returns 1
 * const date = new Date();
 * date.setDate(date.getDate() + (jsDay - date.getDay()));  // Jump to Monday
 */
export function dayOfWeekToJsDay(dayOfWeek: DayOfWeekValue): number {
  // Convert: Our Sunday (6) → JS Sunday (0)
  if (dayOfWeek === DayOfWeek.SUNDAY) return 0;
  
  // Convert: Our Mon-Sat (0-5) → JS Mon-Sat (1-6)
  return dayOfWeek + 1;
}
/**
 * Get array of all days with labels
 * Used for iterating in UI components (e.g., day indicators)
 *
 * @returns Array of {value, label, shortLabel} in Mon-Sun order
 */
export function getDayOfWeekOptions(): Array<{
  value: DayOfWeekValue;
  label: string;
  shortLabel: string;
}> {
  return [
    {
      value: DayOfWeek.MONDAY,
      label: DayOfWeekLabels[DayOfWeek.MONDAY],
      shortLabel: DayOfWeekShort[DayOfWeek.MONDAY],
    },
    {
      value: DayOfWeek.TUESDAY,
      label: DayOfWeekLabels[DayOfWeek.TUESDAY],
      shortLabel: DayOfWeekShort[DayOfWeek.TUESDAY],
    },
    {
      value: DayOfWeek.WEDNESDAY,
      label: DayOfWeekLabels[DayOfWeek.WEDNESDAY],
      shortLabel: DayOfWeekShort[DayOfWeek.WEDNESDAY],
    },
    {
      value: DayOfWeek.THURSDAY,
      label: DayOfWeekLabels[DayOfWeek.THURSDAY],
      shortLabel: DayOfWeekShort[DayOfWeek.THURSDAY],
    },
    {
      value: DayOfWeek.FRIDAY,
      label: DayOfWeekLabels[DayOfWeek.FRIDAY],
      shortLabel: DayOfWeekShort[DayOfWeek.FRIDAY],
    },
    {
      value: DayOfWeek.SATURDAY,
      label: DayOfWeekLabels[DayOfWeek.SATURDAY],
      shortLabel: DayOfWeekShort[DayOfWeek.SATURDAY],
    },
    {
      value: DayOfWeek.SUNDAY,
      label: DayOfWeekLabels[DayOfWeek.SUNDAY],
      shortLabel: DayOfWeekShort[DayOfWeek.SUNDAY],
    },
  ];
}
/**
 * Recurrence Type
 * Maps to Django: public.constants.RecurrenceType
 */
export const RecurrenceType = {
  ONCE: 0,
  WEEKLY: 1,
  BI_WEEKLY: 2,
  MONTHLY: 3,
} as const;

export type RecurrenceTypeValue =
  (typeof RecurrenceType)[keyof typeof RecurrenceType];

export const RecurrenceTypeLabels: Record<RecurrenceTypeValue, string> = {
  [RecurrenceType.ONCE]: "One-time",
  [RecurrenceType.WEEKLY]: "Weekly",
  [RecurrenceType.BI_WEEKLY]: "Every other week",
  [RecurrenceType.MONTHLY]: "Once a month",
};

// Reverse mapping: label → value (for form submissions)
export const RecurrenceTypeValues: Record<string, RecurrenceTypeValue> = {
  "One-time": RecurrenceType.ONCE,
  Weekly: RecurrenceType.WEEKLY,
  "Every other week": RecurrenceType.BI_WEEKLY,
  "Once a month": RecurrenceType.MONTHLY,
};

/**
 * League Attendance Status
 * Maps to Django: public.constants.LeagueAttendanceStatus
 */
export const LeagueAttendanceStatus = {
  ATTENDING: 1,
  CANCELLED: 2,
  ABSENT: 3,
} as const;

export type LeagueAttendanceStatusValue =
  (typeof LeagueAttendanceStatus)[keyof typeof LeagueAttendanceStatus];

export const LeagueAttendanceStatusLabels: Record<
  LeagueAttendanceStatusValue,
  string
> = {
  [LeagueAttendanceStatus.ATTENDING]: "Attending",
  [LeagueAttendanceStatus.CANCELLED]: "Cancelled",
  [LeagueAttendanceStatus.ABSENT]: "Absent (no-show)",
};

// Reverse mapping: label → value (for form submissions)
export const LeagueAttendanceStatusValues: Record<
  string,
  LeagueAttendanceStatusValue
> = {
  Attending: LeagueAttendanceStatus.ATTENDING,
  Cancelled: LeagueAttendanceStatus.CANCELLED,
  "Absent (no-show)": LeagueAttendanceStatus.ABSENT,
};

// =====================================================
// COURTS MODULE
// =====================================================

/**
 * Affiliation Type
 * Maps to Django: public.constants.AffiliationType
 */
export const AffiliationType = {
  PRIORITY: 1,
  EXCLUSIVE: 2,
  PARTNER: 3,
  SHARED: 4,
} as const;

export type AffiliationTypeValue =
  (typeof AffiliationType)[keyof typeof AffiliationType];

export const AffiliationTypeLabels: Record<AffiliationTypeValue, string> = {
  [AffiliationType.PRIORITY]: "Priority Access",
  [AffiliationType.EXCLUSIVE]: "Exclusive Access (certain times)",
  [AffiliationType.PARTNER]: "Partner Club",
  [AffiliationType.SHARED]: "Shared Access",
};

// Reverse mapping: label → value (for form submissions)
export const AffiliationTypeValues: Record<string, AffiliationTypeValue> = {
  "Priority Access": AffiliationType.PRIORITY,
  "Exclusive Access (certain times)": AffiliationType.EXCLUSIVE,
  "Partner Club": AffiliationType.PARTNER,
  "Shared Access": AffiliationType.SHARED,
};

/**
 * Booking Type
 * Maps to Django: public.constants.BookingType
 */
export const BookingType = {
  PRACTICE: 1,
  CASUAL: 2,
  LESSON: 3,
  DRILL: 4,
  OTHER: 5,
} as const;

export type BookingTypeValue = (typeof BookingType)[keyof typeof BookingType];

export const BookingTypeLabels: Record<BookingTypeValue, string> = {
  [BookingType.PRACTICE]: "Practice Session",
  [BookingType.CASUAL]: "Casual Play",
  [BookingType.LESSON]: "Lesson",
  [BookingType.DRILL]: "Drill Session",
  [BookingType.OTHER]: "Other",
};

// Reverse mapping: label → value (for form submissions)
export const BookingTypeValues: Record<string, BookingTypeValue> = {
  "Practice Session": BookingType.PRACTICE,
  "Casual Play": BookingType.CASUAL,
  Lesson: BookingType.LESSON,
  "Drill Session": BookingType.DRILL,
  Other: BookingType.OTHER,
};

/**
 * Block Type
 * Maps to Django: public.constants.BlockType
 */
export const BlockType = {
  LEAGUE: 1,
  COMPETITIVE: 2,
  RECREATIVE: 3,
  SKILL_RESTRICTED: 4,
  PUBLIC: 5,
  DRILL: 6,
  TOURNAMENT: 7,
  BLOCKED: 8,
  MAINTENANCE: 9,
} as const;

export type BlockTypeValue = (typeof BlockType)[keyof typeof BlockType];

export const BlockTypeLabels: Record<BlockTypeValue, string> = {
  [BlockType.LEAGUE]: "League",
  [BlockType.COMPETITIVE]: "Competitive Play",
  [BlockType.RECREATIVE]: "Recreative Play",
  [BlockType.SKILL_RESTRICTED]: "Skill Restricted (3.5+, 4.0+, etc.)",
  [BlockType.PUBLIC]: "Public Open Play",
  [BlockType.DRILL]: "Drill/Training",
  [BlockType.TOURNAMENT]: "Tournament",
  [BlockType.BLOCKED]: "Blocked/Reserved",
  [BlockType.MAINTENANCE]: "Maintenance/Closed",
};

// Reverse mapping: label → value (for form submissions)
export const BlockTypeValues: Record<string, BlockTypeValue> = {
  League: BlockType.LEAGUE,
  "Competitive Play": BlockType.COMPETITIVE,
  "Recreative Play": BlockType.RECREATIVE,
  "Skill Restricted (3.5+, 4.0+, etc.)": BlockType.SKILL_RESTRICTED,
  "Public Open Play": BlockType.PUBLIC,
  "Drill/Training": BlockType.DRILL,
  Tournament: BlockType.TOURNAMENT,
  "Blocked/Reserved": BlockType.BLOCKED,
  "Maintenance/Closed": BlockType.MAINTENANCE,
};

// =====================================================
// MATCHES MODULE
// =====================================================

/**
 * Match Type
 * Maps to Django: public.constants.MatchType
 */
export const MatchType = {
  SINGLES: 1,
  DOUBLES: 2,
  MLP: 3,
} as const;

export type MatchTypeValue = (typeof MatchType)[keyof typeof MatchType];

export const MatchTypeLabels: Record<MatchTypeValue, string> = {
  [MatchType.SINGLES]: "Singles",
  [MatchType.DOUBLES]: "Doubles",
  [MatchType.MLP]: "MLP Team Match",
};

// Reverse mapping: label → value (for form submissions)
export const MatchTypeValues: Record<string, MatchTypeValue> = {
  Singles: MatchType.SINGLES,
  Doubles: MatchType.DOUBLES,
  "MLP Team Match": MatchType.MLP,
};

/**
 * Match Format (Number of games to win)
 * Maps to Django: public.constants.MatchFormat
 * NOTE: Different from GenerationFormat!
 */
export const MatchFormat = {
  BEST_OF_1: 1,
  BEST_OF_3: 2,
  BEST_OF_5: 3,
} as const;

export type MatchFormatValue = (typeof MatchFormat)[keyof typeof MatchFormat];

export const MatchFormatLabels: Record<MatchFormatValue, string> = {
  [MatchFormat.BEST_OF_1]: "Best of 1 (Single Game)",
  [MatchFormat.BEST_OF_3]: "Best of 3",
  [MatchFormat.BEST_OF_5]: "Best of 5",
};

// Reverse mapping: label → value (for form submissions)
export const MatchFormatValues: Record<string, MatchFormatValue> = {
  "Best of 1 (Single Game)": MatchFormat.BEST_OF_1,
  "Best of 3": MatchFormat.BEST_OF_3,
  "Best of 5": MatchFormat.BEST_OF_5,
};

/**
 * Score Format
 * Maps to Django: public.constants.ScoreFormat
 */
export const ScoreFormat = {
  SIDEOUT: 1,
  RALLY: 2,
} as const;

export type ScoreFormatValue = (typeof ScoreFormat)[keyof typeof ScoreFormat];

export const ScoreFormatLabels: Record<ScoreFormatValue, string> = {
  [ScoreFormat.SIDEOUT]: "Side-out Scoring",
  [ScoreFormat.RALLY]: "Rally Scoring",
};

// Reverse mapping: label → value (for form submissions)
export const ScoreFormatValues: Record<string, ScoreFormatValue> = {
  "Side-out Scoring": ScoreFormat.SIDEOUT,
  "Rally Scoring": ScoreFormat.RALLY,
};

/**
 * Match Status
 * Maps to Django: public.constants.MatchStatus
 */
export const MatchStatus = {
  PENDING: 1,
  ACCEPTED: 2,
  SCHEDULED: 3,
  IN_PROGRESS: 4,
  COMPLETED: 5,
  CANCELLED: 6,
} as const;

export type MatchStatusValue = (typeof MatchStatus)[keyof typeof MatchStatus];

export const MatchStatusLabels: Record<MatchStatusValue, string> = {
  [MatchStatus.PENDING]: "Pending - Players invited",
  [MatchStatus.ACCEPTED]: "Accepted - All players confirmed",
  [MatchStatus.SCHEDULED]: "Scheduled",
  [MatchStatus.IN_PROGRESS]: "In Progress",
  [MatchStatus.COMPLETED]: "Completed - Results entered",
  [MatchStatus.CANCELLED]: "Cancelled",
};

// Reverse mapping: label → value (for form submissions)
export const MatchStatusValues: Record<string, MatchStatusValue> = {
  "Pending - Players invited": MatchStatus.PENDING,
  "Accepted - All players confirmed": MatchStatus.ACCEPTED,
  Scheduled: MatchStatus.SCHEDULED,
  "In Progress": MatchStatus.IN_PROGRESS,
  "Completed - Results entered": MatchStatus.COMPLETED,
  Cancelled: MatchStatus.CANCELLED,
};

/**
 * MLP Game Type
 * Maps to Django: public.constants.MLPGameType
 * Shared between Team and Game models
 */
export const MLPGameType = {
  WOMEN_DOUBLES: 1,
  MEN_DOUBLES: 2,
  MIXED_DOUBLES_1: 3,
  MIXED_DOUBLES_2: 4,
  DREAMBREAKER: 5,
} as const;

export type MLPGameTypeValue = (typeof MLPGameType)[keyof typeof MLPGameType];

export const MLPGameTypeLabels: Record<MLPGameTypeValue, string> = {
  [MLPGameType.WOMEN_DOUBLES]: "Women's Doubles",
  [MLPGameType.MEN_DOUBLES]: "Men's Doubles",
  [MLPGameType.MIXED_DOUBLES_1]: "Mixed Doubles 1",
  [MLPGameType.MIXED_DOUBLES_2]: "Mixed Doubles 2",
  [MLPGameType.DREAMBREAKER]: "DreamBreaker",
};

// Reverse mapping: label → value (for form submissions)
export const MLPGameTypeValues: Record<string, MLPGameTypeValue> = {
  "Women's Doubles": MLPGameType.WOMEN_DOUBLES,
  "Men's Doubles": MLPGameType.MEN_DOUBLES,
  "Mixed Doubles 1": MLPGameType.MIXED_DOUBLES_1,
  "Mixed Doubles 2": MLPGameType.MIXED_DOUBLES_2,
  DreamBreaker: MLPGameType.DREAMBREAKER,
};

// ============================================
// NOTIFICATION TYPES
// ============================================

export const NotificationType = {
  // System (1-9)
  SYSTEM_MESSAGE: 1,

  // Events (10-19)
  EVENT_REMINDER: 10,
  EVENT_UPDATED: 11,
  EVENT_CANCELLED: 12,
  EVENT_INVITATION: 13,

  // League/Matches (20-29)
  LEAGUE_MATCH_SCHEDULED: 20,
  LEAGUE_RESULTS_POSTED: 21,
  LEAGUE_STANDINGS_UPDATED: 22,
  LEAGUE_ANNOUNCEMENT: 23,
  LEAGUE_INVITATION: 24,
  LEAGUE_SESSION_REMINDER: 25,
  LEAGUE_SESSION_CANCELLED: 26,
  MATCH_ANNOUNCEMENT: 27,

  // Memberships/Club (30-39)
  MEMBERSHIP_EXPIRING: 30,
  MEMBERSHIP_RENEWED: 31,
  RENEWAL_PERIOD_OPEN: 32,
  MEMBERSHIP_APPROVED: 33,
  MEMBERSHIP_REJECTED: 34,
  CLUB_ANNOUNCEMENT: 35,
  MEMBERSHIP_SUSPENDED: 36,

  // Messages (40-49) - Phase 5.x
  DIRECT_MESSAGE: 40,
  MENTION: 41,

  // Social (50-59) - Phase 6+
  NEW_FOLLOWER: 50,
  PARTNER_REQUEST: 51,

  // Milestones (60-69)
  MILESTONE_GAMES_50: 60,
  MILESTONE_GAMES_100: 61,
  MILESTONE_GAMES_500: 62,
  MILESTONE_WIN_STREAK: 63,
  MILESTONE_RANK_IMPROVED: 64,

  // Admin/Roles (70-79)
  ROLE_ASSIGNED: 70,
  ROLE_REMOVED: 71,

  // System Admin (80-89)
  SYSTEM_MAINTENANCE: 80,
  SYSTEM_UPDATE: 81,
} as const;

export type NotificationTypeValue =
  (typeof NotificationType)[keyof typeof NotificationType];

export const NotificationTypeLabels: Record<NotificationTypeValue, string> = {
  [NotificationType.SYSTEM_MESSAGE]: "System Message",
  [NotificationType.EVENT_REMINDER]: "Event Reminder",
  [NotificationType.EVENT_UPDATED]: "Event Updated",
  [NotificationType.EVENT_CANCELLED]: "Event Cancelled",
  [NotificationType.EVENT_INVITATION]: "Event Invitation",
  [NotificationType.LEAGUE_MATCH_SCHEDULED]: "Match Scheduled",
  [NotificationType.LEAGUE_RESULTS_POSTED]: "Results Posted",
  [NotificationType.LEAGUE_STANDINGS_UPDATED]: "Standings Updated",
  [NotificationType.LEAGUE_ANNOUNCEMENT]: "League Announcement",
  [NotificationType.LEAGUE_INVITATION]: "League Invitation",
  [NotificationType.LEAGUE_SESSION_REMINDER]: "Session Reminder",
  [NotificationType.LEAGUE_SESSION_CANCELLED]: "Session Cancelled",
  [NotificationType.MATCH_ANNOUNCEMENT]: "Match Announcement",
  [NotificationType.MEMBERSHIP_EXPIRING]: "Membership Expiring",
  [NotificationType.MEMBERSHIP_RENEWED]: "Membership Renewed",
  [NotificationType.RENEWAL_PERIOD_OPEN]: "Renewal Period Open",
  [NotificationType.MEMBERSHIP_APPROVED]: "Membership Approved",
  [NotificationType.MEMBERSHIP_REJECTED]: "Membership Rejected",
  [NotificationType.MEMBERSHIP_SUSPENDED]: "Membership Suspended",
  [NotificationType.CLUB_ANNOUNCEMENT]: "Club Announcement",
  [NotificationType.DIRECT_MESSAGE]: "Direct Message",
  [NotificationType.MENTION]: "Mentioned in Message",
  [NotificationType.NEW_FOLLOWER]: "New Follower",
  [NotificationType.PARTNER_REQUEST]: "Partner Request",
  [NotificationType.MILESTONE_GAMES_50]: "50 Games Played",
  [NotificationType.MILESTONE_GAMES_100]: "100 Games Played",
  [NotificationType.MILESTONE_GAMES_500]: "500 Games Played",
  [NotificationType.MILESTONE_WIN_STREAK]: "Win Streak",
  [NotificationType.MILESTONE_RANK_IMPROVED]: "Rank Improved",
  [NotificationType.ROLE_ASSIGNED]: "Role Assigned",
  [NotificationType.ROLE_REMOVED]: "Role Removed",
  [NotificationType.SYSTEM_MAINTENANCE]: "System Maintenance",
  [NotificationType.SYSTEM_UPDATE]: "System Update",
};

export const NotificationTypeValues: Record<string, NotificationTypeValue> = {
  "System Message": NotificationType.SYSTEM_MESSAGE,
  "Event Reminder": NotificationType.EVENT_REMINDER,
  "Event Updated": NotificationType.EVENT_UPDATED,
  "Event Cancelled": NotificationType.EVENT_CANCELLED,
  "Event Invitation": NotificationType.EVENT_INVITATION,
  "Match Scheduled": NotificationType.LEAGUE_MATCH_SCHEDULED,
  "Results Posted": NotificationType.LEAGUE_RESULTS_POSTED,
  "Standings Updated": NotificationType.LEAGUE_STANDINGS_UPDATED,
  "League Announcement": NotificationType.LEAGUE_ANNOUNCEMENT,
  "League Invitation": NotificationType.LEAGUE_INVITATION,
  "Session Reminder": NotificationType.LEAGUE_SESSION_REMINDER,
  "Session Cancelled": NotificationType.LEAGUE_SESSION_CANCELLED,
  "Match Announcement": NotificationType.MATCH_ANNOUNCEMENT,
  "Membership Expiring": NotificationType.MEMBERSHIP_EXPIRING,
  "Membership Renewed": NotificationType.MEMBERSHIP_RENEWED,
  "Renewal Period Open": NotificationType.RENEWAL_PERIOD_OPEN,
  "Membership Approved": NotificationType.MEMBERSHIP_APPROVED,
  "Membership Rejected": NotificationType.MEMBERSHIP_REJECTED,
  "Membership Suspended": NotificationType.MEMBERSHIP_SUSPENDED,
  "Club Announcement": NotificationType.CLUB_ANNOUNCEMENT,
  "Direct Message": NotificationType.DIRECT_MESSAGE,
  "Mentioned in Message": NotificationType.MENTION,
  "New Follower": NotificationType.NEW_FOLLOWER,
  "Partner Request": NotificationType.PARTNER_REQUEST,
  "50 Games Played": NotificationType.MILESTONE_GAMES_50,
  "100 Games Played": NotificationType.MILESTONE_GAMES_100,
  "500 Games Played": NotificationType.MILESTONE_GAMES_500,
  "Win Streak": NotificationType.MILESTONE_WIN_STREAK,
  "Rank Improved": NotificationType.MILESTONE_RANK_IMPROVED,
  "Role Assigned": NotificationType.ROLE_ASSIGNED,
  "Role Removed": NotificationType.ROLE_REMOVED,
  "System Maintenance": NotificationType.SYSTEM_MAINTENANCE,
  "System Update": NotificationType.SYSTEM_UPDATE,
};

/**
 * Notification Categories (Semantic grouping)
 * Maps to Django: public.constants.NotificationCategory
 * Used for filtering, display organization, and color coding
 */
export const NotificationCategory = {
  SYSTEM: "System",
  EVENT: "Event",
  LEAGUE: "League",
  CLUB: "Club",
  MATCH: "Match",
  MESSAGE: "Message",
  SOCIAL: "Social",
  MILESTONE: "Milestone",
  ADMIN: "Admin",
} as const;

export type NotificationCategoryValue =
  (typeof NotificationCategory)[keyof typeof NotificationCategory];

/**
 * Map each NotificationType to its Category
 * Used for filtering notifications by category
 */
export const NotificationTypeCategory: Record<
  NotificationTypeValue,
  NotificationCategoryValue
> = {
  [NotificationType.SYSTEM_MESSAGE]: NotificationCategory.SYSTEM,
  [NotificationType.EVENT_REMINDER]: NotificationCategory.EVENT,
  [NotificationType.EVENT_UPDATED]: NotificationCategory.EVENT,
  [NotificationType.EVENT_CANCELLED]: NotificationCategory.EVENT,
  [NotificationType.EVENT_INVITATION]: NotificationCategory.EVENT,
  [NotificationType.LEAGUE_MATCH_SCHEDULED]: NotificationCategory.LEAGUE,
  [NotificationType.LEAGUE_RESULTS_POSTED]: NotificationCategory.LEAGUE,
  [NotificationType.LEAGUE_STANDINGS_UPDATED]: NotificationCategory.LEAGUE,
  [NotificationType.LEAGUE_ANNOUNCEMENT]: NotificationCategory.LEAGUE,
  [NotificationType.LEAGUE_INVITATION]: NotificationCategory.LEAGUE,
  [NotificationType.LEAGUE_SESSION_REMINDER]: NotificationCategory.LEAGUE,
  [NotificationType.LEAGUE_SESSION_CANCELLED]: NotificationCategory.LEAGUE,
  [NotificationType.MATCH_ANNOUNCEMENT]: NotificationCategory.MATCH,
  [NotificationType.MEMBERSHIP_EXPIRING]: NotificationCategory.CLUB,
  [NotificationType.MEMBERSHIP_RENEWED]: NotificationCategory.CLUB,
  [NotificationType.RENEWAL_PERIOD_OPEN]: NotificationCategory.CLUB,
  [NotificationType.MEMBERSHIP_APPROVED]: NotificationCategory.CLUB,
  [NotificationType.MEMBERSHIP_REJECTED]: NotificationCategory.CLUB,
  [NotificationType.MEMBERSHIP_SUSPENDED]: NotificationCategory.CLUB,
  [NotificationType.CLUB_ANNOUNCEMENT]: NotificationCategory.CLUB,
  [NotificationType.DIRECT_MESSAGE]: NotificationCategory.MESSAGE,
  [NotificationType.MENTION]: NotificationCategory.MESSAGE,
  [NotificationType.NEW_FOLLOWER]: NotificationCategory.SOCIAL,
  [NotificationType.PARTNER_REQUEST]: NotificationCategory.SOCIAL,
  [NotificationType.MILESTONE_GAMES_50]: NotificationCategory.MILESTONE,
  [NotificationType.MILESTONE_GAMES_100]: NotificationCategory.MILESTONE,
  [NotificationType.MILESTONE_GAMES_500]: NotificationCategory.MILESTONE,
  [NotificationType.MILESTONE_WIN_STREAK]: NotificationCategory.MILESTONE,
  [NotificationType.MILESTONE_RANK_IMPROVED]: NotificationCategory.MILESTONE,
  [NotificationType.ROLE_ASSIGNED]: NotificationCategory.ADMIN,
  [NotificationType.ROLE_REMOVED]: NotificationCategory.ADMIN,
  [NotificationType.SYSTEM_MAINTENANCE]: NotificationCategory.SYSTEM,
  [NotificationType.SYSTEM_UPDATE]: NotificationCategory.SYSTEM,
};

/**
 * Map each NotificationType to a Badge Variant (severity-based)
 * Severity hierarchy: ERROR > WARNING > SUCCESS > INFO > DEFAULT
 *
 * - ERROR (Red): Cancellations, rejections, critical issues
 * - WARNING (Orange): Expiring, pending, needs urgent attention
 * - SUCCESS (Green): Approvals, achievements, positive events
 * - INFO (Blue): Updates, changes, general information
 * - DEFAULT (Gray): Standard notifications
 *
 * NOTE: Uses BadgeVariant type from @/ui (imported at top of file)
 */
export const NotificationTypeBadgeVariant: Record<
  NotificationTypeValue,
  BadgeVariant
> = {
  // ERROR severity
  [NotificationType.EVENT_CANCELLED]: "error",
  [NotificationType.LEAGUE_SESSION_CANCELLED]: "error",
  [NotificationType.MEMBERSHIP_REJECTED]: "error",
  [NotificationType.MEMBERSHIP_SUSPENDED]: "error",
  [NotificationType.ROLE_REMOVED]: "error",

  // WARNING severity
  [NotificationType.MEMBERSHIP_EXPIRING]: "warning",
  [NotificationType.RENEWAL_PERIOD_OPEN]: "warning",
  [NotificationType.SYSTEM_MAINTENANCE]: "warning",

  // SUCCESS severity
  [NotificationType.MEMBERSHIP_APPROVED]: "success",
  [NotificationType.MEMBERSHIP_RENEWED]: "success",
  [NotificationType.MILESTONE_GAMES_50]: "success",
  [NotificationType.MILESTONE_GAMES_100]: "success",
  [NotificationType.MILESTONE_GAMES_500]: "success",
  [NotificationType.MILESTONE_WIN_STREAK]: "success",
  [NotificationType.MILESTONE_RANK_IMPROVED]: "success",
  [NotificationType.ROLE_ASSIGNED]: "success",

  // INFO severity
  [NotificationType.EVENT_UPDATED]: "info",
  [NotificationType.LEAGUE_RESULTS_POSTED]: "info",
  [NotificationType.LEAGUE_STANDINGS_UPDATED]: "info",
  [NotificationType.LEAGUE_ANNOUNCEMENT]: "info",
  [NotificationType.CLUB_ANNOUNCEMENT]: "info",
  [NotificationType.MATCH_ANNOUNCEMENT]: "info",
  [NotificationType.SYSTEM_UPDATE]: "info",
  [NotificationType.DIRECT_MESSAGE]: "info",
  [NotificationType.MENTION]: "info",

  // DEFAULT severity (standard notifications)
  [NotificationType.SYSTEM_MESSAGE]: "default",
  [NotificationType.EVENT_REMINDER]: "default",
  [NotificationType.EVENT_INVITATION]: "default",
  [NotificationType.LEAGUE_MATCH_SCHEDULED]: "default",
  [NotificationType.LEAGUE_INVITATION]: "default",
  [NotificationType.LEAGUE_SESSION_REMINDER]: "default",
  [NotificationType.NEW_FOLLOWER]: "default",
  [NotificationType.PARTNER_REQUEST]: "default",
};

/**
 * Severity levels for badge variants (used for "worst wins" logic)
 * Higher number = more severe
 */
export const BadgeVariantSeverity: Record<BadgeVariant, number> = {
  error: 4, // Most severe
  warning: 3,
  success: 2,
  info: 1,
  default: 0,
  primary: 0,
  secondary: 0,
  tertiary: 0,
  outlined: 0,
  accent1: 0,
  accent2: 0,
};

// =====================================================
// HELPER FUNCTIONS (Reusable!)
// =====================================================

// --- USER & CLUB MODULE HELPERS ---
/**
 * Get label for ClubType value
 */
export function getClubTypeLabel(
  value: ClubTypeValue | null | undefined
): string {
  if (value === null || value === undefined) return "Not specified";
  return ClubTypeLabels[value] || "Unknown";
}
/**
 * Get ClubType options array for form selects (in correct order)
 * Usage: <FormField variant="select" options={getClubTypeOptions()} />
 */
export function getClubTypeOptions(): string[] {
  return [ClubTypeLabels[ClubType.PERSONAL], ClubTypeLabels[ClubType.OFFICIAL]];
}
/**
 * Get label for gender value
 */
export function getGenderLabel(value: GenderValue | null | undefined): string {
  if (value === null || value === undefined) return "Not specified";
  return GenderLabels[value] || "Unknown";
}

/**
 * Get gender options array for form selects (in correct order)
 * Usage: <FormField variant="select" options={getGenderOptions()} />
 */
export function getGenderOptions(): string[] {
  return [
    GenderLabels[Gender.FEMALE],
    GenderLabels[Gender.MALE],
    GenderLabels[Gender.UNSPECIFIED],
  ];
}

/**
 * Get label for membership status value
 */
export function getMembershipStatusLabel(value: MembershipStatusValue): string {
  return MembershipStatusLabels[value] || "Unknown";
}

/**
 * Get label for skill level value
 */
export function getSkillLevelLabel(value: SkillLevelValue): string {
  return SkillLevelLabels[value] || "Unknown";
}

/**
 * Get label for registration status value
 */
export function getRegistrationStatusLabel(
  value: RegistrationStatusValue
): string {
  return RegistrationStatusLabels[value] || "Unknown";
}

/**
 * Get label for role type value
 */
export function getRoleTypeLabel(value: RoleTypeValue): string {
  return RoleTypeLabels[value] || "Unknown";
}

// --- LEAGUE MODULE HELPERS ---

/**
 * Get label for league type value
 */
export function getLeagueTypeLabel(value: LeagueTypeValue): string {
  return LeagueTypeLabels[value] || "Unknown";
}

/**
 * Get label for generation format value
 */
export function getGenerationFormatLabel(value: GenerationFormatValue): string {
  return GenerationFormatLabels[value] || "Unknown";
}

/**
 * Get label for league participation status value
 */
export function getLeagueParticipationStatusLabel(
  value: LeagueParticipationStatusValue
): string {
  return LeagueParticipationStatusLabels[value] || "Unknown";
}

/**
 * Get label for day of week value
 */
export function getDayOfWeekLabel(value: DayOfWeekValue): string {
  return DayOfWeekLabels[value] || "Unknown";
}

/**
 * Get label for recurrence type value
 */
export function getRecurrenceTypeLabel(value: RecurrenceTypeValue): string {
  return RecurrenceTypeLabels[value] || "Unknown";
}

/**
 * Get label for league attendance status value
 */
export function getLeagueAttendanceStatusLabel(
  value: LeagueAttendanceStatusValue
): string {
  return LeagueAttendanceStatusLabels[value] || "Unknown";
}

// --- COURTS MODULE HELPERS ---

/**
 * Get label for affiliation type value
 */
export function getAffiliationTypeLabel(value: AffiliationTypeValue): string {
  return AffiliationTypeLabels[value] || "Unknown";
}

/**
 * Get label for booking type value
 */
export function getBookingTypeLabel(value: BookingTypeValue): string {
  return BookingTypeLabels[value] || "Unknown";
}

/**
 * Get label for block type value
 */
export function getBlockTypeLabel(value: BlockTypeValue): string {
  return BlockTypeLabels[value] || "Unknown";
}

// --- MATCHES MODULE HELPERS ---

/**
 * Get label for match type value
 */
export function getMatchTypeLabel(value: MatchTypeValue): string {
  return MatchTypeLabels[value] || "Unknown";
}

/**
 * Get label for match format value
 */
export function getMatchFormatLabel(value: MatchFormatValue): string {
  return MatchFormatLabels[value] || "Unknown";
}

/**
 * Get label for score format value
 */
export function getScoreFormatLabel(value: ScoreFormatValue): string {
  return ScoreFormatLabels[value] || "Unknown";
}

/**
 * Get label for match status value
 */
export function getMatchStatusLabel(value: MatchStatusValue): string {
  return MatchStatusLabels[value] || "Unknown";
}

/**
 * Get label for MLP game type value
 */
export function getMLPGameTypeLabel(value: MLPGameTypeValue): string {
  return MLPGameTypeLabels[value] || "Unknown";
}

// =====================================================
// BADGE/CHIP STYLING HELPERS
// =====================================================
/**
 * Map MembershipStatus to Badge Variant
 *
 * - ACTIVE → "success" (green)
 * - PENDING → "warning" (orange)
 * - SUSPENDED → "error" (red)
 * - CANCELLED → "default" (gray)
 * - BLOCKED → "error" (red)
 */
export const MembershipStatusBadgeVariant: Record<
  MembershipStatusValue,
  BadgeVariant
> = {
  [MembershipStatus.ACTIVE]: "success",
  [MembershipStatus.PENDING]: "warning",
  [MembershipStatus.SUSPENDED]: "error",
  [MembershipStatus.CANCELLED]: "error",
  [MembershipStatus.BLOCKED]: "error",
  [MembershipStatus.EXPIRED]: "error",
};

export const SkillLevelBadgeVariant: Record<SkillLevelValue, BadgeVariant> = {
  [SkillLevel.OPEN]: "default",
  [SkillLevel.INTERMEDIATE_PLUS]: "info",
  [SkillLevel.ADVANCED_PLUS]: "tertiary",
};

/**
 * Map RegistrationStatus to Badge Variant
 *
 * - OPEN → "success" (green)
 * - WAITLIST → "warning" (orange)
 * - CLOSED → "error" (red)
 */
export const RegistrationStatusBadgeVariant: Record<
  RegistrationStatusValue,
  BadgeVariant
> = {
  [RegistrationStatus.OPEN]: "success",
  [RegistrationStatus.WAITLIST]: "warning",
  [RegistrationStatus.CLOSED]: "error",
};

/**
 * Map LeagueParticipationStatus to Badge Variant
 *
 * - ACTIVE → "success" (green)
 * - RESERVE → "warning" (orange)
 * - INJURED → "error" (red)
 * - HOLIDAY → "info" (blue)
 * - DROPPED → "default" (gray)
 */
export const LeagueParticipationStatusBadgeVariant: Record<
  LeagueParticipationStatusValue,
  BadgeVariant
> = {
  [LeagueParticipationStatus.ACTIVE]: "success",
  [LeagueParticipationStatus.RESERVE]: "warning",
  [LeagueParticipationStatus.INJURED]: "error",
  [LeagueParticipationStatus.HOLIDAY]: "info",
  [LeagueParticipationStatus.DROPPED]: "default",
};

/**
 * Map LeagueAttendanceStatus to Badge Variant
 *
 * - ATTENDING → "success" (green)
 * - CANCELLED → "warning" (orange)
 * - ABSENT → "error" (red)
 */
export const LeagueAttendanceStatusBadgeVariant: Record<
  LeagueAttendanceStatusValue,
  BadgeVariant
> = {
  [LeagueAttendanceStatus.ATTENDING]: "success",
  [LeagueAttendanceStatus.CANCELLED]: "warning",
  [LeagueAttendanceStatus.ABSENT]: "error",
};

/**
 * Map MatchStatus to Badge Variant
 *
 * - PENDING → "warning" (orange)
 * - ACCEPTED → "info" (blue)
 * - SCHEDULED → "primary" (brand color)
 * - IN_PROGRESS → "success" (green)
 * - COMPLETED → "success" (green)
 * - CANCELLED → "error" (red)
 */
export const MatchStatusBadgeVariant: Record<MatchStatusValue, BadgeVariant> = {
  [MatchStatus.PENDING]: "warning",
  [MatchStatus.ACCEPTED]: "info",
  [MatchStatus.SCHEDULED]: "primary",
  [MatchStatus.IN_PROGRESS]: "success",
  [MatchStatus.COMPLETED]: "success",
  [MatchStatus.CANCELLED]: "error",
};

/**
 * Get badge variant for membership status
 * Usage: <Badge variant={getMembershipStatusBadgeVariant(status)} />
 */
export function getMembershipStatusBadgeVariant(
  status: MembershipStatusValue
): BadgeVariant {
  return MembershipStatusBadgeVariant[status] || "default";
}

/**
 * Get badge variant for registration status
 * Usage: <Badge variant={getRegistrationStatusBadgeVariant(status)} />
 */
export function getRegistrationStatusBadgeVariant(
  status: RegistrationStatusValue
): BadgeVariant {
  return RegistrationStatusBadgeVariant[status] || "default";
}

/**
 * Get badge variant for league participation status
 * Usage: <Badge variant={getLeagueParticipationStatusBadgeVariant(status)} />
 */
export function getLeagueParticipationStatusBadgeVariant(
  status: LeagueParticipationStatusValue
): BadgeVariant {
  return LeagueParticipationStatusBadgeVariant[status] || "default";
}

/**
 * Get badge variant for league attendance status
 * Usage: <Badge variant={getLeagueAttendanceStatusBadgeVariant(status)} />
 */
export function getLeagueAttendanceStatusBadgeVariant(
  status: LeagueAttendanceStatusValue
): BadgeVariant {
  return LeagueAttendanceStatusBadgeVariant[status] || "default";
}

/**
 * Get badge variant for match status
 * Usage: <Badge variant={getMatchStatusBadgeVariant(status)} />
 */
export function getMatchStatusBadgeVariant(
  status: MatchStatusValue
): BadgeVariant {
  return MatchStatusBadgeVariant[status] || "default";
}
/**
 * Get badge variant for skill Level
 * Usage: <Badge variant={getSkillLevelBadgeVariant(level)} />
 */
export function getSkillLevelBadgeVariant(
  level: SkillLevelValue
): BadgeVariant {
  return SkillLevelBadgeVariant[level] || "default";
}

// --- NOTIFICATIONS MODULE HELPERS ---

/**
 * Get badge variant for a notification type
 * Returns the severity-based color variant for the notification
 *
 * Usage:
 * const variant = getNotificationBadgeVariant(NotificationType.EVENT_CANCELLED);
 * // Returns: "error"
 */
export function getNotificationBadgeVariant(
  type: NotificationTypeValue
): BadgeVariant {
  return NotificationTypeBadgeVariant[type] || "default";
}

/**
 * Get "worst" (most severe) badge variant from array of notification types
 * Used when multiple notification types apply to one menu item
 * Severity hierarchy: ERROR > WARNING > SUCCESS > INFO > DEFAULT
 *
 * Usage:
 * const types = [NotificationType.MEMBERSHIP_EXPIRING, NotificationType.MEMBERSHIP_REJECTED];
 * const variant = getWorstBadgeVariant(types);
 * // Returns: "error" (because REJECTED is ERROR, which beats WARNING)
 *
 * @param types - Array of notification type values
 * @returns Badge variant for most severe notification type
 */
export function getWorstBadgeVariant(
  types: NotificationTypeValue[]
): BadgeVariant {
  if (types.length === 0) return "default";

  let worstVariant: BadgeVariant = "default";
  let worstSeverity = 0;

  for (const type of types) {
    const variant = NotificationTypeBadgeVariant[type] || "default";
    const severity = BadgeVariantSeverity[variant];

    if (severity > worstSeverity) {
      worstSeverity = severity;
      worstVariant = variant;
    }
  }

  return worstVariant;
}

/**
 * Get "worst" badge variant from array of unread notifications
 * Filters by notification type and returns most severe variant
 *
 * Usage:
 * // Get worst variant for membership-related notifications
 * const variant = getWorstBadgeVariantForNotifications(
 *   notifications,
 *   [NotificationType.MEMBERSHIP_EXPIRING, NotificationType.MEMBERSHIP_REJECTED]
 * );
 *
 * @param notifications - Array of notifications
 * @param types - Notification types to consider (optional, defaults to all types)
 * @returns Badge variant for most severe unread notification
 */
export function getWorstBadgeVariantForNotifications(
  notifications: { notificationType: NotificationTypeValue; isRead: boolean }[],
  types?: NotificationTypeValue | NotificationTypeValue[]
): BadgeVariant {
  // Filter unread notifications
  let filtered = notifications.filter((n) => !n.isRead);

  // Further filter by types if provided
  if (types) {
    const typeArray = Array.isArray(types) ? types : [types];
    filtered = filtered.filter((n) => typeArray.includes(n.notificationType));
  }

  // Get unique types from filtered notifications
  const uniqueTypes = Array.from(
    new Set(filtered.map((n) => n.notificationType))
  );

  // Return worst variant
  return getWorstBadgeVariant(uniqueTypes);
}

/**
 * Get notification category
 */
export function getNotificationCategory(
  type: NotificationTypeValue
): NotificationCategoryValue {
  return NotificationTypeCategory[type] || NotificationCategory.SYSTEM;
}

/**
 * Get notification type label
 */
export function getNotificationTypeLabel(type: NotificationTypeValue): string {
  return NotificationTypeLabels[type] || "Unknown";
}
