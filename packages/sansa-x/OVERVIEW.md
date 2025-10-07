# Sansa SDK Architecture - Complete System Design

## Overview

The `@sansa/ai` package provides two distinct but complementary products:

1. **Sansa Router SDK** - Smart routing layer for existing codebases (brownfield)
2. **Sansa Universal API** - Unified LLM client for new projects (greenfield)

Both live in a single npm package with different entry points, sharing underlying infrastructure.

---

## Product 1: Sansa Router SDK (Brownfield)

### Purpose
Minimal-friction integration for existing codebases. Wraps existing Anthropic/OpenAI SDKs with intelligent routing.

### Target Users
- Companies with existing AI implementations
- Teams that can't justify large refactors
- Organizations that need gradual adoption

### Usage Example

```typescript
import { SansaClient } from '@sansa/ai';

const sansa = new SansaClient({
  sansaKey: 'sansa_xxx',
  providers: {
    anthropic: { apiKey: 'sk-ant-xxx' },
    openai: { apiKey: 'sk-xxx' }
  }
});

// Anthropic usage - identical structure to native SDK
await sansa.anthropic.messages.create({
  callType: 'cs-orchestrator-v1',  // <-- Only new requirement
  model: 'claude-opus-4',
  messages: [...],
  tools: [...],
  stream: true
});

// OpenAI usage - identical structure to native SDK
await sansa.openai.chat.completions.create({
  callType: 'abuse-detector-v2',  // <-- Only new requirement
  model: 'gpt-4',
  messages: [...],
  stream: true
});
```

### Migration Path

**Before (Anthropic):**
```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: 'sk-ant-xxx' });

await anthropic.messages.create({
  model: 'claude-opus-4',
  messages: [...]
});
```

**After (Sansa Router):**
```typescript
import { SansaClient } from '@sansa/ai';

const sansa = new SansaClient({
  sansaKey: 'sansa_xxx',
  providers: { anthropic: { apiKey: 'sk-ant-xxx' } }
});

await sansa.anthropic.messages.create({
  callType: 'default',  // <-- Add this
  model: 'claude-opus-4',
  messages: [...]
});
```

**Required Changes:**
1. Change import statement
2. Change client initialization
3. Add `callType` to each intercepted call
4. Update all call sites: `anthropic.messages.create` → `sansa.anthropic.messages.create`

### Convenience Factory Functions

For single-provider usage, optional factory functions reduce boilerplate:

```typescript
import { createAnthropicClient, createOpenAIClient } from '@sansa/ai';

const anthropic = createAnthropicClient({
  apiKey: 'sk-ant-xxx',
  sansaKey: 'sansa_xxx'
});

// Usage identical to SansaClient
await anthropic.messages.create({
  callType: 'cs-chat-v1',
  model: 'claude-opus-4',
  messages: [...]
});
```

---

## Product 2: Sansa Universal API (Greenfield)

### Purpose
Provider-agnostic interface for new projects. One API for all LLM providers.

### Target Users
- New projects starting from scratch
- Teams wanting provider flexibility
- Developers tired of learning multiple SDK patterns

### Usage Example

```typescript
import { UniversalClient } from '@sansa/ai';

const ai = new UniversalClient({
  sansaKey: 'sansa_xxx',  // Optional - enables routing
  providers: {
    anthropic: { apiKey: 'sk-ant-xxx' },
    openai: { apiKey: 'sk-xxx' }
  }
});

// Same interface for any provider
await ai.complete({
  provider: 'anthropic',
  callType: 'cs-agent-v1',  // Required if routing enabled
  model: 'claude-opus-4',
  messages: [
    { role: 'user', content: 'Hello!' }
  ],
  temperature: 0.7,
  maxTokens: 1000
});

// Switch providers with zero code changes
await ai.complete({
  provider: 'openai',
  callType: 'cs-agent-v1',
  model: 'gpt-4',
  messages: [
    { role: 'user', content: 'Hello!' }
  ],
  temperature: 0.7,
  maxTokens: 1000
});
```

### Without Routing (OSS Marketing Wedge)

```typescript
import { UniversalClient } from '@sansa/ai';

const ai = new UniversalClient({
  // No sansaKey - routing disabled
  providers: {
    anthropic: { apiKey: 'sk-ant-xxx' }
  }
});

// callType not required when routing disabled
await ai.complete({
  provider: 'anthropic',
  model: 'claude-opus-4',
  messages: [...]
});
```

**Value Proposition:**
- Free unified client (OSS)
- Easy upgrade path to routing (just add `sansaKey`)
- Natural funnel: developer adoption → customer conversion

