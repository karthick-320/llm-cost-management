# llm-cost-management

A TypeScript SDK for estimating LLM request costs, tracking token usage, and managing AI spending limits.

## Why?

LLM applications can make it difficult to understand how much each request costs and whether a request should be allowed before sending it to a provider.

`llm-cost-management` provides a small, provider-aware layer for:

- Estimating request costs before making an LLM call
- Counting prompt tokens using the model's tokenizer
- Calculating actual request costs from token usage
- Configuring model pricing
- Enforcing spending limits
- Tracking users, projects, features, tokens, costs, latency, and request status

## Installation

```bash
npm install llm-cost-management
```

## Quick Start

```ts
import { LLMCostManager } from "llm-cost-management";

const manager = new LLMCostManager({
  budget: {
    maxRequestCost: 0.05,
    maxUserCost: 5,
    maxDailyCost: 20,
    maxMonthlyCost: 100,
  },
});
```

## Estimate a Request Before Calling the LLM

Pass the model and prompt to estimate the input cost.

```ts
const estimatedCost = manager.estimateRequestCost({
  model: {
    provider: "openai",
    model: "gpt-4o",
  },
  prompt: "Explain binary search in Java.",
});

console.log(`Estimated cost: $${estimatedCost}`);
```

The SDK tokenizes the prompt and uses the configured model pricing to calculate the estimated input cost.

### Include Maximum Output Tokens

If your application specifies a maximum output token limit, you can include it in the estimate:

```ts
const estimatedCost = manager.estimateRequestCost({
  model: {
    provider: "openai",
    model: "gpt-4o",
  },
  prompt: "Explain binary search in Java.",
  maxOutputTokens: 1000,
});
```

The estimate becomes:

```text
estimated cost
=
input token cost
+
maximum output token cost
```

If `maxOutputTokens` is not provided, the SDK estimates the input cost only.

## Check a Budget Before Making the Request

After estimating the request cost, check whether it is allowed by the configured limits.

```ts
const result = manager.checkBudget(
  estimatedCost,
  "user-123",
);

if (!result.allowed) {
  console.log(`Request rejected: ${result.reason}`);
  return;
}

// Make the LLM request
```

This allows applications to perform budget validation before spending money on an LLM request.

## Track Actual Usage

After the LLM request completes, record the actual token usage.

```ts
const record = manager.trackUsage({
  userId: "user-123",
  projectId: "coding-assistant",
  feature: "code-explanation",

  model: {
    provider: "openai",
    model: "gpt-4o",
  },

  usage: {
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  },

  latencyMs: 850,
  success: true,
});

console.log(record);
```

The SDK calculates the actual cost from the reported token usage.

The resulting record contains:

```ts
{
  id: "...",
  userId: "user-123",
  projectId: "coding-assistant",
  feature: "code-explanation",

  modelInfo: {
    provider: "openai",
    model: "gpt-4o"
  },

  usage: {
    inputTokens: 1200,
    outputTokens: 350,
    totalTokens: 1550
  },

  cost: 0.01125,
  latencyMs: 850,
  success: true,
  timestamp: Date
}
```

## Calculate Cost Directly

If you already have token usage, you can calculate the cost without recording a usage event.

```ts
const cost = manager.calculateCost(
  {
    provider: "openai",
    model: "gpt-4o",
  },
  {
    inputTokens: 2000,
    outputTokens: 1000,
    totalTokens: 3000,
  },
);

console.log(`Cost: $${cost}`);
```

## Budget Limits

You can configure different spending limits:

```ts
const manager = new LLMCostManager({
  budget: {
    maxRequestCost: 0.05,
    maxUserCost: 5,
    maxDailyCost: 20,
    maxMonthlyCost: 100,
  },
});
```

### Available limits

| Limit | Description |
|---|---|
| `maxRequestCost` | Maximum allowed cost for a single request |
| `maxUserCost` | Maximum tracked cost for a user |
| `maxDailyCost` | Maximum tracked cost for the current day |
| `maxMonthlyCost` | Maximum tracked cost for the current month |

All limits are optional.

## Custom Pricing

The default pricing catalog can be replaced with your own pricing configuration.

