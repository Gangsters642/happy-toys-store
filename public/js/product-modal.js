const HappyToysModal = (() => {
  let prod = null;
  let curOptionType = "standard";
  let curOptionValue = "Standard";
  let curPrice = 0;
  let qty = 1;
  const WA = "923707116317";
  const RECENT_KEY = "hts_recently_viewed_ids";

  function fmt(n) { return "PKR " + Number(n || 0).toLocaleString("en-PK"); }
  function hashStr(str) { let h = 0; for (let i = 0; i < (str || "").length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0; return Math.abs(h); }

  function saveRecentlyViewed(id) {
    try {
      let arr = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
      arr = [id, ...arr.filter(x => x !== id)].slice(0, 6);
      localStorage.setItem(RECENT_KEY, JSON.stringify(arr));
    } catch (e) {}
  }

  function open(p) {
    if (!p) return;
    prod = p;
    qty = 1;
    saveRecentlyViewed(p.id);

    if (p.hasVariants && Array.isArray(p.variants) && p.variants.length > 0) {
      curOptionType = "size";
      curOptionValue = p.variants[0].size;
      curPrice = Number(p.variants[0].pricePkr);
    } else if (p.hasLangVariants && Array.isArray(p.langVariants) && p.langVariants.length > 0) {
      curOptionType = "lang";
      curOptionValue = p.langVariants[0].lang;
      curPrice = Number(p.langVariants[0].pricePkr);
    } else if (p.hasHoleVariants && Array.isArray(p.holeVariants) && p.holeVariants.length > 0) {
      curOptionType = "holes";
      curOptionValue = p.holeVariants[0].holes;
      curPrice = Number(p.holeVariants[0].pricePkr);
    } else {
      curOptionType = "standard";
      curOptionValue = "Standard";
      curPrice = Number(p.pricePkr || 1500);
    }

    let pg = document.getElementById("htsSeparateProductPage");
    if (!pg) {
      pg = document.createElement("div");
      pg.id = "htsSeparateProductPage";
      pg.className = "fixed inset-0 z-[160] bg-slate-50 overflow-y-auto flex flex-col";
      document.body.appendChild(pg);
    }
    document.body.style.overflow = "hidden";
    render();
    pg.classList.remove("hidden");
    pg.scrollTop = 0;
  }

  function setOption(type, val, pr) {
    curOptionType = type;
    curOptionValue = val;
    curPrice = Number(pr);
    render();
  }

  function setQty(d) {
    qty = Math.max(1, qty + d);
    render();
  }

  function buyWhatsApp() {
    if (!prod) return;
    const total = curPrice * qty;
    const link = `${location.origin}/#product=${prod.id}`;
    
    let optLine = "";
    if (curOptionType === "size") optLine = `*📏 Selected Size:* ${curOptionValue}\n`;
    else if (curOptionType === "lang") optLine = `*📖 Book Language:* ${curOptionValue} Edition\n`;
    else if (curOptionType === "holes") optLine = `*🫧 Bubble Gun:* ${curOptionValue}\n`;

    let dimLine = prod.dimensions ? `*📐 Dimensions:* ${prod.dimensions}\n` : "";

    const msg =
      `Hello *Happy Toys Store*! 🧸\n` +
      `I want to order this product:\n\n` +
      `*🧸 Product:* ${prod.name}\n` +
      optLine +
      dimLine +
      `*🔢 Quantity:* ${qty}\n` +
      `*💰 Total Price:* ${fmt(total)}\n` +
      `*📝 Details:* ${prod.shortDescription || "Premium Kids Toy"}\n\n` +
      `*🔗 Product Link:* ${link}\n\n` +
      `Please confirm my order!`;

    window.open(`https://wa.me/${WA}?text=${encodeURIComponent(msg)}`, "_blank");
  }

  function render() {
    const pg = document.getElementById("htsSeparateProductPage");
    if (!pg || !prod) return;

    const total = curPrice * qty;
    const hasDiscount = prod.comparePrice && Number(prod.comparePrice) > curPrice;
    const h = hashStr(prod.id);
    const viewers = 22 + (h % 25);
    const recentOrders = 1200 + (h % 1800);

    let sizeBoxHtml = "";
    if (prod.hasVariants && Array.isArray(prod.variants) && prod.variants.length > 0) {
      sizeBoxHtml = `
        <div class="bg-amber-50/70 p-4 rounded-2xl border-2 border-amber-200 space-y-2">
          <span class="text-xs font-black text-slate-800 uppercase block">📏 Size: <span class="text-blue-600">${curOptionValue}</span></span>
          <div class="grid grid-cols-3 gap-2">
            ${prod.variants.map(v => {
              const act = v.size === curOptionValue ? "bg-slate-900 text-white border-slate-900 shadow-md" : "bg-white text-slate-800 border-amber-300";
              return `<button type="button" onclick="HappyToysModal.setOption('size', '${v.size}', ${v.pricePkr})" class="py-2.5 px-1 rounded-xl border-2 font-black text-center transition cursor-pointer ${act}">
                <div class="text-xs">${v.size}</div>
                <div class="text-[10px] ${v.size === curOptionValue ? 'text-amber-300' : 'text-blue-600'}">${fmt(v.pricePkr)}</div>
              </button>`;
            }).join("")}
          </div>
        </div>
      `;
    }

    let langBoxHtml = "";
    if (prod.hasLangVariants && Array.isArray(prod.langVariants) && prod.langVariants.length > 0) {
      langBoxHtml = `
        <div class="bg-emerald-50/80 p-4 rounded-2xl border-2 border-emerald-300 space-y-2">
          <span class="text-xs font-black text-slate-800 uppercase block">📚 Book Language: <span class="text-emerald-700">${curOptionValue}</span></span>
          <div class="grid grid-cols-2 gap-2.5">
            ${prod.langVariants.map(l => {
              const act = l.lang === curOptionValue ? "bg-emerald-600 text-white border-emerald-600 shadow-md" : "bg-white text-slate-800 border-emerald-300";
              return `<button type="button" onclick="HappyToysModal.setOption('lang', '${l.lang}', ${l.pricePkr})" class="py-3 px-2 rounded-xl border-2 font-black text-center transition cursor-pointer ${act}">
                <div class="text-xs sm:text-sm">📖 ${l.lang} Edition</div>
                <div class="text-xs ${l.lang === curOptionValue ? 'text-emerald-100' : 'text-emerald-700'} mt-0.5">${fmt(l.pricePkr)}</div>
              </button>`;
            }).join("")}
          </div>
        </div>
      `;
    }

    let holesBoxHtml = "";
    if (prod.hasHoleVariants && Array.isArray(prod.holeVariants) && prod.holeVariants.length > 0) {
      holesBoxHtml = `
        <div class="bg-purple-50/80 p-4 rounded-2xl border-2 border-purple-300 space-y-2">
          <span class="text-xs font-black text-slate-800 uppercase block">🫧 Bubble Gun Holes: <span class="text-purple-700">${curOptionValue}</span></span>
          <div class="grid grid-cols-3 gap-2">
            ${prod.holeVariants.map(h => {
              const act = h.holes === curOptionValue ? "bg-purple-600 text-white border-purple-600 shadow-md" : "bg-white text-slate-800 border-purple-300";
              return `<button type="button" onclick="HappyToysModal.setOption('holes', '${h.holes}', ${h.pricePkr})" class="py-2.5 px-1 rounded-xl border-2 font-black text-center transition cursor-pointer ${act}">
                <div class="text-[11px] sm:text-xs">🫧 ${h.holes}</div>
                <div class="text-[10px] ${h.holes === curOptionValue ? 'text-purple-100' : 'text-purple-700'}">${fmt(h.pricePkr)}</div>
              </button>`;
            }).join("")}
          </div>
        </div>
      `;
    }

    let dimensionsBadgeHtml = prod.dimensions ? `
      <div class="flex items-center gap-2 bg-sky-50 text-sky-900 border border-sky-200 px-3.5 py-2.5 rounded-xl text-xs font-bold">
        <span>📐</span>
        <span><b>Size / Dimensions:</b> ${prod.dimensions}</span>
      </div>
    ` : "";

    let keyFeaturesHtml = "";
    if (prod.keyFeatures && prod.keyFeatures.trim()) {
      const lines = prod.keyFeatures.split("\n").map(s => s.trim()).filter(Boolean);
      if (lines.length) {
        keyFeaturesHtml = `
          <div class="space-y-2 pt-2">
            <h3 class="text-sm font-black text-slate-900 flex items-center gap-1.5">✨ Key Features</h3>
            <ul class="space-y-1.5 bg-amber-50/40 p-3.5 rounded-2xl border border-amber-100">
              ${lines.map(l => `<li class="text-xs sm:text-sm text-slate-700 font-bold flex items-start gap-2"><span class="text-amber-500">🌟</span><span>${l}</span></li>`).join("")}
            </ul>
          </div>
        `;
      }
    }

    let packageIncludesHtml = "";
    if (prod.packageIncludes && prod.packageIncludes.trim()) {
      const lines = prod.packageIncludes.split("\n").map(s => s.trim()).filter(Boolean);
      if (lines.length) {
        packageIncludesHtml = `
          <div class="space-y-2 pt-2">
            <h3 class="text-sm font-black text-slate-900 flex items-center gap-1.5">📦 Package Includes</h3>
            <ul class="space-y-1.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              ${lines.map(l => `<li class="text-xs sm:text-sm text-slate-700 font-bold flex items-start gap-2"><span class="text-blue-600">•</span><span>${l}</span></li>`).join("")}
            </ul>
          </div>
        `;
      }
    }

    // You Might Also Like & Recently Viewed
    const allProducts = window.HappyToysApp ? window.HappyToysApp.getAllProducts() : [];
    const related = allProducts.filter(x => x.id !== prod.id && x.isPublished).slice(0, 4);
    let relatedSectionHtml = "";
    if (related.length > 0) {
      relatedSectionHtml = `
        <div class="pt-6 border-t border-slate-200 space-y-3">
          <h3 class="text-lg font-black text-slate-900 text-center">You Might Also Like</h3>
          <div class="grid grid-cols-2 gap-3">
            ${related.map(r => `
              <div onclick="HappyToysModal.open(HappyToysApp.getProductById('${r.id}'))" class="bg-white rounded-2xl border border-slate-200 p-2.5 shadow-xs cursor-pointer hover:border-amber-400 transition">
                <img src="${r.mainImage}" class="w-full aspect-square object-cover rounded-xl mb-2" />
                <h4 class="text-xs font-extrabold text-slate-900 truncate">${r.name}</h4>
                <div class="text-sm font-black text-blue-600 mt-0.5">${fmt(r.pricePkr)}</div>
              </div>
            `).join("")}
          </div>
        </div>
      `;
    }

    pg.innerHTML = `
      <div class="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 h-15 py-3 flex items-center justify-between shadow-xs">
        <button type="button" onclick="HappyToysModal.close()" class="px-3.5 py-2 rounded-xl bg-amber-100 text-amber-900 font-black text-xs flex items-center gap-1 cursor-pointer">← Back to Store</button>
        <span class="toy-title-font text-sm text-amber-500 truncate max-w-[180px]">${prod.name}</span>
        <button type="button" onclick="HappyToysModal.close(); HappyToysCart.openDrawer();" class="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-black text-xs cursor-pointer">🛒 Cart</button>
      </div>

      <div class="max-w-3xl mx-auto w-full p-4 pb-32 space-y-4">
        <div class="bg-white rounded-3xl p-4 border-4 border-amber-300 shadow-lg relative">
          <span class="absolute top-6 left-6 ${hasDiscount ? 'bg-red-600 text-white' : 'bg-amber-400 text-slate-900'} text-xs font-black px-3 py-1 rounded-full shadow">${hasDiscount ? 'SALE' : '🔥 Hot Deal'}</span>
          <img src="${prod.mainImage}" class="w-full aspect-square object-cover rounded-2xl" />
          <div class="card-rainbow-strip rounded-b-xl mt-2"></div>
        </div>

        <div class="bg-white rounded-3xl p-5 border border-slate-200 shadow-md space-y-4">
          <div>
            <div class="flex items-center gap-2 text-xs font-bold text-slate-500 mb-1">
              <span>🧸 ${prod.category || "Educational Toys"}</span>
              <span class="text-amber-500 ml-auto font-black">⭐ 4.8 (120 reviews)</span>
            </div>
            <h1 class="text-2xl font-black text-slate-900">${prod.name}</h1>
          </div>

          <!-- Habiba Store Social Proof / Live Viewers -->
          <div class="space-y-1.5 text-xs font-bold text-slate-700 bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <div class="flex items-center gap-2"><span>👁️</span> <span><b>${viewers} people</b> are viewing this right now</span></div>
            <div class="flex items-center gap-2"><span>❤️</span> <span><b>Loved product!</b> Best Seller in Pakistan</span></div>
            <div class="flex items-center gap-2 text-rose-600"><span>🔥</span> <span><b>Last 30 days orders: ${recentOrders}</b> | Limited Stock Left!</span></div>
          </div>

          ${dimensionsBadgeHtml}

          <div class="bg-blue-50/80 p-4 rounded-2xl border-2 border-blue-200 flex items-center justify-between">
            <div>
              <span class="text-[11px] font-black text-slate-500 uppercase block">Price (${curOptionValue})</span>
              <div class="flex items-baseline gap-2">
                <span class="text-3xl font-black ${hasDiscount ? 'text-red-600' : 'text-blue-600'}">${fmt(total)}</span>
                ${hasDiscount ? `<del class="text-sm font-bold text-slate-400">${fmt(Number(prod.comparePrice) * qty)}</del>` : ""}
              </div>
            </div>
            <span class="bg-emerald-100 text-emerald-700 font-black text-xs px-3 py-1 rounded-full">✓ In Stock</span>
          </div>

          ${sizeBoxHtml}
          ${langBoxHtml}
          ${holesBoxHtml}

          <div class="flex items-center justify-between bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <span class="text-xs font-black text-slate-700 uppercase">🔢 Quantity:</span>
            <div class="flex items-center gap-3">
              <button type="button" onclick="HappyToysModal.setQty(-1)" class="w-9 h-9 rounded-xl bg-white border font-black text-lg cursor-pointer">-</button>
              <span class="text-base font-black">${qty}</span>
              <button type="button" onclick="HappyToysModal.setQty(1)" class="w-9 h-9 rounded-xl bg-amber-400 font-black text-lg cursor-pointer">+</button>
            </div>
          </div>

          <!-- Delivery & Customer Review Box -->
          <div class="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-3.5 space-y-2">
            <div class="text-xs font-black text-emerald-900 flex items-center gap-2">🚚 Fast Cash on Delivery Across Pakistan (3-5 Days)</div>
            <div class="bg-white p-2.5 rounded-xl border border-emerald-100 text-xs">
              <div class="flex items-center justify-between font-black text-slate-800"><span>Chaudhary</span><span class="text-amber-400">★★★★★</span></div>
              <p class="text-slate-600 font-semibold mt-0.5">"Great value for money, kids loved it! Highly recommend!"</p>
            </div>
          </div>

          <div>
            <h3 class="text-xs font-black text-slate-400 uppercase mb-1">📝 Product Description</h3>
            <p class="p-3.5 rounded-2xl bg-slate-50 border text-slate-700 text-sm leading-relaxed font-semibold whitespace-pre-line">${prod.shortDescription || "Kids premium quality toy with bright colors, safe materials, and fun learning features."}</p>
            ${keyFeaturesHtml}
            ${packageIncludesHtml}
          </div>

          ${relatedSectionHtml}
        </div>
      </div>

      <div class="fixed bottom-0 left-0 right-0 z-30 bg-white border-t-2 border-amber-300 p-3 shadow-2xl">
        <div class="max-w-3xl mx-auto flex items-center gap-2.5">
          <button type="button" onclick="HappyToysCart.addToCart('${prod.id}', '${curOptionValue}', ${curPrice}, ${qty})" class="py-3.5 px-3 rounded-2xl bg-amber-400 hover:bg-amber-500 text-white font-black text-xs shadow-md shrink-0 cursor-pointer flex items-center gap-1">
            <span>🛒 Add to Cart</span>
          </button>
          <button type="button" onclick="HappyToysModal.buyWhatsApp()" class="btn-vip-gradient flex-1 py-3.5 px-3 rounded-2xl text-white font-black text-xs sm:text-sm shadow-xl animate-bounce text-center cursor-pointer flex items-center justify-center gap-1.5">
            <svg class="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24"><path d="M19 6h-2c0-2.76-2.24-5-5-5S7 3.24 7 6H5c-1.1 0-1.99.9-1.99 2L3 20c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-3c1.66 0 3 1.34 3 3H9c0-1.66 1.34-3 3-3zm0 10c-2.76 0-5-2.24-5-5h2c0 1.66 1.34 3 3 3s3-1.34 3-3h2c0 2.76-2.24 5-5 5z"/></svg>
            <span>Buy Now (${fmt(total)})</span>
          </button>
        </div>
      </div>`;
  }

  function close() {
    document.getElementById("htsSeparateProductPage")?.classList.add("hidden");
    document.body.style.overflow = "";
    if (location.hash.includes("#product=")) history.replaceState(null, "", location.pathname);
  }

  return { open, close, setOption, setQty, buyWhatsApp };
})();
window.HappyToysModal = HappyToysModal;
