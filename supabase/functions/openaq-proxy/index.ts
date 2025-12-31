import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { city, country = 'IN', limit = 1 } = await req.json();
    
    if (!city) {
      return new Response(
        JSON.stringify({ error: 'City parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const OPENAQ_API_KEY = Deno.env.get('OPENAQ_API_KEY');
    
    if (!OPENAQ_API_KEY) {
      console.error('OPENAQ_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'OpenAQ API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = `https://api.openaq.org/v2/latest?country=${country}&city=${encodeURIComponent(city)}&limit=${limit}`;
    
    console.log(`Fetching OpenAQ data for city: ${city}, country: ${country}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-API-Key': OPENAQ_API_KEY,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenAQ API error: ${response.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ 
          error: `OpenAQ API returned ${response.status}`,
          details: errorText 
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log(`OpenAQ response for ${city}: ${data.results?.length || 0} results`);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in openaq-proxy function:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
