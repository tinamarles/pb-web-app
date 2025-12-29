// +++ Utility functions +++

// Function to convert the snake_case coming from the Django API
// into camelCase BACKEND -> FRONTEND

export function snakeToCamel(obj: unknown): unknown {
  if (typeof obj !== 'object' || obj === null) {
    // Handle non-object types or null safely
    return obj;
  }

  if (Array.isArray(obj)) {
    // If it's an array, recursively convert its elements
    return obj.map(item => snakeToCamel(item));
  }

  // If it's an object, iterate over its keys and convert them
  const newObj: Record<string, unknown> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      newObj[camelKey] = snakeToCamel((obj as Record<string, unknown>)[key]);
    }
  }
  return newObj;
}
// Function to convert the camelCase coming from the frontend
// into snake_case for the django Backend: FRONTEND -> BACKEND
export function camelToSnake(obj: unknown): unknown {
  if (typeof obj !== 'object' || obj === null) {
    // Handle non-object types or null safely
    return obj;
  }

  if (Array.isArray(obj)) {
    // If it's an array, recursively convert its elements
    return obj.map(item => camelToSnake(item));
  }

  // If it's an object, iterate over its keys and convert them
  const newObj: Record<string, unknown> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      // Convert camelCase to snake_case
      const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
      newObj[snakeKey] = camelToSnake((obj as Record<string, unknown>)[key]);
    }
  }
  return newObj;
}

export function formatBackendErrors(errorData: Record<string, string | string[]>): string {
  // Use Object.values() to get all the values from the error object.
  // The type of `messages` can now be a string or a string array.
  
  const allErrors = Object.values(errorData).flatMap(messages => {
    // If it's a string, wrap it in an array to make it iterable.
    if (typeof messages === 'string') {
      return [messages];
    }
    // If it's an array, return it as-is.
    return messages;
  });

  if (allErrors.length > 0) {
    // This will join the errors with a newline character.
    return allErrors.join('\n');
  }

  return 'Error formatting - An unexpected error occurred.';
}


