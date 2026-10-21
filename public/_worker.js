export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Agar request API ki hai tou Database se connect karo
    if (url.pathname.startsWith('/api/store')) {
       const db = env.HAPPY_TOYS_KV;
       const headers = { "Content-Type": "application/json" };
       
       if (!db) {
           return new Response(JSON.stringify({ error: "KV not bound yet!" }), { status: 500, headers });
       }
       
       if (request.method === "GET") {
         const data = await db.get("store_data");
         return new Response(data || JSON.stringify({ products: [], introGifUrl: "" }), { headers });
       }
       
       if (request.method === "POST") {
         const body = await request.text();
         await db.put("store_data", body);
         return new Response(JSON.stringify({ success: true }), { headers });
       }
    }
    
    // Baqi tamam requests ke liye normal HTML/CSS/JS files show karo
    return env.ASSETS.fetch(request);
  }
};
