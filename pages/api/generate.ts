import { randomUUID } from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface GenerateRequestBody {
  description?: string;
  style?: string;
  colors?: string[];
  files?: unknown[];
}

interface GenerateResponseBody {
  job_id?: string;
  status?: "queued" | "failed";
  message?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GenerateResponseBody>
): Promise<void> {
  if (req.method === "OPTIONS") {
    Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
    res.status(200).end("ok");
    return;
  }

  if (req.method !== "POST") {
    Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { description, style, colors, files } =
      (req.body as GenerateRequestBody) || {};

    if (!description?.trim()) {
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

    const webhookRes = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify(payload),
    });

    const text = await webhookRes.text();

    Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
    res.status(webhookRes.ok ? 200 : 500).json({
      job_id: jobId,
      status: webhookRes.ok ? "queued" : "failed",
      message: webhookRes.ok
        ? "Webhook sent successfully"
        : text || "Webhook failed",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    console.error("❌ /api/generate error:", message);
    Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
    res.status(500).json({ error: message });
  }
}
