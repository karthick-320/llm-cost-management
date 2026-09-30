export type LLMProvider = "openai" | "gemini" | "anthropic" | "groq";

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface UsageInput {
  inputTokens: number;
  outputTokens: number;
}

export interface Model {
  provider: LLMProvider;
  model: string;
}

export interface UsageRecord {
  id: string;
  userId?: string;
  projectId?: string;
  feature?: string;
  modelInfo: Model;
  usage: TokenUsage;
  cost: number;
  latencyMs: number;
  success: boolean;
  timestamp: Date;
}

export interface BudgetLimits {
  maxRequestCost?: number;
  maxUserCost?: number;
  maxDailyCost?: number;
  maxMonthlyCost?: number;
}

export type BudgetRejectionReason =
  | "REQUEST_COST_EXCEEDS_LIMIT"
  | "USER_COST_EXCEEDS_LIMIT"
  | "DAILY_COST_EXCEEDS_LIMIT"
  | "MONTHLY_COST_EXCEEDS_LIMIT"
  | "USER_ID_REQUIRED";

export interface BudgetCheckResult {
  allowed: boolean;
  estimatedCost: number;
  remainingBudget: number | null;
  reason?: BudgetRejectionReason;
}