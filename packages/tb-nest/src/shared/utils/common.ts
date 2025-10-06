/**
 * Check if a value is null or undefined
 *
 * @param value - The value to check
 * @returns True if the value is null or undefined, false otherwise
 */
export function isNil(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * Safely converts a value to a string
 *
 * @param value - The value to convert
 * @returns The string representation of the value
 */
export function safeStringify(value: unknown): string {
  try {
    if (typeof value === 'string') {
      return value;
    }
    return JSON.stringify(value, null, 2);
  } catch (error) {
    return String(value);
  }
}

/**
 * Safely parses a JSON string
 *
 * @param value - The string to parse
 * @param defaultValue - The default value to return if parsing fails
 * @returns The parsed JSON or the default value
 */
export function safeJsonParse<T>(value: string, defaultValue: T): T {
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    return defaultValue;
  }
}

/**
 * Generates a random ID
 *
 * @param prefix - Optional prefix for the ID
 * @returns A random ID
 */
export function generateId(prefix = ''): string {
  return `${prefix}${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Sleep for a specified duration
 *
 * @param ms - The number of milliseconds to sleep
 * @returns A promise that resolves after the specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Extracts the first non-free (workspace) email domain from a list of email addresses.
 *
 * Free email providers (e.g., gmail.com, outlook.com, yahoo.com, etc.) are excluded.
 * If no non-free domain is found, returns undefined.
 *
 * @param {string[]} emails - Array of email addresses to check
 * @returns {string | undefined} The first non-free domain found, or undefined if none
 *
 * @example
 * extractWorkspaceEmailDomain(['john@gmail.com', 'jane@acme.com']) // 'acme.com'
 * extractWorkspaceEmailDomain(['foo@yahoo.com', 'bar@gmail.com']) // undefined
 */
export function extractWorkspaceEmailDomain(
  emails: string[],
): string | undefined {
  // List of common free email domains
  const freeDomains = new Set([
    'gmail.com',
    'yahoo.com',
    'outlook.com',
    'hotmail.com',
    'aol.com',
    'icloud.com',
    'mail.com',
    'zoho.com',
    'protonmail.com',
    'gmx.com',
    'yandex.com',
    'msn.com',
    'live.com',
    'me.com',
    'comcast.net',
    'rediffmail.com',
    'rocketmail.com',
    'ymail.com',
    'inbox.com',
    'fastmail.com',
    'hushmail.com',
    'mail.ru',
    'qq.com',
    'naver.com',
    '163.com',
    '126.com',
    'sina.com',
    'yeah.net',
    'googlemail.com',
  ]);

  for (const email of emails) {
    const atIdx = email.lastIndexOf('@');
    if (atIdx === -1 || atIdx === email.length - 1) continue; // Invalid email
    const domain = email.slice(atIdx + 1).toLowerCase();
    if (!freeDomains.has(domain)) {
      return domain;
    }
  }
  return undefined;
}
