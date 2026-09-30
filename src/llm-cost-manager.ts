import { randomUUID } from "node:crypto";

import { BudgetEngine } from "./core/budget-engine.js";
import { CostCalculator } from "./core/cost-calculator.js";
import { UsageTracker } from "./core/usage-tracker.js";
import { PricingCatalog } from "./pricing/catalog.js";
import { createDefaultPricingCatalog } from "./pricing/default-prices.js";
import { TokenizerRegistry } from "./tokenization/registry.js";

import {
  BudgetCheckResult,
  BudgetLimits,
  Model,
  TokenUsage,
  UsageInput,
  UsageRecord,
} from "./types/index.js";

export interface LLMCostManagerOptions {
  budget?: BudgetLimits;
  pricing?: PricingCatalog;
}

export interface RequestCostInput {
  model: Model;
  prompt: string;
  maxOutputTokens?: number;
}

export interface TrackUsageInput {
  userId?: string;
  projectId?: string;
  feature?: string;
  model: Model;
  usage: UsageInput;
  latencyMs: number;
  success: boolean;
}

export class LLMCostManager {
  private readonly pricing: PricingCatalog;
  private readonly calculator: CostCalculator;
  private readonly usage: UsageTracker;
  private readonly budget: BudgetEngine;
  private readonly tokenizerRegistry: TokenizerRegistry;

  constructor(options: LLMCostManagerOptions = {}) {
    this.pricing = options.pricing ?? createDefaultPricingCatalog();
    this.calculator = new CostCalculator();
    this.usage = new UsageTracker();
    this.budget = new BudgetEngine(options.budget ?? {}, this.usage);
    this.tokenizerRegistry = new TokenizerRegistry();
  }


  checkBudget(estimatedCost: number, userId?: string): BudgetCheckResult {
    this.validateNonNegativeNumber(estimatedCost, "estimatedCost");
    return this.budget.check(estimatedCost, userId);
  }


  estimateRequestCost(input: RequestCostInput): number {
    this.validateModel(input.model);

    if (typeof input.prompt !== "string" || input.prompt.trim().length === 0) {
      throw new Error("prompt must be a non-empty string");
    }

    if (input.maxOutputTokens !== undefined) {
      this.validateNonNegativeInteger(input.maxOutputTokens, "maxOutputTokens");
    }

    const price = this.pricing.get(input.model);

    if (!price) {
      throw new Error(
        `Pricing not found for ${input.model.provider}:${input.model.model}`,
      );
    }

    const tokenizer = this.tokenizerRegistry.get(input.model);
    const inputTokens = tokenizer.countTokens(input.prompt, input.model);
    const inputCost = (inputTokens / 1_000_000) * price.inputPerMillionTokens;

    if (input.maxOutputTokens === undefined) {
      return inputCost;
    }

    const outputCost =
      (input.maxOutputTokens / 1_000_000) * price.outputPerMillionTokens;

    return inputCost + outputCost;
  }

  calculateCost(model: Model, usage: TokenUsage): number {
    this.validateModel(model);
    this.validateTokenUsage(usage);

    const price = this.pricing.get(model);

    if (!price) {
      throw new Error(`Pricing not found for ${model.provider}:${model.model}`);
    }

    return this.calculator.calculate(price, usage);
  }


  trackUsage(input: TrackUsageInput): UsageRecord {
    this.validateModel(input.model);
    this.validateUsageInput(input.usage);

    if (!Number.isFinite(input.latencyMs) || input.latencyMs < 0) {
      throw new Error("latencyMs must be a non-negative number");
    }

    const price = this.pricing.get(input.model);

    if (!price) {
      throw new Error(
        `Pricing not found for ${input.model.provider}:${input.model.model}`,
      );
    }

    const tokenUsage: TokenUsage = {
      inputTokens: input.usage.inputTokens,
      outputTokens: input.usage.outputTokens,
      totalTokens: input.usage.inputTokens + input.usage.outputTokens,
    };

    const cost = this.calculator.calculate(price, tokenUsage);

    const record: UsageRecord = {
      id: randomUUID(),
      userId: input.userId,
      projectId: input.projectId,
      feature: input.feature,
      modelInfo: input.model,
      usage: tokenUsage,
      cost,
      latencyMs: input.latencyMs,
      success: input.success,
      timestamp: new Date(),
    };

    this.usage.add(record);

    return record;
  }

  private validateModel(model: Model): void {
    if (!model || typeof model !== "object") {
      throw new Error("model is required");
    }

    if (
      typeof model.provider !== "string" ||
      model.provider.trim().length === 0
    ) {
      throw new Error("model.provider must be a non-empty string");
    }

    if (typeof model.model !== "string" || model.model.trim().length === 0) {
      throw new Error("model.model must be a non-empty string");
    }
  }

  private validateTokenUsage(usage: TokenUsage): void {
    if (!usage || typeof usage !== "object") {
      throw new Error("usage is required");
    }

    this.validateNonNegativeInteger(usage.inputTokens, "inputTokens");

    this.validateNonNegativeInteger(usage.outputTokens, "outputTokens");

    const expectedTotal = usage.inputTokens + usage.outputTokens;

    if (usage.totalTokens !== expectedTotal) {
      throw new Error(`totalTokens must equal inputTokens + outputTokens`);
    }
  }

  private validateUsageInput(usage: UsageInput): void {
    if (!usage || typeof usage !== "object") {
      throw new Error("usage is required");
    }

    this.validateNonNegativeInteger(usage.inputTokens, "inputTokens");

    this.validateNonNegativeInteger(usage.outputTokens, "outputTokens");
  }

  private validateNonNegativeInteger(value: number, fieldName: string): void {
    if (!Number.isInteger(value) || value < 0) {
      throw new Error(`${fieldName} must be a non-negative integer`);
    }
  }

  private validateNonNegativeNumber(value: number, fieldName: string): void {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`${fieldName} must be a non-negative number`);
    }
  }
}
