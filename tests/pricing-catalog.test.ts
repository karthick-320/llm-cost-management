import { describe, expect, it } from "vitest";
import { PricingCatalog, ModelPrice } from "../src/pricing/catalog.js";

describe("PricingCatalog", () => {
  const testPrice: ModelPrice = {
    modelInfo: {
      provider: "openai",
      model: "test-model",
    },
    inputPerMillionTokens: 1,
    outputPerMillionTokens: 2,
    currency: "USD",
  };

  it("should add and retrieve model pricing", () => {
    const catalog = new PricingCatalog();
    catalog.add(testPrice);

    const price = catalog.get({
      provider: "openai",
      model: "test-model",
    });

    expect(price).toEqual(testPrice);
  });

  it("should return undefined for an unknown model", () => {
    const catalog = new PricingCatalog();

    const price = catalog.get({
      provider: "openai",
      model: "does-not-exist",
    });

    expect(price).toBeUndefined();
  });

  it("should return true when pricing exists", () => {
    const catalog = new PricingCatalog();

    catalog.add(testPrice);

    expect(
      catalog.has({
        provider: "openai",
        model: "test-model",
      }),
    ).toBe(true);
  });

  it("should return false when pricing does not exist", () => {
    const catalog = new PricingCatalog();

    expect(
      catalog.has({
        provider: "openai",
        model: "does-not-exist",
      }),
    ).toBe(false);
  });

  it("should update pricing when the same model is added again", () => {
    const catalog = new PricingCatalog();
    catalog.add(testPrice);

    const updatedPrice: ModelPrice = {
      ...testPrice,
      inputPerMillionTokens: 3,
      outputPerMillionTokens: 5,
    };

    catalog.add(updatedPrice);

    const price = catalog.get({
      provider: "openai",
      model: "test-model",
    });

    expect(price).toEqual(updatedPrice);
  });

  it("should keep pricing separate for different providers", () => {
    const catalog = new PricingCatalog();

    catalog.add({
      modelInfo: {
        provider: "openai",
        model: "test-model",
      },
      inputPerMillionTokens: 1,
      outputPerMillionTokens: 2,
      currency: "USD",
    });

    catalog.add({
      modelInfo: {
        provider: "gemini",
        model: "test-model",
      },
      inputPerMillionTokens: 3,
      outputPerMillionTokens: 4,
      currency: "USD",
    });

    const openAIPrice = catalog.get({
      provider: "openai",
      model: "test-model",
    });

    const geminiPrice = catalog.get({
      provider: "gemini",
      model: "test-model",
    });

    expect(openAIPrice?.inputPerMillionTokens).toBe(1);
    expect(geminiPrice?.inputPerMillionTokens).toBe(3);
  });
});
