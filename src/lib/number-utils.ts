/**
 * Parse string to integer with fallback to default value if NaN
 * @param value - String value to parse
 * @param defaultValue - Fallback value if parsing fails (default: 0)
 * @returns Parsed integer or default value
 */
export function parseIntOrDefault(value: string, defaultValue: number = 0): number {
  const parsed = parseInt(value)
  return isNaN(parsed) ? defaultValue : parsed
}

/**
 * Parse string to integer or undefined if NaN
 * @param value - String value to parse
 * @returns Parsed integer or undefined
 */
export function parseIntOrUndefined(value: string): number | undefined {
  const parsed = parseInt(value)
  return isNaN(parsed) ? undefined : parsed
}
