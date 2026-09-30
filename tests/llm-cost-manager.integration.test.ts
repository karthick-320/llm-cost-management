import { describe, expect, it } from "vitest";

import { LLMCostManager } from "../src/llm-cost-manager.js";
import { PricingCatalog } from "../src/pricing/catalog.js";

describe("LLMCostManager - Integration", () => {
  const createManager = (budget = {}) => {
    const pricing = new PricingCatalog();
    pricing.add({
      modelInfo: {
        provider: "openai",
        model: "gpt-4o",
      },
      inputPerMillionTokens: 5,
      outputPerMillionTokens: 15,
      currency: "USD",
    });
    return new LLMCostManager({
      pricing,
      budget,
    });
  };

  describe("estimateRequestCost", () => {
    it("should estimate input cost using the real tokenizer", () => {
      const manager = createManager();
      const cost = manager.estimateRequestCost({
        model: {
          provider: "openai",
          model: "gpt-4o",
        },
        prompt: "Explain binary search in Java.",
      });
      console.log("cost ",cost);
      expect(cost).toBeGreaterThan(0);
    });

    it("should include maxOutputTokens in the estimate", () => {
      const manager = createManager();

      const inputOnlyCost = manager.estimateRequestCost({
        model: {
          provider: "openai",
          model: "gpt-4o",
        },
        prompt: "Explain binary search in Java.",
      });

      const maximumCost = manager.estimateRequestCost({
        model: {
          provider: "openai",
          model: "gpt-4o",
        },
        prompt: "Explain binary search in Java.",
        maxOutputTokens: 1_000,
      });

      expect(maximumCost).toBeGreaterThan(inputOnlyCost);
    });

    it("should reject an unknown model", () => {
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

  describe("calculateCost", () => {
    it("should calculate cost from actual token usage", () => {
      const manager = createManager();

      const cost = manager.calculateCost(
        {
          provider: "openai",
          model: "gpt-4o",
        },
        {
          inputTokens: 2_000,
          outputTokens: 1_000,
          totalTokens: 3_000,
        },
      );

      // (2000 / 1M * $5) + (1000 / 1M * $15)
      // = $0.025
      expect(cost).toBeCloseTo(0.025);
    });

    it("should reject inconsistent total token count", () => {
      const manager = createManager();

      expect(() =>
        manager.calculateCost(
          {
            provider: "openai",
            model: "gpt-4o",
          },
          {
            inputTokens: 2_000,
            outputTokens: 1_000,
            totalTokens: 5_000,
          },
        ),
      ).toThrow("totalTokens must equal inputTokens + outputTokens");
    });
  });

  describe("budget checking", () => {
    it("should allow a request within the request limit", () => {
      const manager = createManager({
        maxRequestCost: 1,
      });

      const result = manager.checkBudget(0.05);

      expect(result.allowed).toBe(true);
    });

    it("should reject a request exceeding the request limit", () => {
      const manager = createManager({
        maxRequestCost: 0.01,
      });

      const result = manager.checkBudget(0.05);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("REQUEST_COST_EXCEEDS_LIMIT");
    });
  });

  describe("trackUsage", () => {
    it("should record actual usage and calculate cost", () => {
      const manager = createManager();

      const record = manager.trackUsage({
        userId: "user-123",
        projectId: "project-1",
        feature: "chat",
        model: {
          provider: "openai",
          model: "gpt-4o",
        },
        usage: {
          inputTokens: 2_000,
          outputTokens: 1_000,
        },
        latencyMs: 850,
        success: true,
      });

      expect(record.id).toBeDefined();

      expect(record.userId).toBe("user-123");

      expect(record.projectId).toBe("project-1");

      expect(record.feature).toBe("chat");

      expect(record.modelInfo).toEqual({
        provider: "openai",
        model: "gpt-4o",
      });

      expect(record.usage).toEqual({
        inputTokens: 2_000,
        outputTokens: 1_000,
        totalTokens: 3_000,
      });

      expect(record.cost).toBeCloseTo(0.025);

      expect(record.latencyMs).toBe(850);

      expect(record.success).toBe(true);

      expect(record.timestamp).toBeInstanceOf(Date);
    });

    it("should reject negative token usage", () => {
      const manager = createManager();

      expect(() =>
        manager.trackUsage({
          model: {
            provider: "openai",
            model: "gpt-4o",
          },
          usage: {
            inputTokens: -100,
            outputTokens: 50,
          },
          latencyMs: 100,
          success: true,
        }),
      ).toThrow("inputTokens must be a non-negative integer");
    });

    it("should reject negative latency", () => {
      const manager = createManager();

      expect(() =>
        manager.trackUsage({
          model: {
            provider: "openai",
            model: "gpt-4o",
          },
          usage: {
            inputTokens: 100,
            outputTokens: 50,
          },
          latencyMs: -1,
          success: true,
        }),
      ).toThrow("latencyMs must be a non-negative number");
    });
  });

  describe("end-to-end workflow", () => {
    it("should estimate, check budget, then track actual usage", () => {
      const manager = createManager({
        maxRequestCost: 1,
        maxUserCost: 5,
        maxDailyCost: 10,
        maxMonthlyCost: 100,
      });

      // 1. Estimate before making the LLM request.
      const estimatedCost = manager.estimateRequestCost({
        model: {
          provider: "openai",
          model: "gpt-4o",
        },
        prompt: "Explain how a hash map works in Java.",
        maxOutputTokens: 1_000,
      });

      expect(estimatedCost).toBeGreaterThan(0);

      // 2. Check whether the request is allowed.
      const budgetResult = manager.checkBudget(estimatedCost, "user-123");

      expect(budgetResult.allowed).toBe(true);

      // 3. Simulate the actual LLM response.
      const record = manager.trackUsage({
        userId: "user-123",
        feature: "coding-assistant",
        model: {
          provider: "openai",
          model: "gpt-4o",
        },
        usage: {
          inputTokens: 12,
          outputTokens: 200,
        },
        latencyMs: 720,
        success: true,
      });

      // 4. Verify actual cost was recorded.
      expect(record.cost).toBeGreaterThan(0);
      expect(record.usage.totalTokens).toBe(212);
      expect(record.userId).toBe("user-123");
    });
  });
});
