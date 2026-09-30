import { describe, expect, it } from "vitest";
import { BudgetEngine } from "../src/core/budget-engine.js";
import { UsageTracker } from "../src/core/usage-tracker.js";
import type { UsageRecord } from "../src/types/index.js";

const createEvent = (
  cost: number,
  userId = "user-123",
  projectId = "project-1",
  feature = "chat",
): UsageRecord => ({
  id: crypto.randomUUID(),
  userId,
  projectId,
  feature,
  modelInfo: {
    provider: "openai",
    model: "test-model",
  },

  usage: {
    inputTokens: 1000,
    outputTokens: 500,
    totalTokens: 1500,
  },
  cost,
  latencyMs: 500,
  success: true,
  timestamp: new Date(),
});

describe("BudgetEngine", () => {
  it("should allow a request within the request cost limit", () => {
    const tracker = new UsageTracker();
    const budget = new BudgetEngine(
      {
        maxRequestCost: 0.05,
      },
      tracker,
    );

    const result = budget.check(0.03);

    expect(result.allowed).toBe(true);
    expect(result.estimatedCost).toBe(0.03);
    expect(result.remainingBudget).toBeCloseTo(0.02);
  });

  it("should reject when request cost exceeds the limit", () => {
    const tracker = new UsageTracker();
    const budget = new BudgetEngine(
      {
        maxRequestCost: 0.05,
      },
      tracker,
    );

    const result = budget.check(0.08);

    expect(result.allowed).toBe(false);
    expect(result.estimatedCost).toBe(0.08);
    expect(result.remainingBudget).toBe(0.05);
    expect(result.reason).toBe("REQUEST_COST_EXCEEDS_LIMIT");
  });

  it("should allow a request when there is no request limit", () => {
    const tracker = new UsageTracker();
    const budget = new BudgetEngine({}, tracker);
    const result = budget.check(0.1);

    expect(result.allowed).toBe(true);
    expect(result.estimatedCost).toBe(0.1);
    expect(result.remainingBudget).toBeNull();
  });

  it("should allow a user request within the user cost limit", () => {
    const tracker = new UsageTracker();
    tracker.add(createEvent(0.2, "user-1"));

    const budget = new BudgetEngine(
      {
        maxUserCost: 1,
      },
      tracker,
    );

    const result = budget.check(0.3, "user-1");

    expect(result.allowed).toBe(true);
    expect(result.estimatedCost).toBe(0.3);
    expect(result.remainingBudget).toBeCloseTo(0.5);
  });

  it("should reject when user cost limit is exceeded", () => {
    const tracker = new UsageTracker();
    tracker.add(createEvent(0.8, "user-1"));
    const budget = new BudgetEngine(
      {
        maxUserCost: 1,
      },
      tracker,
    );

    const result = budget.check(0.3, "user-1");

    expect(result.allowed).toBe(false);
    expect(result.estimatedCost).toBe(0.3);
    expect(result.remainingBudget).toBeCloseTo(0.2);
    expect(result.reason).toBe("USER_COST_EXCEEDS_LIMIT");
  });

  it("should require a user ID when user cost limit is configured", () => {
    const tracker = new UsageTracker();
    const budget = new BudgetEngine(
      {
        maxUserCost: 1,
      },
      tracker,
    );

    const result = budget.check(0.3);

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("USER_ID_REQUIRED");
  });

  it("should reject when daily cost limit is exceeded", () => {
    const tracker = new UsageTracker();

    tracker.add({
      ...createEvent(0.8),
      timestamp: new Date(),
    });

    const budget = new BudgetEngine(
      {
        maxDailyCost: 1,
      },
      tracker,
    );

    const result = budget.check(0.3);

    expect(result.allowed).toBe(false);
    expect(result.estimatedCost).toBe(0.3);
    expect(result.remainingBudget).toBeCloseTo(0.2);
    expect(result.reason).toBe("DAILY_COST_EXCEEDS_LIMIT");
  });

  it("should reject when monthly cost limit is exceeded", () => {
    const tracker = new UsageTracker();

    tracker.add({
      ...createEvent(4),
      timestamp: new Date(),
    });

    const budget = new BudgetEngine(
      {
        maxMonthlyCost: 5,
      },
      tracker,
    );

    const result = budget.check(2);

    expect(result.allowed).toBe(false);
    expect(result.estimatedCost).toBe(2);
    expect(result.remainingBudget).toBeCloseTo(1);
    expect(result.reason).toBe("MONTHLY_COST_EXCEEDS_LIMIT");
  });

  it("should allow request when all limits are satisfied", () => {
    const tracker = new UsageTracker();

    tracker.add({
      ...createEvent(0.2, "user-1"),
      timestamp: new Date(),
    });

    const budget = new BudgetEngine(
      {
        maxRequestCost: 1,
        maxUserCost: 2,
        maxDailyCost: 5,
        maxMonthlyCost: 20,
      },
      tracker,
    );

    const result = budget.check(0.3, "user-1");

    expect(result.allowed).toBe(true);
    expect(result.estimatedCost).toBe(0.3);
    expect(result.remainingBudget).toBeCloseTo(0.7);
  });

  it("should return the smallest remaining budget when multiple limits exist", () => {
    const tracker = new UsageTracker();

    tracker.add({
      ...createEvent(0.8, "user-1"),
      timestamp: new Date(),
    });

    const budget = new BudgetEngine(
      {
        maxRequestCost: 1,
        maxUserCost: 2,
        maxDailyCost: 5,
        maxMonthlyCost: 20,
      },
      tracker,
    );

    const result = budget.check(0.3, "user-1");

    expect(result.allowed).toBe(true);
    expect(result.remainingBudget).toBeCloseTo(0.7);
  });
});
