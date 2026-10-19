// Cloudflare Pages Function Middleware for Security & CORS
export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // Enable CORS for API routes
  if (url.pathname.startsWith("/api/")) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // Protect /api/admin/ routes with token verification
    if (url.pathname.startsWith("/api/admin/") && url.pathname !== "/api/admin/auth") {
      const authHeader = request.headers.get("Authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return Response.json({ error: "Unauthorized: Missing or invalid token" }, { status: 401 });
      }
      const token = authHeader.split(" ")[1];
      const expectedToken = env.ADMIN_SECRET_TOKEN || "happy-toys-admin-secure-token";
      if (token !== expectedToken) {
        return Response.json({ error: "Unauthorized: Invalid admin token" }, { status: 403 });
      }
    }
  }

  const response = await next();
  response.headers.set("Access-Control-Allow-Origin", "*");
  return response;
}
