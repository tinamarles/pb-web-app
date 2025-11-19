// frontend/lib/definitions.ts

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

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
  /* club.serializer sends fields = '__all__'
    id = primaryKey
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True, null=True)
  */
  id?: number;
  name: string;
  description?: string | null;
}

export interface ClubMembershipType {
  /* club.serializer sends fields = ['id', 'type', 'description']
    id = primaryKey
    type = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True, null=True)
  */
  id?: number;
  type: string;
  description?: string | null;
}

export interface ClubMembershipSkillLevel {
  /* club.serializer sends fields = ['id', 'level', 'description']
    id = primaryKey
    level = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True, null=True)
  */
  id?: number;
  level: string;
  description?: string | null;
}

export interface MemberClub {
  /* light-weight club that is used for a Club member. It
     does NOT include the array that contains all the members of 
     the club.
     
     It corresponds to the NestedClubSerializer in club.serializer
     that sends the fields = [
            'id',
            'name',
            'description',
            'phone_number',
            'email',
            'website_url',
            'logo_url',
            'address',
        ]
  */
  id?: number;
  name: string;
  description?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  websiteUrl?: string | null;
  logoUrl?: string | null;
  address?: Address;
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
  /* club.serializer ClubMembership which sends:
    club = NestedClubSerializer(read_only=True) ==> MemberClub
    roles = RoleSerializer(many=True, read_only=True) ==> Role
    type = ClubMembershipTypeSerializer(read_only=True) ==> ClubMembershipType
    levels = ClubMembershipSkillLevelSerializer(many=True, read_only=True) ==> ClubMembershipLevel

    class Meta:
        model = ClubMembership
        fields = ['id', 
                  'club', 
                  'roles', 
                  'type', 
                  'levels', 
                  'membership_number', 
                  'is_preferred_club',
                  'registration_start_date',
                  'registration_end_date'
                  ]
  */
  id?: number;
  club?: MemberClub;
  roles?: Role[];
  type?: ClubMembershipType;
  levels?: ClubMembershipSkillLevel[];
  membershipNumber?: string | null;
  isPreferredClub?: boolean;
  registrationStartDate?: string | null;
  registrationEndDate?: string | null;
}
// +++ User-specific types: types for different user roles

// PublicUser has no club membership and matches CustomUser
// serializer
/*
    'id', 
    'username', 
    'first_name', 
    'last_name', 
    'email', 
    'skill_level',
    'is_coach',
    'home_phone',
    'mobile_phone',
    'work_phone',
    'dob',
    'gender',
*/
export interface PublicUser {
  id?: number;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string;
  skillLevel?: number | null;
  profilePictureUrl?: string | null;
  isCoach?: boolean;
  homePhone?: string | null;
  mobilePhone?: string | null;
  workPhone?: string | null;
  dob?: string | null;
  gender?: 1 | 2 | 3;
  bio?: string | null;
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
  return "club_memberships" in user;
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
  isMemberUser: () => boolean; // NEW
  refetchUser: () => Promise<void>; // NEW
  
}
