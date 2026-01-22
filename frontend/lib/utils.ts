import type { User, MemberUser, ClubMembership } from "@/lib/definitions";

// +++ Utility functions +++

// Function to convert the snake_case coming from the Django API
// into camelCase BACKEND -> FRONTEND

export function snakeToCamel(obj: unknown): unknown {
  if (typeof obj !== "object" || obj === null) {
    // Handle non-object types or null safely
    return obj;
  }

  if (Array.isArray(obj)) {
    // If it's an array, recursively convert its elements
    return obj.map((item) => snakeToCamel(item));
  }

  // If it's an object, iterate over its keys and convert them
  const newObj: Record<string, unknown> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) =>
        letter.toUpperCase()
      );
      newObj[camelKey] = snakeToCamel((obj as Record<string, unknown>)[key]);
    }
  }
  return newObj;
}
// Function to convert the camelCase coming from the frontend
// into snake_case for the django Backend: FRONTEND -> BACKEND
export function camelToSnake(obj: unknown): unknown {
  if (typeof obj !== "object" || obj === null) {
    // Handle non-object types or null safely
    return obj;
  }

  if (Array.isArray(obj)) {
    // If it's an array, recursively convert its elements
    return obj.map((item) => camelToSnake(item));
  }

  // If it's an object, iterate over its keys and convert them
  const newObj: Record<string, unknown> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      // Convert camelCase to snake_case
      const snakeKey = key.replace(
        /[A-Z]/g,
        (letter) => `_${letter.toLowerCase()}`
      );
      newObj[snakeKey] = camelToSnake((obj as Record<string, unknown>)[key]);
    }
  }
  return newObj;
}

export function formatBackendErrors(
  errorData: Record<string, string | string[]>
): string {
  // Use Object.values() to get all the values from the error object.
  // The type of `messages` can now be a string or a string array.

  const allErrors = Object.values(errorData).flatMap((messages) => {
    // If it's a string, wrap it in an array to make it iterable.
    if (typeof messages === "string") {
      return [messages];
    }
    // If it's an array, return it as-is.
    return messages;
  });

  if (allErrors.length > 0) {
    // This will join the errors with a newline character.
    return allErrors.join("\n");
  }

  return "Error formatting - An unexpected error occurred.";
}

/**
 * Check if a user is a member of a specific club
 * @param user - The authenticated user object
 * @param clubId - The club ID to check membership for
 * @returns boolean - True if user is a member of the club
 */
export function isClubMember(user: User | null, clubId: number): boolean {
  if (!user) return false;

  // Check if user has clubMemberships (MemberUser)
  if (!("clubMemberships" in user)) return false;

  const memberUser = user as MemberUser;
  return memberUser.clubMemberships.some((m) => m.club.id === clubId);
}

/**
 * Check if a user has admin privileges for a specific club
 * @param user - The authenticated user object
 * @param clubId - The club ID to check admin rights for
 * @returns boolean - True if user has ANY admin permission (can_*) for this club
 */
export function isClubAdmin(user: User | null, clubId: number): boolean {
  if (!user) return false;

  // Check if user has clubMemberships (MemberUser)
  if (!("clubMemberships" in user)) return false;

  const memberUser = user as MemberUser;

  // Find the specific membership for this club
  const clubMembership = memberUser.clubMemberships.find(
    (m) => m.club.id === clubId
  );

  if (!clubMembership) return false;

  // Check if ANY property starting with 'can' is true
  return Object.entries(clubMembership).some(
    ([key, value]) => key.startsWith("can") && value === true
  );
}

/**
 * Get the club membership object for a specific club
 * @param user - The authenticated user object
 * @param clubId - The club ID to get membership for
 * @returns ClubMembership | undefined - The membership object or undefined if not found
 */
export function getClubMembership(
  user: User | null,
  clubId: number
): ClubMembership | undefined {
  if (!user) return undefined;

  // Check if user has clubMemberships (MemberUser)
  if (!("clubMemberships" in user)) return undefined;

  const memberUser = user as MemberUser;
  return memberUser.clubMemberships.find((m) => m.club.id === clubId);
}

/**
 * Utility function to combine both checks for convenience
 * @param user - The authenticated user object
 * @param clubId - The club ID to check
 * @returns Object with isMember and isAdmin boolean flags
 */
export function getClubPermissions(user: User | null, clubId: number) {
  return {
    isMember: isClubMember(user, clubId),
    isAdmin: isClubAdmin(user, clubId),
    membership: getClubMembership(user, clubId),
  };
}

/**
 * Convert string decimal from API to number for calculations
 * 
 * @param value - String decimal from Django DecimalField
 * @param defaultValue - Fallback if null/undefined (default: 0)
 * @returns Number for calculations
 * 
 * @example
 * const fee = toNumber(event.fee);  // "40.00" → 40
 * const fee = toNumber(event.fee, 10);  // null → 10
 */
export function toNumber(
  value: string | null | undefined,
  defaultValue: number = 0
): number {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  return Number(value);
}