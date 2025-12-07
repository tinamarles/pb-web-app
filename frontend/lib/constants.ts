// lib/constants.ts
// =====================================================
// CRITICAL: Keep in sync with Django constants.py!
// Backend file: backend/public/constants.py
// Last synced: 2025-12-07
// =====================================================

// =====================================================
// USER & CLUB MODULE
// =====================================================

/**
 * Gender values
 * Maps to Django: public.constants.Gender
 */
export const Gender = {
  FEMALE: 1,
  MALE: 2,
  UNSPECIFIED: 3,
} as const;

export type GenderValue = typeof Gender[keyof typeof Gender];

export const GenderLabels: Record<GenderValue, string> = {
  [Gender.FEMALE]: "Female",
  [Gender.MALE]: "Male",
  [Gender.UNSPECIFIED]: "Unspecified",
};

// Reverse mapping: label → value (for form submissions)
export const GenderValues: Record<string, GenderValue> = {
  "Female": Gender.FEMALE,
  "Male": Gender.MALE,
  "Unspecified": Gender.UNSPECIFIED,
  "Other": Gender.UNSPECIFIED,  // Alias for backwards compatibility
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
} as const;

export type MembershipStatusValue = typeof MembershipStatus[keyof typeof MembershipStatus];

export const MembershipStatusLabels: Record<MembershipStatusValue, string> = {
  [MembershipStatus.PENDING]: "Pending",
  [MembershipStatus.ACTIVE]: "Active",
  [MembershipStatus.SUSPENDED]: "Suspended",
  [MembershipStatus.CANCELLED]: "Cancelled",
  [MembershipStatus.BLOCKED]: "Blocked",
};

