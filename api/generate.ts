import { randomUUID } from "crypto";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

export default async function handler(req: any, res: any) {
  // --- Handle CORS preflight ---
  if (req.method === "OPTIONS") {
    Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
    res.statusCode = 200;
    res.end("ok");
    return;
  }

  try {
    // --- Parse request body safely ---
    let body = req.body;
    if (!body) {
      body = await new Promise((resolve) => {
        let data = "";
        req.on("data", (chunk: Buffer) => (data += chunk.toString()));
        req.on("end", () => {
          try {
            resolve(JSON.parse(data || "{}"));
          } catch {
            resolve({});
          }
        });
      });
    }

    const { description, style, colors, files } = body || {};

    // --- Validate required field ---
    if (!description || !String(description).trim()) {
      Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Description is required" }));
      return;
    }

    // --- Create job and forward to n8n ---
    const jobId = randomUUID();
    const webhookUrl =
      process.env.VITE_N8N_WEBHOOK_URL ||
      "https://indiscernibly-biochemic-agnes.ngrok-free.app/webhook/commet_generate_logo";

    const payload = {
      job_id: jobId,
      description,
      style: style || "minimal",
      colors: colors || [],
      files: files || [],
      timestamp: new Date().toISOString(),
    };

    console.log("Forwarding payload to n8n:", webhookUrl, payload);

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await response.text();

    // --- Respond back to frontend ---
    Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
    res.statusCode = response.ok ? 200 : 500;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        job_id: jobId,
        status: response.ok ? "queued" : "failed",
        message: response.ok
          ? "Logo generation request accepted"
          : text || "Webhook failed",
      })
    );
  } catch (err) {
    console.error("Error in handler:", err);
    Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Internal Server Error",
      })
    );
  }
}
