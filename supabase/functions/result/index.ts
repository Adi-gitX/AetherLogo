import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const jobId = url.pathname.split('/').pop();

    console.log('Result request for job ID:', jobId);

    if (!jobId) {
      return new Response(
        JSON.stringify({ error: 'Job ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get result base URL from environment
    const resultBaseUrl = Deno.env.get('RESULT_BASE_URL');

    if (resultBaseUrl) {
      console.log('Fetching result from:', `${resultBaseUrl}/${jobId}.json`);
      
      try {
        // Try to fetch from external result endpoint
        const resultResponse = await fetch(`${resultBaseUrl}/${jobId}.json`);
        
        if (resultResponse.ok) {
          const resultData = await resultResponse.json();
          console.log('Result fetched successfully');
          return new Response(
            JSON.stringify(resultData),
            {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
      } catch (error) {
        console.error('Error fetching from result URL:', error);
      }
    }

    // Return mock response if no result URL configured or fetch failed
    console.log('Returning mock response');
    const mockResponse = {
      status: "completed",
      variants: [
        {
          id: "1",
          url: "https://images.unsplash.com/photo-1634942537034-2531766767d1?w=400&h=400&fit=crop",
          score: 0.92,
          metadata: {
            model: "sdxl-lora-v1",
            prompt: "A sleek futuristic monogram logo with geometric shapes",
          },
        },
        {
          id: "2",
          url: "https://images.unsplash.com/photo-1618172193622-ae2d025f4032?w=400&h=400&fit=crop",
          score: 0.89,
          metadata: {
            model: "sdxl-lora-v1",
            prompt: "Modern minimalist logo with clean lines and bold typography",
          },
        },
        {
          id: "3",
          url: "https://images.unsplash.com/photo-1635322966219-b75ed372eb01?w=400&h=400&fit=crop",
          score: 0.87,
          metadata: {
            model: "sdxl-lora-v1",
            prompt: "Abstract geometric logo with vibrant gradient colors",
          },
        },
      ],
    };

    return new Response(
      JSON.stringify(mockResponse),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in result function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
