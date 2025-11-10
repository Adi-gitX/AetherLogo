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
  Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method === "OPTIONS") {
    res.status(200).end("ok");
    return;
  }

  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const jobId = req.query.job_id as string;
  if (!jobId) {
    res.status(400).json({ error: "Missing job_id" });
    return;
  }

  try {
    // 1️⃣ Try local file cache
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

    // 2️⃣ Try database fallback
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
        res.status(200).json(rows[0]);
        return;
      }
    }

    res.status(404).json({ error: "Result not found" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    console.error("❌ /api/results/[job_id] failed:", message);
    res.status(500).json({ error: message });
  }
}
