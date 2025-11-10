import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// simple in-memory cache
const memoryStore: Record<string, unknown> = {};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method === "OPTIONS") {
    res.status(200).end("ok");
    return;
  }

  // ✅ GET: fetch results
  if (req.method === "GET") {
    const jobId = req.query.job_id as string;
    if (!jobId) return res.status(400).json({ error: "Missing job_id" });

    if (memoryStore[jobId]) return res.status(200).json(memoryStore[jobId]);

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
      console.warn("⚠️ Failed reading result file:", error);
    }

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
        console.warn("⚠️ DB read failed:", dbErr);
      }
    }

    res.status(404).json({ error: "Result not found", job_id: jobId });
    return;
  }

  // ✅ POST: store new result (from n8n webhook)
  if (req.method === "POST") {
    const { job_id, status = "completed", variants = [] } = req.body || {};
    if (!job_id) return res.status(400).json({ error: "job_id is required" });

    const result = {
      job_id,
      status,
      variants,
      timestamp: new Date().toISOString(),
    };

    memoryStore[job_id] = result;

    try {
      const dir = path.join(process.cwd(), "public", "results");
      await fs.promises.mkdir(dir, { recursive: true });
      await fs.promises.writeFile(
        path.join(dir, `${job_id}.json`),
        JSON.stringify(result, null, 2),
        "utf8"
      );
    } catch (err) {
      console.warn("⚠️ File write failed:", err);
    }

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
          [job_id, status, JSON.stringify(variants)]
        );
        await client.end();
      } catch (dbErr) {
        console.warn("⚠️ DB write failed:", dbErr);
      }
    }

    res.status(200).json({ success: true, job_id });
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}
