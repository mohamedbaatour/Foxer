import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Blob } from "buffer";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || "whisper-large-v3-turbo";
const MAX_AUDIO_BYTES = Number(process.env.MAX_AUDIO_BYTES || 8 * 1024 * 1024);
const GROQ_TIMEOUT_MS = Number(process.env.GROQ_TIMEOUT_MS || 25000);

if (!GROQ_API_KEY) {
  console.error("❌ GROQ_API_KEY is missing in backend/.env");
  process.exit(1);
}

const allowedOrigins = new Set([
  "http://localhost:3000",
  "https://foxer.app",
  "https://www.foxer.app",
]);

app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      if (allowedOrigins.has(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
  })
);

app.use(express.json({ limit: "15mb" }));

app.get("/health", (req, res) => {
  res.json({ ok: true, env: process.env.NODE_ENV || "development" });
});

app.post("/api/transcribe", async (req, res, next) => {
  try {
    const { audio, mimeType } = req.body ?? {};

    if (!audio || typeof audio !== "string") {
      return res.status(400).json({ error: "Missing or invalid audio" });
    }

    const buffer = Buffer.from(audio, "base64");
    if (!buffer.length) {
      return res.status(400).json({ error: "Invalid audio payload" });
    }

    if (buffer.length > MAX_AUDIO_BYTES) {
      return res.status(413).json({ error: "Audio too large" });
    }

    console.log("Received audio bytes:", buffer.length);

    const blob = new Blob([buffer], { type: mimeType || "audio/webm" });
    const fd = new FormData();
    fd.append("file", blob, "voice.webm");
    fd.append("model", GROQ_MODEL);
    fd.append("response_format", "text");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), GROQ_TIMEOUT_MS);

    let groqRes;
    try {
      groqRes = await fetch(
        "https://api.groq.com/openai/v1/audio/transcriptions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${GROQ_API_KEY}`,
          },
          body: fd,
          signal: controller.signal,
        }
      );
    } catch (err) {
      clearTimeout(timeout);
      if (err.name === "AbortError") {
        console.error("Groq request timed out");
        return res.status(504).json({ error: "Groq timeout" });
      }
      throw err;
    }

    clearTimeout(timeout);

    const raw = await groqRes.text();

    if (!groqRes.ok) {
      console.error("Groq error:", groqRes.status, raw);
      const status =
        groqRes.status >= 400 && groqRes.status < 500 ? 502 : 503;
      return res.status(status).json({ error: "Groq STT failed" });
    }

    const text = raw.trim();
    return res.json({ text });
  } catch (err) {
    next(err);
  }
});

app.use((err, req, res, _next) => {
  console.error("Unhandled error:", err);

  if (err.type === "entity.too.large") {
    return res.status(413).json({ error: "Payload too large" });
  }

  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ error: "CORS blocked" });
  }

  return res.status(500).json({ error: "Internal error" });
});

app.listen(PORT, () => {
  console.log(`✅ Foxer backend running on http://localhost:${PORT}`);
});
