const HappyToysModal = (() => {
  let currentProduct = null;
  let allProducts = [];

  function formatPkr(amount) {
    return "PKR " + Number(amount || 0).toLocaleString("en-PK");
  }

  function isFav(id) {
    try {
      const favs = JSON.parse(localStorage.getItem("hts_favorites") || "[]");
      return favs.includes(id);
    } catch (e) {
      return false;
    }
  }

  function open(product, productList) {
    currentProduct = product;
    allProducts = productList || [];

    let modal = document.getElementById("customProductDetailModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "customProductDetailModal";
      modal.className = "fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto";
      document.body.appendChild(modal);
    }

    const whatsappNumber = "923707116317";
    const favActive = isFav(product.id);
    const catName = product.categoryName || product.category || "For kids";
    const rating = product.rating || "4.8";
    const reviews = product.reviewsCount || "120";

    const waMessage = `Hello Happy Toys Store! I want to order this product:\n\n* Name: ${product.name}\n* Price: ${formatPkr(product.pricePkr)}\n* Product Link: ${window.location.origin}/#product=${product.id}\n\nPlease confirm my order!`;

    modal.innerHTML = `
      <div class="bg-white rounded-[2rem] max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 relative flex flex-col my-auto max-h-[92vh] animate-scale-in p-3.5 sm:p-5">
        
        <!-- Product Image Box -->
        <div class="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-slate-50">
          <img src="${product.mainImage}" alt="${product.name}" class="w-full h-full object-cover" />
          
          <!-- Top-Left Yellow Badge -->
          <span class="absolute top-3 left-3 bg-[#FACC15] text-slate-900 text-xs font-extrabold px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
            <span>🔥</span> <span>Hot Deal</span>
          </span>

          <!-- Close Button -->
          <button onclick="HappyToysModal.close()" class="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-white/95 hover:bg-white text-slate-700 flex items-center justify-center shadow-md font-bold transition">
            ✕
          </button>

          <!-- Rainbow Bottom Strip -->
          <div class="absolute bottom-0 inset-x-0 h-1.5 flex">
            <span class="flex-1 bg-rose-500"></span>
            <span class="flex-1 bg-amber-400"></span>
            <span class="flex-1 bg-emerald-400"></span>
            <span class="flex-1 bg-sky-500"></span>
            <span class="flex-1 bg-purple-500"></span>
          </div>
        </div>

        <!-- Product Details Content -->
        <div class="pt-3.5 pb-2 flex-1 overflow-y-auto space-y-2.5">
          <!-- Title -->
          <h2 class="text-lg sm:text-xl font-extrabold text-[#0F172A] leading-snug">${product.name}</h2>

          <!-- Category & Icon -->
          <div class="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <span class="text-sm">🧸</span>
            <span class="capitalize">${catName}</span>
          </div>

          <!-- Star Rating & Reviews -->
          <div class="flex items-center gap-1.5 text-xs">
            <svg class="w-4 h-4 text-amber-400 fill-current shrink-0" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
            <span class="font-extrabold text-slate-800">${rating}</span>
            <span class="text-slate-400 font-medium">(${reviews} reviews)</span>
            <span class="ml-auto text-[11px] font-bold ${product.stockQty > 0 ? 'text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full' : 'text-rose-500'}">
              ${product.stockQty > 0 ? '✓ In Stock' : 'Out of Stock'}
            </span>
          </div>

          <!-- Price -->
          <div class="pt-0.5">
            <span class="text-2xl font-black text-[#0066FF] tracking-tight">${formatPkr(product.pricePkr)}</span>
          </div>

          <!-- Short Description -->
          <div class="pt-1">
            <p class="text-slate-600 text-xs sm:text-sm leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
              ${product.shortDescription || 'Premium quality toy designed to bring endless smiles and interactive learning for kids!'}
            </p>
          </div>
        </div>

        <!-- Footer Action Buttons (Exact Reference UI) -->
        <div class="pt-3 border-t border-slate-100 flex items-center gap-2">
          <!-- Favorite Outline Heart Button -->
          <button onclick="HappyToysApp.toggleFavorite('${product.id}', event, true)" 
                  id="modalFavBtn-${product.id}"
                  class="w-11 h-11 rounded-2xl border border-slate-200 bg-white hover:bg-rose-50 flex items-center justify-center shrink-0 shadow-sm active:scale-90 transition">
            <svg class="w-5 h-5 text-rose-500 transition-transform" fill="${favActive ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>
          </button>

          <!-- Add to Cart Button with Cart Sticker -->
          <button onclick="HappyToysCart.addToCart('${product.id}'); HappyToysModal.close();" 
                  class="flex-1 h-11 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-white font-extrabold text-xs sm:text-sm shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition">
            <svg class="w-4 h-4 stroke-current shrink-0" fill="none" stroke-width="2.2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
            <span>Add to Cart</span>
          </button>

          <!-- Buy Now Button with Shopping Bag Sticker -->
          <a href="https://wa.me/${whatsappNumber}?text=${encodeURIComponent(waMessage)}" 
             target="_blank" 
             class="flex-1 h-11 rounded-full bg-[#0066FF] hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition">
            <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
              <path d="M9 6V5a3 3 0 016 0v1" stroke="white" stroke-width="2.2" stroke-linecap="round"/>
              <path fill-rule="evenodd" clip-rule="evenodd" d="M5.6 6h12.8c.95 0 1.74.74 1.8 1.69l.65 11A2 2 0 0118.86 21H5.14a2 2 0 01-1.99-2.31l.65-11C3.86 6.74 4.65 6 5.6 6zm6.4 8.2l-2.3-2.5h4.6L12 14.2z" fill="white"/>
            </svg>
            <span>Buy Now</span>
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
