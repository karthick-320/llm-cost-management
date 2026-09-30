import { describe, expect, it } from "vitest";

import { OpenAITokenizer } from "../src/tokenization/openai-tokenizer.js";

describe("OpenAITokenizer", () => {
  const tokenizer = new OpenAITokenizer();

  it("should count tokens for an OpenAI model", () => {
    const tokenCount = tokenizer.countTokens("Hello, how are you?", {
      provider: "openai",
      model: "gpt-4o",
    });

    expect(tokenCount).toBeGreaterThan(0);
  });

  it("should return a consistent token count", () => {
    const prompt = "Explain binary search in Java";

    const firstCount = tokenizer.countTokens(prompt, {
      provider: "openai",
      model: "gpt-4",
    });

    console.log(firstCount);

    const secondCount = tokenizer.countTokens(prompt, {
      provider: "openai",
      model: "gpt-4",
    });

    expect(firstCount).toBe(secondCount);
  });

  it("should return zero tokens for an empty prompt", () => {
    const tokenCount = tokenizer.countTokens("", {
      provider: "openai",
      model: "gpt-4o",
    });

    expect(tokenCount).toBe(0);
  });

  it("should reject non-OpenAI models", () => {
    expect(() =>
      tokenizer.countTokens("Hello", {
        provider: "gemini",
        model: "gemini-model",
      }),
    ).toThrow("OpenAITokenizer cannot tokenize gemini models");
  });
});