### Streaming Support

```typescript
const stream = await ai.stream({
  provider: 'anthropic',
  callType: 'cs-chat-v1',
  model: 'claude-opus-4',
  messages: [...]
});

for await (const chunk of stream) {
  console.log(chunk.content);
}
```

### Tool Calling Support

```typescript
await ai.complete({
  provider: 'anthropic',
  callType: 'cs-agent-v1',
  model: 'claude-opus-4',
  messages: [...],
  tools: [
    {
      name: 'get_weather',
      description: 'Get weather for a location',
      parameters: {
        type: 'object',
        properties: {
          location: { type: 'string' }
        }
      }
    }
  ]
});
```

**Note:** Universal API translates tool formats between providers automatically.

---

## Architecture: How Both Products Work

### Package Structure

```
@sansa/ai
├── src/
│   ├── router/                    # Sansa Router SDK
│   │   ├── sansa-client.ts        # Main SansaClient class
│   │   ├── anthropic/
│   │   │   ├── sansa-anthropic-client.ts
│   │   │   ├── sansa-messages.ts  # Interception layer
│   │   │   └── types.ts
│   │   ├── openai/
│   │   │   ├── sansa-openai-client.ts
│   │   │   ├── sansa-chat-completions.ts
│   │   │   └── types.ts
│   │   └── core/
│   │       └── sansa-router.ts    # Routing decision engine
│   │
│   ├── universal/                 # Universal API
│   │   ├── universal-client.ts
│   │   ├── adapters/
│   │   │   ├── anthropic-adapter.ts
│   │   │   └── openai-adapter.ts
│   │   └── types.ts
│   │
│   └── shared/
│       ├── types.ts               # Shared types
│       └── utils.ts
│
├── index.ts                       # Main exports
└── package.json
```

### Main Exports

```typescript
// @sansa/ai/index.ts

// Router SDK exports
export { SansaClient } from './router/sansa-client';
export { createAnthropicClient, createOpenAIClient } from './router/factories';

// Universal API exports
export { UniversalClient } from './universal/universal-client';

// Types
export type { 
  SansaConfig,
  SansaMessageCreateParams,
  SansaChatCompletionParams,
  UniversalCompleteParams
} from './shared/types';
```

---

## Implementation Details

### 1. Sansa Router Core

```typescript
// src/router/core/sansa-router.ts

export class SansaRouter {
  private apiKey: string;
  private endpoint: string;
  private cache: Map<string, RoutingDecision>;

  constructor(config: SansaRouterConfig) {
    this.apiKey = config.apiKey;
    this.endpoint = config.endpoint || 'https://api.sansa.ai';
    this.cache = new Map();
  }

  async decide(
    callType: string, 
    params: RoutingParams
  ): Promise<RoutingDecision> {
    try {
      const response = await fetch(`${this.endpoint}/v1/route`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          callType,
          model: params.model,
          messageCount: params.messages?.length,
          hasTools: !!params.tools,
          timestamp: Date.now()
        })
      });

      const decision = await response.json();
      
      return {
        shouldRoute: decision.route,
        targetModel: decision.target_model,
        confidence: decision.confidence
      };
    } catch (error) {
      // Graceful degradation - use baseline on error
      console.error('Sansa routing failed:', error);
      return {
        shouldRoute: false,
        targetModel: params.model,
        confidence: 0
      };
    }
  }
}
```

### 2. Anthropic Interception Layer

```typescript
// src/router/anthropic/sansa-anthropic-client.ts

import Anthropic from '@anthropic-ai/sdk';
import { SansaRouter } from '../core/sansa-router';
import { SansaMessages } from './sansa-messages';

export class SansaAnthropicClient {
  private _anthropic: Anthropic;
  private _router: SansaRouter;
  
  public readonly messages: SansaMessages;

  constructor(config: SansaAnthropicConfig) {
    this._anthropic = new Anthropic({ 
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      defaultHeaders: config.defaultHeaders
    });
    
    this._router = new SansaRouter({
      apiKey: config.sansaKey,
      endpoint: config.sansaEndpoint
    });
    
    this.messages = new SansaMessages(this._anthropic, this._router);
  }

  // Pass through non-intercepted resources
  get batches() {
    return this._anthropic.batches;
  }
}
```

