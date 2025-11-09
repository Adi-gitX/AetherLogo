import { randomUUID } from "crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
    res.status(200).end("ok");
    return;
  }

  try {
    const body = req.body || {};
    const { description, style, colors, files } = body;

    if (!description || !String(description).trim()) {
      res.status(400).json({ error: "Description is required" });
      return;
    }

    const jobId = randomUUID();
    const webhookUrl =
      process.env.VITE_N8N_WEBHOOK_URL ||
      "https://indiscernibly-biochemic-agnes.ngrok-free.dev/webhook/commet_generate_logo";

    const payload = {
      job_id: jobId,
      description,
      style: style || "minimal",
      colors: colors || [],
      files: files || [],
      timestamp: new Date().toISOString(),
    };

    // 👇 KEY FIX: Add ngrok-skip-browser-warning header
    const webhookRes = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify(payload),
    });

    const text = await webhookRes.text();

    res.status(webhookRes.ok ? 200 : 500).json({
      job_id: jobId,
      status: webhookRes.ok ? "queued" : "failed",
      message: webhookRes.ok ? "Logo generation request accepted." : text,
    });
  } catch (err) {
    res.status(500).json({
      error: err.message || "Internal Server Error",
    });
  }
}
