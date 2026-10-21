const HappyToysModal = (() => {
  let prod = null, curSize = "Standard", curPrice = 0, qty = 1;
  const WA = "923707116317";
  function fmt(n) { return "PKR " + Number(n || 0).toLocaleString("en-PK"); }

  function open(p) {
    if (!p) return;
    prod = p;
    qty = 1;

    const hasVar = p.hasVariants && Array.isArray(p.variants) && p.variants.length > 0;
    if (hasVar) {
      curSize = p.variants[0].size;
      curPrice = Number(p.variants[0].pricePkr);
    } else {
      curSize = "Standard";
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

  function setSize(sz, pr) { curSize = sz; curPrice = Number(pr); render(); }
  function setQty(d) { qty = Math.max(1, qty + d); render(); }

  function buyWhatsApp() {
    if (!prod) return;
    const total = curPrice * qty;
    const link = `${location.origin}/#product=${prod.id}`;
    const msg = `Hello *Happy Toys Store*! 🧸\nI want to order this product:\n\n*🧸 Product:* ${prod.name}\n*📏 Size/Variant:* ${curSize}\n*🔢 Quantity:* ${qty}\n*💰 Total Price:* ${fmt(total)}\n*📝 Details:* ${prod.shortDescription || "Premium Kids Toy"}\n\n*🔗 Product Link:* ${link}`;
    window.open(`https://wa.me/${WA}?text=${encodeURIComponent(msg)}`, "_blank");
  }

  function render() {
    const pg = document.getElementById("htsSeparateProductPage");
    if (!pg || !prod) return;
    
    const hasVar = prod.hasVariants && Array.isArray(prod.variants) && prod.variants.length > 0;
    const total = curPrice * qty;

    const sizeBoxHtml = hasVar ? `
      <div class="bg-amber-50/70 p-4 rounded-2xl border-2 border-amber-200 space-y-2">
        <span class="text-xs font-black text-slate-800 uppercase block">📏 Select Size / Variant:</span>
        <div class="grid grid-cols-3 gap-2">
          ${prod.variants.map(v => {
            const act = v.size === curSize ? "bg-blue-600 text-white border-blue-600 shadow-md" : "bg-white text-slate-800 border-amber-300";
            return `<button type="button" onclick="HappyToysModal.setSize('${v.size}',${v.pricePkr})" class="py-2.5 px-1 rounded-2xl border-2 font-black text-center transition ${act}">
              <div class="text-xs">${v.size}</div>
              <div class="text-[10px] ${v.size === curSize ? 'text-amber-200' : 'text-blue-600'}">${fmt(v.pricePkr)}</div>
            </button>`;
          }).join("")}
        </div>
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

          <div class="bg-blue-50/80 p-4 rounded-2xl border-2 border-blue-200 flex items-center justify-between">
            <div>
              <span class="text-[11px] font-black text-slate-500 uppercase block">Price (${curSize})</span>
              <span class="text-3xl font-black text-blue-600">${fmt(total)}</span>
            </div>
            <span class="bg-emerald-100 text-emerald-700 font-black text-xs px-3 py-1 rounded-full">✓ In Stock</span>
          </div>

          ${sizeBoxHtml}

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
          <button type="button" onclick="HappyToysCart.addToCart('${prod.id}', '${curSize}', ${curPrice}, ${qty})" class="py-3.5 px-3 rounded-2xl bg-amber-400 hover:bg-amber-500 text-white font-black text-xs shadow-md shrink-0 cursor-pointer">🛒 Add to Cart</button>
          <button type="button" onclick="HappyToysModal.buyWhatsApp()" class="btn-vip-gradient flex-1 py-3.5 px-3 rounded-2xl text-white font-black text-xs sm:text-sm shadow-xl animate-bounce text-center cursor-pointer">💬 Buy Now (${fmt(total)})</button>
        </div>
      </div>`;
  }

  function close() {
    document.getElementById("htsSeparateProductPage")?.classList.add("hidden");
    document.body.style.overflow = "";
    if (location.hash.includes("#product=")) history.replaceState(null, "", location.pathname);
  }

  return { open, close, setSize, setQty, buyWhatsApp };
})();
window.HappyToysModal = HappyToysModal;
