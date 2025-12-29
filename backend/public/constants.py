from django.db import models
# ==============================================
# USER & CLUB MODULE
# ==============================================

class Gender(models.IntegerChoices):
    FEMALE = 1, "Female"
    MALE = 2, "Male"
    UNSPECIFIED = 3, "Unspecified"

class MembershipStatus(models.IntegerChoices):
    PENDING = 1, "Pending"
    ACTIVE = 2, "Active"
    SUSPENDED = 3, "Suspended"
    CANCELLED = 4, "Cancelled"
    BLOCKED = 5, "Blocked"
    EXPIRED = 6, "Expired"

class SkillLevel(models.IntegerChoices):
    """Club membership skill levels (assessment-based)"""
    OPEN = 1, 'Open (Not Assessed)'
    INTERMEDIATE_PLUS = 2, '3.5+ (Advanced Intermediate)'
    ADVANCED_PLUS = 3, '4.0+ (Advanced)'

class RegistrationStatus(models.IntegerChoices):
    OPEN = 1, 'Open'
    WAITLIST = 2, 'Waitlist'
    CLOSED = 3, 'Closed'

class RoleType(models.IntegerChoices):
    ADMIN = 1, 'Admin'
    ORGANIZER = 2, 'Organizer'
    CAPTAIN = 3, 'Captain'
    INSTRUCTOR = 4, 'Instructor'
    MEMBER = 5, 'Club Member'

# ==============================================
# LEAGUE MODULE
# ==============================================

class LeagueType(models.IntegerChoices):
    STANDARD = 1, 'Standard (Rotating Partners)'
    TEAM = 2, 'Team-Based (Fixed 2-Player Teams)'
    MLP = 3, 'MLP (Fixed 4+ Player Teams)'

class GenerationFormat(models.IntegerChoices):
    """How matches are generated (used in League.default_generation_format and Match.generation_format)"""
    ROUND_ROBIN = 1, 'Round-Robin'
    KING_OF_COURT = 2, 'King of the Court'
    MANUAL = 3, 'Manual Entry'

class LeagueParticipationStatus(models.IntegerChoices):
    ACTIVE = 1, 'Active'
    RESERVE = 2, 'Reserve - Waiting for spot'
    INJURED = 3, 'Injured - Temporarily out'
    HOLIDAY = 4, 'On Holiday - Temporarily out'
    DROPPED = 5, 'Dropped Out'

class DayOfWeek(models.IntegerChoices):
    """Shared between League and Courts modules"""
    MONDAY = 0, "Monday"
    TUESDAY = 1, "Tuesday"
    WEDNESDAY = 2, "Wednesday"
    THURSDAY = 3, "Thursday"
    FRIDAY = 4, "Friday"
    SATURDAY = 5, "Saturday"
    SUNDAY = 6, "Sunday"

class RecurrenceType(models.IntegerChoices):
    WEEKLY = 1, 'Weekly'
    BI_WEEKLY = 2, 'Every other week'
    MONTHLY = 3, 'Once a month'

class LeagueAttendanceStatus(models.IntegerChoices):
    ATTENDING = 1, 'Attending'
    CANCELLED = 2, 'Cancelled'
    ABSENT = 3, 'Absent (no-show)'

# ==============================================
# COURTS MODULE
# ==============================================

class AffiliationType(models.IntegerChoices):
    PRIORITY = 1, 'Priority Access'
    EXCLUSIVE = 2, 'Exclusive Access (certain times)'
    PARTNER = 3, 'Partner Club'
    SHARED = 4, 'Shared Access'

class BookingType(models.IntegerChoices):
    PRACTICE = 1, 'Practice Session'
    CASUAL = 2, 'Casual Play'
    LESSON = 3, 'Lesson'
    DRILL = 4, 'Drill Session'
    OTHER = 5, 'Other'

class BlockType(models.IntegerChoices):
    LEAGUE = 1, 'League'
    COMPETITIVE = 2, 'Competitive Play'
    RECREATIVE = 3, 'Recreative Play'
    SKILL_RESTRICTED = 4, 'Skill Restricted (3.5+, 4.0+, etc.)'
    PUBLIC = 5, 'Public Open Play'
    DRILL = 6, 'Drill/Training'
    TOURNAMENT = 7, 'Tournament'
    BLOCKED = 8, 'Blocked/Reserved'
    MAINTENANCE = 9, 'Maintenance/Closed'

