/**
 * Configuration utility for AI Engine
 */
export const config = {
  /**
   * Gets the value of an environment variable.
   * @param key - Environment variable key
   * @param defaultValue - Optional default value if not found
   * @returns The value or undefined if not found and no default provided
   */
  get<T = string>(key: string, defaultValue?: T): T | undefined {
    const value = process.env[key];
    if (value === undefined) {
      return defaultValue;
    }
    try {
      // Handle boolean values
      if (value.toLowerCase() === 'true') return true as unknown as T;
      if (value.toLowerCase() === 'false') return false as unknown as T;

      // Handle number values
      if (!isNaN(Number(value)) && value.trim() !== '') {
        return Number(value) as unknown as T;
      }
      return value as unknown as T;
    } catch (e) {
      return value as unknown as T;
    }
  },

  /**
   * Gets the required value of an environment variable.
   * @param key - Environment variable key
   * @returns The value
   * @throws Error if the environment variable is not defined
   */
  getRequired<T = string>(key: string): T {
    const value = this.get<T>(key);
    if (value === undefined) {
      throw new Error(`Required environment variable ${key} is not defined`);
    }
    return value;
  },

  /**
   * Gets the value of an environment variable or returns the default value.
   * @param key - Environment variable key
   * @param defaultValue - Default value to use if not found
   * @returns The value or the default value
   */
  getOrDefault<T>(key: string, defaultValue: T): T {
    const value = this.get<T>(key);
    return value !== undefined ? value : defaultValue;
  },
};
