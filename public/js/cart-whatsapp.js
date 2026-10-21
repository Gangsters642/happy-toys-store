const HappyToysCart = (() => {
  const STORAGE_KEY = "hts_live_cart_v2";
  const WHATSAPP_NUMBER = "923707116317";
  let cart = [];

  function formatPkr(amount) {
    return "PKR " + Number(amount || 0).toLocaleString("en-PK");
  }

  function loadCart() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      cart = saved ? JSON.parse(saved) : [];
    } catch (e) {
      cart = [];
    }
    updateBadge();
  }

  function saveCart() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    updateBadge();
    renderDrawerItems();
  }

  function updateBadge() {
    const totalCount = cart.reduce((sum, item) => sum + Number(item.qty || 1), 0);
    const badge = document.getElementById("cartCountBadge");
    if (badge) {
      badge.textContent = totalCount;
      badge.classList.remove("scale-125");
      setTimeout(() => badge.classList.add("transition-transform", "scale-125"), 10);
      setTimeout(() => badge.classList.remove("scale-125"), 300);
    }
  }

  function ensureDrawerExists() {
    if (document.getElementById("htsCartDrawerModal")) return;

    const div = document.createElement("div");
    div.id = "htsCartDrawerModal";
    div.className = "fixed inset-0 z-[200] hidden";
    div.innerHTML = `
      <div onclick="HappyToysCart.closeDrawer()" class="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"></div>
      <aside class="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-10 flex flex-col justify-between">
        <!-- Drawer Header -->
        <div class="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div class="flex items-center gap-2.5">
            <span class="text-2xl">🛒</span>
            <div>
              <h3 class="toy-title-font text-lg text-slate-900 leading-none">Your Toy Cart</h3>
              <span class="text-xs text-slate-500 font-bold">Fast Delivery Across Pakistan</span>
            </div>
          </div>
          <button onclick="HappyToysCart.closeDrawer()" class="w-9 h-9 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-black flex items-center justify-center">✕</button>
        </div>

        <!-- Drawer Body -->
        <div id="htsCartItemsContainer" class="p-4 overflow-y-auto flex-1 space-y-3"></div>

        <!-- Drawer Footer -->
        <div class="p-5 border-t border-slate-200 bg-slate-50 space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-sm font-extrabold text-slate-600">Grand Total:</span>
            <span id="htsCartGrandTotal" class="text-2xl font-black text-blue-600">PKR 0</span>
          </div>
          <button onclick="HappyToysCart.checkoutWhatsApp()" class="btn-vip-gradient w-full py-4 rounded-2xl text-white font-black text-base shadow-xl flex items-center justify-center gap-2 cursor-pointer">
            <span>💬 Order All on WhatsApp</span>
          </button>
        </div>
      </aside>
    `;
    document.body.appendChild(div);
  }

  function showToast(msg) {
    let toast = document.getElementById("htsCartToast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "htsCartToast";
      toast.className = "fixed bottom-6 left-1/2 -translate-x-1/2 z-[250] bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl font-black text-xs flex items-center gap-2 transition-all duration-300 opacity-0 pointer-events-none";
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<span>✅</span> <span>${msg}</span>`;
    toast.classList.remove("opacity-0");
    toast.classList.add("opacity-100");
    clearTimeout(window.htsToastTimer);
    window.htsToastTimer = setTimeout(() => {
      toast.classList.remove("opacity-100");
      toast.classList.add("opacity-0");
    }, 2200);
  }

  function addToCart(productId, selectedSize = null, customPrice = null, qtyToAdd = 1) {
    const product = window.HappyToysApp ? window.HappyToysApp.getProductById(productId) : null;
    if (!product) return;

    let sizeLabel = selectedSize;
    let unitPrice = customPrice !== null ? Number(customPrice) : Number(product.pricePkr);

    if (!sizeLabel && product.hasVariants && product.variants && product.variants.length > 0) {
      sizeLabel = product.variants[0].size;
      unitPrice = Number(product.variants[0].pricePkr);
    }

    const cartKey = `${product.id}__${sizeLabel || "Standard"}`;
    const existing = cart.find(item => item.cartKey === cartKey);

    if (existing) {
      existing.qty += Number(qtyToAdd);
    } else {
      cart.push({
        cartKey,
        id: product.id,
        name: product.name,
        size: sizeLabel || "Standard",
        pricePkr: unitPrice,
        mainImage: product.mainImage,
        qty: Number(qtyToAdd)
      });
    }

    saveCart();
    showToast(`${product.name} (${sizeLabel || "Standard"}) added to Cart!`);
  }

  function changeQty(cartKey, delta) {
    const idx = cart.findIndex(item => item.cartKey === cartKey);
    if (idx === -1) return;
    cart[idx].qty += delta;
    if (cart[idx].qty <= 0) {
      cart.splice(idx, 1);
    }
    saveCart();
  }

  function removeItem(cartKey) {
    cart = cart.filter(item => item.cartKey !== cartKey);
    saveCart();
  }

  function renderDrawerItems() {
    ensureDrawerExists();
    const container = document.getElementById("htsCartItemsContainer");
    const totalEl = document.getElementById("htsCartGrandTotal");
    if (!container || !totalEl) return;

    if (cart.length === 0) {
      container.innerHTML = `
        <div class="py-16 text-center space-y-3">
          <div class="text-5xl">🧸</div>
          <p class="text-slate-500 font-extrabold text-sm">Your cart is empty!</p>
          <p class="text-slate-400 text-xs">Add some awesome toys to get started.</p>
        </div>
      `;
      totalEl.textContent = "PKR 0";
      return;
    }

    let grandTotal = 0;
    container.innerHTML = cart.map(item => {
      const subTotal = item.pricePkr * item.qty;
      grandTotal += subTotal;
      return `
        <div class="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
          <img src="${item.mainImage}" class="w-16 h-16 rounded-xl object-cover border bg-white shrink-0" />
          <div class="flex-1 min-w-0">
            <h4 class="font-black text-slate-900 text-xs truncate">${item.name}</h4>
            <span class="inline-block bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-md my-1">Size: ${item.size}</span>
            <div class="text-blue-600 font-black text-sm">${formatPkr(subTotal)}</div>
          </div>
          <div class="flex flex-col items-end gap-2">
            <button onclick="HappyToysCart.removeItem('${item.cartKey}')" class="text-[11px] text-red-500 font-bold hover:underline">Remove</button>
            <div class="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-2 py-1">
              <button onclick="HappyToysCart.changeQty('${item.cartKey}', -1)" class="w-5 h-5 rounded bg-slate-100 font-black text-xs">-</button>
              <span class="text-xs font-black min-w-[16px] text-center">${item.qty}</span>
              <button onclick="HappyToysCart.changeQty('${item.cartKey}', 1)" class="w-5 h-5 rounded bg-amber-400 font-black text-xs">+</button>
            </div>
          </div>
        </div>
      `;
    }).join("");

    totalEl.textContent = formatPkr(grandTotal);
  }

  function openDrawer() {
    ensureDrawerExists();
    renderDrawerItems();
    document.getElementById("htsCartDrawerModal").classList.remove("hidden");
  }

  function closeDrawer() {
    const modal = document.getElementById("htsCartDrawerModal");
    if (modal) modal.classList.add("hidden");
  }

  function checkoutWhatsApp() {
    if (cart.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    let grandTotal = 0;
    const lines = cart.map((item, idx) => {
      const sub = item.pricePkr * item.qty;
      grandTotal += sub;
      const link = `${window.location.origin}/#product=${item.id}`;
      return `${idx + 1}. *${item.name}*\n   • Size: ${item.size}\n   • Qty: ${item.qty} x ${formatPkr(item.pricePkr)} = *${formatPkr(sub)}*\n   • Link: ${link}`;
    }).join("\n\n");

    const message = `Hello *Happy Toys Store*! 🧸\nI would like to place an order:\n\n${lines}\n\n💰 *Grand Total: ${formatPkr(grandTotal)}*\n\nPlease confirm my order!`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank");
  }

  document.addEventListener("DOMContentLoaded", loadCart);

  return { addToCart, openDrawer, closeDrawer, changeQty, removeItem, checkoutWhatsApp };
})();
