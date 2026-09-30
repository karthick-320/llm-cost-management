import { ModelPrice } from "../pricing/catalog.js";
import { TokenUsage } from "../types/index.js";

export class CostCalculator {
  calculate(price: ModelPrice, usage: TokenUsage): number {
    const inputCost =
      (usage.inputTokens / 1_000_000) * price.inputPerMillionTokens;

    const outputCost =
      (usage.outputTokens / 1_000_000) * price.outputPerMillionTokens;

    return inputCost + outputCost;
  }
}
