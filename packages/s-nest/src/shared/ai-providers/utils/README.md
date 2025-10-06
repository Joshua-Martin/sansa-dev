# AI Provider Utilities

This directory contains utility functions extracted from the unified LLM service to provide clean, modular conversion functions for each AI provider.

## Structure

### `common.utils.ts`

Contains shared types and utility functions used across all AI providers:

- `JsonValue`, `JsonObject`, `JsonArray` - JSON type definitions
- `UnifiedTool`, `UnifiedMessage`, `UnifiedToolCall` - Unified format types
- `UnifiedLLMResponse`, `UnifiedStreamChunk` - Response format types
- Helper functions for JSON validation and parsing

### `openai.utils.ts`

OpenAI-specific conversion utilities:

- `convertUnifiedToolsToResponseTools()` - Converts unified tools to OpenAI Responses API format
- `convertToolChoiceToOpenAI()` - Converts unified tool choice to OpenAI format
- `createOpenAIResponseRequest()` - Creates OpenAI request from unified request
- `parseOpenAIResponseApiResponse()` - Parses OpenAI response to unified format
- `processOpenAIStream()` - Processes OpenAI streaming responses

### `anthropic.utils.ts`

Anthropic-specific conversion utilities:

- `convertToolsToAnthropic()` - Converts unified tools to Anthropic format
- `convertToolChoiceToAnthropic()` - Converts unified tool choice to Anthropic format
- `convertMessagesToAnthropic()` - Converts unified messages to Anthropic format
- `createAnthropicCompletionRequest()` - Creates Anthropic request from unified request
- `parseAnthropicResponse()` - Parses Anthropic response to unified format
- `processAnthropicStream()` - Processes Anthropic streaming responses

### `vertex-ai.utils.ts`

Vertex AI-specific conversion utilities:

- `convertJsonValueToSchema()` - Converts JSON schema to Vertex AI Schema format
- `convertToolsToVertexAI()` - Converts unified tools to Vertex AI format
- `convertToolChoiceToVertexAI()` - Converts unified tool choice to Vertex AI format
- `convertMessagesToVertexAI()` - Converts unified messages to Vertex AI format
- `createVertexAICompletionRequest()` - Creates Vertex AI request from unified request
- `parseVertexAIResponse()` - Parses Vertex AI response to unified format
- `processVertexAIStream()` - Processes Vertex AI streaming responses

### `index.ts`

Exports all utility functions and types for easy importing.

## Usage

### Basic Import

```typescript
import {
  UnifiedTool,
  UnifiedLLMResponse,
  convertToolsToAnthropic,
  parseOpenAIResponseApiResponse,
  processVertexAIStream,
} from '../utils';
```

### Provider-specific Imports

```typescript
// OpenAI utilities
import {
  OpenAIUnifiedRequest,
  createOpenAIResponseRequest,
  processOpenAIStream,
} from '../utils/openai.utils';

// Anthropic utilities
import {
  AnthropicUnifiedRequest,
  parseAnthropicResponse,
  processAnthropicStream,
} from '../utils/anthropic.utils';

// Vertex AI utilities
import {
  VertexAIUnifiedRequest,
  convertJsonValueToSchema,
  processVertexAIStream,
} from '../utils/vertex-ai.utils';
```

## Benefits of This Refactor

1. **Separation of Concerns**: Each provider's conversion logic is isolated in its own file
2. **Reusability**: Utility functions can be imported and used independently
3. **Testability**: Individual functions can be unit tested more easily
4. **Maintainability**: Provider-specific changes only affect their respective utility files
5. **Type Safety**: Strong typing is maintained throughout all conversions
6. **Documentation**: Each function has clear JSDoc comments explaining its purpose

## Example Usage in Services

```typescript
import {
  createAnthropicCompletionRequest,
  parseAnthropicResponse,
} from '../utils';

class MyService {
  async processAnthropicRequest(request: AnthropicUnifiedRequest) {
    // Convert unified request to Anthropic format
    const anthropicRequest = createAnthropicCompletionRequest(request);

    // Call Anthropic service
    const response =
      await this.anthropicService.createChatCompletion(anthropicRequest);

    // Parse response back to unified format
    return parseAnthropicResponse(response);
  }
}
```

## Migration from Original Unified Service

The original `unified-llm.service.ts` contained all conversion logic inline. This refactor:

- Extracted ~800 lines of conversion logic into focused utility files
- Reduced the unified service to ~200 lines of orchestration logic
- Maintained 100% backward compatibility with existing interfaces
- Improved code organization and maintainability

The refactored service (`unified-llm-refactored.service.ts`) demonstrates how to use these utilities while keeping the same public API.
