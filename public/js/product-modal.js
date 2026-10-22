const HappyToysModal = (() => {
  let prod = null;
  let curOptionType = "standard"; // 'size' | 'lang' | 'holes' | 'standard'
  let curOptionValue = "Standard";
  let curPrice = 0;
  let qty = 1;
  const WA = "923707116317";

  function fmt(n) { return "PKR " + Number(n || 0).toLocaleString("en-PK"); }

  function open(p) {
    if (!p) return;
    prod = p;
    qty = 1;

    // Check which variant type is active for this product
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

    // 1. Size Variants Box
    let sizeBoxHtml = "";
    if (prod.hasVariants && Array.isArray(prod.variants) && prod.variants.length > 0) {
      sizeBoxHtml = `
        <div class="bg-amber-50/70 p-4 rounded-2xl border-2 border-amber-200 space-y-2">
          <span class="text-xs font-black text-slate-800 uppercase block">📏 Select Toy Size (Click to change price):</span>
          <div class="grid grid-cols-3 gap-2">
            ${prod.variants.map(v => {
              const act = v.size === curOptionValue ? "bg-blue-600 text-white border-blue-600 shadow-md scale-102" : "bg-white text-slate-800 border-amber-300";
              return `<button type="button" onclick="HappyToysModal.setOption('size', '${v.size}', ${v.pricePkr})" class="py-2.5 px-1 rounded-2xl border-2 font-black text-center transition cursor-pointer ${act}">
                <div class="text-xs">${v.size}</div>
                <div class="text-[10px] ${v.size === curOptionValue ? 'text-amber-200' : 'text-blue-600'}">${fmt(v.pricePkr)}</div>
              </button>`;
            }).join("")}
          </div>
        </div>
      `;
    }

    // 2. Book Language Variants Box
    let langBoxHtml = "";
    if (prod.hasLangVariants && Array.isArray(prod.langVariants) && prod.langVariants.length > 0) {
      langBoxHtml = `
        <div class="bg-emerald-50/80 p-4 rounded-2xl border-2 border-emerald-300 space-y-2">
          <span class="text-xs font-black text-slate-800 uppercase block">📚 Select Book Language (Edition & Price):</span>
          <div class="grid grid-cols-2 gap-2.5">
            ${prod.langVariants.map(l => {
              const act = l.lang === curOptionValue ? "bg-emerald-600 text-white border-emerald-600 shadow-md scale-102" : "bg-white text-slate-800 border-emerald-300";
              return `<button type="button" onclick="HappyToysModal.setOption('lang', '${l.lang}', ${l.pricePkr})" class="py-3 px-2 rounded-2xl border-2 font-black text-center transition cursor-pointer ${act}">
                <div class="text-xs sm:text-sm">📖 ${l.lang} Edition</div>
                <div class="text-xs ${l.lang === curOptionValue ? 'text-emerald-100' : 'text-emerald-700'} mt-0.5">${fmt(l.pricePkr)}</div>
              </button>`;
            }).join("")}
          </div>
        </div>
      `;
    }

    // 3. Bubble Gun Holes Variants Box
    let holesBoxHtml = "";
    if (prod.hasHoleVariants && Array.isArray(prod.holeVariants) && prod.holeVariants.length > 0) {
      holesBoxHtml = `
        <div class="bg-purple-50/80 p-4 rounded-2xl border-2 border-purple-300 space-y-2">
          <span class="text-xs font-black text-slate-800 uppercase block">🫧 Select Bubble Gun Holes:</span>
          <div class="grid grid-cols-3 gap-2">
            ${prod.holeVariants.map(h => {
              const act = h.holes === curOptionValue ? "bg-purple-600 text-white border-purple-600 shadow-md scale-102" : "bg-white text-slate-800 border-purple-300";
              return `<button type="button" onclick="HappyToysModal.setOption('holes', '${h.holes}', ${h.pricePkr})" class="py-2.5 px-1 rounded-2xl border-2 font-black text-center transition cursor-pointer ${act}">
                <div class="text-[11px] sm:text-xs">🫧 ${h.holes}</div>
                <div class="text-[10px] ${h.holes === curOptionValue ? 'text-purple-100' : 'text-purple-700'}">${fmt(h.pricePkr)}</div>
              </button>`;
            }).join("")}
          </div>
        </div>
      `;
    }

    // 4. Dimensions Display Badge
    let dimensionsBadgeHtml = prod.dimensions ? `
      <div class="flex items-center gap-2 bg-sky-50 text-sky-900 border border-sky-200 px-3.5 py-2 rounded-xl text-xs font-bold">
        <span>📐</span>
        <span><b>Product Dimensions:</b> ${prod.dimensions}</span>
      </div>
    ` : "";

    pg.innerHTML = `
      <div class="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 h-15 py-3 flex items-center justify-between shadow-xs">
        <button type="button" onclick="HappyToysModal.close()" class="px-3.5 py-2 rounded-xl bg-amber-100 text-amber-900 font-black text-xs flex items-center gap-1 cursor-pointer">← Back to Store</button>
        <span class="toy-title-font text-sm text-amber-500 truncate max-w-[180px]">${prod.name}</span>
        <button type="button" onclick="HappyToysModal.close(); HappyToysCart.openDrawer();" class="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-black text-xs cursor-pointer">🛒 Cart</button>
      </div>

      <div class="max-w-3xl mx-auto w-full p-4 pb-32 space-y-4">
        <div class="bg-white rounded-3xl p-4 border-4 border-amber-300 shadow-lg relative">
          <span class="absolute top-6 left-6 bg-amber-400 text-slate-900 text-xs font-black px-3 py-1 rounded-full shadow">🔥 Hot Deal</span>
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
            <span class="text-[11px] text-slate-400 font-bold">SKU: ${prod.sku || "HTS-01"} • Stock: ${prod.stockQty || 10} Available</span>
          </div>

          ${dimensionsBadgeHtml}

          <div class="bg-blue-50/80 p-4 rounded-2xl border-2 border-blue-200 flex items-center justify-between">
            <div>
              <span class="text-[11px] font-black text-slate-500 uppercase block">Selected: ${curOptionValue}</span>
              <span class="text-3xl font-black text-blue-600">${fmt(total)}</span>
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

          <div>
            <h3 class="text-xs font-black text-slate-400 uppercase mb-1">📝 Full Product Description</h3>
            <p class="p-3.5 rounded-2xl bg-slate-50 border text-slate-700 text-sm leading-relaxed font-semibold">${prod.shortDescription || "Kids premium quality toy with bright colors, safe materials, and fun learning features."}</p>
          </div>
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
