# Database Migration Guide: Token Count Updates

## Overview

This migration updates the `llm_messages` table to track separate input and output token counts, replacing the single `tokenCount` column.

## Quick Start

To run the migration:

```bash
cd packages/nest
npm run db:migrate
```

That's it! The migration script will automatically:

1. Add new token count columns
2. Migrate existing data
3. Remove old columns

## Manual Migration (Alternative)

If you prefer to run the migration manually, follow these steps:

### Database Schema Changes

Run the following SQL commands to update the database schema:

```sql
-- Add new columns for separate input/output token counts and costs
ALTER TABLE llm_messages
  ADD COLUMN token_count_input INT DEFAULT 0,
  ADD COLUMN token_count_output INT DEFAULT 0,
  ADD COLUMN token_cost_input DECIMAL(10, 6) DEFAULT 0,
  ADD COLUMN token_cost_output DECIMAL(10, 6) DEFAULT 0;

-- Migrate existing data
-- For user messages, all tokens are input tokens
UPDATE llm_messages
SET token_count_input = tokenCount,
    token_count_output = 0,
    token_cost_input = tokenCost,
    token_cost_output = 0
WHERE role = 'user';

-- For assistant messages, all tokens are output tokens
UPDATE llm_messages
SET token_count_input = 0,
    token_count_output = tokenCount,
    token_cost_input = 0,
    token_cost_output = tokenCost
WHERE role = 'assistant';

-- For system messages (if any), treat as input tokens
UPDATE llm_messages
SET token_count_input = tokenCount,
    token_count_output = 0,
    token_cost_input = tokenCost,
    token_cost_output = 0
WHERE role = 'system';

-- Rename message_cost column to match new naming convention (optional, if not already named correctly)
-- ALTER TABLE llm_messages RENAME COLUMN messageCost TO message_cost;

-- Drop old columns after data migration is verified
ALTER TABLE llm_messages
  DROP COLUMN tokenCount,
  DROP COLUMN tokenCost;
```

### Rollback Script (if needed)

```sql
-- Add back old columns
ALTER TABLE llm_messages
  ADD COLUMN tokenCount INT DEFAULT 0,
  ADD COLUMN tokenCost DECIMAL(10, 6) DEFAULT 0;

-- Restore data
UPDATE llm_messages
SET tokenCount = token_count_input + token_count_output,
    tokenCost = token_cost_input + token_cost_output;

-- Drop new columns
ALTER TABLE llm_messages
  DROP COLUMN token_count_input,
  DROP COLUMN token_count_output,
  DROP COLUMN token_cost_input,
  DROP COLUMN token_cost_output;
```

## Benefits

### Before

- Single `tokenCount` field with rough approximations (length / 4)
- Single `tokenCost` field with estimated costs
- No visibility into input vs output usage
- Inaccurate cost calculations

### After

- Separate `tokenCountInput` and `tokenCountOutput` fields with **actual token counts from AI providers**
- Separate `tokenCostInput` and `tokenCostOutput` fields for accurate pricing
- Full transparency into token usage patterns
- Accurate cost tracking using provider-specific input/output pricing

## Token Count Sources

### OpenAI

- Uses the `usage` field from OpenAI Response API
- Contains `input_tokens`, `output_tokens`, and `total_tokens`
- Captured in both streaming and non-streaming responses

### Anthropic

- Uses the `usage` field from Anthropic Message API
- Contains `input_tokens` and `output_tokens`
- Captured from `message_start` and `message_delta` events in streaming responses

## Frontend Updates

The frontend now displays:

- **Input Tokens**: Number of tokens in the prompt/context
- **Output Tokens**: Number of tokens in the generated response
- **Total Tokens**: Sum of input and output tokens
- **Cost**: Accurately calculated based on per-million token pricing for input and output

This provides users with complete transparency into their AI usage and costs.