// Reverse mapping: label → value (for form submissions)
export const MembershipStatusValues: Record<string, MembershipStatusValue> = {
  "Pending": MembershipStatus.PENDING,
  "Active": MembershipStatus.ACTIVE,
  "Suspended": MembershipStatus.SUSPENDED,
  "Cancelled": MembershipStatus.CANCELLED,
  "Blocked": MembershipStatus.BLOCKED,
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

export type SkillLevelValue = typeof SkillLevel[keyof typeof SkillLevel];

export const SkillLevelLabels: Record<SkillLevelValue, string> = {
  [SkillLevel.OPEN]: "Open (Not Assessed)",
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

export type RegistrationStatusValue = typeof RegistrationStatus[keyof typeof RegistrationStatus];

export const RegistrationStatusLabels: Record<RegistrationStatusValue, string> = {
  [RegistrationStatus.OPEN]: "Open",
  [RegistrationStatus.WAITLIST]: "Waitlist",
  [RegistrationStatus.CLOSED]: "Closed",
};

// Reverse mapping: label → value (for form submissions)
export const RegistrationStatusValues: Record<string, RegistrationStatusValue> = {
  "Open": RegistrationStatus.OPEN,
  "Waitlist": RegistrationStatus.WAITLIST,
  "Closed": RegistrationStatus.CLOSED,
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

export type RoleTypeValue = typeof RoleType[keyof typeof RoleType];

export const RoleTypeLabels: Record<RoleTypeValue, string> = {
  [RoleType.ADMIN]: "Admin",
  [RoleType.ORGANIZER]: "Organizer",
  [RoleType.CAPTAIN]: "Captain",
  [RoleType.INSTRUCTOR]: "Instructor",
  [RoleType.MEMBER]: "Club Member",
};

// Reverse mapping: label → value (for form submissions)
export const RoleTypeValues: Record<string, RoleTypeValue> = {
  "Admin": RoleType.ADMIN,
  "Organizer": RoleType.ORGANIZER,
  "Captain": RoleType.CAPTAIN,
  "Instructor": RoleType.INSTRUCTOR,
  "Club Member": RoleType.MEMBER,
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

export type LeagueTypeValue = typeof LeagueType[keyof typeof LeagueType];

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

export type GenerationFormatValue = typeof GenerationFormat[keyof typeof GenerationFormat];

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

export type LeagueParticipationStatusValue = typeof LeagueParticipationStatus[keyof typeof LeagueParticipationStatus];

export const LeagueParticipationStatusLabels: Record<LeagueParticipationStatusValue, string> = {
  [LeagueParticipationStatus.ACTIVE]: "Active",
  [LeagueParticipationStatus.RESERVE]: "Reserve - Waiting for spot",
  [LeagueParticipationStatus.INJURED]: "Injured - Temporarily out",
  [LeagueParticipationStatus.HOLIDAY]: "On Holiday - Temporarily out",
  [LeagueParticipationStatus.DROPPED]: "Dropped Out",
};

// Reverse mapping: label → value (for form submissions)
export const LeagueParticipationStatusValues: Record<string, LeagueParticipationStatusValue> = {
  "Active": LeagueParticipationStatus.ACTIVE,
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

export type DayOfWeekValue = typeof DayOfWeek[keyof typeof DayOfWeek];

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
  "Monday": DayOfWeek.MONDAY,
  "Tuesday": DayOfWeek.TUESDAY,
  "Wednesday": DayOfWeek.WEDNESDAY,
  "Thursday": DayOfWeek.THURSDAY,
  "Friday": DayOfWeek.FRIDAY,
  "Saturday": DayOfWeek.SATURDAY,
  "Sunday": DayOfWeek.SUNDAY,
};

/**
 * Recurrence Type
 * Maps to Django: public.constants.RecurrenceType
 */
export const RecurrenceType = {
  WEEKLY: 1,
  BI_WEEKLY: 2,
  MONTHLY: 3,
} as const;

export type RecurrenceTypeValue = typeof RecurrenceType[keyof typeof RecurrenceType];

export const RecurrenceTypeLabels: Record<RecurrenceTypeValue, string> = {
  [RecurrenceType.WEEKLY]: "Weekly",
  [RecurrenceType.BI_WEEKLY]: "Every other week",
  [RecurrenceType.MONTHLY]: "Once a month",
};

// Reverse mapping: label → value (for form submissions)
export const RecurrenceTypeValues: Record<string, RecurrenceTypeValue> = {
  "Weekly": RecurrenceType.WEEKLY,
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

export type LeagueAttendanceStatusValue = typeof LeagueAttendanceStatus[keyof typeof LeagueAttendanceStatus];

export const LeagueAttendanceStatusLabels: Record<LeagueAttendanceStatusValue, string> = {
  [LeagueAttendanceStatus.ATTENDING]: "Attending",
  [LeagueAttendanceStatus.CANCELLED]: "Cancelled",
  [LeagueAttendanceStatus.ABSENT]: "Absent (no-show)",
};

// Reverse mapping: label → value (for form submissions)
export const LeagueAttendanceStatusValues: Record<string, LeagueAttendanceStatusValue> = {
  "Attending": LeagueAttendanceStatus.ATTENDING,
  "Cancelled": LeagueAttendanceStatus.CANCELLED,
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

export type AffiliationTypeValue = typeof AffiliationType[keyof typeof AffiliationType];

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

export type BookingTypeValue = typeof BookingType[keyof typeof BookingType];

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
  "Lesson": BookingType.LESSON,
  "Drill Session": BookingType.DRILL,
  "Other": BookingType.OTHER,
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

export type BlockTypeValue = typeof BlockType[keyof typeof BlockType];

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
  "League": BlockType.LEAGUE,
  "Competitive Play": BlockType.COMPETITIVE,
  "Recreative Play": BlockType.RECREATIVE,
  "Skill Restricted (3.5+, 4.0+, etc.)": BlockType.SKILL_RESTRICTED,
  "Public Open Play": BlockType.PUBLIC,
  "Drill/Training": BlockType.DRILL,
  "Tournament": BlockType.TOURNAMENT,
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

export type MatchTypeValue = typeof MatchType[keyof typeof MatchType];

export const MatchTypeLabels: Record<MatchTypeValue, string> = {
  [MatchType.SINGLES]: "Singles",
  [MatchType.DOUBLES]: "Doubles",
  [MatchType.MLP]: "MLP Team Match",
};

// Reverse mapping: label → value (for form submissions)
export const MatchTypeValues: Record<string, MatchTypeValue> = {
  "Singles": MatchType.SINGLES,
  "Doubles": MatchType.DOUBLES,
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

export type MatchFormatValue = typeof MatchFormat[keyof typeof MatchFormat];

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

export type ScoreFormatValue = typeof ScoreFormat[keyof typeof ScoreFormat];

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

export type MatchStatusValue = typeof MatchStatus[keyof typeof MatchStatus];

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
  "Scheduled": MatchStatus.SCHEDULED,
  "In Progress": MatchStatus.IN_PROGRESS,
  "Completed - Results entered": MatchStatus.COMPLETED,
  "Cancelled": MatchStatus.CANCELLED,
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

export type MLPGameTypeValue = typeof MLPGameType[keyof typeof MLPGameType];

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
  "DreamBreaker": MLPGameType.DREAMBREAKER,
};

// =====================================================
// HELPER FUNCTIONS (Reusable!)
// =====================================================

// --- USER & CLUB MODULE HELPERS ---

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
export function getRegistrationStatusLabel(value: RegistrationStatusValue): string {
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
export function getLeagueParticipationStatusLabel(value: LeagueParticipationStatusValue): string {
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
export function getLeagueAttendanceStatusLabel(value: LeagueAttendanceStatusValue): string {
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
 * Get CSS class for membership status badge
 */
export function getMembershipStatusClass(status: MembershipStatusValue): string {
  switch (status) {
    case MembershipStatus.PENDING:
      return "badge-warning";
    case MembershipStatus.ACTIVE:
      return "badge-success";
    case MembershipStatus.SUSPENDED:
      return "badge-error";
    case MembershipStatus.CANCELLED:
      return "badge-neutral";
    case MembershipStatus.BLOCKED:
      return "badge-error";
    default:
      return "badge-neutral";
  }
}

/**
 * Get CSS class for registration status badge
 */
export function getRegistrationStatusClass(status: RegistrationStatusValue): string {
  switch (status) {
    case RegistrationStatus.OPEN:
      return "badge-success";
    case RegistrationStatus.WAITLIST:
      return "badge-warning";
    case RegistrationStatus.CLOSED:
      return "badge-error";
    default:
      return "badge-neutral";
  }
}

/**
 * Get CSS class for league participation status badge
 */
export function getLeagueParticipationStatusClass(status: LeagueParticipationStatusValue): string {
  switch (status) {
    case LeagueParticipationStatus.ACTIVE:
      return "badge-success";
    case LeagueParticipationStatus.RESERVE:
      return "badge-warning";
    case LeagueParticipationStatus.INJURED:
      return "badge-error";
    case LeagueParticipationStatus.HOLIDAY:
      return "badge-info";
    case LeagueParticipationStatus.DROPPED:
      return "badge-neutral";
    default:
      return "badge-neutral";
  }
}

/**
 * Get CSS class for league attendance status badge
 */
export function getLeagueAttendanceStatusClass(status: LeagueAttendanceStatusValue): string {
  switch (status) {
    case LeagueAttendanceStatus.ATTENDING:
      return "badge-success";
    case LeagueAttendanceStatus.CANCELLED:
      return "badge-warning";
    case LeagueAttendanceStatus.ABSENT:
      return "badge-error";
    default:
      return "badge-neutral";
  }
}

/**
 * Get CSS class for match status badge
 */
export function getMatchStatusClass(status: MatchStatusValue): string {
  switch (status) {
    case MatchStatus.PENDING:
      return "badge-warning";
    case MatchStatus.ACCEPTED:
      return "badge-info";
    case MatchStatus.SCHEDULED:
      return "badge-primary";
    case MatchStatus.IN_PROGRESS:
      return "badge-success";
    case MatchStatus.COMPLETED:
      return "badge-success";
    case MatchStatus.CANCELLED:
      return "badge-error";
    default:
      return "badge-neutral";
  }
}