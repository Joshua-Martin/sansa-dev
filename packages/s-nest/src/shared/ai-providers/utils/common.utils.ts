/**
 * Common utilities and functions shared across all AI providers
 */

// Import unified types from the types directory
export {
  type JsonValue,
  type JsonObject,
  type JsonArray,
  type LLMProvider,
  type UnifiedTool,
  type UnifiedMessage,
  type UnifiedToolCall,
  type UnifiedLLMResponse,
  type UnifiedStreamChunk,
  type UnifiedToolChoice,
  type OpenAIUnifiedRequest,
  type AnthropicUnifiedRequest,
  type UnifiedLLMRequest,
} from '../types/unified.types';

/**
 * Common utility functions
 */

/**
 * Checks if a value is a valid JSON object
 *
 * @param {unknown} value - The value to check
 * @returns {boolean} True if the value is a valid JSON object
 */
export function isJsonObject(
  value: unknown,
): value is import('../types/unified.types').JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Checks if a value is a valid JSON array
 *
 * @param {unknown} value - The value to check
 * @returns {boolean} True if the value is a valid JSON array
 */
export function isJsonArray(
  value: unknown,
): value is import('../types/unified.types').JsonArray {
  return Array.isArray(value);
}

/**
 * Safely parses a JSON string, returning the original value if parsing fails
 *
 * @param {string} value - The string to parse
 * @returns {JsonValue} The parsed JSON value or the original string
 */
export function safeJsonParse(
  value: string,
): import('../types/unified.types').JsonValue {
  try {
    if (value.trim().startsWith('{') || value.trim().startsWith('[')) {
      return JSON.parse(value) as import('../types/unified.types').JsonValue;
    }
    return value;
  } catch {
    return value;
  }
}

/**
 * Validates that a tool has the required structure
 *
 * @param {UnifiedTool} tool - The tool to validate
 * @returns {boolean} True if the tool is valid
 */
export function isValidUnifiedTool(
  tool: import('../types/unified.types').UnifiedTool,
): boolean {
  return (
    tool.type === 'function' &&
    typeof tool.function?.name === 'string' &&
    typeof tool.function?.description === 'string' &&
    isJsonObject(tool.function?.parameters?.properties)
  );
}
