import { describe, expect, it } from "vitest";
import { CostCalculator } from "../src/core/cost-calculator.js";
import type { ModelPricing } from "../src/pricing/registry.js";
import type { TokenUsage } from "../src/types/index.js";

describe("CostCalculator", () => {
  it("should calculate the correct cost", () => {
    const calculator = new CostCalculator();

    const pricing: ModelPricing = {
      modelInfo: {
        provider: "openai",
        model: "test-model",
      },
      inputPerMillionTokens: 1,
      outputPerMillionTokens: 2,
      currency: "USD",
    };

    const usage: TokenUsage = {
      inputTokens: 2000,
      outputTokens: 1000,
      totalTokens: 3000,
    };

    const cost = calculator.calculate(pricing, usage);

    expect(cost).toBeCloseTo(0.004);
  });

  it("should return zero when there are no tokens", () => {
    const calculator = new CostCalculator();

    const pricing: ModelPricing = {
      modelInfo: {
        provider: "openai",
        model: "test-model",
      },
      inputPerMillionTokens: 1,
      outputPerMillionTokens: 2,
      currency: "USD",
    };

    const usage: TokenUsage = {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
    };

    const cost = calculator.calculate(pricing, usage);

    expect(cost).toBe(0);
  });

  it("should calculate large token usage correctly", () => {
    const calculator = new CostCalculator();

    const pricing: ModelPricing = {
      modelInfo: {
        provider: "openai",
        model: "test-model",
      },
      inputPerMillionTokens: 1,
      outputPerMillionTokens: 2,
      currency: "USD",
    };

    const usage: TokenUsage = {
      inputTokens: 1_000_000,
      outputTokens: 500_000,
      totalTokens: 1_500_000,
    };

    const cost = calculator.calculate(pricing, usage);

    expect(cost).toBeCloseTo(2);
  });
});
