import "dotenv/config";
import { openai } from "../src/config/openai.js";

const list = await openai.models.list();
for await (const m of list) console.log(m.id);
