import { randomUUID } from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method === "OPTIONS") return res.status(200).end("ok");

  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const { description, style, colors, files } = req.body || {};
    if (!description?.trim())
      return res.status(400).json({ error: "Description is required" });

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
      message: webhookRes.ok ? "Webhook sent successfully" : text,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    console.error("❌ /api/generate error:", message);
    res.status(500).json({ error: message });
  }
}
