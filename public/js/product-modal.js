const HappyToysModal = (() => {
  let prod = null;
  let curOptionType = "standard";
  let curOptionValue = "Standard";
  let curPrice = 0;
  let curImage = "";
  let qty = 1;
  let slideTimer = null;
  let isAutoSliding = true;
  let currentSlideIdx = 0;
  let modalHistoryPushed = false;

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

  function buildGalleryList(p) {
    if (!p) return [];
    const list = [];
    if (Array.isArray(p.images) && p.images.length) {
      p.images.forEach(img => { if (img && !list.includes(img)) list.push(img); });
    }
    if (p.mainImage && !list.includes(p.mainImage)) {
      list.unshift(p.mainImage);
    }
    if (Array.isArray(p.variants)) { p.variants.forEach(v => { if (v.image && !list.includes(v.image)) list.push(v.image); }); }
    if (Array.isArray(p.inchVariants)) { p.inchVariants.forEach(iv => { if (iv.image && !list.includes(iv.image)) list.push(iv.image); }); }
    if (Array.isArray(p.langVariants)) { p.langVariants.forEach(lv => { if (lv.image && !list.includes(lv.image)) list.push(lv.image); }); }
    if (Array.isArray(p.holeVariants)) { p.holeVariants.forEach(hv => { if (hv.image && !list.includes(hv.image)) list.push(hv.image); }); }
    if (Array.isArray(p.customVariants)) { p.customVariants.forEach(cv => { if (cv.image && !list.includes(cv.image)) list.push(cv.image); }); }
    return list;
  }

  function stopAutoSlider() {
    if (slideTimer) {
      clearInterval(slideTimer);
      slideTimer = null;
    }
  }

  function animateMainImageSwap(imgUrl) {
    curImage = imgUrl;
    const imgEl = document.getElementById("modalMainImg");
    if (imgEl) {
      imgEl.classList.remove("hts-slide-anim");
      void imgEl.offsetWidth;
      imgEl.src = imgUrl;
      imgEl.classList.add("hts-slide-anim");
    }
    // Highlight active thumbnail and scroll it into view smoothly
    const thumbs = document.querySelectorAll(".hts-gallery-thumb");
    thumbs.forEach(t => {
      const isMatch = t.getAttribute("data-src") === imgUrl;
      if (isMatch) {
        t.classList.add("border-amber-500", "scale-105", "ring-2", "ring-amber-300");
        t.classList.remove("border-slate-200", "opacity-75");
        const strip = document.getElementById("modalThumbStrip");
        if (strip) {
          const scrollLeft = t.offsetLeft - (strip.clientWidth / 2) + (t.clientWidth / 2);
          strip.scrollTo({ left: Math.max(0, scrollLeft), behavior: "smooth" });
        }
      } else {
        t.classList.remove("border-amber-500", "scale-105", "ring-2", "ring-amber-300");
        t.classList.add("border-slate-200", "opacity-75");
      }
    });
  }

  function startAutoSlider() {
    stopAutoSlider();
    if (!isAutoSliding || !prod) return;
    const gallery = buildGalleryList(prod);
    if (gallery.length <= 1) return;

    slideTimer = setInterval(() => {
      if (!isAutoSliding || !prod) {
        stopAutoSlider();
        return;
      }
      const g = buildGalleryList(prod);
      if (g.length <= 1) return;
      currentSlideIdx = (currentSlideIdx + 1) % g.length;
      animateMainImageSwap(g[currentSlideIdx]);
    }, 2000);
  }

  function open(p) {
    if (!p) return;
    stopAutoSlider();
    prod = p;
    qty = 1;
    isAutoSliding = true;
    currentSlideIdx = 0;
    curImage = p.mainImage;
    saveRecentlyViewed(p.id);

    if (p.hasCustomVariants && Array.isArray(p.customVariants) && p.customVariants.length > 0) {
      curOptionType = "custom";
      curOptionValue = p.customVariants[0].name;
      curPrice = Number(p.customVariants[0].pricePkr);
      curImage = p.customVariants[0].image || p.mainImage;
    } else if (p.hasVariants && Array.isArray(p.variants) && p.variants.length > 0) {
      curOptionType = "size";
      curOptionValue = p.variants[0].size === "Big" ? "Large" : p.variants[0].size;
      curPrice = Number(p.variants[0].pricePkr);
      curImage = p.variants[0].image || p.mainImage;
    } else if (p.hasInchVariants && Array.isArray(p.inchVariants) && p.inchVariants.length > 0) {
      curOptionType = "inches";
      curOptionValue = p.inchVariants[0].inches;
      curPrice = Number(p.inchVariants[0].pricePkr);
      curImage = p.inchVariants[0].image || p.mainImage;
    } else if (p.hasLangVariants && Array.isArray(p.langVariants) && p.langVariants.length > 0) {
      curOptionType = "lang";
      curOptionValue = p.langVariants[0].lang;
      curPrice = Number(p.langVariants[0].pricePkr);
      curImage = p.langVariants[0].image || p.mainImage;
    } else if (p.hasHoleVariants && Array.isArray(p.holeVariants) && p.holeVariants.length > 0) {
      curOptionType = "holes";
      curOptionValue = p.holeVariants[0].holes;
      curPrice = Number(p.holeVariants[0].pricePkr);
      curImage = p.holeVariants[0].image || p.mainImage;
    } else {
      curOptionType = "standard";
      curOptionValue = "Standard";
      curPrice = Number(p.pricePkr || 1500);
    }

    let pg = document.getElementById("htsSeparateProductPage");
    const wasAlreadyOpen = pg && !pg.classList.contains("hidden");
    if (!pg) {
      pg = document.createElement("div");
      pg.id = "htsSeparateProductPage";
      pg.className = "fixed inset-0 z-[160] bg-slate-50 overflow-y-auto flex flex-col";
      document.body.appendChild(pg);
    }
    try {
      if (!wasAlreadyOpen) {
        if (location.hash.includes("#product=")) {
          history.replaceState({ htsStoreRoot: true }, "", location.pathname);
        }
        history.pushState({ htsModal: "product", id: p.id }, "", "#product=" + p.id);
        modalHistoryPushed = true;
      } else {
        history.replaceState({ htsModal: "product", id: p.id }, "", "#product=" + p.id);
      }
    } catch (e) {}
    document.body.style.overflow = "hidden";
    render();
    pg.classList.remove("hidden");
    pg.scrollTop = 0;
    startAutoSlider();
  }

  function setCustomVariant(idx) {
    if (!prod || !prod.customVariants || !prod.customVariants[idx]) return;
    isAutoSliding = false;
    stopAutoSlider();
    const cv = prod.customVariants[idx];
    curOptionType = "custom";
    curOptionValue = cv.name;
    curPrice = Number(cv.pricePkr);
    curImage = cv.image || prod.mainImage;
    render();
  }

  function setSizeVariant(idx) {
    if (!prod || !prod.variants || !prod.variants[idx]) return;
    isAutoSliding = false;
    stopAutoSlider();
    const v = prod.variants[idx];
    curOptionType = "size";
    curOptionValue = v.size === "Big" ? "Large" : v.size;
    curPrice = Number(v.pricePkr);
    curImage = v.image || prod.mainImage;
    render();
  }

  function setInchVariant(idx) {
    if (!prod || !prod.inchVariants || !prod.inchVariants[idx]) return;
    isAutoSliding = false;
    stopAutoSlider();
    const iv = prod.inchVariants[idx];
    curOptionType = "inches";
    curOptionValue = iv.inches;
    curPrice = Number(iv.pricePkr);
    curImage = iv.image || prod.mainImage;
    render();
  }

  function setLangVariant(idx) {
    if (!prod || !prod.langVariants || !prod.langVariants[idx]) return;
    isAutoSliding = false;
    stopAutoSlider();
    const lv = prod.langVariants[idx];
    curOptionType = "lang";
    curOptionValue = lv.lang;
    curPrice = Number(lv.pricePkr);
    curImage = lv.image || prod.mainImage;
    render();
  }

  function setHoleVariant(idx) {
    if (!prod || !prod.holeVariants || !prod.holeVariants[idx]) return;
    isAutoSliding = false;
    stopAutoSlider();
    const hv = prod.holeVariants[idx];
    curOptionType = "holes";
    curOptionValue = hv.holes;
    curPrice = Number(hv.pricePkr);
    curImage = hv.image || prod.mainImage;
    render();
  }

  function setOption(type, val, pr) {
    isAutoSliding = false;
    stopAutoSlider();
    curOptionType = type;
    curOptionValue = val;
    curPrice = Number(pr);
    render();
  }

  function switchMainImage(imgUrl) {
    isAutoSliding = false;
    stopAutoSlider();
    animateMainImageSwap(imgUrl);
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
    else if (curOptionType === "inches") optLine = `*📐 Selected Inches:* ${curOptionValue}\n`;
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
    const viewers = 1 + (h % 2);
    const revCount = 2 + (h % 3);

    // 5. Extra Custom Variants
    let customBoxHtml = "";
    if (prod.hasCustomVariants && Array.isArray(prod.customVariants) && prod.customVariants.length > 0) {
      customBoxHtml = `
        <div class="bg-indigo-50/70 p-3 rounded-2xl border-2 border-indigo-200 space-y-1.5">
          <span class="text-[11px] font-black text-slate-800 uppercase block">🌟 Select Option: <span class="text-indigo-700">${curOptionValue}</span></span>
          <div class="flex flex-wrap gap-1.5">
            ${prod.customVariants.map((cv, idx) => {
              const isSel = cv.name === curOptionValue;
              const cls = isSel
                ? "bg-slate-900 text-white border-slate-900 shadow-md scale-[1.02]"
                : "bg-white text-slate-800 border-slate-200 hover:border-indigo-400";
              return `<button type="button" onclick="HappyToysModal.setCustomVariant(${idx})" class="px-3 py-1.5 rounded-xl border-2 font-black text-xs transition cursor-pointer ${cls}">
                <div>${cv.name}</div>
                <div class="text-[10px] ${isSel ? 'text-amber-300' : 'text-blue-600'}">${fmt(cv.pricePkr)}</div>
              </button>`;
            }).join("")}
          </div>
        </div>
      `;
    }

    // 1. Size Variants Box (Small / Medium / Large)
    let sizeBoxHtml = "";
    if (prod.hasVariants && Array.isArray(prod.variants) && prod.variants.length > 0) {
      sizeBoxHtml = `
        <div class="bg-amber-50/70 p-3 rounded-2xl border-2 border-amber-200 space-y-1.5">
          <span class="text-[11px] font-black text-slate-800 uppercase block">📏 Size: <span class="text-blue-600">${curOptionValue}</span></span>
          <div class="grid grid-cols-3 gap-2">
            ${prod.variants.map((v, idx) => {
              const dispName = v.size === "Big" ? "Large" : v.size;
              const act = dispName === curOptionValue ? "bg-slate-900 text-white border-slate-900 shadow-md" : "bg-white text-slate-800 border-amber-300";
              return `<button type="button" onclick="HappyToysModal.setSizeVariant(${idx})" class="py-2 px-1 rounded-xl border-2 font-black text-center transition cursor-pointer ${act}">
                <div class="text-xs">${dispName}</div>
                <div class="text-[10px] ${dispName === curOptionValue ? 'text-amber-300' : 'text-blue-600'}">${fmt(v.pricePkr)}</div>
              </button>`;
            }).join("")}
          </div>
        </div>
      `;
    }

    // 2. Extra Inches Variants Box
    if (prod.hasInchVariants && Array.isArray(prod.inchVariants) && prod.inchVariants.length > 0) {
      sizeBoxHtml += `
        <div class="bg-sky-50/80 p-3 rounded-2xl border-2 border-sky-200 space-y-1.5">
          <span class="text-[11px] font-black text-slate-800 uppercase block">📐 Size in Inches: <span class="text-sky-700">${curOptionValue}</span></span>
          <div class="flex flex-wrap gap-1.5">
            ${prod.inchVariants.map((iv, idx) => {
              const act = iv.inches === curOptionValue ? "bg-slate-900 text-white border-slate-900 shadow-md" : "bg-white text-slate-800 border-sky-300";
              return `<button type="button" onclick="HappyToysModal.setInchVariant(${idx})" class="px-3 py-1.5 rounded-xl border-2 font-black text-xs text-center transition cursor-pointer ${act}">
                <div>${iv.inches}</div>
                <div class="text-[10px] ${iv.inches === curOptionValue ? 'text-amber-300' : 'text-blue-600'}">${fmt(iv.pricePkr)}</div>
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
        <div class="bg-emerald-50/80 p-3 rounded-2xl border-2 border-emerald-300 space-y-1.5">
          <span class="text-[11px] font-black text-slate-800 uppercase block">📚 Book Language: <span class="text-emerald-700">${curOptionValue}</span></span>
          <div class="grid grid-cols-2 gap-2">
            ${prod.langVariants.map((l, idx) => {
              const act = l.lang === curOptionValue ? "bg-emerald-600 text-white border-emerald-600 shadow-md" : "bg-white text-slate-800 border-emerald-300";
              return `<button type="button" onclick="HappyToysModal.setLangVariant(${idx})" class="py-2 px-2 rounded-xl border-2 font-black text-center transition cursor-pointer ${act}">
                <div class="text-xs">📖 ${l.lang} Edition</div>
                <div class="text-[10px] ${l.lang === curOptionValue ? 'text-emerald-100' : 'text-emerald-700'}">${fmt(l.pricePkr)}</div>
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
        <div class="bg-purple-50/80 p-3 rounded-2xl border-2 border-purple-300 space-y-1.5">
          <span class="text-[11px] font-black text-slate-800 uppercase block">🫧 Bubble Gun Holes: <span class="text-purple-700">${curOptionValue}</span></span>
          <div class="grid grid-cols-3 gap-2">
            ${prod.holeVariants.map((h, idx) => {
              const act = h.holes === curOptionValue ? "bg-purple-600 text-white border-purple-600 shadow-md" : "bg-white text-slate-800 border-purple-300";
              return `<button type="button" onclick="HappyToysModal.setHoleVariant(${idx})" class="py-2 px-1 rounded-xl border-2 font-black text-center transition cursor-pointer ${act}">
                <div class="text-[11px]">🫧 ${h.holes}</div>
                <div class="text-[10px] ${h.holes === curOptionValue ? 'text-purple-100' : 'text-purple-700'}">${fmt(h.pricePkr)}</div>
              </button>`;
            }).join("")}
          </div>
        </div>
      `;
    }

    let dimensionsBadgeHtml = prod.dimensions ? `
      <div class="flex items-center gap-2 bg-sky-50 text-sky-900 border border-sky-200 px-3 py-2 rounded-xl text-xs font-bold">
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

    const galleryList = buildGalleryList(prod);

    // SEPARATE WINDOWS FOR "YOU MIGHT ALSO LIKE" AND "RECENTLY VIEWED PRODUCTS"
    let separateBottomWindowsHtml = "";
    if (window.HappyToysApp && typeof window.HappyToysApp.generateCardHtml === "function") {
      const allP = window.HappyToysApp.getAllProducts();

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
      <style>
        @keyframes htsSlideIn {
          0% { opacity: 0.35; transform: translateX(35px) scale(0.97); }
          100% { opacity: 1; transform: translateX(0) scale(1); }
        }
        .hts-slide-anim {
          animation: htsSlideIn 0.38s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      </style>

      <div class="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 h-14 py-2.5 flex items-center justify-between shadow-xs">
        <button type="button" onclick="HappyToysModal.close()" class="px-3.5 py-1.5 rounded-xl bg-amber-100 text-amber-900 font-black text-xs flex items-center gap-1 cursor-pointer">← Back to Store</button>
        <span class="toy-title-font text-sm text-amber-500 truncate max-w-[180px]">${prod.name}</span>
        <button type="button" onclick="HappyToysModal.close(); HappyToysCart.openDrawer();" class="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-black text-xs cursor-pointer">🛒 Cart</button>
      </div>

      <div class="max-w-4xl mx-auto w-full p-3 sm:p-4 pb-32">
        <!-- Main Product Image Window (Compact so Image + Variants show together) -->
        <div class="bg-white rounded-3xl p-3 sm:p-4 border-4 border-amber-300 shadow-lg relative mb-3 overflow-hidden">
          <span class="absolute top-4 left-4 ${hasDiscount ? 'bg-red-600 text-white' : 'bg-amber-400 text-slate-900'} text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-full shadow z-10">${hasDiscount ? 'SALE' : '🔥 Hot Deal'}</span>
          <div class="w-full h-56 sm:h-80 flex items-center justify-center bg-white rounded-2xl overflow-hidden">
            <img id="modalMainImg" src="${curImage || prod.mainImage}" class="hts-slide-anim max-h-full max-w-full object-contain rounded-2xl transition-all duration-300" />
          </div>
          ${galleryList.length > 1 ? `
            <div id="modalThumbStrip" class="flex gap-2 mt-2.5 overflow-x-auto no-scrollbar pb-1">
              ${galleryList.map(img => `<img data-src="${img}" src="${img}" onclick="HappyToysModal.switchMainImage('${img}')" class="hts-gallery-thumb w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover cursor-pointer border-2 ${img === curImage ? 'border-amber-500 scale-105 ring-2 ring-amber-300' : 'border-slate-200 opacity-75'} shrink-0 transition" />`).join("")}
            </div>
          ` : ""}
          <div class="card-rainbow-strip rounded-b-xl mt-2"></div>
        </div>

        <!-- Main Product Details Window (Compact Title + Immediate Variants & Price) -->
        <div class="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-md space-y-3">
          <div>
            <div class="flex items-center gap-2 text-[11px] font-bold text-slate-500 mb-0.5">
              <span>🧸 ${prod.category || "Educational Toys"}</span>
              <span class="text-amber-500 ml-auto font-black">⭐ 4.8 (${revCount} reviews)</span>
            </div>
            <!-- Smaller Product Name -->
            <h1 class="text-base sm:text-lg font-black text-slate-900 leading-snug">${prod.name}</h1>
          </div>

          <!-- Variants Placed Right Below Product Name so Image & Variants are visible together -->
          ${customBoxHtml}
          ${sizeBoxHtml}
          ${langBoxHtml}
          ${holesBoxHtml}

          <!-- Price Box Right Next to Variants -->
          <div class="bg-blue-50/80 p-3 sm:p-3.5 rounded-2xl border-2 border-blue-200 flex items-center justify-between">
            <div>
              <span class="text-[10px] font-black text-slate-500 uppercase block">Price (${curOptionValue})</span>
              <div class="flex items-baseline gap-2">
                <span class="text-2xl sm:text-3xl font-black ${hasDiscount ? 'text-red-600' : 'text-blue-600'}">${fmt(total)}</span>
                ${hasDiscount ? `<del class="text-xs sm:text-sm font-bold text-slate-400">${fmt(Number(prod.comparePrice) * qty)}</del>` : ""}
              </div>
            </div>
            <span class="bg-emerald-100 text-emerald-700 font-black text-xs px-3 py-1 rounded-full">✓ In Stock</span>
          </div>

          ${dimensionsBadgeHtml}

          <div class="space-y-1 text-xs font-bold text-slate-700 bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
            <div class="flex items-center gap-2"><span>👁️</span> <span><b>${viewers} ${viewers === 1 ? 'person is' : 'people are'}</b> viewing this right now</span></div>
            <div class="flex items-center gap-2 text-emerald-700"><span>🔥</span> <span><b>Good Selling Product!</b> Fresh Stock Available</span></div>
          </div>

          <div class="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <span class="text-xs font-black text-slate-700 uppercase">🔢 Quantity:</span>
            <div class="flex items-center gap-3">
              <button type="button" onclick="HappyToysModal.setQty(-1)" class="w-8 h-8 rounded-xl bg-white border font-black text-base cursor-pointer">-</button>
              <span class="text-sm font-black">${qty}</span>
              <button type="button" onclick="HappyToysModal.setQty(1)" class="w-8 h-8 rounded-xl bg-amber-400 font-black text-base cursor-pointer">+</button>
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

  function close(fromPopState) {
    stopAutoSlider();
    const pg = document.getElementById("htsSeparateProductPage");
    const wasOpen = pg && !pg.classList.contains("hidden");
    if (pg) pg.classList.add("hidden");
    document.body.style.overflow = "";
    try { localStorage.setItem("hts_last_splash_ts", String(Date.now())); } catch (e) {}

    if (!fromPopState && modalHistoryPushed && wasOpen) {
      modalHistoryPushed = false;
      try { history.back(); } catch (e) {}
    } else {
      modalHistoryPushed = false;
      if (location.hash.includes("#product=")) {
        try { history.replaceState({ htsStoreRoot: true }, "", location.pathname); } catch (e) {}
      }
    }
  }

  window.addEventListener("popstate", () => {
    const pg = document.getElementById("htsSeparateProductPage");
    if (pg && !pg.classList.contains("hidden")) {
      close(true);
    }
  });

  return { open, close, setOption, setSizeVariant, setInchVariant, setLangVariant, setHoleVariant, setCustomVariant, switchMainImage, setQty, buyWhatsApp };
})();
window.HappyToysModal = HappyToysModal;
