import { randomUUID } from "crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

export default async function handler(req: any, res: any) {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
    res.status(200).end("ok");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { description, style, colors, files } = req.body || {};

    if (!description || !description.trim()) {
      res.status(400).json({ error: "Description is required" });
      return;
    }

    const jobId = randomUUID();
    const webhookUrl =
      process.env.N8N_WEBHOOK_URL ||
      "https://indiscernibly-biochemic-agnes.ngrok-free.dev/webhook/commet_generate_logo";

    const payload = {
      job_id: jobId,
      description: description.trim(),
      style: style || "minimal",
      colors: colors || [],
      files: files || [],
      timestamp: new Date().toISOString(),
    };

    // 👇 Critical: Skip ngrok browser warning
    const webhookRes = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify(payload),
    });

    const text = await webhookRes.text();

    // ✅ Return job ID regardless, so frontend can start polling
    res.status(webhookRes.ok ? 200 : 500).json({
      job_id: jobId,
      status: webhookRes.ok ? "queued" : "failed",
      message: webhookRes.ok ? "Webhook sent successfully" : text,
    });
  } catch (err: any) {
    console.error("❌ /api/generate error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
}
