const HappyToysCart = (() => {
  const KEY = "hts_cart_items_v5";
  const WA = "923707116317";
  let cart = [];

  function fmt(n) { return "PKR " + Number(n || 0).toLocaleString("en-PK"); }

  function init() {
    try { cart = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { cart = []; }
    updateBadge();
  }

  function save() {
    localStorage.setItem(KEY, JSON.stringify(cart));
    updateBadge();
    renderDrawer();
  }

  function updateBadge() {
    const count = cart.reduce((s, i) => s + Number(i.qty || 1), 0);
    const el = document.getElementById("cartCountBadge");
    if (el) {
      el.textContent = count;
      el.style.transform = "scale(1.3)";
      setTimeout(() => { el.style.transform = "scale(1)"; }, 200);
    }
  }

  function toast(text) {
    let t = document.getElementById("htsToast");
    if (!t) {
      t = document.createElement("div");
      t.id = "htsToast";
      t.className = "fixed bottom-6 left-1/2 -translate-x-1/2 z-[250] bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl font-black text-xs flex items-center gap-2 transition-all duration-300 opacity-0 pointer-events-none";
      document.body.appendChild(t);
    }
    t.innerHTML = `<span>🛒</span><span>${text}</span>`;
    t.classList.remove("opacity-0");
    clearTimeout(window._htsT);
    window._htsT = setTimeout(() => t.classList.add("opacity-0"), 2000);
  }

  function addToCart(id, size = null, price = null, qty = 1) {
    const p = window.HappyToysApp ? window.HappyToysApp.getProductById(id) : null;
    if (!p) return;
    const sz = size || (p.hasVariants && p.variants && p.variants.length ? p.variants[0].size : "Standard");
    const pr = price !== null ? Number(price) : (p.hasVariants && p.variants && p.variants.length ? Number(p.variants[0].pricePkr) : Number(p.pricePkr));
    const k = `${p.id}_${sz}`;
    
    const existing = cart.find(x => x.k === k);
    if (existing) {
      existing.qty += Number(qty);
    } else {
      cart.push({ k, id: p.id, name: p.name, size: sz, pricePkr: pr, mainImage: p.mainImage, qty: Number(qty) });
    }
    save();
    toast(`${p.name} (${sz}) added to Cart successfully!`);
  }

  function changeQty(k, d) {
    const idx = cart.findIndex(x => x.k === k);
    if (idx < 0) return;
    cart[idx].qty += d;
    if (cart[idx].qty <= 0) cart.splice(idx, 1);
    save();
  }

  function ensureDrawer() {
    if (document.getElementById("htsCartDrawer")) return;
    const d = document.createElement("div");
    d.id = "htsCartDrawer";
    d.className = "fixed inset-0 z-[210] hidden";
    d.innerHTML = `
      <div onclick="HappyToysCart.closeDrawer()" class="fixed inset-0 bg-black/60 backdrop-blur-xs"></div>
      <aside class="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-10 flex flex-col justify-between">
        <div class="p-4 border-b border-slate-200 flex items-center justify-between bg-amber-50">
          <span class="toy-title-font text-lg text-slate-900">🛒 Your Toy Cart</span>
          <button type="button" onclick="HappyToysCart.closeDrawer()" class="w-8 h-8 rounded-full bg-white font-black text-slate-700 shadow">✕</button>
        </div>
        <div id="htsCartList" class="p-4 overflow-y-auto flex-1 space-y-3"></div>
        <div class="p-4 border-t border-slate-200 bg-slate-50 space-y-3">
          <div class="flex justify-between items-center">
            <span class="font-extrabold text-sm text-slate-600">Total Amount:</span>
            <span id="htsCartTotal" class="text-2xl font-black text-blue-600">PKR 0</span>
          </div>
          <button type="button" onclick="HappyToysCart.checkoutWhatsApp()" class="btn-vip-gradient w-full py-3.5 rounded-2xl text-white font-black text-base shadow-lg cursor-pointer">💬 Order All on WhatsApp</button>
        </div>
      </aside>`;
    document.body.appendChild(d);
  }

  function renderDrawer() {
    ensureDrawer();
    const list = document.getElementById("htsCartList");
    const tot = document.getElementById("htsCartTotal");
    if (!list || !tot) return;
    if (!cart.length) {
      list.innerHTML = `<div class="py-16 text-center text-slate-400 font-bold">🧸 Your cart is empty!</div>`;
      tot.textContent = "PKR 0";
      return;
    }
    let total = 0;
    list.innerHTML = cart.map(i => {
      const sub = i.pricePkr * i.qty;
      total += sub;
      return `<div class="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
        <img src="${i.mainImage}" class="w-14 h-14 rounded-xl object-cover border bg-white" />
        <div class="flex-1 min-w-0">
          <h4 class="font-black text-slate-900 text-xs truncate">${i.name}</h4>
          <span class="text-[10px] font-black bg-amber-100 text-amber-800 px-2 py-0.5 rounded">Size: ${i.size}</span>
          <div class="text-blue-600 font-black text-sm mt-0.5">${fmt(sub)}</div>
        </div>
        <div class="flex items-center gap-1.5 bg-white border rounded-xl px-2 py-1">
          <button type="button" onclick="HappyToysCart.changeQty('${i.k}',-1)" class="w-6 h-6 bg-slate-100 rounded font-black">-</button>
          <span class="text-xs font-black px-1">${i.qty}</span>
          <button type="button" onclick="HappyToysCart.changeQty('${i.k}',1)" class="w-6 h-6 bg-amber-400 rounded font-black">+</button>
        </div>
      </div>`;
    }).join("");
    tot.textContent = fmt(total);
  }

  function openDrawer() { ensureDrawer(); renderDrawer(); document.getElementById("htsCartDrawer").classList.remove("hidden"); }
  function closeDrawer() { document.getElementById("htsCartDrawer")?.classList.add("hidden"); }

  function checkoutWhatsApp() {
    if (!cart.length) return;
    let total = 0;
    const itemsTxt = cart.map((i, idx) => {
      const sub = i.pricePkr * i.qty;
      total += sub;
      return `${idx + 1}. *${i.name}* (Size: ${i.size})\n   Qty: ${i.qty} x ${fmt(i.pricePkr)} = *${fmt(sub)}*\n   Link: ${location.origin}/#product=${i.id}`;
    }).join("\n\n");
    const msg = `Hello *Happy Toys Store*! 🧸\nNew Cart Order:\n\n${itemsTxt}\n\n💰 *Total: ${fmt(total)}*`;
    window.open(`https://wa.me/${WA}?text=${encodeURIComponent(msg)}`, "_blank");
  }

  document.addEventListener("DOMContentLoaded", init);
  setTimeout(init, 200);
  return { addToCart, openDrawer, closeDrawer, changeQty, checkoutWhatsApp };
})();
window.HappyToysCart = HappyToysCart;
