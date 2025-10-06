# Token Tracking Implementation Summary

## Overview

This implementation replaces approximate token counting with **actual token counts from AI provider APIs**, enabling accurate usage tracking and cost calculation.

## What Changed

### 1. AI Provider Layer (`packages/nest/src/tb-shared/ai-providers/`)

#### Types Updated
- **`unified.types.ts`**: Added `UnifiedUsage` type with `inputTokens` and `outputTokens` fields
- **`openai.types.ts`**: Added `ResponseUsage` type for OpenAI usage data
- Both `UnifiedLLMResponse` and `UnifiedStreamChunk` now include optional `usage` field

#### Utility Functions Updated
- **`anthropic.utils.ts`**:
  - `parseAnthropicResponse()`: Extracts usage from `response.usage`
  - `processAnthropicStream()`: Captures usage from `message_start` and `message_delta` events

- **`openai.utils.ts`**:
  - `parseOpenAIResponseApiResponse()`: Extracts usage from response
  - `processOpenAIStream()`: Passes through usage in final chunk

#### Base Services Updated
- **`base-openai.service.ts`**: Extracts usage from OpenAI Response API in both streaming and non-streaming responses
- **`base-anthropic.service.ts`**: No changes needed (already returns usage in Message type)

### 2. Database Layer (`packages/nest/src/tb-shared/database/`)

#### Entity Changes (`llm-message.entity.ts`)
**Removed:**
- `tokenCount: number` (single column)
- `tokenCost: number` (single column)

**Added:**
- `tokenCountInput: number` (input tokens)
- `tokenCountOutput: number` (output tokens)
- `tokenCostInput: number` (input token cost)
- `tokenCostOutput: number` (output token cost)

All new columns map to snake_case in database: `token_count_input`, `token_count_output`, etc.

### 3. Shared Types (`packages/tb-shared/src/chat-agent/`)

#### Updated Types (`message.types.ts`)
- `LLMMessage`: Now has separate `tokenCountInput` and `tokenCountOutput` fields
- `CreateLLMMessageRequest`: Updated with separate input/output fields
- `UpdateLLMMessageRequest`: Updated with separate input/output fields

### 4. Chat Agent Service (`packages/nest/src/modules/chat-agent/`)

#### Service Changes (`chat-agent.service.ts`)
- **`processChatMessage()`**: User messages now use separate input/output token fields
- **`createPendingAssistantMessage()`**: Initializes all token fields to 0
- **`completeAssistantMessage()`**: Now accepts optional `inputTokens` and `outputTokens` parameters from provider API
- **`createUserMessage()`**: Updated to use separate input/output parameters
- **`createFinalAssistantMessage()`**: Updated to accept and use actual token counts

#### Gateway Changes (`chat-agent.gateway.ts`)
- **`streamLLMResponse()`**: 
  - Captures `inputTokens` and `outputTokens` from stream chunks
  - Passes actual token counts to `completeAssistantMessage()`
  - Logs token counts in completion message

### 5. Frontend (`packages/frontend/src/components/custom/chat/`)

#### UI Changes (`chat-message.tsx`)
The assistant message stats panel now displays:
- **Input**: Input token count
- **Output**: Output token count
- **Total**: Sum of input + output tokens
- **Cost**: Accurately calculated total cost

### 6. Database Migration (`packages/nest/migrations/`)

#### Migration File: `001-add-separate-token-counts.sql`
1. Adds new columns: `token_count_input`, `token_count_output`, `token_cost_input`, `token_cost_output`
2. Migrates existing data:
   - User messages: All tokens → input
   - Assistant messages: All tokens → output
   - System messages: All tokens → input
3. Drops old columns: `tokenCount`, `tokenCost`
4. Sets NOT NULL constraints on new columns

#### Rollback: `ROLLBACK-001-add-separate-token-counts.sql`
Reverses the migration by:
1. Adding back old columns
2. Summing input + output tokens
3. Dropping new columns

## Token Count Sources

### OpenAI Response API
```typescript
response.usage = {
  input_tokens: 123,
  output_tokens: 456,
  total_tokens: 579
}
```
Captured in:
- Non-streaming: `response.usage`
- Streaming: `event.response.usage` in `response.completed` event

### Anthropic Messages API
```typescript
response.usage = {
  input_tokens: 123,
  output_tokens: 456
}
```
Captured in:
- Non-streaming: `response.usage`
- Streaming: `event.message.usage` in `message_start` and `event.usage` in `message_delta`

## Cost Calculation

Costs are now calculated using actual token counts and per-million pricing:

```typescript
const inputTokenCost = (actualInputTokens / 1_000_000) * modelData.inputTokenCostPerMillion;
const outputTokenCost = (actualOutputTokens / 1_000_000) * modelData.outputTokenCostPerMillion;
const messageCost = inputTokenCost + outputTokenCost;
```

### Example: GPT-4o-mini
- Input: $0.15 per million tokens
- Output: $0.60 per million tokens

For a message with 1,000 input tokens and 500 output tokens:
- Input cost: (1000 / 1,000,000) × $0.15 = $0.00015
- Output cost: (500 / 1,000,000) × $0.60 = $0.00030
- **Total**: $0.00045

## Running the Migration

```bash
cd packages/nest
npm run db:migrate
```

This will:
1. Connect to the database
2. Run all `.sql` files in `migrations/` directory in order
3. Apply the schema changes
4. Migrate existing data

## Benefits

### Before
- ❌ Approximate token counts (length / 4)
- ❌ Inaccurate cost calculations
- ❌ No visibility into input vs output
- ❌ Single combined token field

### After
- ✅ **Actual token counts** from AI providers
- ✅ **Accurate cost calculations** using real usage
- ✅ **Full transparency** showing input/output breakdown
- ✅ **Better analytics** for usage patterns
- ✅ **Correct pricing** using different input/output rates

## Backward Compatibility

The migration handles existing data automatically:
- Existing messages are migrated based on role
- Old columns are removed after data migration
- TypeORM entity is updated to use new fields
- Frontend displays new token breakdown

## Testing Recommendations

1. **Verify migration**: Check that existing messages have correct token distributions
2. **Test new messages**: Ensure actual token counts are being captured
3. **Validate costs**: Compare calculated costs with provider billing
4. **Check frontend**: Verify token breakdown displays correctly
5. **Monitor logs**: Watch for token count logging in gateway

## Files Modified

### Backend
- `packages/nest/src/tb-shared/ai-providers/types/unified.types.ts`
- `packages/nest/src/tb-shared/ai-providers/types/openai.types.ts`
- `packages/nest/src/tb-shared/ai-providers/utils/anthropic.utils.ts`
- `packages/nest/src/tb-shared/ai-providers/utils/openai.utils.ts`
- `packages/nest/src/tb-shared/ai-providers/base/base-openai.service.ts`
- `packages/nest/src/tb-shared/database/entities/llm-message.entity.ts`
- `packages/nest/src/modules/chat-agent/chat-agent.service.ts`
- `packages/nest/src/modules/chat-agent/chat-agent.gateway.ts`
- `packages/nest/package.json`

### Shared
- `packages/tb-shared/src/chat-agent/message.types.ts`

### Frontend
- `packages/frontend/src/components/custom/chat/chat-message.tsx`

### Migrations
- `packages/nest/migrations/001-add-separate-token-counts.sql`
- `packages/nest/migrations/ROLLBACK-001-add-separate-token-counts.sql`
- `packages/nest/migrations/README.md`

### Documentation
- `packages/nest/MIGRATION_GUIDE.md`
- `packages/nest/TOKEN_TRACKING_IMPLEMENTATION.md` (this file)

