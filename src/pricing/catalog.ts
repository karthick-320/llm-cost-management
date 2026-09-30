import { Model } from "../types/index.js";

export interface ModelPrice {
  modelInfo: Model;
  inputPerMillionTokens: number;
  outputPerMillionTokens: number;
  currency: string;
}

export class PricingCatalog {
  private readonly prices = new Map<string, ModelPrice>();

  private createKey(modelInfo: Model): string {
    return `${modelInfo.provider}:${modelInfo.model}`;
  }

  add(price: ModelPrice): void {
    const key = this.createKey(price.modelInfo);
    this.prices.set(key, price);
  }

  get(modelInfo: Model): ModelPrice | undefined {
    const key = this.createKey(modelInfo);
    return this.prices.get(key);
  }

  has(modelInfo: Model): boolean {
    return this.prices.has(this.createKey(modelInfo));
  }
}
