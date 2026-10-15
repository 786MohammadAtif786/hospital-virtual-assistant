import { openai, LLM_MODEL } from "../config/openai.js";
export async function generateAnswer(messages) {
  const res = await openai.chat.completions.create({
    model: LLM_MODEL,
    messages,
    temperature: 0.2,
    max_tokens: 1500,
  });

  const choice = res?.choices?.[0];
  const msg = choice?.message;

  const raw = msg?.content ?? msg?.reasoning_content ?? choice?.text ?? "";
  const text = typeof raw === "string" ? raw.trim() : "";

  if (!text) {
    console.error(
      "Empty LLM response | finish_reason:",
      choice?.finish_reason,
      "\nRaw response:",
      JSON.stringify(res, null, 2)
    );

    if (choice?.finish_reason === "length") {
      throw new Error("LLM ka response token limit me kat gaya (max_tokens badhao)");
    }
    throw new Error("LLM ne empty response diya");
  }

  return text;
}