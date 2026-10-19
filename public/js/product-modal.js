// public/js/product-modal.js - Interactive Product Detail Modal & Related Recommendations
const HappyToysModal = (() => {
  let currentProduct = null;
  let selectedVariant = null;

  function formatPkr(amount) {
    return "PKR " + Number(amount || 0).toLocaleString("en-PK");
  }

  function open(product, allProducts = []) {
    currentProduct = product;
    selectedVariant = product.hasVariants && product.variants?.length > 0 ? product.variants[0] : null;

    let modalEl = document.getElementById("productDetailModal");
    if (!modalEl) {
      modalEl = document.createElement("div");
      modalEl.id = "productDetailModal";
      modalEl.className = "fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm overflow-y-auto p-4 flex items-center justify-center";
      document.body.appendChild(modalEl);
    }

    const gallery = product.galleryImages || [product.mainImage];
    const hasDiscount = product.salePricePkr && product.salePricePkr < product.pricePkr;
    const activePrice = selectedVariant ? (selectedVariant.salePricePkr || selectedVariant.pricePkr) : (hasDiscount ? product.salePricePkr : product.pricePkr);
    const activeStock = selectedVariant ? selectedVariant.stockQty : product.stockQty;

    // Find Related Products ("You May Also Like")
    const related = allProducts
      .filter(p => p.id !== product.id && p.isPublished && (p.category === product.category || (p.tags && product.tags && p.tags.some(t => product.tags.includes(t)))))
      .slice(0, 4);
    
    // Fallback if not enough related
    if (related.length < 2) {
      const extras = allProducts.filter(p => p.id !== product.id && p.isPublished).slice(0, 4);
      extras.forEach(e => { if (!related.some(r => r.id === e.id)) related.push(e); });
    }

    modalEl.innerHTML = `
      <div class="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl my-8 relative overflow-hidden">
        <button onclick="HappyToysModal.close()" class="absolute top-5 right-5 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold z-10">✕</button>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <!-- Image Gallery -->
          <div>
            <div class="rounded-2xl overflow-hidden bg-slate-100 mb-3 border aspect-square">
              <img id="modalMainImg" src="${gallery[0]}" alt="${product.name}" class="w-full h-full object-cover" />
            </div>
            ${gallery.length > 1 ? `
              <div class="flex gap-2 overflow-x-auto pb-1">
                ${gallery.map((img, idx) => `
                  <button onclick="document.getElementById('modalMainImg').src='${img}'" class="w-14 h-14 rounded-xl overflow-hidden border-2 border-transparent hover:border-blue-600 shrink-0 bg-slate-100">
                    <img src="${img}" class="w-full h-full object-cover" />
                  </button>
                `).join("")}
              </div>
            ` : ""}
          </div>

          <!-- Product Details -->
          <div class="flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
                <span>SKU: ${product.sku}</span>
                <span class="${activeStock > 0 ? "text-emerald-600" : "text-red-500"}">${activeStock > 0 ? `● In Stock (${activeStock})` : "● Out of Stock"}</span>
              </div>
              <h2 class="text-xl sm:text-2xl font-bold text-slate-900 mb-2">${product.name}</h2>
              <div class="flex items-baseline gap-2.5 mb-4">
                <span id="modalDisplayPrice" class="text-2xl font-extrabold text-blue-700">${formatPkr(activePrice)}</span>
                ${hasDiscount && !selectedVariant ? `<span class="text-sm text-slate-400 line-through">${formatPkr(product.pricePkr)}</span>` : ""}
              </div>
              <p class="text-xs sm:text-sm text-slate-600 mb-5 leading-relaxed">${product.fullDescription || product.shortDescription}</p>

              <!-- Variant Selector -->
              ${product.hasVariants && product.variants?.length > 0 ? `
                <div class="mb-5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <label class="block text-xs font-bold text-slate-700 uppercase mb-2">Select Option / Variant:</label>
                  <div class="flex flex-wrap gap-2">
                    ${product.variants.map((v, i) => `
                      <button onclick="HappyToysModal.selectVariant('${v.id}')" id="variant-btn-${v.id}" class="variant-chip px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${i === 0 ? "bg-blue-600 text-white border-blue-600 shadow-sm" : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"}">
                        ${v.name} (${formatPkr(v.salePricePkr || v.pricePkr)})
                      </button>
                    `).join("")}
                  </div>
                </div>
              ` : ""}
            </div>

            <!-- Action Buttons -->
            <div class="space-y-2 pt-4 border-t border-slate-200">
              <button onclick="HappyToysModal.addToCartAndCheckout()" class="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow transition flex items-center justify-center gap-2">
                <span>📲 Order via WhatsApp</span>
              </button>
              <button onclick="HappyToysModal.addToCartOnly()" class="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition">
                Add to Cart
              </button>
            </div>
          </div>
        </div>

        <!-- Related Products ("You May Also Like") -->
        ${related.length > 0 ? `
          <div class="pt-6 border-t border-slate-200">
            <h3 class="font-bold text-base text-slate-900 mb-3">You May Also Like</h3>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              ${related.map(r => `
                <div onclick="HappyToysApp.openProductModal('${r.id}')" class="p-3 rounded-2xl border border-slate-200 hover:border-blue-500 cursor-pointer transition bg-slate-50 flex flex-col justify-between">
                  <img src="${r.mainImage}" class="w-full aspect-square object-cover rounded-xl mb-2 bg-white" />
                  <h4 class="font-bold text-xs text-slate-800 line-clamp-1 mb-1">${r.name}</h4>
                  <span class="text-xs font-extrabold text-blue-700">${formatPkr(r.salePricePkr || r.pricePkr)}</span>
                </div>
              `).join("")}
            </div>
          </div>
        ` : ""}
        <div class="rainbow-bar mt-6"></div>
      </div>
    `;
    modalEl.classList.remove("hidden");
  }

  function selectVariant(varId) {
    if (!currentProduct || !currentProduct.variants) return;
    selectedVariant = currentProduct.variants.find(v => v.id === varId);
    
    document.querySelectorAll(".variant-chip").forEach(btn => {
      btn.className = "variant-chip px-3 py-1.5 rounded-xl border text-xs font-semibold bg-white text-slate-700 border-slate-300 hover:bg-slate-100";
    });
    const activeBtn = document.getElementById("variant-btn-" + varId);
    if (activeBtn) activeBtn.className = "variant-chip px-3 py-1.5 rounded-xl border text-xs font-semibold bg-blue-600 text-white border-blue-600 shadow-sm";

    if (selectedVariant) {
      const price = selectedVariant.salePricePkr || selectedVariant.pricePkr;
      const priceEl = document.getElementById("modalDisplayPrice");
      if (priceEl) priceEl.textContent = formatPkr(price);
    }
  }

  function close() {
    const modalEl = document.getElementById("productDetailModal");
    if (modalEl) modalEl.classList.add("hidden");
  }

  function addToCartAndCheckout() {
    if (!currentProduct) return;
    const variantText = selectedVariant ? ` [Option: ${selectedVariant.name}]` : "";
    const price = selectedVariant ? (selectedVariant.salePricePkr || selectedVariant.pricePkr) : (currentProduct.salePricePkr || currentProduct.pricePkr);
    const msg = `Hello Happy Toys Store! I want to order:\n\n*${currentProduct.name}*${variantText}\nSKU: ${currentProduct.sku}\nPrice: ${formatPkr(price)}\n\nPlease confirm availability and delivery details.`;
    const whatsappNum = "923000000000"; // Configurable in settings
    window.open(`https://wa.me/${whatsappNum}?text=` + encodeURIComponent(msg), "_blank");
  }

  function addToCartOnly() {
    if (!currentProduct) return;
    alert(`Added "${currentProduct.name}"${selectedVariant ? " (" + selectedVariant.name + ")" : ""} to cart! (Cart Drawer connects in Phase 5)`);
    close();
  }

  return { open, selectVariant, close, addToCartAndCheckout, addToCartOnly };
})();
