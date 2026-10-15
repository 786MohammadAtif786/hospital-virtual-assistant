import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.CODECRAFT_API_KEY,
  baseURL: process.env.CODECRAFT_BASE_URL || "https://codecraftapi.com/v1",
});

export const LLM_MODEL = process.env.LLM_MODEL;
export const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL;
