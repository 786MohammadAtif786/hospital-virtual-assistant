import { randomUUID } from "crypto";
import Chat from "../models/chat.model.js";
import { runRAG } from "../services/rag.service.js";

const HISTORY_LIMIT = 6;

export async function sendMessage(req, res, next) {
  try {
    const { message } = req.body;
    const sessionId = req.body.sessionId || randomUUID();

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "message is required" });
    }

    let chat = await Chat.findOne({ sessionId });
    if (!chat) chat = new Chat({ sessionId, messages: [] });

    const history = chat.messages.slice(-HISTORY_LIMIT);
    const { answer, sources } = await runRAG({ question: message, history });

    chat.messages.push({ role: "user", content: message });
    chat.messages.push({ role: "assistant", content: answer, sources });
    await chat.save();

    res.json({ sessionId, answer, sources });
  } catch (err) {
    next(err);
  }
}

export async function getHistory(req, res, next) {
  try {
    const chat = await Chat.findOne({ sessionId: req.params.sessionId });
    res.json({ sessionId: req.params.sessionId, messages: chat?.messages || [] });
  } catch (err) {
    next(err);
  }
}
