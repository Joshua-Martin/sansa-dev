# Sansa-X

A framework-agnostic TypeScript package for monitoring and tracking LLM API calls. Sansa-X allows you to instrument your LLM integrations to send pre-request and post-response data to the Sansa monitoring service.

## Installation

```bash
pnpm add @workspace/sansa-x
```

## Usage

### Basic Setup

```typescript
import { SansaXClient, generateCallId, getTimestamp } from '@workspace/sansa-x';

// Initialize the client with your API key
const client = new SansaXClient({
  apiKey: 'your-api-key-here',
  baseUrl: 'https://api.sansa.example.com', // optional
  timeout: 5000, // optional, default 5000ms
  debug: false, // optional, default false
});
```

### Tracking LLM Calls

```typescript
// Generate a unique ID for this call
const callId = generateCallId();

// Before making the LLM API call
await client.sendPreRequest({
  id: callId,
  name: 'chat-completion',
  prompt: 'What is the capital of France?',
  systemPrompt: 'You are a helpful assistant.',
  promptVersion: 'v1.0',
  model: 'gpt-4',
  provider: 'openai',
  timestamp: getTimestamp(),
});

// Make your actual LLM API call here
const startTime = Date.now();
const response = await yourLLMApiCall();
const duration = Date.now() - startTime;

// After receiving the response
await client.sendPostResponse({
  id: callId, // Same ID to correlate
  name: 'chat-completion',
  model: 'gpt-4',
  provider: 'openai',
  inputTokenCount: response.usage.prompt_tokens,
  outputTokenCount: response.usage.completion_tokens,
  response: response.choices[0].message.content,
  timestamp: getTimestamp(),
  durationMs: duration,
});
```

### Error Handling

```typescript
try {
  // Your LLM API call
} catch (error) {
  await client.sendPostResponse({
    id: callId,
    name: 'chat-completion',
    model: 'gpt-4',
    provider: 'openai',
    inputTokenCount: 0,
    outputTokenCount: 0,
    timestamp: getTimestamp(),
    error: {
      message: error.message,
      code: error.code,
    },
  });
}
```

## Types

All types are exported from the package:

- `LLMProvider`: Supported providers ('openai' | 'anthropic' | 'custom')
- `LLMApiCallData`: Core data structure for LLM calls
- `PreRequestPayload`: Data sent before the API call
- `PostResponsePayload`: Data sent after the API call
- `SansaXConfig`: Client configuration options

## Features

- 🚀 Framework-agnostic - works with any Node.js application
- 🔒 Secure - API key authentication
- 📊 Complete tracking - pre and post request data
- 🔗 Correlation - unique IDs to match requests and responses
- 🛡️ Non-blocking - errors don't disrupt your application
- 📝 TypeScript - fully typed for better DX

## License

MIT
