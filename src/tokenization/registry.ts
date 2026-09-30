import { Model } from "../types/index.js";
import { Tokenizer } from "./tokenizer.js";
import { OpenAITokenizer } from "./openai-tokenizer.js";

export class TokenizerRegistry {
  private readonly tokenizers = new Map<string, Tokenizer>();

  constructor() {
    this.register("openai", new OpenAITokenizer());
  }

  private createKey(provider: string): string {
    return provider;
  }

  register(provider: string, tokenizer: Tokenizer): void {
    this.tokenizers.set(this.createKey(provider), tokenizer);
  }

  get(model: Model): Tokenizer {
    const tokenizer = this.tokenizers.get(this.createKey(model.provider));

    if (!tokenizer) {
      throw new Error(
        `Tokenizer not found for ${model.provider}:${model.model}`,
      );
    }

    return tokenizer;
  }
}
