import { embedText } from "./embedding.service.js";
import { querySimilar } from "./pinecone.service.js";
import { generateAnswer } from "./llm.service.js";

const TOP_K = Number(process.env.TOP_K || 4);
const MIN_SCORE = Number(process.env.MIN_SCORE || 0.35);

const SYSTEM_PROMPT = `You are a helpful virtual assistant for a hospital.
Rules:
- Answer ONLY using the provided CONTEXT (doctors, departments, timings, fees, services, policies).
- If the answer is not in the context, say you don't have that information and suggest calling the hospital helpdesk.
- Never diagnose or prescribe medicines. For medical advice, tell the user to consult a doctor.
- For emergencies (chest pain, breathing trouble, severe bleeding, etc.) tell them to go to the emergency ward / call emergency services immediately.
- Reply in the same language as the user (Hindi, English or Hinglish). Keep answers short and clear.`;

export async function runRAG({ question, history = [] }) {
  // 1) question -> embedding
  const queryVector = await embedText(question);

  // 2) Pinecone se similar chunks
  const matches = await querySimilar(queryVector, TOP_K);
  const relevant = matches.filter((m) => m.score >= MIN_SCORE);

  const context = relevant.length
    ? relevant.map((m, i) => `[${i + 1}] ${m.metadata?.text}`).join("\n\n")
    : "No relevant information found.";

  // 3) LLM call (last few messages history ke saath)
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.map((h) => ({ role: h.role, content: h.content })),
    { role: "user", content: `CONTEXT:\n${context}\n\nQUESTION: ${question}` },
  ];

  const answer = await generateAnswer(messages);

  const sources = relevant.map((m) => ({
    id: m.id,
    score: Number(m.score.toFixed(3)),
    category: m.metadata?.category || null,
  }));

  return { answer, sources };
}
