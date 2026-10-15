import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pdf from "pdf-parse/lib/pdf-parse.js";
import { embedBatch } from "../src/services/embedding.service.js";
import { upsertVectors } from "../src/services/pinecone.service.js";

const DOCS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../documents");
const CHUNK_SIZE = 900;
const OVERLAP = 150;
const BATCH = 20;

function chunkText(text) {
  let paragraphs = text
    .replace(/\r/g, "")
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  // Agar blank lines nahi hain (jaise doctors.txt mein har doctor ek line mein),
  // to har line ko alag unit maan lo taaki doctor ki info beech mein na kate
  if (paragraphs.length < 3) {
    paragraphs = text
      .replace(/\r/g, "")
      .split("\n")
      .map((p) => p.replace(/\s+/g, " ").trim())
      .filter(Boolean);
  }

  const chunks = [];
  let current = "";

  for (const para of paragraphs) {
    if ((current + " " + para).length > CHUNK_SIZE && current) {
      chunks.push(current.trim());
      current = current.slice(-OVERLAP) + " " + para;
    } else {
      current += " " + para;
    }
    while (current.length > CHUNK_SIZE * 1.5) {
      chunks.push(current.slice(0, CHUNK_SIZE).trim());
      current = current.slice(CHUNK_SIZE - OVERLAP);
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

async function readFileText(file) {
  const fullPath = path.join(DOCS_DIR, file);
  if (file.toLowerCase().endsWith(".pdf")) {
    const { text } = await pdf(fs.readFileSync(fullPath));
    return text;
  }
  return fs.readFileSync(fullPath, "utf-8");
}

const files = fs
  .readdirSync(DOCS_DIR)
  .filter((f) => /\.(pdf|txt)$/i.test(f));

if (!files.length) {
  console.log(`⚠️  ${DOCS_DIR} me koi PDF/TXT file nahi mili`);
  process.exit(0);
}

const failed = [];

for (const file of files) {
  try {
    const text = await readFileText(file);

    if (!text || !text.trim()) {
      console.warn(`⚠️  ${file}: koi text nahi mila, skip`);
      failed.push(`${file} (empty text)`);
      continue;
    }

    const chunks = chunkText(text);
    const name = file.replace(/\.(pdf|txt)$/i, "");
    console.log(`📄 ${file}: ${chunks.length} chunks`);

    for (let i = 0; i < chunks.length; i += BATCH) {
      const batch = chunks.slice(i, i + BATCH);
      const vectors = await embedBatch(batch);
      await upsertVectors(
        batch.map((t, j) => ({
          id: `${name}-${i + j}`,
          values: vectors[j],
          metadata: { text: t, category: name, source: file },
        }))
      );
    }
  } catch (err) {
    console.error(`❌ ${file} fail hui: ${err.message || err}`);
    failed.push(file);
  }
}

console.log("✅ Ingestion done");
if (failed.length) {
  console.log("⚠️  Ye files skip/fail hui:");
  failed.forEach((f) => console.log("   -", f));
}












// import "dotenv/config";
// import fs from "fs";
// import path from "path";
// import { fileURLToPath } from "url";
// import pdf from "pdf-parse/lib/pdf-parse.js";
// import { embedBatch } from "../src/services/embedding.service.js";
// import { upsertVectors } from "../src/services/pinecone.service.js";

// const DOCS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../documents");
// const CHUNK_SIZE = 900;
// const OVERLAP = 150;
// const BATCH = 20;

// function chunkText(text) {
//   const paragraphs = text
//     .replace(/\r/g, "")
//     .split(/\n\s*\n/)
//     .map((p) => p.replace(/\s+/g, " ").trim())
//     .filter(Boolean);
//   const chunks = [];
//   let current = "";

//   for (const para of paragraphs) {
//     if ((current + " " + para).length > CHUNK_SIZE && current) {
//       chunks.push(current.trim());
//       current = current.slice(-OVERLAP) + " " + para;
//     } else {
//       current += " " + para;
//     }
//     while (current.length > CHUNK_SIZE * 1.5) {
//       chunks.push(current.slice(0, CHUNK_SIZE).trim());
//       current = current.slice(CHUNK_SIZE - OVERLAP);
//     }
//   }
//   if (current.trim()) chunks.push(current.trim());
//   return chunks;
// }

// const files = fs.readdirSync(DOCS_DIR).filter((f) => f.toLowerCase().endsWith(".pdf"));
// if (!files.length) {
//   console.log(`⚠️  ${DOCS_DIR} me koi PDF nahi mili`);
//   process.exit(0);
// }

// const failed = [];

// for (const file of files) {
//   try {
//     const buffer = fs.readFileSync(path.join(DOCS_DIR, file));
//     const { text } = await pdf(buffer);

//     if (!text || !text.trim()) {
//       console.warn(`⚠️  ${file}: koi text nahi mila (scanned/image PDF ho sakti hai), skip`);
//       failed.push(`${file} (empty text)`);
//       continue;
//     }

//     const chunks = chunkText(text);
//     const name = file.replace(/\.pdf$/i, "");
//     console.log(`📄 ${file}: ${chunks.length} chunks`);

//     for (let i = 0; i < chunks.length; i += BATCH) {
//       const batch = chunks.slice(i, i + BATCH);
//       const vectors = await embedBatch(batch);
//       await upsertVectors(
//         batch.map((t, j) => ({
//           id: `${name}-${i + j}`,
//           values: vectors[j],
//           metadata: { text: t, category: name, source: file },
//         }))
//       );
//     }
//   } catch (err) {
//     console.error(`❌ ${file} fail hui: ${err.message || err}`);
//     failed.push(file);
//   }
// }

// console.log("✅ PDF ingestion done");
// if (failed.length) {
//   console.log("⚠️  Ye files skip/fail hui:");
//   failed.forEach((f) => console.log("   -", f));
// }





