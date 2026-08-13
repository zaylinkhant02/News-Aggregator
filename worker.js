export default {
    async fetch(request, env) {
      const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      };
  
      if (request.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
      }
  
      const url = new URL(request.url);
      const category = url.searchParams.get("category") || "top";
  
      let apiUrl = `https://newsdata.io/api/1/news?apikey=${env.NEWS_API_KEY}&language=en&size=10`;
      if (category !== "top") {
        apiUrl += `&category=${encodeURIComponent(category)}`;
      }
  
      try {
        const newsResponse = await fetch(apiUrl);
        const data = await newsResponse.json();
  
        return new Response(JSON.stringify(data), {
          status: newsResponse.status,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: "Failed to fetch news data" }), {
          status: 500,
          headers: corsHeaders,
        });
      }
    }
  };