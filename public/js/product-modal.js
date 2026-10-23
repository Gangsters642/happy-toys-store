const HappyToysModal = (() => {
  let prod = null, curOptionType = "standard", curOptionValue = "Standard", curPrice = 0, curImage = null, qty = 1;
  const WA = "923707116317";
  const RECENT_KEY = "hts_recently_viewed_ids";

  function fmt(n) { return "PKR " + Number(n || 0).toLocaleString("en-PK"); }
  function hashStr(str) { let h = 0; for (let i = 0; i < (str || "").length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0; return Math.abs(h); }

  function saveRecentlyViewed(id) {
    try { let arr = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); arr = [id, ...arr.filter(x => x !== id)].slice(0, 6); localStorage.setItem(RECENT_KEY, JSON.stringify(arr)); } catch (e) {}
  }

  function open(p) {
    if (!p) return; prod = p; qty = 1; curImage = p.mainImage; saveRecentlyViewed(p.id);

    if (p.hasCustomVariants && p.customVariants?.length) {
      curOptionType = "custom"; curOptionValue = p.customVariants[0].name; curPrice = Number(p.customVariants[0].pricePkr); curImage = p.customVariants[0].image || p.mainImage;
    } else if (p.hasVariants && p.variants?.length) {
      curOptionType = "size"; curOptionValue = p.variants[0].size; curPrice = Number(p.variants[0].pricePkr);
    } else if (p.hasLangVariants && p.langVariants?.length) {
      curOptionType = "lang"; curOptionValue = p.langVariants[0].lang; curPrice = Number(p.langVariants[0].pricePkr);
    } else if (p.hasHoleVariants && p.holeVariants?.length) {
      curOptionType = "holes"; curOptionValue = p.holeVariants[0].holes; curPrice = Number(p.holeVariants[0].pricePkr);
    } else {
      curOptionType = "standard"; curOptionValue = "Standard"; curPrice = Number(p.pricePkr || 1500);
    }

    let pg = document.getElementById("htsSeparateProductPage");
    if (!pg) { pg = document.createElement("div"); pg.id = "htsSeparateProductPage"; pg.className = "fixed inset-0 z-[160] bg-slate-50 overflow-y-auto flex flex-col"; document.body.appendChild(pg); }
    document.body.style.overflow = "hidden"; render(); pg.classList.remove("hidden"); pg.scrollTop = 0;
  }

  function setCustomVariant(idx) {
    const cv = prod.customVariants[idx];
    curOptionType = "custom"; curOptionValue = cv.name; curPrice = Number(cv.pricePkr); curImage = cv.image || prod.mainImage;
    render();
  }

  function setOption(type, val, pr) {
    curOptionType = type; curOptionValue = val; curPrice = Number(pr); curImage = prod.mainImage; render();
  }

  function setQty(d) { qty = Math.max(1, qty + d); render(); }

  function buyWhatsApp() {
    if (!prod) return; const total = curPrice * qty; const link = `${location.origin}/#product=${prod.id}`;
    let optLine = "";
    if (curOptionType === "custom") optLine = `*✨ Selected Option:* ${curOptionValue}\n`;
    else if (curOptionType === "size") optLine = `*📏 Selected Size:* ${curOptionValue}\n`;
    else if (curOptionType === "lang") optLine = `*📖 Book Language:* ${curOptionValue} Edition\n`;
    else if (curOptionType === "holes") optLine = `*🫧 Bubble Gun:* ${curOptionValue}\n`;
    let dimLine = prod.dimensions ? `*📐 Dimensions:* ${prod.dimensions}\n` : "";

    const msg = `Hello *Happy Toys Store*! 🧸\nI want to order this product:\n\n*🧸 Product:* ${prod.name}\n${optLine}${dimLine}*🔢 Quantity:* ${qty}\n*💰 Total Price:* ${fmt(total)}\n*🔗 Product Link:* ${link}\n\nPlease confirm my order!`;
    window.open(`https://wa.me/${WA}?text=${encodeURIComponent(msg)}`, "_blank");
  }

  function render() {
    const pg = document.getElementById("htsSeparateProductPage"); if (!pg || !prod) return;
    const total = curPrice * qty; const hasDiscount = prod.comparePrice && Number(prod.comparePrice) > curPrice;
    const viewers = 1 + (hashStr(prod.id) % 3);

    // Dynamic Options UI
    let optsHtml = "";
    if (prod.hasCustomVariants && prod.customVariants?.length) {
      optsHtml = `<div class="bg-indigo-50/80 p-4 rounded-2xl border-2 border-indigo-200 space-y-2"><span class="text-xs font-black text-slate-800 uppercase block">✨ Select Variant: <span class="text-indigo-600">${curOptionValue}</span></span><div class="flex flex-wrap gap-2">${prod.customVariants.map((v, i) => { const act = v.name === curOptionValue ? "bg-indigo-600 text-white border-indigo-600 shadow-md" : "bg-white text-slate-800 border-indigo-200"; return `<button type="button" onclick="HappyToysModal.setCustomVariant(${i})" class="py-2 px-3 rounded-xl border-2 font-black text-center transition cursor-pointer ${act}"><div class="text-[11px] sm:text-xs">${v.name}</div><div class="text-[10px] ${v.name === curOptionValue ? 'text-indigo-200' : 'text-indigo-600'}">${fmt(v.pricePkr)}</div></button>`; }).join("")}</div></div>`;
    } else if (prod.hasVariants && prod.variants?.length) {
      optsHtml = `<div class="bg-amber-50/70 p-4 rounded-2xl border-2 border-amber-200 space-y-2"><span class="text-xs font-black text-slate-800 uppercase block">📏 Size: <span class="text-blue-600">${curOptionValue}</span></span><div class="grid grid-cols-3 gap-2">${prod.variants.map(v => { const act = v.size === curOptionValue ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-800 border-amber-300"; return `<button type="button" onclick="HappyToysModal.setOption('size', '${v.size}', ${v.pricePkr})" class="py-2.5 px-1 rounded-xl border-2 font-black text-center transition cursor-pointer ${act}"><div class="text-xs">${v.size}</div><div class="text-[10px] ${v.size === curOptionValue ? 'text-amber-300' : 'text-blue-600'}">${fmt(v.pricePkr)}</div></button>`; }).join("")}</div></div>`;
    }

    let dimHtml = prod.dimensions ? `<div class="flex items-center gap-2 bg-sky-50 text-sky-900 border border-sky-200 px-3.5 py-2.5 rounded-xl text-xs font-bold"><span>📐</span><span><b>Size:</b> ${prod.dimensions}</span></div>` : "";
    let featHtml = (prod.keyFeatures || "").trim() ? `<div class="space-y-2 pt-2"><h3 class="text-sm font-black text-slate-900">✨ Key Features</h3><ul class="space-y-1.5 bg-amber-50/40 p-3.5 rounded-2xl border border-amber-100">${prod.keyFeatures.split("\n").filter(Boolean).map(l => `<li class="text-xs sm:text-sm text-slate-700 font-bold flex gap-2"><span class="text-amber-500">🌟</span><span>${l}</span></li>`).join("")}</ul></div>` : "";

    pg.innerHTML = `
      <div class="sticky top-0 z-20 bg-white border-b px-4 h-15 py-3 flex justify-between shadow-xs">
        <button type="button" onclick="HappyToysModal.close()" class="px-3.5 py-2 rounded-xl bg-amber-100 text-amber-900 font-black text-xs">← Back</button>
        <span class="toy-title-font text-sm text-amber-500 truncate max-w-[150px]">${prod.name}</span>
        <button type="button" onclick="HappyToysModal.close(); HappyToysCart.openDrawer();" class="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-black text-xs">🛒 Cart</button>
      </div>

      <div class="max-w-4xl mx-auto w-full p-4 pb-32">
        <div class="bg-white rounded-3xl p-4 border-4 border-amber-300 shadow-lg relative mb-4">
          <span class="absolute top-6 left-6 ${hasDiscount ? 'bg-red-600 text-white' : 'bg-amber-400 text-slate-900'} text-xs font-black px-3 py-1 rounded-full z-10">${hasDiscount ? 'SALE' : '🔥 Hot Deal'}</span>
          <img id="modalMainImg" src="${curImage}" class="w-full aspect-square object-cover rounded-2xl transition-all duration-300" />
          ${(prod.images && prod.images.length > 1) ? `<div class="flex gap-2 mt-3 overflow-x-auto no-scrollbar pb-1">${prod.images.map(img => `<img src="${img}" onclick="document.getElementById('modalMainImg').src=this.src" class="w-14 h-14 rounded-xl object-cover cursor-pointer border-2 border-slate-200 hover:border-amber-400 shrink-0" />`).join("")}</div>` : ""}
          <div class="card-rainbow-strip rounded-b-xl mt-2"></div>
        </div>

        <div class="bg-white rounded-3xl p-5 border shadow-sm space-y-4">
          <div><h1 class="text-2xl font-black text-slate-900">${prod.name}</h1></div>
          <div class="text-xs font-bold text-slate-700 bg-slate-50 p-3 rounded-2xl border flex gap-2"><span>👁️</span> <span><b>${viewers} people</b> are viewing this right now</span></div>
          ${dimHtml}
          <div class="bg-blue-50 p-4 rounded-2xl border border-blue-200 flex justify-between items-center">
            <div><span class="text-[11px] font-black text-slate-500 uppercase block">Price (${curOptionValue})</span>
              <div class="flex items-baseline gap-2"><span class="text-3xl font-black ${hasDiscount ? 'text-red-600' : 'text-blue-600'}">${fmt(total)}</span>${hasDiscount ? `<del class="text-sm font-bold text-slate-400">${fmt(Number(prod.comparePrice)*qty)}</del>` : ""}</div>
            </div><span class="bg-emerald-100 text-emerald-700 font-black text-xs px-3 py-1 rounded-full">✓ In Stock</span>
          </div>
          ${optsHtml}
          <div class="flex justify-between bg-slate-50 p-3.5 rounded-2xl border"><span class="text-xs font-black uppercase mt-2">🔢 Quantity:</span><div class="flex gap-3"><button onclick="HappyToysModal.setQty(-1)" class="w-9 h-9 rounded-xl bg-white border font-black">-</button><span class="text-base font-black mt-1">${qty}</span><button onclick="HappyToysModal.setQty(1)" class="w-9 h-9 rounded-xl bg-amber-400 font-black">+</button></div></div>
          <div><h3 class="text-xs font-black text-slate-400 uppercase mb-1">📝 Description</h3><p class="p-3.5 rounded-2xl bg-slate-50 border text-slate-700 text-sm font-semibold whitespace-pre-line">${prod.shortDescription || "Premium quality toy."}</p>${featHtml}</div>
        </div>
      </div>

      <div class="fixed bottom-0 left-0 right-0 z-30 bg-white border-t-2 border-amber-300 p-3 shadow-2xl">
        <div class="max-w-3xl mx-auto flex gap-2.5">
          <button onclick="HappyToysCart.addToCart('${prod.id}', '${curOptionValue}', ${curPrice}, ${qty})" class="py-3.5 px-3 rounded-2xl bg-amber-400 text-white font-black text-xs shadow-md shrink-0">🛒 Add to Cart</button>
          <button onclick="HappyToysModal.buyWhatsApp()" class="btn-vip-gradient flex-1 py-3.5 px-3 rounded-2xl text-white font-black text-sm shadow-xl animate-bounce">💬 Buy Now (${fmt(total)})</button>
        </div>
      </div>`;
  }
  function close() { document.getElementById("htsSeparateProductPage")?.classList.add("hidden"); document.body.style.overflow = ""; }
  return { open, close, setOption, setCustomVariant, setQty, buyWhatsApp };
})();
window.HappyToysModal = HappyToysModal;
