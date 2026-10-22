const HappyToysModal = (() => {
  let prod = null, curOptionType = "standard", curOptionValue = "Standard", curPrice = 0, qty = 1;
  function fmt(n) { return "PKR " + Number(n || 0).toLocaleString("en-PK"); }

  // Simple Hash for random pseudo-consistent FOMO numbers
  function hashStr(str) { let h=0; for(let i=0;i<str.length;i++) h=Math.imul(31,h)+str.charCodeAt(i)|0; return Math.abs(h); }

  function open(p) {
    if (!p) return; prod = p; qty = 1;
    if (p.hasVariants && p.variants?.length) { curOptionType = "size"; curOptionValue = p.variants[0].size; curPrice = Number(p.variants[0].pricePkr); }
    else if (p.hasLangVariants && p.langVariants?.length) { curOptionType = "lang"; curOptionValue = p.langVariants[0].lang; curPrice = Number(p.langVariants[0].pricePkr); }
    else { curOptionType = "standard"; curOptionValue = "Standard"; curPrice = Number(p.pricePkr || 1500); }

    let pg = document.getElementById("htsSeparateProductPage");
    if (!pg) { pg = document.createElement("div"); pg.id = "htsSeparateProductPage"; pg.className = "fixed inset-0 z-[160] bg-slate-50 overflow-y-auto flex flex-col"; document.body.appendChild(pg); }
    document.body.style.overflow = "hidden"; render(); pg.classList.remove("hidden");
  }

  function setOption(type, val, pr) { curOptionType = type; curOptionValue = val; curPrice = Number(pr); render(); }
  function setQty(d) { qty = Math.max(1, qty + d); render(); }

  function buyWhatsApp() {
    if (!prod) return; const total = curPrice * qty; const link = `${location.origin}/#product=${prod.id}`;
    let optLine = "";
    if (curOptionType === "size") optLine = `*📏 Size:* ${curOptionValue}\n`;
    else if (curOptionType === "lang") optLine = `*📖 Book Language:* ${curOptionValue}\n`;
    const msg = `Hello *Happy Toys Store*! 🧸\nI want to order this product:\n\n*🧸 Product:* ${prod.name}\n${optLine}*🔢 Quantity:* ${qty}\n*💰 Total Price:* ${fmt(total)}\n*🔗 Product Link:* ${link}\n\nPlease confirm my order!`;
    window.open(`https://wa.me/923707116317?text=${encodeURIComponent(msg)}`, "_blank");
  }

  function render() {
    const pg = document.getElementById("htsSeparateProductPage"); if (!pg || !prod) return;
    const total = curPrice * qty; const isSale = prod.comparePrice && prod.comparePrice > curPrice;
    
    // Social Proof / FOMO 
    const h = hashStr(prod.id); const viewers = 15 + (h % 35); const sold = 1000 + (h % 4500);

    // Dynamic Options HTML
    let optsHtml = "";
    if (curOptionType === "size") {
      optsHtml = `<div class="bg-amber-50 p-4 rounded-2xl border border-amber-200"><span class="text-xs font-black mb-2 block">📏 Select Size:</span><div class="grid grid-cols-3 gap-2">${prod.variants.map(v => `<button onclick="HappyToysModal.setOption('size','${v.size}',${v.pricePkr})" class="py-2 rounded-xl border-2 font-black text-xs ${v.size === curOptionValue ? 'bg-blue-600 text-white border-blue-600' : 'bg-white'}">${v.size}<br><span class="text-[9px] font-normal">${fmt(v.pricePkr)}</span></button>`).join("")}</div></div>`;
    } else if (curOptionType === "lang") {
      optsHtml = `<div class="bg-emerald-50 p-4 rounded-2xl border border-emerald-200"><span class="text-xs font-black mb-2 block">📚 Select Book Edition:</span><div class="grid grid-cols-2 gap-2">${prod.langVariants.map(l => `<button onclick="HappyToysModal.setOption('lang','${l.lang}',${l.pricePkr})" class="py-2 rounded-xl border-2 font-black text-xs ${l.lang === curOptionValue ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white'}">${l.lang} Edition<br><span class="text-[9px] font-normal">${fmt(l.pricePkr)}</span></button>`).join("")}</div></div>`;
    }

    // Key Features & Package Includes
    let featuresHtml = "";
    if(prod.keyFeatures) {
      const arr = prod.keyFeatures.split("\n").filter(x=>x.trim()!=="");
      if(arr.length) featuresHtml += `<div class="mb-4"><h3 class="font-black text-slate-800 text-sm mb-2 flex items-center gap-1">✨ Key Features</h3><ul class="space-y-1.5">${arr.map(a=>`<li class="text-xs text-slate-600 font-bold flex items-start gap-1.5"><span class="text-amber-500">✔</span> <span>${a}</span></li>`).join("")}</ul></div>`;
    }
    if(prod.packageIncludes) {
      const arr2 = prod.packageIncludes.split("\n").filter(x=>x.trim()!=="");
      if(arr2.length) featuresHtml += `<div><h3 class="font-black text-slate-800 text-sm mb-2 flex items-center gap-1">📦 Package Includes</h3><ul class="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">${arr2.map(a=>`<li class="text-xs text-slate-600 font-bold flex items-center gap-1.5"><span class="text-blue-500">▪</span> <span>${a}</span></li>`).join("")}</ul></div>`;
    }

    // Related Products (Cross-Sell)
    const allProd = window.HappyToysApp ? window.HappyToysApp.getProductById : null; // Access state via App? Better to just read localStorage or we can fetch.
    let relatedHtml = "";
    if(window.HappyToysApp) {
      // Re-fetch all products logic is slightly decoupled, but we can do a quick local pull
      const allStr = localStorage.getItem("hts_custom_products");
      if(allStr) {
        try {
          const allP = JSON.parse(allStr);
          const rel = allP.filter(x => x.category === prod.category && x.id !== prod.id && x.isPublished).slice(0, 3);
          if(rel.length) {
            relatedHtml = `<div class="mt-8 border-t border-slate-200 pt-6"><h3 class="text-lg font-black text-slate-900 mb-4">🧸 You Might Also Like</h3><div class="grid grid-cols-3 gap-2 overflow-x-auto">${rel.map(r => `<div onclick="HappyToysModal.close(); window.HappyToysApp.tapProductCard('${r.id}', null, null);" class="bg-white border border-slate-100 rounded-xl p-2 cursor-pointer shadow-sm"><img src="${r.mainImage}" class="w-full aspect-square object-cover rounded-lg mb-1"><h4 class="text-[10px] font-extrabold truncate text-slate-800">${r.name}</h4><span class="text-[11px] font-black text-blue-600">${fmt(r.pricePkr)}</span></div>`).join("")}</div></div>`;
          }
        }catch(e){}
      }
    }

    pg.innerHTML = `
      <div class="sticky top-0 z-20 bg-white border-b px-4 h-14 flex items-center justify-between shadow-xs">
        <button onclick="HappyToysModal.close()" class="text-xs font-black px-3 py-1.5 bg-slate-100 rounded-lg">← Back</button>
        <span class="toy-title-font text-amber-500 text-sm truncate max-w-[150px]">${prod.name}</span>
        <button onclick="HappyToysModal.close(); HappyToysCart.openDrawer();" class="text-xs font-black px-3 py-1.5 bg-blue-600 text-white rounded-lg">🛒 Cart</button>
      </div>

      <div class="w-full max-w-xl mx-auto p-4 pb-32">
        <div class="bg-white rounded-3xl p-3 border border-slate-200 shadow-sm relative mb-4">
          ${isSale ? `<span class="absolute top-4 left-4 bg-red-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-full z-10 shadow">SALE</span>` : ''}
          <img src="${prod.mainImage}" class="w-full aspect-square object-cover rounded-2xl" />
        </div>

        <div class="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
          
          <!-- FOMO Badges -->
          <div class="flex items-center gap-2 text-[9px] font-extrabold text-slate-600 flex-wrap">
            <span class="bg-blue-50 px-2 py-1 rounded-md text-blue-700 flex items-center gap-1">👁️ ${viewers} viewing right now</span>
            <span class="bg-rose-50 px-2 py-1 rounded-md text-rose-700 flex items-center gap-1">🔥 ${sold} Sold!</span>
            <span class="bg-emerald-50 px-2 py-1 rounded-md text-emerald-700 flex items-center gap-1">⭐ 4.8 Rating</span>
          </div>

          <div><h1 class="text-2xl font-black text-slate-900">${prod.name}</h1></div>

          <div class="bg-gradient-to-r from-blue-50 to-sky-50 p-4 rounded-2xl border border-blue-100 flex justify-between items-center">
             <div><span class="block text-[11px] font-black text-slate-500 uppercase">Total Price</span><span class="text-3xl font-black ${isSale?'text-red-600':'text-blue-600'}">${fmt(total)}</span>
             ${isSale ? `<del class="text-xs text-slate-400 font-bold block">${fmt(prod.comparePrice * qty)}</del>` : ''}
             </div>
          </div>

          ${optsHtml}
          ${prod.dimensions ? `<div class="bg-sky-50 p-3 rounded-xl border border-sky-200 text-xs font-bold text-sky-900">📐 Dimensions: ${prod.dimensions}</div>` : ''}

          <div class="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span class="text-xs font-black uppercase">Quantity:</span>
            <div class="flex items-center gap-3"><button onclick="HappyToysModal.setQty(-1)" class="w-8 h-8 rounded bg-white border font-black">-</button><span class="font-black">${qty}</span><button onclick="HappyToysModal.setQty(1)" class="w-8 h-8 rounded bg-amber-400 font-black">+</button></div>
          </div>

          <div class="pt-2">
            ${featuresHtml}
            ${(!prod.keyFeatures && !prod.packageIncludes) ? `<p class="text-sm font-semibold text-slate-600">${prod.shortDescription || "Premium Toy"}</p>` : ''}
          </div>

          ${relatedHtml}

        </div>
      </div>
      
      <div class="fixed bottom-0 left-0 right-0 z-30 bg-white border-t-2 border-amber-300 p-3 shadow-2xl flex gap-2 justify-center">
        <button onclick="HappyToysCart.addToCart('${prod.id}', '${curOptionValue}', ${curPrice}, ${qty})" class="px-4 py-3.5 rounded-xl bg-amber-400 font-black text-xs shrink-0">🛒 Add to Cart</button>
        <button onclick="HappyToysModal.buyWhatsApp()" class="flex-1 max-w-sm py-3.5 rounded-xl btn-vip-gradient text-white font-black text-sm shadow-xl animate-bounce">💬 Buy Now (${fmt(total)})</button>
      </div>`;
  }
  function close() { document.getElementById("htsSeparateProductPage")?.classList.add("hidden"); document.body.style.overflow = ""; }
  return { open, close, setOption, setQty, buyWhatsApp };
})();
window.HappyToysModal = HappyToysModal;
