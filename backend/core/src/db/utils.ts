/**
 * Utility functions for database operations
 */

/**
 * Generates a UUID v4
 * @returns A UUID v4 string
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Parse a JSON string safely
 * @param jsonString The JSON string to parse
 * @param defaultValue Default value to return if parsing fails
 * @returns Parsed JSON object or default value
 */
export function safeParseJSON<T>(
  jsonString: string | null | undefined,
  defaultValue: T
): T {
  if (!jsonString) return defaultValue;

  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return defaultValue;
  }
}

/**
 * Safely stringify a value to JSON
 * @param value The value to stringify
 * @returns JSON string or empty string on error
 */
export function safeStringifyJSON<T>(value: T): string {
  try {
    return JSON.stringify(value);
  } catch (error) {
    console.error("Error stringifying to JSON:", error);
    return "";
  }
}
