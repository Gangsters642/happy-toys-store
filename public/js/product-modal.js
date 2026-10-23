const HappyToysModal = (() => {
  let prod = null;
  let curOptionType = "standard";
  let curOptionValue = "Standard";
  let curPrice = 0;
  let curImage = "";
  let qty = 1;
  const WA = "923707116317";
  const RECENT_KEY = "hts_recently_viewed_ids";

  function fmt(n) { return "PKR " + Number(n || 0).toLocaleString("en-PK"); }
  function hashStr(str) { let h = 0; for (let i = 0; i < (str || "").length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0; return Math.abs(h); }

  function saveRecentlyViewed(id) {
    try {
      let arr = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
      arr = [id, ...arr.filter(x => x !== id)].slice(0, 8);
      localStorage.setItem(RECENT_KEY, JSON.stringify(arr));
    } catch (e) {}
  }

  function open(p) {
    if (!p) return;
    prod = p;
    qty = 1;
    curImage = p.mainImage;
    saveRecentlyViewed(p.id);

    if (p.hasCustomVariants && Array.isArray(p.customVariants) && p.customVariants.length > 0) {
      curOptionType = "custom";
      curOptionValue = p.customVariants[0].name;
      curPrice = Number(p.customVariants[0].pricePkr);
      curImage = p.customVariants[0].image || p.mainImage;
    } else if (p.hasVariants && Array.isArray(p.variants) && p.variants.length > 0) {
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

  function setCustomVariant(idx) {
    if (!prod || !prod.customVariants || !prod.customVariants[idx]) return;
    const cv = prod.customVariants[idx];
    curOptionType = "custom";
    curOptionValue = cv.name;
    curPrice = Number(cv.pricePkr);
    curImage = cv.image || prod.mainImage;
    render();
  }

  function setOption(type, val, pr) {
    curOptionType = type;
    curOptionValue = val;
    curPrice = Number(pr);
    render();
  }

  function switchMainImage(imgUrl) {
    curImage = imgUrl;
    const imgEl = document.getElementById("modalMainImg");
    if (imgEl) imgEl.src = imgUrl;
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
    if (curOptionType === "custom") optLine = `*🌟 Selected Option:* ${curOptionValue}\n`;
    else if (curOptionType === "size") optLine = `*📏 Selected Size:* ${curOptionValue}\n`;
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
    const viewers = 1 + (h % 2); // 1 or 2 people viewing
    const revCount = 2 + (h % 3); // 2, 3, or 4 reviews

    // 5. Extra Custom Variants (Habiba Store Style Pill Buttons + Image Switch)
    let customBoxHtml = "";
    if (prod.hasCustomVariants && Array.isArray(prod.customVariants) && prod.customVariants.length > 0) {
      customBoxHtml = `
        <div class="bg-indigo-50/70 p-4 rounded-2xl border-2 border-indigo-200 space-y-2.5">
          <span class="text-xs font-black text-slate-800 block">🌟 Select Option: <span class="text-indigo-700">${curOptionValue}</span></span>
          <div class="flex flex-wrap gap-2">
            ${prod.customVariants.map((cv, idx) => {
              const isSel = cv.name === curOptionValue;
              const cls = isSel
                ? "bg-slate-900 text-white border-slate-900 shadow-md scale-[1.03]"
                : "bg-white text-slate-800 border-slate-200 hover:border-indigo-400";
              return `<button type="button" onclick="HappyToysModal.setCustomVariant(${idx})" class="px-3.5 py-2 rounded-xl border-2 font-black text-xs transition cursor-pointer ${cls}">
                <div>${cv.name}</div>
                <div class="text-[10px] ${isSel ? 'text-amber-300' : 'text-blue-600'}">${fmt(cv.pricePkr)}</div>
              </button>`;
            }).join("")}
          </div>
        </div>
      `;
    }

    // 1. Size Variants Box
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

    // 3. Book Language Variants Box
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

    // 4. Bubble Gun Holes Variants Box
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

    // Build all gallery thumbnails (product images + custom variant images)
    const galleryList = [];
    if (Array.isArray(prod.images) && prod.images.length) {
      prod.images.forEach(img => { if (img && !galleryList.includes(img)) galleryList.push(img); });
    } else if (prod.mainImage) {
      galleryList.push(prod.mainImage);
    }
    if (Array.isArray(prod.customVariants)) {
      prod.customVariants.forEach(cv => { if (cv.image && !galleryList.includes(cv.image)) galleryList.push(cv.image); });
    }

    // SEPARATE WINDOWS FOR "YOU MIGHT ALSO LIKE" AND "RECENTLY VIEWED PRODUCTS"
    let separateBottomWindowsHtml = "";
    if (window.HappyToysApp && typeof window.HappyToysApp.generateCardHtml === "function") {
      const allP = window.HappyToysApp.getAllProducts();

      // 1. Separate Window: You Might Also Like
      const related = allP.filter(x => x.id !== prod.id && x.isPublished && (x.category === prod.category || true)).slice(0, 4);
      if (related.length > 0) {
        separateBottomWindowsHtml += `
          <section class="bg-white rounded-3xl p-4 sm:p-5 border-2 border-amber-200 shadow-md mt-6 space-y-4">
            <div class="flex flex-col items-center justify-center border-b-2 border-amber-200 pb-4 mb-2 text-center">
              <div class="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 text-white font-black text-lg sm:text-2xl tracking-wide shadow-md flex items-center justify-center gap-2">
                <span>✨</span> <span>You Might Also Like</span> <span>✨</span>
              </div>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              ${related.map((r, i) => window.HappyToysApp.generateCardHtml(r, i)).join("")}
            </div>
          </section>
        `;
      }

      // 2. Separate Window: Recently Viewed Products
      try {
        const rvIds = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
        const rvProducts = rvIds.filter(id => id !== prod.id).map(id => allP.find(x => x.id === id)).filter(Boolean).slice(0, 4);
        if (rvProducts.length > 0) {
          separateBottomWindowsHtml += `
            <section class="bg-white rounded-3xl p-4 sm:p-5 border-2 border-blue-200 shadow-md mt-6 space-y-4">
              <div class="flex flex-col items-center justify-center border-b-2 border-blue-200 pb-4 mb-2 text-center">
                <div class="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white font-black text-lg sm:text-2xl tracking-wide shadow-md flex items-center justify-center gap-2">
                  <span>🕒</span> <span>Recently Viewed Products</span>
                </div>
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                ${rvProducts.map((r, i) => window.HappyToysApp.generateCardHtml(r, i)).join("")}
              </div>
            </section>
          `;
        }
      } catch (e) {}
    }

    pg.innerHTML = `
      <div class="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 h-15 py-3 flex items-center justify-between shadow-xs">
        <button type="button" onclick="HappyToysModal.close()" class="px-3.5 py-2 rounded-xl bg-amber-100 text-amber-900 font-black text-xs flex items-center gap-1 cursor-pointer">← Back to Store</button>
        <span class="toy-title-font text-sm text-amber-500 truncate max-w-[180px]">${prod.name}</span>
        <button type="button" onclick="HappyToysModal.close(); HappyToysCart.openDrawer();" class="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-black text-xs cursor-pointer">🛒 Cart</button>
      </div>

      <div class="max-w-4xl mx-auto w-full p-4 pb-32">
        <!-- Main Product Image Window -->
        <div class="bg-white rounded-3xl p-4 border-4 border-amber-300 shadow-lg relative mb-4">
          <span class="absolute top-6 left-6 ${hasDiscount ? 'bg-red-600 text-white' : 'bg-amber-400 text-slate-900'} text-xs font-black px-3 py-1 rounded-full shadow z-10">${hasDiscount ? 'SALE' : '🔥 Hot Deal'}</span>
          <img id="modalMainImg" src="${curImage || prod.mainImage}" class="w-full aspect-square object-cover rounded-2xl transition-all duration-300" />
          ${galleryList.length > 1 ? `
            <div class="flex gap-2 mt-3 overflow-x-auto no-scrollbar pb-1">
              ${galleryList.map(img => `<img src="${img}" onclick="HappyToysModal.switchMainImage('${img}')" class="w-14 h-14 rounded-xl object-cover cursor-pointer border-2 ${img === curImage ? 'border-amber-500 scale-105' : 'border-slate-200'} shrink-0 transition" />`).join("")}
            </div>
          ` : ""}
          <div class="card-rainbow-strip rounded-b-xl mt-2"></div>
        </div>

        <!-- Main Product Details Window -->
        <div class="bg-white rounded-3xl p-5 border border-slate-200 shadow-md space-y-4">
          <div>
            <div class="flex items-center gap-2 text-xs font-bold text-slate-500 mb-1">
              <span>🧸 ${prod.category || "Educational Toys"}</span>
              <span class="text-amber-500 ml-auto font-black">⭐ 4.8 (${revCount} reviews)</span>
            </div>
            <h1 class="text-2xl font-black text-slate-900">${prod.name}</h1>
          </div>

          <div class="space-y-1.5 text-xs font-bold text-slate-700 bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <div class="flex items-center gap-2"><span>👁️</span> <span><b>${viewers} ${viewers === 1 ? 'person is' : 'people are'}</b> viewing this right now</span></div>
            <div class="flex items-center gap-2 text-emerald-700"><span>🔥</span> <span><b>Good Selling Product!</b> Fresh Stock Available</span></div>
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

          ${customBoxHtml}
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
            <h3 class="text-xs font-black text-slate-400 uppercase mb-1">📝 Product Description</h3>
            <p class="p-3.5 rounded-2xl bg-slate-50 border text-slate-700 text-sm leading-relaxed font-semibold whitespace-pre-line">${prod.shortDescription || "Kids premium quality toy with bright colors, safe materials, and fun learning features."}</p>
            ${keyFeaturesHtml}
            ${packageIncludesHtml}
          </div>
        </div>

        <!-- SEPARATE WINDOWS BELOW FOR YOU MIGHT ALSO LIKE & RECENTLY VIEWED -->
        ${separateBottomWindowsHtml}
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

    if (window.HappyToysApp && typeof window.HappyToysApp.initScrollAnimations === "function") {
      setTimeout(() => window.HappyToysApp.initScrollAnimations(), 60);
    }
  }

  function close() {
    document.getElementById("htsSeparateProductPage")?.classList.add("hidden");
    document.body.style.overflow = "";
    if (location.hash.includes("#product=")) history.replaceState(null, "", location.pathname);
  }

  return { open, close, setOption, setCustomVariant, switchMainImage, setQty, buyWhatsApp };
})();
window.HappyToysModal = HappyToysModal;
