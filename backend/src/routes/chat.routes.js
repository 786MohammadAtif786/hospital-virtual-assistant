import { Router } from "express";
import { sendMessage, getHistory } from "../controllers/chat.controller.js";

const router = Router();

router.post("/", sendMessage);
router.get("/:sessionId", getHistory);

export default router;
