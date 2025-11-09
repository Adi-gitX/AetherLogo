import fs from "fs";
import path from "path";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// simple in-memory store (temporary)
let memoryStore: Record<string, any> = {};

export default async function handler(req: any, res: any) {
  if (req.method === "OPTIONS") {
    Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
    res.status(200).end("ok");
    return;
  }

  if (req.method === "POST") {
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

      // ✅ keep an in-memory copy (for polling)
      memoryStore[job_id] = result;

      // Try writing locally (works only on dev)
      try {
        const dir = path.join(process.cwd(), "public", "results");
        await fs.promises.mkdir(dir, { recursive: true });
        await fs.promises.writeFile(
          path.join(dir, `${job_id}.json`),
          JSON.stringify(result, null, 2),
          "utf8"
        );
      } catch {
        console.warn("⚠️ Expected write fail on Vercel");
      }

      // Optional: Store result in PostgreSQL if configured
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
        } catch (err: any) {
          console.warn("⚠️ Database write failed:", err.message);
        }
      }

      Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
      res.status(200).json({ success: true, job_id });
    } catch (err: any) {
      console.error("❌ /api/results POST error:", err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
    return;
  }

  // ✅ NEW: handle GET for frontend polling
  if (req.method === "GET") {
    const { job_id } = req.query;

    if (!job_id) {
      res.status(400).json({ error: "job_id is required" });
      return;
    }

    // First check memory
    if (memoryStore[job_id]) {
      Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
      res.status(200).json(memoryStore[job_id]);
      return;
    }

    // Then check DB if available
    if (process.env.DATABASE_URL) {
      try {
        const { Client } = await import("pg");
        const client = new Client({
          connectionString: process.env.DATABASE_URL,
          ssl: { rejectUnauthorized: false },
        });
        await client.connect();
        const { rows } = await client.query(
          "SELECT job_id, status, variants, saved_at FROM logo_results WHERE job_id = $1",
          [job_id]
        );
        await client.end();

        if (rows.length) {
          Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
          res.status(200).json(rows[0]);
          return;
        }
      } catch (err: any) {
        console.warn("⚠️ DB read failed:", err.message);
      }
    }

    // If nothing found
    res.status(404).json({ error: "Result not found", job_id });
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}
