import { pc } from "../config/pinecone.js";
const MODEL = process.env.EMBEDDING_MODEL || "multilingual-e5-large";

async function embed(texts, inputType) {
  const res = await pc.inference.embed(MODEL, texts, { inputType, truncate: "END" });
  return res.data.map((d) => d.values);
}

export async function embedText(text) {
  return (await embed([text], "query"))[0];
}

export async function embedBatch(texts) {
  return embed(texts, "passage");
}