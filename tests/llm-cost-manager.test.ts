import { describe, expect, it } from "vitest";

import { LLMCostManager } from "../src/llm-cost-manager.js";
import { PricingCatalog } from "../src/pricing/catalog.js";

describe("LLMCostManager", () => {
  const createManager = () => {
    const pricing = new PricingCatalog();

    pricing.add({
      modelInfo: {
        provider: "openai",
        model: "gpt-4o",
      },
      inputPerMillionTokens: 1,
      outputPerMillionTokens: 2,
      currency: "USD",
    });

    return new LLMCostManager({
      pricing,
    });
  };

  it("should estimate request cost using the prompt token count", () => {
    const manager = createManager();

    const estimatedCost = manager.estimateRequestCost({
      model: {
        provider: "openai",
        model: "gpt-4o",
      },
      prompt: "Explain binary search in Java.",
    });

    expect(estimatedCost).toBeGreaterThan(0);
  });

  it("should include max output token cost when provided", () => {
    const manager = createManager();

    const inputOnlyCost = manager.estimateRequestCost({
      model: {
        provider: "openai",
        model: "gpt-4o",
      },
      prompt: "Explain binary search in Java.",
    });

    const costWithOutputLimit = manager.estimateRequestCost({
      model: {
        provider: "openai",
        model: "gpt-4o",
      },
      prompt: "Explain binary search in Java.",
      maxOutputTokens: 1000,
    });

    expect(costWithOutputLimit).toBeGreaterThan(inputOnlyCost);
  });

  it("should throw when pricing is not available", () => {
    const manager = createManager();

    expect(() =>
      manager.estimateRequestCost({
        model: {
          provider: "openai",
          model: "unknown-model",
        },
        prompt: "Hello",
      }),
    ).toThrow("Pricing not found for openai:unknown-model");
  });
});
