// Hospital data -> embeddings -> Pinecone
import "dotenv/config";
import fs from "fs";
import { embedBatch } from "../src/services/embedding.service.js";
import { upsertVectors } from "../src/services/pinecone.service.js";

const docs = JSON.parse(fs.readFileSync(new URL("../data/hospital-data.json", import.meta.url)));
const BATCH = 20;

for (let i = 0; i < docs.length; i += BATCH) {
  const batch = docs.slice(i, i + BATCH);
  const vectors = await embedBatch(batch.map((d) => d.text));
  await upsertVectors(
    batch.map((d, j) => ({
      id: d.id || `doc-${i + j}`,
      values: vectors[j],
      metadata: { text: d.text, category: d.category || "general" },
    }))
  );
  console.log(`Upserted ${i + batch.length}/${docs.length}`);
}
console.log("✅ Ingestion done");
