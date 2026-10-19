// Products & Variants CRUD API for Happy Toys Store
export async function onRequestGet(context) {
  try {
    const { env, request } = context;
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!env.DB) {
      return Response.json({ success: true, products: [] });
    }

    if (id) {
      const product = await env.DB.prepare("SELECT * FROM products WHERE id = ?").bind(id).first();
      if (!product) return Response.json({ error: "Product not found" }, { status: 404 });
      
      const variants = await env.DB.prepare("SELECT * FROM product_variants WHERE product_id = ? ORDER BY sort_order").bind(id).all();
      const images = await env.DB.prepare("SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order").bind(id).all();
      
      return Response.json({ success: true, product: { ...product, variants: variants.results, galleryImages: images.results.map(i => i.image_url) } });
    }

    const products = await env.DB.prepare("SELECT * FROM products ORDER BY created_at DESC").all();
    
    // Attach variants & images to each product
    const enriched = [];
    for (const p of products.results) {
      const variants = await env.DB.prepare("SELECT * FROM product_variants WHERE product_id = ?").bind(p.id).all();
      const images = await env.DB.prepare("SELECT * FROM product_images WHERE product_id = ?").bind(p.id).all();
      enriched.push({
        ...p,
        hasVariants: Boolean(p.has_variants),
        isPublished: Boolean(p.is_published),
        isFeatured: Boolean(p.is_featured),
        isNewArrival: Boolean(p.is_new_arrival),
        isBestSeller: Boolean(p.is_best_seller),
        isSpecialOffer: Boolean(p.is_special_offer),
        variants: variants.results,
        galleryImages: images.results.map(i => i.image_url),
        tags: p.tags ? p.tags.split(",") : []
      });
    }

    return Response.json({ success: true, products: enriched });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const {
      id = `prod-${Date.now()}`,
      sku, name, slug, category, subcategory, ageGroup, brand,
      shortDescription, fullDescription, pricePkr, salePricePkr,
      costPkr, stockQty, availability, hasVariants, mainImage,
      galleryImages = [], variants = [], tags = [],
      isPublished, isFeatured, isNewArrival, isBestSeller, isSpecialOffer
    } = body;

    if (!env.DB) return Response.json({ error: "Database not bound" }, { status: 500 });

    await env.DB.prepare(`
      INSERT OR REPLACE INTO products (
        id, sku, name, slug, category, subcategory, age_group, brand,
        short_description, full_description, price_pkr, sale_price_pkr,
        cost_price_pkr, stock_qty, availability, has_variants, main_image,
        tags, is_published, is_featured, is_new_arrival, is_best_seller, is_special_offer
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, sku, name, slug || sku.toLowerCase(), category, subcategory || null, ageGroup || null, brand || 'Happy Toys Store',
      shortDescription || null, fullDescription || null, Number(pricePkr), salePricePkr ? Number(salePricePkr) : null,
      costPkr ? Number(costPkr) : null, Number(stockQty || 0), availability || 'in_stock', hasVariants ? 1 : 0, mainImage || null,
      Array.isArray(tags) ? tags.join(",") : tags, isPublished ? 1 : 0, isFeatured ? 1 : 0, isNewArrival ? 1 : 0, isBestSeller ? 1 : 0, isSpecialOffer ? 1 : 0
    ).run();

    // Save variants
    await env.DB.prepare("DELETE FROM product_variants WHERE product_id = ?").bind(id).run();
    if (hasVariants && Array.isArray(variants)) {
      for (let i = 0; i < variants.length; i++) {
        const v = variants[i];
        const vId = v.id || `var-${id}-${i}`;
        await env.DB.prepare(`
          INSERT INTO product_variants (id, product_id, variant_type, variant_name, sku, price_pkr, sale_price_pkr, stock_qty, available, sort_order)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(vId, id, v.type || 'Size', v.name, v.sku || `${sku}-${i}`, Number(v.pricePkr), v.salePricePkr ? Number(v.salePricePkr) : null, Number(v.stockQty || 0), v.available !== false ? 1 : 0, i).run();
      }
    }

    // Save gallery images
    await env.DB.prepare("DELETE FROM product_images WHERE product_id = ?").bind(id).run();
    if (Array.isArray(galleryImages)) {
      for (let i = 0; i < galleryImages.length; i++) {
        const imgUrl = galleryImages[i];
        const imgId = `img-${id}-${i}`;
        await env.DB.prepare(`
          INSERT INTO product_images (id, product_id, image_url, sort_order, is_main)
          VALUES (?, ?, ?, ?, ?)
        `).bind(imgId, id, imgUrl, i, i === 0 ? 1 : 0).run();
      }
    }

    return Response.json({ success: true, message: "Product saved successfully", productId: id });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function onRequestDelete(context) {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) return Response.json({ error: "Product ID required" }, { status: 400 });

    await env.DB.prepare("DELETE FROM product_variants WHERE product_id = ?").bind(id).run();
    await env.DB.prepare("DELETE FROM product_images WHERE product_id = ?").bind(id).run();
    await env.DB.prepare("DELETE FROM products WHERE id = ?").bind(id).run();

    return Response.json({ success: true, message: "Product deleted successfully" });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
