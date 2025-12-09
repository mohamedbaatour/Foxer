import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Blob } from "buffer"; // Node Blob

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!GROQ_API_KEY) {
  console.error("❌ GROQ_API_KEY is missing in backend/.env");
  process.exit(1);
}

const allowedOrigins = [
  "http://localhost:3000",
  "https://foxer.app",
  "https://www.foxer.app",
];

app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true);

      if (allowedOrigins.includes(origin)) return cb(null, true);

      return cb(new Error("Not allowed by CORS"));
    },
  })
);

// we send base64 JSON, so this is fine
app.use(express.json({ limit: "15mb" }));

app.post("/api/transcribe", async (req, res) => {
  try {
    const { audio, mimeType } = req.body;
    if (!audio) return res.status(400).json({ error: "Missing audio" });

    const buffer = Buffer.from(audio, "base64");
    console.log("Received audio bytes:", buffer.length);

    // Use web-compatible Blob + FormData (native in Node 18+)
    const blob = new Blob([buffer], { type: mimeType || "audio/webm" });
    const fd = new FormData();
    fd.append("file", blob, "voice.webm");
    fd.append("model", "whisper-large-v3-turbo");
    fd.append("response_format", "text");

    const groqRes = await fetch(
      "https://api.groq.com/openai/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          // ❌ do NOT set Content-Type manually; fetch + FormData will do it
        },
        body: fd,
      }
    );

    const raw = await groqRes.text();

    if (!groqRes.ok) {
      console.error("Groq error:", groqRes.status, raw);
      return res.status(500).json({ error: "Groq STT failed" });
    }

    const text = raw.trim();
    res.json({ text });
  } catch (err) {
    console.error("Backend /api/transcribe error:", err);
    res.status(500).json({ error: "Internal error" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Foxer backend running on http://localhost:${PORT}`);
});
