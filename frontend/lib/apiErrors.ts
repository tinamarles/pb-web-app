/**
 * API Error handling utilities
 *
 * Usage:
 * try {
 *   await get('endpoint');
 * } catch (error) {
 *   if (isApiError(error)) {
 *     console.log(error.status);  // 403
 *     console.log(error.message); // "Not Authorized"
 *     console.log(error.detail);  // "You do not have admin permissions..."
 *   }
 * }
 */

/**
 * API Error type definition
 */
export type ApiError = {
  readonly type: "ApiError";
  readonly status: number;
  readonly message: string;
  readonly detail: string;
  readonly endpoint: string;
};

/**
 * Get user-friendly message for HTTP status code
 */
function getDefaultMessage(status: number): string {
  switch (status) {
    case 400:
      return "Bad Request";
    case 401:
      return "Authentication Required";
    case 403:
      return "Not Authorized";
    case 404:
      return "Not Found";
    case 500:
      return "Server Error";
    default:
      return `HTTP Error ${status}`;
  }
}

/**
 * Create an API error object
 *
 * @param status - HTTP status code
 * @param detail - Detailed error message from backend
 * @param endpoint - API endpoint that failed
 * @param message - Optional custom message (defaults to status-based message)
 * @returns ApiError object
 */
export function createApiError(
  status: number,
  detail: string,
  endpoint: string,
  message?: string,
): ApiError {
  return {
    type: "ApiError",
    status,
    message: message || getDefaultMessage(status),
    detail,
    endpoint,
  };
}

/**
 * Type guard to check if error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    error.type === "ApiError"
  );
}

/**
 * Check if error is a specific status code
 */
export function isStatus(error: ApiError, status: number): boolean {
  return error.status === status;
}

/**
 * Check if error is a client error (4xx)
 */
export function isClientError(error: ApiError): boolean {
  return error.status >= 400 && error.status < 500;
}

/**
 * Check if error is a server error (5xx)
 */
export function isServerError(error: ApiError): boolean {
  return error.status >= 500 && error.status < 600;
}
