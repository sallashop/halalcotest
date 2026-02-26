const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Fetch Pi price from OKX
    const response = await fetch(
      "https://www.okx.com/api/v5/market/ticker?instId=PI-USDT"
    );

    if (!response.ok) {
      throw new Error("Failed to fetch from OKX");
    }

    const data = await response.json();
    const ticker = data?.data?.[0];

    if (!ticker) {
      throw new Error("No ticker data");
    }

    return new Response(
      JSON.stringify({
        price: parseFloat(ticker.last),
        high24h: parseFloat(ticker.high24h),
        low24h: parseFloat(ticker.low24h),
        change24h: parseFloat(ticker.last) - parseFloat(ticker.open24h),
        changePercent: (((parseFloat(ticker.last) - parseFloat(ticker.open24h)) / parseFloat(ticker.open24h)) * 100).toFixed(2),
        volume24h: parseFloat(ticker.vol24h),
        timestamp: Date.now(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Price fetch error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch Pi price", price: null }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
