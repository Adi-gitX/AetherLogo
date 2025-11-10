import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// In-memory cache (useful for serverless + dev)
const memoryStore: Record<string, unknown> = {};

interface ResultPayload {
  job_id: string;
  status?: string;
  variants?: unknown[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method === "OPTIONS") {
    res.status(200).end("ok");
    return;
  }

  // 🟢 GET /api/results?job_id=...
  if (req.method === "GET") {
    const jobId = req.query.job_id as string;
    if (!jobId) {
      res.status(400).json({ error: "Missing job_id parameter" });
      return;
    }

    // 1) Memory store
    if (memoryStore[jobId]) {
      res.status(200).json(memoryStore[jobId]);
      return;
    }

    // 2) Local file
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
    } catch (error) {
      console.warn("/api/results GET file read failed", error);
    }

    // 3) Database fallback
    if (process.env.DATABASE_URL) {
      try {
        const { Client } = await import("pg");
        const client = new Client({
          connectionString: process.env.DATABASE_URL,
          ssl: { rejectUnauthorized: false },
        });
        await client.connect();
        const result = await client.query(
          "SELECT * FROM logo_jobs WHERE job_id = $1",
          [jobId]
        );
        await client.end();

        if (result.rows.length > 0) {
          res.status(200).json(result.rows[0]);
          return;
        }
      } catch (dbErr) {
        console.warn("/api/results GET DB read failed", dbErr);
      }
    }

    res.status(404).json({ error: "Result not found", job_id: jobId });
    return;
  }

  // 🟢 POST /api/results — n8n sends back generation result
  if (req.method === "POST") {
    const body = (req.body || {}) as ResultPayload;
    const { job_id: jobId, status, variants } = body;

    if (!jobId) {
      res.status(400).json({ error: "job_id is required" });
      return;
    }

    const result = {
      job_id: jobId,
      status: status || "completed",
      variants: variants || [],
      timestamp: new Date().toISOString(),
    };

    // 1) Memory cache
    memoryStore[jobId] = result;

    // 2) Disk storage
    try {
      const dir = path.join(process.cwd(), "public", "results");
      await fs.promises.mkdir(dir, { recursive: true });
      const filePath = path.join(dir, `${jobId}.json`);
      await fs.promises.writeFile(
        filePath,
        JSON.stringify(result, null, 2),
        "utf8"
      );
    } catch (err) {
      console.warn("/api/results write failed", err);
    }

    // 3) DB write
    if (process.env.DATABASE_URL) {
      try {
        const { Client } = await import("pg");
        const client = new Client({
          connectionString: process.env.DATABASE_URL,
          ssl: { rejectUnauthorized: false },
        });
        await client.connect();
        await client.query(`
          CREATE TABLE IF NOT EXISTS logo_jobs (
            job_id TEXT PRIMARY KEY,
            status TEXT,
            variants JSONB,
            created_at TIMESTAMP DEFAULT NOW()
          )
        `);
        await client.query(
          `INSERT INTO logo_jobs (job_id, status, variants)
           VALUES ($1, $2, $3)
           ON CONFLICT (job_id)
           DO UPDATE SET status = EXCLUDED.status, variants = EXCLUDED.variants`,
          [jobId, result.status, JSON.stringify(result.variants)]
        );
        await client.end();
      } catch (dbErr) {
        console.warn("/api/results DB write failed", dbErr);
      }
    }

    res.status(200).json({ success: true, job_id: jobId });
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}