```ts
import {
  LLMCostManager,
  PricingCatalog,
} from "llm-cost-management";

const pricing = new PricingCatalog();

pricing.register({
  modelInfo: {
    provider: "openai",
    model: "gpt-4o",
  },
  inputPerMillionTokens: 5,
  outputPerMillionTokens: 15,
  currency: "USD",
});

const manager = new LLMCostManager({
  pricing,
});
```

This makes pricing independent from the cost calculation logic.

## Request Lifecycle

A typical application flow looks like this:

```text
                    User Request
                         │
                         ▼
                  Estimate Cost
                         │
                         ▼
                  Check Budget
                    │       │
                 Reject    Allow
                    │       │
                    │       ▼
                    │    LLM API
                    │       │
                    │       ▼
                    │  Actual Usage
                    │       │
                    │       ▼
                    └──► Track Usage
                            │
                            ▼
                       Actual Cost
```

This separates **pre-request cost control** from **post-request usage tracking**.

## Current Provider Support

### OpenAI

OpenAI model tokenization is currently supported through `js-tiktoken`.

Example:

```ts
{
  provider: "openai",
  model: "gpt-4o"
}
```

The pricing system is configurable, allowing applications to register their own model pricing.

Additional provider-specific tokenizers can be added to the tokenizer registry as the project evolves.

## TypeScript

The package is written in TypeScript and ships with generated type declarations.

```ts
import type {
  Model,
  TokenUsage,
  UsageRecord,
  BudgetLimits,
} from "llm-cost-management";
```

## API Overview

### `LLMCostManager`

Main entry point for the SDK.

```ts
const manager = new LLMCostManager(options);
```

### `estimateRequestCost()`

Estimates the cost of an LLM request before it is sent.

```ts
manager.estimateRequestCost({
  model,
  prompt,
  maxOutputTokens,
});
```

### `checkBudget()`

Checks whether an estimated request cost is within the configured limits.

```ts
manager.checkBudget(
  estimatedCost,
  userId,
);
```

### `calculateCost()`

Calculates the cost from known token usage.

```ts
manager.calculateCost(
  model,
  usage,
);
```

### `trackUsage()`

Records actual LLM usage and calculates the resulting cost.

```ts
manager.trackUsage({
  userId,
  projectId,
  feature,
  model,
  usage,
  latencyMs,
  success,
});
```

## Development

Clone the repository:

```bash
git clone https://github.com/karthick-320/llm-cost-management.git
cd llm-cost-management
```

Install dependencies:

```bash
npm install
```

Run type checking:

```bash
npm run typecheck
```

Run tests:

```bash
npm test
```

Build the package:

```bash
npm run build
```

Run tests in watch mode:

```bash
npm run test:watch
```

## Project Structure

```text
src/
├── core/
│   ├── budget-engine.ts
│   ├── cost-calculator.ts
│   └── usage-tracker.ts
│
├── pricing/
│   ├── catalog.ts
│   └── default-prices.ts
│
├── tokenization/
│   ├── openai-tokenizer.ts
│   ├── registry.ts
│   └── tokenizer.ts
│
├── types/
│   └── index.ts
│
├── index.ts
└── llm-cost-manager.ts

tests/
├── ...
└── llm-cost-manager.integration.test.ts
```

## Design Goals

The project is designed around a few simple principles:

### Provider-aware

Tokenization depends on the model and provider rather than assuming that every LLM uses the same tokenizer.

### Configurable pricing

Pricing is kept separate from cost calculation so applications can provide their own model pricing.

### Pre-request protection

Applications can estimate a request cost and check their budget before making the LLM request.

### Actual usage tracking

After a request completes, applications can record actual token usage and calculate the actual cost.

### Type-safe

The SDK exposes TypeScript types for models, token usage, pricing, budgets, and usage records.

## Roadmap

Planned improvements include:

- Additional provider-specific tokenizers
- More built-in model pricing
- Persistent usage storage
- Usage aggregation and reporting
- Improved budget period handling
- More provider response adapters
- Additional observability integrations
- Expanded test coverage

## Contributing

Contributions, issues, and feature requests are welcome.

Before submitting a pull request, run:

```bash
npm run typecheck
npm test
npm run build
```

## License

MIT