```typescript
// src/router/anthropic/sansa-messages.ts

export class SansaMessages {
  constructor(
    private anthropic: Anthropic,
    private router: SansaRouter
  ) {}

  async create(
    params: SansaMessageCreateParams
  ): Promise<Anthropic.Message> {
    const { callType, ...anthropicParams } = params;
    
    const decision = await this.router.decide(callType, {
      model: params.model,
      messages: params.messages,
      tools: params.tools
    });
    
    if (decision.shouldRoute) {
      anthropicParams.model = decision.targetModel;
    }
    
    return this.anthropic.messages.create(anthropicParams);
  }

  stream(
    params: SansaMessageStreamParams
  ): Anthropic.MessageStream {
    const { callType, ...anthropicParams } = params;
    
    // Streaming routing needs to be synchronous or use cached decision
    // For MVP: Could require pre-warming or use last known decision
    const cachedDecision = this.router.getCached(callType);
    
    if (cachedDecision?.shouldRoute) {
      anthropicParams.model = cachedDecision.targetModel;
    }
    
    return this.anthropic.messages.stream(anthropicParams);
  }
}
```

### 3. OpenAI Interception Layer

```typescript
// src/router/openai/sansa-openai-client.ts

import OpenAI from 'openai';
import { SansaRouter } from '../core/sansa-router';
import { SansaChatCompletions } from './sansa-chat-completions';

export class SansaOpenAIClient {
  private _openai: OpenAI;
  private _router: SansaRouter;
  
  public readonly chat: {
    completions: SansaChatCompletions;
  };

  constructor(config: SansaOpenAIConfig) {
    this._openai = new OpenAI({ 
      apiKey: config.apiKey 
    });
    
    this._router = new SansaRouter({
      apiKey: config.sansaKey,
      endpoint: config.sansaEndpoint
    });
    
    this.chat = {
      completions: new SansaChatCompletions(this._openai, this._router)
    };
  }

  // Pass through
  get embeddings() {
    return this._openai.embeddings;
  }
  
  get batches() {
    return this._openai.batches;
  }
}
```

```typescript
// src/router/openai/sansa-chat-completions.ts

export class SansaChatCompletions {
  constructor(
    private openai: OpenAI,
    private router: SansaRouter
  ) {}

  async create(
    params: SansaChatCompletionParams
  ): Promise<OpenAI.ChatCompletion> {
    const { callType, ...openaiParams } = params;
    
    const decision = await this.router.decide(callType, {
      model: params.model,
      messages: params.messages,
      tools: params.tools
    });
    
    if (decision.shouldRoute) {
      openaiParams.model = decision.targetModel;
    }
    
    return this.openai.chat.completions.create(openaiParams);
  }
}
```

### 4. Main SansaClient

```typescript
// src/router/sansa-client.ts

export class SansaClient {
  public readonly anthropic?: SansaAnthropicClient;
  public readonly openai?: SansaOpenAIClient;

  constructor(config: SansaConfig) {
    if (config.providers.anthropic) {
      this.anthropic = new SansaAnthropicClient({
        apiKey: config.providers.anthropic.apiKey,
        sansaKey: config.sansaKey,
        sansaEndpoint: config.endpoint
      });
    }

    if (config.providers.openai) {
      this.openai = new SansaOpenAIClient({
        apiKey: config.providers.openai.apiKey,
        sansaKey: config.sansaKey,
        sansaEndpoint: config.endpoint
      });
    }
  }
}
```

### 5. Universal Client

```typescript
// src/universal/universal-client.ts

export class UniversalClient {
  private providers: Map<string, any>;
  private adapters: Map<string, BaseAdapter>;
  private router?: SansaRouter;

  constructor(config: UniversalClientConfig) {
    this.providers = new Map();
    this.adapters = new Map();
    
    if (config.sansaKey) {
      this.router = new SansaRouter({
        apiKey: config.sansaKey,
        endpoint: config.endpoint
      });
    }

    if (config.providers.anthropic) {
      const anthropic = new Anthropic({ 
        apiKey: config.providers.anthropic.apiKey 
      });
      this.providers.set('anthropic', anthropic);
      this.adapters.set('anthropic', new AnthropicAdapter(anthropic));
    }

    if (config.providers.openai) {
      const openai = new OpenAI({ 
        apiKey: config.providers.openai.apiKey 
      });
      this.providers.set('openai', openai);
      this.adapters.set('openai', new OpenAIAdapter(openai));
    }
  }

  async complete(params: UniversalCompleteParams): Promise<UniversalResponse> {
    const adapter = this.adapters.get(params.provider);
    if (!adapter) {
      throw new Error(`Provider ${params.provider} not configured`);
    }

    // Route if enabled and callType provided
    let targetModel = params.model;
    if (this.router && params.callType) {
      const decision = await this.router.decide(params.callType, params);
      if (decision.shouldRoute) {
        targetModel = decision.targetModel;
      }
    }

    // Translate universal format to provider-specific format
    const providerParams = adapter.translateParams({
      ...params,
      model: targetModel
    });

    // Call provider
    const response = await adapter.complete(providerParams);

    // Translate response back to universal format
    return adapter.translateResponse(response);
  }

  async stream(params: UniversalCompleteParams): Promise<AsyncIterable<UniversalStreamChunk>> {
    const adapter = this.adapters.get(params.provider);
    if (!adapter) {
      throw new Error(`Provider ${params.provider} not configured`);
    }

    // Routing logic...
    let targetModel = params.model;
    if (this.router && params.callType) {
      const decision = await this.router.decide(params.callType, params);
      if (decision.shouldRoute) {
        targetModel = decision.targetModel;
      }
    }

    const providerParams = adapter.translateParams({
      ...params,
      model: targetModel
    });

    return adapter.stream(providerParams);
  }
}
```

