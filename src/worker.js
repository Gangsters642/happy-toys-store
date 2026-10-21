export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });

    if (url.pathname === "/api/splash-media") {
      const cache = caches.default;
      const cacheKey = new Request(url.toString(), request);
      let cached = await cache.match(cacheKey);
      if (cached) return cached;
      if (!env.HAPPY_TOYS_KV) return new Response("Not found", { status: 404 });
      const videoData = await env.HAPPY_TOYS_KV.get("store_video");
      if (!videoData) return new Response("No video", { status: 404 });
      if (videoData.startsWith("http")) return Response.redirect(videoData, 302);
      if (videoData.startsWith("data:")) {
        const comma = videoData.indexOf(",");
        const mime = videoData.slice(5, comma).split(";")[0] || "video/mp4";
        const b64 = videoData.slice(comma + 1).replace(/\s/g, "");
        const bin = atob(b64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        const res = new Response(bytes.buffer, {
          headers: { "Content-Type": mime, "Content-Length": bytes.length.toString(), "Accept-Ranges": "bytes", "Cache-Control": "public, max-age=86400", ...cors }
        });
        ctx.waitUntil(cache.put(cacheKey, res.clone()));
        return res;
      }
    }

    if (url.pathname === "/api/store") {
      const headers = { "Content-Type": "application/json", "Cache-Control": "no-store", ...cors };
      if (!env.HAPPY_TOYS_KV) return new Response(JSON.stringify({ products: [] }), { headers });
      if (request.method === "GET") {
        const data = await env.HAPPY_TOYS_KV.get("store_data");
        return new Response(data || JSON.stringify({ products: [] }), { headers });
      }
      if (request.method === "POST") {
        await env.HAPPY_TOYS_KV.put("store_data", await request.text());
        return new Response(JSON.stringify({ success: true }), { headers });
      }
    }

    if (url.pathname === "/api/video") {
      const headers = { "Content-Type": "application/json", ...cors };
      if (!env.HAPPY_TOYS_KV) return new Response(JSON.stringify({ videoData: "" }), { headers });
      if (request.method === "GET") {
        const v = await env.HAPPY_TOYS_KV.get("store_video");
        return new Response(JSON.stringify({ videoData: v || "" }), { headers });
      }
      if (request.method === "POST") {
        const body = await request.json();
        await env.HAPPY_TOYS_KV.put("store_video", body.videoData || "");
        await caches.default.delete(new Request(new URL("/api/splash-media", url.origin).toString()));
        return new Response(JSON.stringify({ success: true }), { headers });
      }
    }

    const assetRes = await env.ASSETS.fetch(request);
    const newRes = new Response(assetRes.body, assetRes);
    newRes.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    return newRes;
  }
};
