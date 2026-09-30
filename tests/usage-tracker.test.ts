import { describe, expect, it } from "vitest";
import { UsageTracker } from "../src/core/usage-tracker.js";
import type { UsageRecord } from "../src/types/index.js";

const createEvent = (
  cost: number,
  userId = "user-123",
  projectId = "test-project",
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

describe("UsageTracker", () => {
  it("should add a usage event", () => {
    const tracker = new UsageTracker();

    const event = createEvent(0.02);

    tracker.add(event);

    expect(tracker.getAll()).toHaveLength(1);
  });

  it("should add multiple usage events", () => {
    const tracker = new UsageTracker();

    tracker.add(createEvent(0.02));
    tracker.add(createEvent(0.03));
    tracker.add(createEvent(0.05));

    expect(tracker.getAll()).toHaveLength(3);
  });

  it("should calculate total cost", () => {
    const tracker = new UsageTracker();

    tracker.add(createEvent(0.02));
    tracker.add(createEvent(0.03));
    tracker.add(createEvent(0.05));

    expect(tracker.getTotalCost()).toBeCloseTo(0.1);
  });

  it("should return zero cost for an empty tracker", () => {
    const tracker = new UsageTracker();

    expect(tracker.getTotalCost()).toBe(0);
  });

  it("should return a copy of the events", () => {
    const tracker = new UsageTracker();

    tracker.add(createEvent(0.02));

    const events = tracker.getAll();

    events.pop();

    expect(tracker.getAll()).toHaveLength(1);
  });
  it("should calculate cost for a specific user", () => {
    const tracker = new UsageTracker();

    tracker.add(createEvent(0.02, "user-1", "project-1", "chat"));
    tracker.add(createEvent(0.03, "user-1", "project-1", "summary"));
    tracker.add(createEvent(0.1, "user-2", "project-2", "chat"));

    expect(tracker.getUserCost("user-1")).toBeCloseTo(0.05);
    expect(tracker.getUserCost("user-2")).toBeCloseTo(0.1);
  });
    it("should calculate daily cost", () => {
      const tracker = new UsageTracker();

      const targetDate = new Date(2026, 8, 30);

      tracker.add({
        ...createEvent(0.02),
        timestamp: new Date(2026, 8, 30),
      });

      tracker.add({
        ...createEvent(0.03),
        timestamp: new Date(2026, 8, 30),
      });

      tracker.add({
        ...createEvent(0.1),
        timestamp: new Date(2026, 8, 29),
      });

      expect(tracker.getDailyCost(targetDate)).toBeCloseTo(0.05);
    });
    it("should calculate monthly cost", () => {
      const tracker = new UsageTracker();

      const targetDate = new Date(2026, 8, 30);

      tracker.add({
        ...createEvent(0.02),
        timestamp: new Date(2026, 8, 1),
      });

      tracker.add({
        ...createEvent(0.03),
        timestamp: new Date(2026, 8, 15),
      });

      tracker.add({
        ...createEvent(0.1),
        timestamp: new Date(2026, 7, 30),
      });

      expect(tracker.getMonthlyCost(targetDate)).toBeCloseTo(0.05);
    });
});
