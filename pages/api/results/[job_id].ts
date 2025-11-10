import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface JobResult {
  job_id: string;
  status: string;
  variants?: unknown[];
  created_at?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<JobResult | { error: string }>
): Promise<void> {
  if (req.method === "OPTIONS") {
    Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
    res.status(200).end("ok");
    return;
  }

  if (req.method !== "GET") {
    Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const jobId = req.query.job_id as string;
  if (!jobId) {
    res.status(400).json({ error: "Missing job_id" });
    return;
  }

  try {
    const filePath = path.join(
      process.cwd(),
      "public",
      "results",
      `${jobId}.json`
    );
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(await fs.promises.readFile(filePath, "utf8"));
      res.status(200).json(data);
      return;
    }

    if (process.env.DATABASE_URL) {
      const { Client } = await import("pg");
      const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      });
      await client.connect();
      const { rows } = await client.query(
        "SELECT job_id, status, variants, created_at FROM logo_jobs WHERE job_id = $1",
        [jobId]
      );
      await client.end();

      if (rows.length > 0) {
        const row = rows[0];
        res.status(200).json({
          job_id: row.job_id,
          status: row.status,
          variants: row.variants,
          created_at: row.created_at,
        });
        return;
      }
    }

    res.status(404).json({ error: "Result not found", job_id: jobId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    console.error("❌ /api/results/:job_id failed:", message);
    res.status(500).json({ error: message });
  }
}
