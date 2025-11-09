import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { description, style, colors, files } = await req.json();

    console.log("Generate request received:", {
      description,
      style,
      colors,
      filesCount: files?.length,
    });

    // Validate required fields
    if (!description || !description.trim()) {
      return new Response(
        JSON.stringify({ error: "Description is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Generate unique job ID
    const jobId = crypto.randomUUID();
    console.log("Generated job ID:", jobId);

    // Get n8n webhook URL from environment
    const webhookUrl = Deno.env.get("N8N_WEBHOOK_URL");

    // Helpful debug log: show what URL the function is about to use (or undefined)
    console.log("Using webhook URL:", webhookUrl);

    if (!webhookUrl) {
      console.error("N8N_WEBHOOK_URL not configured");
      return new Response(
        JSON.stringify({ error: "Webhook URL not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Prepare payload for n8n webhook
    const webhookPayload = {
      job_id: jobId,
      description,
      style: style || "minimal",
      colors: colors || [],
      files: files || [],
      timestamp: new Date().toISOString(),
    };

    console.log("Forwarding to n8n webhook:", webhookUrl);

    // Forward request to n8n webhook
    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(webhookPayload),
    });

    if (!webhookResponse.ok) {
      // Log status and response body to help debugging (n8n may return helpful error info)
      const respText = await webhookResponse
        .text()
        .catch(() => "<unable to read response body>");
      console.error(
        "Webhook request failed:",
        webhookResponse.status,
        respText
      );
      // Continue anyway - return job_id so client can poll
    } else {
      console.log("Webhook request successful");
    }

    // Return job ID to client
    return new Response(
      JSON.stringify({
        job_id: jobId,
        status: "queued",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in generate function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
