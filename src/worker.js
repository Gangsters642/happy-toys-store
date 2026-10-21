export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // INSTANT BINARY VIDEO STREAM ENDPOINT (0-Second Load via Edge Cache)
    if (url.pathname === "/api/splash-media") {
      const cache = caches.default;
      const cacheKey = new Request(url.toString(), request);
      let cachedResponse = await cache.match(cacheKey);
      if (cachedResponse) {
        return cachedResponse;
      }

      if (!env.HAPPY_TOYS_KV) {
        return new Response("Not found", { status: 404 });
      }

      const videoData = await env.HAPPY_TOYS_KV.get("store_video");
      if (!videoData) {
        return new Response("No video", { status: 404 });
      }

      if (videoData.startsWith("http")) {
        return Response.redirect(videoData, 302);
      }

      if (videoData.startsWith("data:")) {
        const commaIdx = videoData.indexOf(",");
        const meta = videoData.slice(5, commaIdx);
        const mime = meta.split(";")[0] || "video/mp4";
        const b64 = videoData.slice(commaIdx + 1).replace(/\s/g, "");
        const binStr = atob(b64);
        const len = binStr.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binStr.charCodeAt(i);
        }

        const response = new Response(bytes.buffer, {
          headers: {
            "Content-Type": mime,
            "Content-Length": len.toString(),
            "Accept-Ranges": "bytes",
            "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
            ...corsHeaders
          }
        });

        ctx.waitUntil(cache.put(cacheKey, response.clone()));
        return response;
      }
    }

    // API 1: Products Data
    if (url.pathname === "/api/store") {
      const headers = { "Content-Type": "application/json", "Cache-Control": "no-cache", ...corsHeaders };
      if (!env.HAPPY_TOYS_KV) {
        return new Response(JSON.stringify({ products: [] }), { headers });
      }
      if (request.method === "GET") {
        const data = await env.HAPPY_TOYS_KV.get("store_data");
        return new Response(data || JSON.stringify({ products: [] }), { headers });
      }
      if (request.method === "POST") {
        const body = await request.text();
        await env.HAPPY_TOYS_KV.put("store_data", body);
        return new Response(JSON.stringify({ success: true }), { headers });
      }
    }

    // API 2: Splash Video Upload / Sync
    if (url.pathname === "/api/video") {
      const headers = { "Content-Type": "application/json", ...corsHeaders };
      if (!env.HAPPY_TOYS_KV) {
        return new Response(JSON.stringify({ videoData: "" }), { headers });
      }
      if (request.method === "GET") {
        const videoData = await env.HAPPY_TOYS_KV.get("store_video");
        return new Response(JSON.stringify({ videoData: videoData || "" }), { headers });
      }
      if (request.method === "POST") {
        const body = await request.json();
        await env.HAPPY_TOYS_KV.put("store_video", body.videoData || "");
        // Clear Edge Cache so newly uploaded video updates immediately
        const cache = caches.default;
        const streamUrl = new URL("/api/splash-media", url.origin).toString();
        await cache.delete(new Request(streamUrl));
        return new Response(JSON.stringify({ success: true }), { headers });
      }
    }

    return env.ASSETS.fetch(request);
  }
};
