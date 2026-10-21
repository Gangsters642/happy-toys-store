export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const headers = {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Cache-Control": "no-store, no-cache, must-revalidate"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    // API 1: Products Data
    if (url.pathname === "/api/store") {
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

    // API 2: Splash Video Data (Separate Key for 25MB limit support)
    if (url.pathname === "/api/video") {
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
        return new Response(JSON.stringify({ success: true }), { headers });
      }
    }

    // Serve Static Website Files
    return env.ASSETS.fetch(request);
  }
};
