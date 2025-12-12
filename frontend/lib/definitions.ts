// frontend/lib/definitions.ts

import * as C from '@/lib/constants';

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
  name: string;  // e.g., "Resident", "Non-Resident", "Junior"
  description?: string;  // ✅ FIXED: Django has blank=True ONLY (not null=True)
  requiresApproval?: boolean;
  registrationOpenDate?: string | null;
  registrationCloseDate?: string | null;
  currentMemberCount?: number;  // ✅ From @property
  isAtCapacity?: boolean;       // ✅ From @property
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

export interface MemberClub {
  /* light-weight club that is used for a Club member. It
     does NOT include the array that contains all the members of 
     the club.
  */
  id?: number;
  name: string;
  shortName?: string;
  description?: string;  // ✅ FIXED: Django has blank=True ONLY (not null=True)
  phoneNumber?: string;  // ✅ FIXED: Django has blank=True ONLY (not null=True)
  email?: string;  // ✅ FIXED: Django has blank=True ONLY (not null=True)
  websiteUrl?: string;  // ✅ FIXED: Django has blank=True ONLY (not null=True)
  logoUrl?: string;  // ✅ FIXED: Django has blank=True ONLY (not null=True)
  address?: Address | null;  // ✅ FIXED: Django ForeignKey with null=True, blank=True
  autoapproval: boolean; // default=False in Django
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
  firstName?: string;  // Django AbstractUser has blank=True
  lastName?: string;  // Django AbstractUser has blank=True
  email?: string;  // Required but optional in response
  profilePictureUrl?: string;  // ✅ blank=True only - NO null!
  skillLevel?: number | null;  // ✅ null=True - NULL OK
  isCoach?: boolean;
  homePhone?: string;  // ✅ blank=True only - NO null!
  mobilePhone?: string;  // ✅ blank=True only - NO null!
  workPhone?: string;  // ✅ blank=True only - NO null!
  location?: string;  // ✅ blank=True only - NO null!
  dob?: string | null;  // ✅ null=True - NULL OK
  gender: C.GenderValue;  // Has default, not null
  bio?: string;  // ✅ blank=True only - NO null!
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
}
