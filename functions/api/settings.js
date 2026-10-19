// Store Settings API for Happy Toys Store
export async function onRequestGet(context) {
  try {
    const { env } = context;
    if (!env.DB) return Response.json({ success: true, settings: { whatsappNumber: "923000000000" } });
    const res = await env.DB.prepare("SELECT * FROM store_settings").all();
    const settings = {};
    res.results.forEach(row => { settings[row.key] = row.value; });
    return Response.json({ success: true, settings });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
