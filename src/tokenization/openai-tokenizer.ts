import { encodingForModel } from "js-tiktoken";

import { Model } from "../types/index.js";
import { Tokenizer } from "./tokenizer.js";

export class OpenAITokenizer implements Tokenizer {
  countTokens(prompt: string, model: Model): number {
    if (model.provider !== "openai") {
      throw new Error(
        `OpenAITokenizer cannot tokenize ${model.provider} models`,
      );
    }

    const encoding = encodingForModel(
      model.model as Parameters<typeof encodingForModel>[0],
    );

    return encoding.encode(prompt).length;
  }
}
