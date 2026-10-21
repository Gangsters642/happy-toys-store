const HappyToysModal = (() => {
  let currentProduct = null;
  let allProducts = [];

  function formatPkr(amount) { return "PKR " + Number(amount || 0).toLocaleString("en-PK"); }

  function open(product, productList) {
    currentProduct = product;
    allProducts = productList || [];

    let modal = document.getElementById("customProductDetailModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "customProductDetailModal";
      modal.className = "fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto";
      document.body.appendChild(modal);
    }

    const whatsappNumber = "923707116317"; // 03707116317 converted to international format

    modal.innerHTML = `
      <div class="bg-white rounded-[2.5rem] max-w-lg w-full overflow-hidden shadow-2xl border-4 border-amber-300 relative flex flex-col my-auto max-h-[90vh] animate-scale-in">
        
        <!-- Close Button -->
        <button onclick="HappyToysModal.close()" class="absolute top-4 right-4 z-20 bg-white/95 hover:bg-slate-100 text-slate-700 p-2.5 rounded-full shadow-md font-bold transition">
          ✕
        </button>

        <!-- Product Image -->
        <div class="relative w-full aspect-square bg-amber-50/50 p-6 flex items-center justify-center">
          <img src="${product.mainImage}" alt="${product.name}" class="w-full h-full object-cover rounded-2xl shadow-inner" />
          <span class="absolute bottom-4 left-4 bg-amber-400 text-slate-900 text-xs font-black px-3 py-1 rounded-full shadow-sm">✨ Happy Toys Exclusive</span>
        </div>

        <!-- Product Content Details -->
        <div class="p-6 flex-1 overflow-y-auto space-y-4">
          <div>
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">SKU: ${product.sku || 'HTS-TOY'}</span>
            <h2 class="text-xl sm:text-2xl font-black text-slate-900 leading-snug">${product.name}</h2>
          </div>

          <div class="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div>
              <span class="text-xs text-slate-500 block font-bold">Price</span>
              <span class="text-2xl font-black text-blue-600">${formatPkr(product.pricePkr)}</span>
            </div>
            <div class="text-right">
              <span class="text-xs text-slate-500 block font-bold">Stock Status</span>
              <span class="text-xs font-extrabold ${product.stockQty > 0 ? 'text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full' : 'text-red-500'}">
                ${product.stockQty > 0 ? '✓ In Stock (' + product.stockQty + ' available)' : 'Out of Stock'}
              </span>
            </div>
          </div>

          <div>
            <h4 class="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Description & Features</h4>
            <p class="text-slate-600 text-sm leading-relaxed bg-amber-50/30 p-4 rounded-2xl border border-amber-100/60">${product.shortDescription || 'No additional description provided for this premium toy. Best choice for kids!'}</p>
          </div>
        </div>

        <!-- Floating / Animated WhatsApp Buy Now Footer -->
        <div class="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-3">
          <a href="https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Hello Happy Toys Store! I want to order this product:\n\n* ' + product.name + '\n* Price: ' + formatPkr(product.pricePkr) + '\n* Product Link: ' + window.location.origin + '/#product=' + product.id + '\n\nPlease confirm my order!')}" 
             target="_blank" 
             class="btn-vip-gradient w-full py-4 rounded-2xl text-white font-black text-base flex items-center justify-center gap-2 shadow-xl animate-bounce cursor-pointer">
            <span>💬 Order via WhatsApp (03707116317)</span>
          </a>
        </div>

      </div>
    `;
    modal.classList.remove("hidden");
  }

  function close() {
    const modal = document.getElementById("customProductDetailModal");
    if (modal) modal.classList.add("hidden");
  }

  return { open, close };
})();
