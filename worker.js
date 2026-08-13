const ALLOWED_ORIGINS = [
  https://zaylinkhant02.github.io/News-Aggregator/
];

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get("Origin");
    const isAllowedOrigin = ALLOWED_ORIGINS.includes(origin);

    const corsHeaders = {
      "Access-Control-Allow-Origin": isAllowedOrigin ? origin : "null",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      if (!isAllowedOrigin) {
        return new Response("Forbidden origin", { status: 403 });
      }
      return new Response(null, { headers: corsHeaders });
    }

    if (origin && !isAllowedOrigin) {
      return new Response(JSON.stringify({ error: "Forbidden: Origin not allowed" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const ip = request.headers.get("cf-connecting-ip") || "anonymous";
    const cache = caches.default;
    const rateLimitKey = new Request(`https://rate-limit.local/${ip}`);

    let rateData = await cache.match(rateLimitKey);
    let count = rateData ? (parseInt(await rateData.text(), 10) || 0) : 0;

    if (count >= 15) {
      return new Response(JSON.stringify({ message: "Rate limit exceeded. Please wait a minute." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    ctx.waitUntil(
      cache.put(
        rateLimitKey,
        new Response((count + 1).toString(), {
          headers: { "Cache-Control": "public, max-age=60" },
        })
      )
    );

    const url = new URL(request.url);
    const cacheKey = new Request(url.toString(), request);

    let response = await cache.match(cacheKey);
    if (response) {
      return response;
    }

    const category = url.searchParams.get("category") || "top";
    const page = url.searchParams.get("page");
    const q = url.searchParams.get("q");

    let apiUrl = `https://newsdata.io/api/1/news?apikey=${env.NEWS_API_KEY}&language=en&size=10`;

    if (q) {
      apiUrl += `&q=${encodeURIComponent(q)}`;
    } else if (category !== "top") {
      apiUrl += `&category=${encodeURIComponent(category)}`;
    }

    if (page) {
      apiUrl += `&page=${encodeURIComponent(page)}`;
    }

    try {
      const newsResponse = await fetch(apiUrl);
      const data = await newsResponse.json();

      response = new Response(JSON.stringify(data), {
        status: newsResponse.status,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=300, s-maxage=900",
        },
      });

      if (newsResponse.status === 200 && data.status === "success") {
        ctx.waitUntil(cache.put(cacheKey, response.clone()));
      }

      return response;
    } catch (err) {
      return new Response(JSON.stringify({ error: "Failed to fetch news data" }), {
        status: 500,
        headers: corsHeaders,
      });
    }
  }
};
