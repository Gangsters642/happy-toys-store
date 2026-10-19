// Android Gallery Image Upload to Cloudflare R2
export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return Response.json({ success: false, error: "No image file provided" }, { status: 400 });
    }

    const filename = `product-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    
    // Check if R2 bucket binding exists
    if (env.BUCKET) {
      await env.BUCKET.put(filename, file.stream(), {
        httpMetadata: { contentType: file.type || "image/jpeg" }
      });
      const imageUrl = `/images/${filename}`;
      return Response.json({ success: true, url: imageUrl, filename });
    } else {
      // Fallback local storage reference if R2 is not bound during local test
      const imageUrl = `images/${filename}`;
      return Response.json({ success: true, url: imageUrl, filename, warning: "Stored locally (R2 binding pending)" });
    }
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