# ==============================================
# MATCHES MODULE
# ==============================================

class MatchType(models.IntegerChoices):
    SINGLES = 1, 'Singles'
    DOUBLES = 2, 'Doubles'
    MLP = 3, 'MLP Team Match'

class MatchFormat(models.IntegerChoices):
    """Number of games to win (different from GenerationFormat!)"""
    BEST_OF_1 = 1, 'Best of 1 (Single Game)'
    BEST_OF_3 = 2, 'Best of 3'
    BEST_OF_5 = 3, 'Best of 5'

class ScoreFormat(models.IntegerChoices):
    SIDEOUT = 1, 'Side-out Scoring'
    RALLY = 2, 'Rally Scoring'

class MatchStatus(models.IntegerChoices):
    PENDING = 1, 'Pending - Players invited'
    ACCEPTED = 2, 'Accepted - All players confirmed'
    SCHEDULED = 3, 'Scheduled'
    IN_PROGRESS = 4, 'In Progress'
    COMPLETED = 5, 'Completed - Results entered'
    CANCELLED = 6, 'Cancelled'

class MLPGameType(models.IntegerChoices):
    """Shared between Team and Game models"""
    WOMEN_DOUBLES = 1, "Women's Doubles"
    MEN_DOUBLES = 2, "Men's Doubles"
    MIXED_DOUBLES_1 = 3, 'Mixed Doubles 1'
    MIXED_DOUBLES_2 = 4, 'Mixed Doubles 2'
    DREAMBREAKER = 5, 'DreamBreaker'

# ==============================================
# NOTIFICATIONS MODULE
# ==============================================
class NotificationType(models.IntegerChoices):
    """All notification types across all phases."""
    
    # System (1-9)
    SYSTEM_MESSAGE = 1, "System Message"
    
    # Events (10-19)
    EVENT_REMINDER = 10, "Event Reminder"
    EVENT_UPDATED = 11, "Event Updated"
    EVENT_CANCELLED = 12, "Event Cancelled"
    EVENT_INVITATION = 13, "Event Invitation"
    
    # League/Matches (20-29)
    LEAGUE_MATCH_SCHEDULED = 20, "Match Scheduled"
    LEAGUE_RESULTS_POSTED = 21, "Results Posted"
    LEAGUE_STANDINGS_UPDATED = 22, "Standings Updated"
    LEAGUE_ANNOUNCEMENT = 23, "League Announcement"
    LEAGUE_INVITATION = 24, "League Invitation"
    LEAGUE_SESSION_REMINDER = 25, "Session Reminder"
    LEAGUE_SESSION_CANCELLED = 26, "Session Cancelled"
    
    # Memberships/Club (30-39)
    MEMBERSHIP_EXPIRING = 30, "Membership Expiring"
    MEMBERSHIP_RENEWED = 31, "Membership Renewed"
    RENEWAL_PERIOD_OPEN = 32, "Renewal Period Open"
    MEMBERSHIP_APPROVED = 33, "Membership Approved"
    MEMBERSHIP_REJECTED = 34, "Membership Rejected"
    CLUB_ANNOUNCEMENT = 35, "Club Announcement"
    MEMBERSHIP_SUSPENDED = 36, "Membership Suspended"
    
    # Messages (40-49) - Phase 5.x (FUTURE)
    DIRECT_MESSAGE = 40, "Direct Message"
    MENTION = 41, "Mentioned in Message"
    
    # Social (50-59) - Phase 6+ (FUTURE)
    NEW_FOLLOWER = 50, "New Follower"
    PARTNER_REQUEST = 51, "Partner Request"
    
    # Milestones (60-69)
    MILESTONE_GAMES_50 = 60, "50 Games Played"
    MILESTONE_GAMES_100 = 61, "100 Games Played"
    MILESTONE_GAMES_500 = 62, "500 Games Played"
    MILESTONE_WIN_STREAK = 63, "Win Streak"
    MILESTONE_RANK_IMPROVED = 64, "Rank Improved"
    
    # Admin/Roles (70-79)
    ROLE_ASSIGNED = 70, "Role Assigned"
    ROLE_REMOVED = 71, "Role Removed"
    
    # System Admin (80-89)
    SYSTEM_MAINTENANCE = 80, "System Maintenance"
    SYSTEM_UPDATE = 81, "System Update"
# ... etc for all status/type fields