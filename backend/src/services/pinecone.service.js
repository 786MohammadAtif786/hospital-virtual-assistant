import { pineconeIndex, NAMESPACE } from "../config/pinecone.js";

export async function upsertVectors(vectors) {
  // vectors: [{ id, values, metadata }]
  await pineconeIndex.namespace(NAMESPACE).upsert(vectors);
}

export async function querySimilar(vector, topK = 4) {
  const res = await pineconeIndex.namespace(NAMESPACE).query({
    vector,
    topK,
    includeMetadata: true,
  });
  return res.matches || [];
}
