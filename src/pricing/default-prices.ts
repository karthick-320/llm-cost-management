import { PricingCatalog } from "./catalog.js";

export function createDefaultPricingCatalog(): PricingCatalog {
  const catalog = new PricingCatalog();
  catalog.add({
    modelInfo: {
      provider: "openai",
      model: "gpt-5",
    },
    inputPerMillionTokens: 1.25,
    outputPerMillionTokens: 0,
    currency: "USD",
  });

  catalog.add({
    modelInfo: {
      provider: "gemini",
      model: "gemini-2.5-flash",
    },
    inputPerMillionTokens: 0,
    outputPerMillionTokens: 0,
    currency: "USD",
  });

  return catalog;
}
