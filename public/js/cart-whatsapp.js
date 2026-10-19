// public/js/cart-whatsapp.js - Multi-Item Shopping Cart & WhatsApp Order Engine
const HappyToysCart = (() => {
  let cart = JSON.parse(localStorage.getItem("hts_cart") || "[]");

  function formatPkr(amount) {
    return "PKR " + Number(amount || 0).toLocaleString("en-PK");
  }

  function save() {
    localStorage.setItem("hts_cart", JSON.stringify(cart));
    updateBadge();
  }

  function updateBadge() {
    const badge = document.getElementById("cartCountBadge");
    if (badge) {
      const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
      badge.textContent = totalItems;
    }
  }

  function addItem(product, variant = null, qty = 1) {
    const price = variant ? (variant.salePricePkr || variant.pricePkr) : (product.salePricePkr || product.pricePkr);
    const variantId = variant ? variant.id : "std";
    const variantName = variant ? variant.name : "Standard";

    const existing = cart.find(i => i.productId === product.id && i.variantId === variantId);
    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({
        productId: product.id,
        name: product.name,
        sku: variant ? variant.sku : product.sku,
        price,
        variantId,
        variantName,
        qty,
        mainImage: product.mainImage
      });
    }
    save();
    openDrawer();
  }

  function updateQty(productId, variantId, qty) {
    const item = cart.find(i => i.productId === productId && i.variantId === variantId);
    if (item) {
      item.qty = Number(qty);
      if (item.qty <= 0) {
        cart = cart.filter(i => !(i.productId === productId && i.variantId === variantId));
      }
      save();
      renderCartDrawer();
    }
  }

  function openDrawer() {
    let drawer = document.getElementById("cartDrawer");
    if (!drawer) {
      drawer = document.createElement("div");
      drawer.id = "cartDrawer";
      drawer.className = "fixed inset-0 z-50 hidden";
      drawer.innerHTML = `
        <div class="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onclick="HappyToysCart.closeDrawer()"></div>
        <aside class="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl flex flex-col z-10">
          <div class="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <span class="brand-font text-lg font-bold text-slate-800">🛒 Shopping Cart</span>
            <button onclick="HappyToysCart.closeDrawer()" class="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200">✕</button>
          </div>
          <div id="cartDrawerItems" class="p-4 overflow-y-auto flex-1 space-y-3 divide-y divide-slate-100"></div>
          <div class="p-5 border-t border-slate-200 bg-slate-50 space-y-3">
            <div class="flex items-center justify-between font-bold text-base text-slate-900">
              <span>Subtotal:</span>
              <span id="cartSubtotalText">PKR 0</span>
            </div>
            <button onclick="HappyToysCart.checkoutWhatsApp()" class="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg transition flex items-center justify-center gap-2">
              <span>📲 Complete Order on WhatsApp</span>
            </button>
          </div>
        </aside>
      `;
      document.body.appendChild(drawer);
    }
    renderCartDrawer();
    drawer.classList.remove("hidden");
  }

  function closeDrawer() {
    const drawer = document.getElementById("cartDrawer");
    if (drawer) drawer.classList.add("hidden");
  }

  function renderCartDrawer() {
    const container = document.getElementById("cartDrawerItems");
    const subtotalEl = document.getElementById("cartSubtotalText");
    if (!container) return;

    if (cart.length === 0) {
      container.innerHTML = `<div class="text-center py-12 text-slate-400 text-sm">Your cart is empty. Add some toys!</div>`;
      if (subtotalEl) subtotalEl.textContent = formatPkr(0);
      return;
    }

    let subtotal = 0;
    container.innerHTML = cart.map(item => {
      const itemTotal = item.price * item.qty;
      subtotal += itemTotal;
      return `
        <div class="pt-3 first:pt-0 flex items-center gap-3">
          <img src="${item.mainImage}" class="w-14 h-14 rounded-xl object-cover bg-slate-100 border shrink-0" />
          <div class="flex-1">
            <h4 class="font-bold text-xs text-slate-900 line-clamp-1">${item.name}</h4>
            <span class="text-[11px] text-slate-500 block">Option: ${item.variantName} | SKU: ${item.sku}</span>
            <div class="flex items-center justify-between mt-2">
              <span class="text-xs font-bold text-blue-700">${formatPkr(item.price)}</span>
              <div class="flex items-center gap-1.5 border rounded-lg bg-white overflow-hidden">
                <button onclick="HappyToysCart.updateQty('${item.productId}', '${item.variantId}', ${item.qty - 1})" class="px-2 py-0.5 text-xs font-bold hover:bg-slate-100">-</button>
                <span class="text-xs font-bold px-1">${item.qty}</span>
                <button onclick="HappyToysCart.updateQty('${item.productId}', '${item.variantId}', ${item.qty + 1})" class="px-2 py-0.5 text-xs font-bold hover:bg-slate-100">+</button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join("");

    if (subtotalEl) subtotalEl.textContent = formatPkr(subtotal);
  }

  function checkoutWhatsApp() {
    if (cart.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    let subtotal = 0;
    let msg = "Hello Happy Toys Store! I want to place an order for the following items:\n\n";
    cart.forEach((item, idx) => {
      const total = item.price * item.qty;
      subtotal += total;
      msg += `${idx + 1}. *${item.name}*\n   Option: ${item.variantName}\n   SKU: ${item.sku}\n   Qty: ${item.qty} x ${formatPkr(item.price)} = *${formatPkr(total)}*\n\n`;
    });
    msg += `*Total Bill: ${formatPkr(subtotal)}*\n\nPlease confirm availability and delivery details. Thank you!`;

    const whatsappNum = "923000000000"; // Configurable in Admin
    window.open(`https://wa.me/${whatsappNum}?text=` + encodeURIComponent(msg), "_blank");
  }

  return { init: updateBadge, addItem, updateQty, openDrawer, closeDrawer, checkoutWhatsApp };
})();

document.addEventListener("DOMContentLoaded", HappyToysCart.init);
