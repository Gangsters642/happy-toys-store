export async function onRequest(context) {
  const { request, env } = context;
  const db = env.HAPPY_TOYS_KV;

  if (!db) {
    return new Response(JSON.stringify({ error: "KV Database not connected yet!" }), { status: 500 });
  }

  const headers = { "Content-Type": "application/json" };

  if (request.method === "GET") {
    const data = await db.get("store_data");
    // Default empty state if no data exists yet
    return new Response(data || JSON.stringify({ products: [], introGifUrl: "" }), { headers });
  }

  if (request.method === "POST") {
    const body = await request.text();
    // Save to Cloudflare KV
    await db.put("store_data", body);
    return new Response(JSON.stringify({ success: true }), { headers });
  }

  return new Response("Method not allowed", { status: 405 });
}
