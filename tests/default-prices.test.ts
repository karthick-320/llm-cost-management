import { describe, expect, it } from "vitest";
import { createDefaultPricingCatalog } from "../src/pricing/default-prices.js";

describe("Default pricing catalog", () => {
  it("should contain default OpenAI pricing", () => {
    const catalog = createDefaultPricingCatalog();

    expect(
      catalog.has({
        provider: "openai",
        model: "gpt-5",
      }),
    ).toBe(true);
  });

  it("should contain default Gemini pricing", () => {
    const catalog = createDefaultPricingCatalog();

    expect(
      catalog.has({
        provider: "gemini",
        model: "gemini-2.5-flash",
      }),
    ).toBe(true);
  });
});
