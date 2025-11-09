import fs from "fs";
import path from "path";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

export default async function handler(req: any, res: any) {
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
    const { job_id, status, variants } = req.body || {};

    if (!job_id) {
      res.status(400).json({ error: "job_id is required" });
      return;
    }

    const result = {
      job_id,
      status: status || "completed",
      variants: variants || [],
      saved_at: new Date().toISOString(),
    };

    // Try saving result file (works locally)
    try {
      const dir = path.join(process.cwd(), "public", "results");
      await fs.promises.mkdir(dir, { recursive: true });
      await fs.promises.writeFile(
        path.join(dir, `${job_id}.json`),
        JSON.stringify(result, null, 2),
        "utf8"
      );
    } catch (err) {
      console.warn(
        "⚠️ Could not write to local results folder (expected on Vercel)"
      );
    }

    // Optional: Store result in Aiven PostgreSQL
    if (process.env.DATABASE_URL) {
      try {
        const { Client } = await import("pg");
        const client = new Client({
          connectionString: process.env.DATABASE_URL,
          ssl: { rejectUnauthorized: false },
        });
        await client.connect();

        await client.query(`
          CREATE TABLE IF NOT EXISTS logo_results (
            job_id TEXT PRIMARY KEY,
            status TEXT,
            variants JSONB,
            saved_at TIMESTAMP DEFAULT NOW()
          )
        `);

        await client.query(
          `INSERT INTO logo_results (job_id, status, variants)
           VALUES ($1, $2, $3)
           ON CONFLICT (job_id)
           DO UPDATE SET status = EXCLUDED.status, variants = EXCLUDED.variants`,
          [job_id, result.status, JSON.stringify(result.variants)]
        );

        await client.end();
      } catch (dbErr) {
        console.warn("⚠️ Database write failed:", dbErr.message);
      }
    }

    Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
    res.status(200).json({ success: true, job_id });
  } catch (err: any) {
    console.error("❌ /api/results error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
}
