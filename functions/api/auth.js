// Admin Login Authentication Endpoint
export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const { password } = body;

    const adminPassword = env.ADMIN_PASSWORD || "HappyToys2026!";
    if (!password || password !== adminPassword) {
      return Response.json({ success: false, error: "Incorrect administrator password" }, { status: 401 });
    }

    const token = env.ADMIN_SECRET_TOKEN || "happy-toys-admin-secure-token";
    return Response.json({
      success: true,
      token,
      message: "Admin authentication successful"
    });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
