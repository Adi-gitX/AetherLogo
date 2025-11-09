import fs from "fs";
import path from "path";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Simple in-memory cache for temporary result storage (for Vercel)
const memoryStore: Record<string, any> = {};

export default async function handler(req: any, res: any) {
  Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method === "OPTIONS") {
    res.status(200).end("ok");
    return;
  }

  // 🟢 Handle GET requests — frontend polling
  if (req.method === "GET") {
    const jobId = req.query.job_id;

    if (!jobId) {
      res.status(400).json({ error: "Missing job_id parameter" });
      return;
    }

    // 1️⃣ Check memory cache first
    if (memoryStore[jobId]) {
      res.status(200).json(memoryStore[jobId]);
      return;
    }

    // 2️⃣ Try local file (for dev)
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
    } catch {}

    // 3️⃣ Try database (optional)
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
      } catch (e: any) {
        console.warn("/api/results GET DB read failed:", e.message);
      }
    }

    res.status(404).json({ error: "Result not found", job_id: jobId });
    return;
  }

  // 🟠 Handle POST requests — n8n webhook sends here
  if (req.method === "POST") {
    let body = req.body;

    // Handle raw body if not parsed automatically
    if (!body) {
      body = await new Promise((resolve) => {
        let data = "";
        req.on("data", (chunk: Buffer) => (data += chunk.toString()));
        req.on("end", () => {
          try {
            resolve(data ? JSON.parse(data) : {});
          } catch {
            resolve({});
          }
        });
      });
    }

    const { job_id: jobId, status, variants } = body || {};

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

    // Store in memory
    memoryStore[jobId] = result;

    // Also try to persist to disk (for local dev)
    try {
      const dir = path.join(process.cwd(), "public", "results");
      await fs.promises.mkdir(dir, { recursive: true });
      const filePath = path.join(dir, `${jobId}.json`);
      await fs.promises.writeFile(
        filePath,
        JSON.stringify(result, null, 2),
        "utf8"
      );
    } catch (e: any) {
      console.warn("/api/results: write failed", e.message);
    }

    // Optional DB storage
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
           ON CONFLICT (job_id) DO UPDATE SET status = EXCLUDED.status, variants = EXCLUDED.variants`,
          [jobId, result.status, JSON.stringify(result.variants)]
        );

        await client.end();
      } catch (e: any) {
        console.warn("/api/results: DB write failed", e.message);
      }
    }

    res.status(200).json({ success: true, job_id: jobId });
    return;
  }

  // 🚫 Fallback for other methods
  res.status(405).json({ error: "Method not allowed" });
}
