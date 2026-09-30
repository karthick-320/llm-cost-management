import { Model } from "../types/index.js";

export interface Tokenizer {
  countTokens(prompt: string, model: Model): number;
}
