Sansa – Product Plan

## 1. Non-Technical Overview

Sansa is an AI routing and benchmarking platform designed to make working with large language models (LLMs) more cost-effective, reliable, and visible.

### Three problems:
- **Costs**: expensive models are used for all tasks, even when cheaper models would suffice
- **Downtime**: if one provider fails, customers face outages
- **Blind spots**: there's no easy way to compare output quality, track token usage, or measure model performance (across multiple models)

### Sansa solves this by:
- Routing intelligently between multiple LLM providers
- Benchmarking outputs (A/B testing across models)
- Failing over automatically when one provider errors out

### The value to customers:
- Lower costs (use the right model for the right job)
- Higher uptime (no single-provider dependency)
- Better insights (observability into token usage, model performance, and costs)

## 2. MVP Outline

### A. SDK (Open-source NPM fork; drop-in)
OpenAI-compatible interface with required metadata per call:
- **name** (e.g., schedule-orchestration)
- **prompt_version** (e.g., 0.1)
- **custom_field** (free text: user, tenant, experiment id, etc.)

Primary behavior: send to Aviator API.

Safety net: if Aviator times out or 5xx, SDK direct-dials OpenAI (configurable) and reports telemetry on the next healthy call.

### B. Providers (Phase order)
- **Phase 1**: OpenAI, Anthropic
- **Phase 2**: Google/Gemini, Grok, Mistral

### C. Routing & Fallbacks
- Per-call explicit model and fallback (e.g., model: gpt-5, fallback: claude-sonnet-4)
- Global fallback (dashboard setting) used when a per-call fallback isn't set
- Auto modes (names TBD; for illustration):
  - **auto-sota**: choose the least expensive SOTA model that passes a quality threshold
  - **auto-cheap**: choose the cheapest available model that passes the quality threshold
- If no fallback configured, Aviator uses its closest-match pick based on your benchmarking history for that named call+prompt version

### D. Shadow Benchmarking (A/B suggestion engine)
Every production call can (optionally, per setting) run a shadow request on a cheaper comparison model (e.g., gpt-5-mini) without affecting the user's live response.

Aviator computes accuracy/quality deltas via task-specific evaluators and shows:
- "Save $X/token or Y% per request with ~Z% accuracy vs current"
- One-click "Adopt cheaper model" on the dashboard per named call

### E. Quality Degradation Auto-Routing
Aviator tracks quality signals (evaluation scores, abnormal error rate/latency, output-shape failures) per provider/model.

When a model's degrade score crosses a threshold, Aviator can auto-switch to the configured fallback or closest-match until recovery (configurable & auditable).

### F. MVP Screens
- **Overview**: cost & token usage by model and by named call; error/latency
- **Detail**: Logs per call (table) by name
- **Routing**: configure model, fallback, global fallback, and auto mode per named call
- **Benchmarks**: side-by-side outputs, costs, and evaluator scores; "Adopt suggestion"
- **Settings**: provider API keys, data/benchmarking privacy toggles, timeouts & retry policy

## 3. Metrics Measurement per Named Call

Sansa measures comprehensive metrics for each named call made through our npm package (e.g., "orchestrate-schedule", "schedule-orchestration"). These metrics are tracked across time and responses, providing deep insights into performance, reliability, and quality for every LLM interaction.

### Relevance Score
**What it is**: A numerical score (often from cosine similarity) that measures how well retrieved documents or context match the user's query.

**How it's calculated**: Typically via embeddings (vector representations of text). Cosine similarity ranges from -1 to 1, where 1 means "identical direction" (highly relevant).

**Why it matters**: A higher score means the AI is answering based on highly relevant context rather than loosely related or unrelated material. It's often combined with metrics like the number of retrieved docs used in a response.

**For named calls**: Tracked per call name to ensure consistent relevance across different use cases.

### Coverage
**What it is**: The percentage of user queries that result in a substantive model response versus falling back (e.g., "I don't know," or empty responses).

**How it's tracked**: (Number of queries answered with content) ÷ (Total queries asked)

**Why it matters**: Indicates how well the system can handle the breadth of user needs. Low coverage means the AI is failing often or relying too heavily on fallback answers.

**For named calls**: Monitored individually to identify which call types need improvement.

### Drift Detection
**What it is**: Monitoring for when user queries start shifting away from the domains the system was trained or optimized for.

**How it's done**: Clustering or statistical methods on embeddings to detect if inputs no longer resemble the expected domain distribution.

**Why it matters**: Prevents performance degradation. For example, a healthcare chatbot drifting into financial advice is both unsafe and unhelpful.

**For named calls**: Helps identify when a specific call pattern is being used outside its intended domain.

### Hallucination Rate
**What it is**: How often the model produces factually incorrect or fabricated content.

**How it's measured**: Usually requires human-in-the-loop review (manual checking) or automated fact-checking against trusted sources.

**Why it matters**: Hallucinations erode trust. Tracking this helps teams quantify error rates and refine retrieval grounding.

**For named calls**: Critical for mission-critical applications where accuracy is paramount.

### Latency
**What it is**: The time it takes from user query to final response.

**Why it matters**: Even if answers are good, long delays hurt user experience. For production apps, latency is often tracked as P50/P95/P99 (median, 95th percentile, 99th percentile response times).

**For named calls**: Measured end-to-end from SDK call to response, helping optimize routing decisions.

### Cache Hit Rate
**What it is**: The proportion of queries served quickly from a cache versus recomputed fresh.

**Why it matters**: High cache hit rate reduces cost and latency. For example, if multiple users ask "What's the capital of France?" and it's cached, the system avoids re-running a full LLM pipeline.

**For named calls**: Particularly useful for repetitive queries within the same call name.

### Summary of Metrics per Named Call
- **Relevance score** = how good the retrieved context is
- **Coverage** = how often the system gives real answers
- **Drift detection** = are users asking off-topic stuff
- **Hallucination rate** = how often the AI makes things up
- **Latency** = how fast answers come back
- **Cache hit rate** = how often results are reused

These metrics are aggregated and visualized in the dashboard, allowing teams to monitor performance trends, identify optimization opportunities, and ensure consistent quality across all named calls in their application.