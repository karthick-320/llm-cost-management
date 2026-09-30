import { BudgetLimits, BudgetCheckResult } from "../types/index.js";
import { UsageTracker } from "./usage-tracker.js";

export class BudgetEngine {
  constructor(
    private readonly limits: BudgetLimits,
    private readonly usageTracker: UsageTracker,
  ) {}

  private getRemainingBudget(
    estimatedCost: number,
    userId?: string,
  ): number | null {
    const remainingBudgets: number[] = [];

    if (this.limits.maxRequestCost !== undefined) {
      remainingBudgets.push(this.limits.maxRequestCost - estimatedCost);
    }

    if (this.limits.maxUserCost !== undefined && userId) {
      remainingBudgets.push(
        this.limits.maxUserCost -
          this.usageTracker.getUserCost(userId) -
          estimatedCost,
      );
    }

    if (this.limits.maxDailyCost !== undefined) {
      remainingBudgets.push(
        this.limits.maxDailyCost -
          this.usageTracker.getDailyCost() -
          estimatedCost,
      );
    }

    if (this.limits.maxMonthlyCost !== undefined) {
      remainingBudgets.push(
        this.limits.maxMonthlyCost -
          this.usageTracker.getMonthlyCost() -
          estimatedCost,
      );
    }

    if (remainingBudgets.length === 0) {
      return null;
    }

    return Math.max(0, Math.min(...remainingBudgets));
  }

  check(estimatedCost: number, userId?: string): BudgetCheckResult {
    // Maximum cost for a single request
    if (
      this.limits.maxRequestCost !== undefined &&
      estimatedCost > this.limits.maxRequestCost
    ) {
      return {
        allowed: false,
        estimatedCost,
        remainingBudget:  this.limits.maxRequestCost,
        reason: "REQUEST_COST_EXCEEDS_LIMIT",
      };
    }

    // Maximum cost for a specific user
    if (this.limits.maxUserCost !== undefined) {
      if (!userId) {
        return {
          allowed: false,
          estimatedCost,
          remainingBudget: null,
          reason: "USER_ID_REQUIRED",
        };
      }

      const currentUserCost = this.usageTracker.getUserCost(userId);
      const remainingUserBudget = this.limits.maxUserCost - currentUserCost;

      if (estimatedCost > remainingUserBudget) {
        return {
          allowed: false,
          estimatedCost,
          remainingBudget: Math.max(0, remainingUserBudget),
          reason: "USER_COST_EXCEEDS_LIMIT",
        };
      }
    }

    // Maximum cost per day
    if (this.limits.maxDailyCost !== undefined) {
      const currentDailyCost = this.usageTracker.getDailyCost();
      const remainingDailyBudget = this.limits.maxDailyCost - currentDailyCost;

      if (estimatedCost > remainingDailyBudget) {
        return {
          allowed: false,
          estimatedCost,
          remainingBudget: Math.max(0, remainingDailyBudget),
          reason: "DAILY_COST_EXCEEDS_LIMIT",
        };
      }
    }

    // Maximum cost per month
    if (this.limits.maxMonthlyCost !== undefined) {
      const currentMonthlyCost = this.usageTracker.getMonthlyCost();
      const remainingMonthlyBudget =
        this.limits.maxMonthlyCost - currentMonthlyCost;

      if (estimatedCost > remainingMonthlyBudget) {
        return {
          allowed: false,
          estimatedCost,
          remainingBudget: Math.max(0, remainingMonthlyBudget),
          reason: "MONTHLY_COST_EXCEEDS_LIMIT",
        };
      }
    }

    return {
      allowed: true,
      estimatedCost,
      remainingBudget: this.getRemainingBudget(estimatedCost, userId),
    };
  }
}