### 6. Provider Adapters

```typescript
// src/universal/adapters/anthropic-adapter.ts

export class AnthropicAdapter implements BaseAdapter {
  constructor(private client: Anthropic) {}

  translateParams(universal: UniversalCompleteParams): Anthropic.MessageCreateParams {
    return {
      model: universal.model,
      messages: universal.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      max_tokens: universal.maxTokens || 1024,
      temperature: universal.temperature,
      tools: universal.tools ? this.translateTools(universal.tools) : undefined
    };
  }

  async complete(params: Anthropic.MessageCreateParams): Promise<Anthropic.Message> {
    return this.client.messages.create(params);
  }

  translateResponse(response: Anthropic.Message): UniversalResponse {
    return {
      id: response.id,
      content: response.content[0].type === 'text' 
        ? response.content[0].text 
        : '',
      model: response.model,
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens
      }
    };
  }

  private translateTools(tools: UniversalTool[]): Anthropic.Tool[] {
    return tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.parameters
    }));
  }
}
```

---

## Types

```typescript
// src/shared/types.ts

export interface SansaConfig {
  sansaKey: string;
  endpoint?: string;
  providers: {
    anthropic?: {
      apiKey: string;
      baseURL?: string;
    };
    openai?: {
      apiKey: string;
      baseURL?: string;
    };
  };
}

export interface SansaMessageCreateParams extends Anthropic.MessageCreateParamsNonStreaming {
  callType: string;
}

export interface SansaMessageStreamParams extends Anthropic.MessageCreateParamsStreaming {
  callType: string;
}

export interface SansaChatCompletionParams extends OpenAI.ChatCompletionCreateParamsNonStreaming {
  callType: string;
}

export interface UniversalClientConfig {
  sansaKey?: string;  // Optional - enables routing
  endpoint?: string;
  providers: {
    anthropic?: {
      apiKey: string;
    };
    openai?: {
      apiKey: string;
    };
  };
}

export interface UniversalCompleteParams {
  provider: 'anthropic' | 'openai';
  callType?: string;  // Required only if routing enabled
  model: string;
  messages: UniversalMessage[];
  temperature?: number;
  maxTokens?: number;
  tools?: UniversalTool[];
}

export interface UniversalMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface UniversalTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export interface UniversalResponse {
  id: string;
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface RoutingDecision {
  shouldRoute: boolean;
  targetModel: string;
  confidence: number;
}
```

---

## Intercepted Methods Reference

### Anthropic SDK

| Method | Intercept? | Reason |
|--------|-----------|---------|
| `messages.create()` | ✅ Yes | Single prompt to LLM |
| `messages.stream()` | ✅ Yes | Single prompt, streaming |
| `messages.count_tokens()` | ❌ No | Just counting, no LLM call |
| `batches.*` | ❌ No | Batch operations handled separately |

### OpenAI SDK

| Method | Intercept? | Reason |
|--------|-----------|---------|
| `chat.completions.create()` | ✅ Yes | Single prompt to LLM |
| `completions.create()` | ✅ Yes | Legacy completion API |
| `embeddings.create()` | ❌ No | Not a chat completion |
| `batches.*` | ❌ No | Batch operations handled separately |

---

## Routing Strategy

### Within-Provider Routing (Phase 1)

**Anthropic:**
- Expensive: `claude-opus-4`
- Cheap: `claude-sonnet-4.5`, `claude-haiku-4`

**OpenAI:**
- Expensive: `gpt-4`, `gpt-4-turbo`
- Cheap: `gpt-4o-mini`, `gpt-3.5-turbo`

