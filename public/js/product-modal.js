const HappyToysModal = (() => {
  let currentProduct = null;
  let selectedSize = "Standard";
  let selectedUnitPrice = 0;
  let selectedQty = 1;
  const WHATSAPP_NUMBER = "923707116317";

  function formatPkr(amount) {
    return "PKR " + Number(amount || 0).toLocaleString("en-PK");
  }

  function getAvailableVariants(product) {
    if (product.hasVariants && Array.isArray(product.variants) && product.variants.length > 0) {
      return product.variants;
    }
    // Also provide Small, Medium, Big if user didn't configure custom variants yet?
    // Wait: user said "अगर वेरिएंट वाला हो तो वो ऑप्शन हो... साइज सेलेक्ट करने का ऑप्शन भी हो"
    return [];
  }

  function open(product) {
    if (!product) return;
    currentProduct = product;
    selectedQty = 1;

    const variants = getAvailableVariants(product);
    if (variants.length > 0) {
      selectedSize = variants[0].size;
      selectedUnitPrice = Number(variants[0].pricePkr);
    } else {
      selectedSize = "Standard";
      selectedUnitPrice = Number(product.pricePkr);
    }

    // Update browser hash so link refers directly to this product
    if (window.location.hash !== `#product=${product.id}`) {
      history.replaceState(null, "", `#product=${product.id}`);
    }

    let pageModal = document.getElementById("separateProductDetailPage");
    if (!pageModal) {
      pageModal = document.createElement("div");
      pageModal.id = "separateProductDetailPage";
      pageModal.className = "fixed inset-0 z-[140] bg-slate-50 overflow-y-auto flex flex-col";
      document.body.appendChild(pageModal);
    }

    document.body.style.overflow = "hidden";
    renderDetailPage();
    pageModal.classList.remove("hidden");
    pageModal.scrollTop = 0;
  }

  function selectVariantSize(sizeName, pricePkr) {
    selectedSize = sizeName;
    selectedUnitPrice = Number(pricePkr);
    renderDetailPage();
  }

  function updateQuantity(delta) {
    selectedQty = Math.max(1, selectedQty + delta);
    renderDetailPage();
  }

  function orderNowOnWhatsApp() {
    if (!currentProduct) return;
    const totalPrice = selectedUnitPrice * selectedQty;
    const productUrl = `${window.location.origin}/#product=${currentProduct.id}`;

    const msg =
      `Hello *Happy Toys Store*! 🧸\n` +
      `I want to buy this toy:\n\n` +
      `*🧸 Toy Name:* ${currentProduct.name}\n` +
      `*📏 Selected Size:* ${selectedSize}\n` +
      `*🔢 Quantity:* ${selectedQty}\n` +
      `*💰 Total Price:* ${formatPkr(totalPrice)}\n` +
      `*📝 Details:* ${currentProduct.shortDescription || "Premium Kids Toy"}\n\n` +
      `*🔗 Product Link:* ${productUrl}\n\n` +
      `Please confirm my order!`;

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");
  }

  function addCurrentToCart() {
    if (!currentProduct || !window.HappyToysCart) return;
    window.HappyToysCart.addToCart(currentProduct.id, selectedSize, selectedUnitPrice, selectedQty);
  }

  function renderDetailPage() {
    const pageModal = document.getElementById("separateProductDetailPage");
    if (!pageModal || !currentProduct) return;

    const variants = getAvailableVariants(currentProduct);
    const totalPrice = selectedUnitPrice * selectedQty;

    const sizeSelectorHtml = variants.length > 0 ? `
      <div class="bg-amber-50/70 p-4 rounded-3xl border-2 border-amber-200 space-y-2.5">
        <div class="flex items-center justify-between">
          <span class="text-xs font-black text-slate-800 uppercase tracking-wider">📏 Select Toy Size:</span>
          <span class="text-xs font-black text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">Selected: ${selectedSize}</span>
        </div>
        <div class="grid grid-cols-3 gap-2.5">
          ${variants.map(v => {
            const isSelected = v.size === selectedSize;
            const activeCls = isSelected
              ? "bg-blue-600 text-white border-blue-600 shadow-lg scale-[1.03]"
              : "bg-white text-slate-800 border-slate-200 hover:border-amber-400";
            return `
              <button type="button" onclick="HappyToysModal.selectVariantSize('${v.size}',${v.pricePkr})"
                class="py-3 px-2 rounded-2xl border-2 font-black text-center transition-all flex flex-col items-center justify-center ${activeCls}">
                <span class="text-xs sm:text-sm">${v.size}</span>
                <span class="text-[11px] ${isSelected ? 'text-amber-300' : 'text-blue-600'} font-extrabold mt-0.5">${formatPkr(v.pricePkr)}</span>
              </button>
            `;
          }).join("")}
        </div>
      </div>
    ` : "";

    pageModal.innerHTML = `
      <!-- Top Dedicated Product Page Header -->
      <div class="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 px-4 h-16 flex items-center justify-between shadow-xs">
        <button onclick="HappyToysModal.close()" class="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs sm:text-sm flex items-center gap-1.5 transition">
          <span>←</span> <span>Back to Store</span>
        </button>
        <span class="toy-title-font text-base text-amber-500 truncate max-w-[160px] sm:max-w-xs">${currentProduct.name}</span>
        <button onclick="HappyToysModal.close(); HappyToysCart.openDrawer();" class="px-3 py-2 rounded-xl bg-blue-600 text-white font-black text-xs shadow-sm">
          🛒 Cart
        </button>
      </div>

      <!-- Main Separate Product Body -->
      <div class="max-w-4xl mx-auto w-full p-4 sm:p-6 pb-32 grid md:grid-cols-2 gap-6 items-start">
        
        <!-- Big Product Image Card -->
        <div class="bg-white rounded-[2.2rem] p-4 sm:p-6 border-2 border-amber-200 shadow-md relative">
          <span class="absolute top-6 left-6 bg-amber-400 text-slate-900 text-xs font-black px-3 py-1 rounded-full shadow-sm">🔥 Premium Toy</span>
          <img src="${currentProduct.mainImage}" alt="${currentProduct.name}" class="w-full aspect-square object-cover rounded-2xl" />
        </div>

        <!-- Product Complete Information -->
        <div class="bg-white rounded-[2.2rem] p-5 sm:p-6 border-2 border-slate-100 shadow-md space-y-5">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <span class="px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-black text-xs capitalize">🧸 ${currentProduct.category || "Kids Toy"}</span>
              <span class="text-xs font-black text-amber-500">⭐ 4.9 (120+ Happy Kids)</span>
            </div>
            <h1 class="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">${currentProduct.name}</h1>
            <span class="text-xs text-slate-400 font-bold block mt-1">SKU: ${currentProduct.sku || "HTS-VIP"}</span>
          </div>

          <!-- Dynamic Live Price Box -->
          <div class="bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 p-4 rounded-2xl border border-blue-100 flex items-center justify-between">
            <div>
              <span class="text-[11px] font-black text-slate-500 uppercase block">Selected Price (${selectedSize})</span>
              <span class="text-3xl font-black text-blue-600">${formatPkr(totalPrice)}</span>
            </div>
            <div class="text-right">
              <span class="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 font-black text-xs">
                ✓ In Stock (${currentProduct.stockQty || 10})
              </span>
            </div>
          </div>

          <!-- Size Variants Selector (Small / Medium / Big) -->
          ${sizeSelectorHtml}

          <!-- Quantity Selector -->
          <div class="flex items-center justify-between bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <span class="text-xs font-black text-slate-700 uppercase">🔢 Select Quantity:</span>
            <div class="flex items-center gap-3">
              <button type="button" onclick="HappyToysModal.updateQuantity(-1)" class="w-9 h-9 rounded-xl bg-white border border-slate-300 font-black text-lg shadow-xs active:scale-90">-</button>
              <span class="text-base font-black text-slate-900 min-w-[24px] text-center">${selectedQty}</span>
              <button type="button" onclick="HappyToysModal.updateQuantity(1)" class="w-9 h-9 rounded-xl bg-amber-400 text-slate-900 font-black text-lg shadow-xs active:scale-90">+</button>
            </div>
          </div>

          <!-- Full Product Description -->
          <div class="space-y-2">
            <h3 class="text-xs font-black text-slate-400 uppercase tracking-wider">📝 Product Description & Details</h3>
            <div class="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-700 text-sm leading-relaxed whitespace-pre-line font-semibold">
              ${currentProduct.shortDescription || "Best quality interactive toy for kids! Safe materials, bright colors, and durable build."}
            </div>
          </div>
        </div>
      </div>

      <!-- Sticky Animated Bottom Action Bar -->
      <div class="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t-2 border-amber-200 p-3 sm:p-4 shadow-[0_-10px_30px_rgba(0,0,0,0.08)]">
        <div class="max-w-4xl mx-auto flex items-center gap-3">
          <button type="button" onclick="HappyToysModal.addCurrentToCart()"
            class="py-3.5 px-5 rounded-2xl bg-amber-400 hover:bg-amber-500 text-slate-900 font-black text-xs sm:text-sm shadow-md active:scale-95 transition flex items-center justify-center gap-2 shrink-0">
            <span>🛒 Add to Cart</span>
          </button>

          <button type="button" onclick="HappyToysModal.orderNowOnWhatsApp()"
            class="btn-vip-gradient flex-1 py-4 px-5 rounded-2xl text-white font-black text-sm sm:text-base shadow-xl flex items-center justify-center gap-2 animate-bounce cursor-pointer">
            <span>💬 Buy Now on WhatsApp (${formatPkr(totalPrice)})</span>
          </button>
        </div>
      </div>
    `;
  }

  function close() {
    const pageModal = document.getElementById("separateProductDetailPage");
    if (pageModal) pageModal.classList.add("hidden");
    document.body.style.overflow = "";
    if (window.location.hash.includes("#product=")) {
      history.replaceState(null, "", window.location.pathname);
    }
  }

  return { open, close, selectVariantSize, updateQuantity, orderNowOnWhatsApp, addCurrentToCart };
})();
window.HappyToysModal = HappyToysModal;
