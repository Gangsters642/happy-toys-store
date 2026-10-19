// Categories API for Happy Toys Store
export async function onRequestGet(context) {
  try {
    const { env } = context;
    if (!env.DB) return Response.json({ success: true, categories: [] });
    const categories = await env.DB.prepare("SELECT * FROM categories ORDER BY sort_order ASC").all();
    return Response.json({ success: true, categories: categories.results });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const { id = `cat-${Date.now()}`, name, slug, icon = '🧸', sortOrder = 0 } = await request.json();
    await env.DB.prepare(`
      INSERT OR REPLACE INTO categories (id, name, slug, icon, sort_order) VALUES (?, ?, ?, ?, ?)
    `).bind(id, name, slug || name.toLowerCase().replace(/\s+/g, '-'), icon, Number(sortOrder)).run();
    return Response.json({ success: true, message: "Category saved" });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