**Benefits:**
- ✅ Zero translation required
- ✅ All features supported (streaming, tools, vision)
- ✅ Same response format
- ✅ Still achieve 5-20x cost savings

### Cross-Provider Routing (Phase 2 - Future)

Route between providers for maximum savings:
- Anthropic Opus → OpenAI GPT-4-mini
- OpenAI GPT-4 → Anthropic Haiku

**Challenges:**
- Requires format translation
- Feature parity issues
- More complex error handling

**Implementation:** Only in Universal API where we control the interface.

---

## Latency Considerations

### Routing Decision Overhead

Each intercepted call adds one HTTP request to Sansa API:

```
User call → Sansa routing decision (~50-100ms) → LLM API call
```

### Mitigation Strategies

1. **Faster models offset latency**
   - Claude Haiku TTFT < Claude Opus TTFT
   - Net latency neutral or positive

2. **Caching** (future optimization)
   - Cache routing decisions by callType
   - Periodic refresh (every N minutes)
   - Reduces to near-zero overhead

3. **Parallel routing** (advanced)
   - Start LLM call while routing decision pending
   - Cancel if routed to different model
   - Complex but eliminates perceived latency

### Failure Modes

**If Sansa API is unreachable:**
```typescript
try {
  const decision = await this.router.decide(callType, params);
  // Use routing decision
} catch (error) {
  console.error('Sansa routing failed, using baseline model');
  // Fall through to baseline model (no routing)
}
```

**Result:** Non-blocking degradation. Calls succeed without routing.

---

## Testing Strategy

### Unit Tests

```typescript
describe('SansaMessages', () => {
  it('routes to cheaper model when decision says so', async () => {
    const mockRouter = {
      decide: jest.fn().mockResolvedValue({
        shouldRoute: true,
        targetModel: 'claude-sonnet-4.5',
        confidence: 0.95
      })
    };
    
    const mockAnthropic = {
      messages: {
        create: jest.fn().mockResolvedValue({ id: 'msg_123' })
      }
    };
    
    const sansaMessages = new SansaMessages(mockAnthropic, mockRouter);
    
    await sansaMessages.create({
      callType: 'test',
      model: 'claude-opus-4',
      messages: [{ role: 'user', content: 'Hello' }]
    });
    
    expect(mockAnthropic.messages.create).toHaveBeenCalledWith({
      model: 'claude-sonnet-4.5',  // Routed model
      messages: [{ role: 'user', content: 'Hello' }]
    });
  });
  
  it('falls back to baseline on router error', async () => {
    const mockRouter = {
      decide: jest.fn().mockRejectedValue(new Error('API down'))
    };
    
    const mockAnthropic = {
      messages: {
        create: jest.fn().mockResolvedValue({ id: 'msg_123' })
      }
    };
    
    const sansaMessages = new SansaMessages(mockAnthropic, mockRouter);
    
    await sansaMessages.create({
      callType: 'test',
      model: 'claude-opus-4',
      messages: [{ role: 'user', content: 'Hello' }]
    });
    
    // Should use original model when routing fails
    expect(mockAnthropic.messages.create).toHaveBeenCalledWith({
      model: 'claude-opus-4',
      messages: [{ role: 'user', content: 'Hello' }]
    });
  });
});
```

### Integration Tests

Test against real Anthropic/OpenAI APIs with Sansa sandbox environment.

---

## Documentation & Developer Experience

### Quick Start (Router SDK)

```typescript
// 1. Install
npm install @sansa/ai

// 2. Replace your client initialization
const sansa = new SansaClient({
  sansaKey: process.env.SANSA_API_KEY,
  providers: {
    anthropic: { apiKey: process.env.ANTHROPIC_API_KEY }
  }
});

// 3. Add callType to your calls
await sansa.anthropic.messages.create({
  callType: 'my-use-case',  // <-- Add this
  model: 'claude-opus-4',
  messages: [...]
});
```

### Quick Start (Universal API)

```typescript
// 1. Install
npm install @sansa/ai

// 2. Create client (routing optional)
const ai = new UniversalClient({
  providers: {
    anthropic: { apiKey: process.env.ANTHROPIC_API_KEY },
    openai: { apiKey: process.env.OPENAI_API_KEY }
  }
});

// 3. Use unified interface
await ai.complete({
  provider: 'anthropic',
  model: 'claude-opus-4',
  messages: [{ role: 'user', content: 'Hello!' }]
});
```

### TypeScript Support

Full type inference and autocomplete:

```typescript
// TypeScript knows callType is required
await sansa.