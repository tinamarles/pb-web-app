// lib/validationErrors.ts

/**
 * ValidationError type definition
 * Plain object (NOT a class!) for Next.js/React serialization
 */
export type ValidationError = {
  readonly type: "ValidationError";
  readonly status: number;
  readonly message: string;
  readonly detail?: string;
};

/**
 * Create a validation error object
 *
 * USE FOR: Validation failures in route.ts
 * - Missing authentication token
 * - Missing required fields
 * - Type validation failures
 * - Any validation BEFORE calling server actions
 *
 * @param message - User-friendly error message
 * @param status - HTTP status code (default: 400)
 * @param detail - Optional detailed explanation
 * @returns ValidationError object
 *
 * @example
 * throw createValidationError("Authentication required", 401);
 * throw createValidationError("Status is required", 400, "Missing required field");
 */
export function createValidationError(
  message: string,
  status: number = 400,
  detail?: string,
): ValidationError {
  return {
    type: "ValidationError",
    status,
    message,
    detail,
  };
}

/**
 * Type guard to check if error is ValidationError
 */
export function isValidationError(error: unknown): error is ValidationError {
  return (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    error.type === "ValidationError"
  );
}
