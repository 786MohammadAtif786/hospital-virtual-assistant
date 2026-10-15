import "dotenv/config"; // sabse upar rahe
import express from "express";
import cors from "cors";
import { connectDB } from "./config/mongodb.js";
import chatRoutes from "./routes/chat.routes.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/chat", chatRoutes);

app.use((err, _req, res, _next) => {
  console.error("❌", err.message);
  res.status(500).json({ error: "Something went wrong", detail: err.message });
});

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`)))
  .catch((e) => {
    console.error("MongoDB connection failed:", e.message);
    process.exit(1);
  });
