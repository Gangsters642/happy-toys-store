export async function onRequest(context) {
  const { request, env } = context;
  const db = env.HAPPY_TOYS_KV;
  
  const headers = { "Content-Type": "application/json" };
  if (!db) return new Response(JSON.stringify({ error: "KV Database missing!" }), { status: 500, headers });
  
  if (request.method === "GET") {
    const data = await db.get("store_data");
    return new Response(data || JSON.stringify({ products: [], introGifUrl: "" }), { headers });
  }
  
  if (request.method === "POST") {
    const body = await request.text();
    await db.put("store_data", body);
    return new Response(JSON.stringify({ success: true }), { headers });
  }
  
  return new Response("Method not allowed", { status: 405 });
}
