const HappyToysApp = (() => {
  let state = {
    categories: [],
    products: [],
    activeCategory: "all",
    searchQuery: "",
    sortBy: "featured",
    inStockOnly: false,
    emptyModeTest: false
  };

  function formatPkr(amount) {
    return "PKR " + Number(amount || 0).toLocaleString("en-PK");
  }

  function getFallbackImageDataUri(title, bgColor = "#e0f2fe") {
    const safeTitle = (title || "Happy Toys Store").replace(/&/g, "&amp;").replace(/</g, "&lt;");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
      <rect width="100%" height="100%" fill="${bgColor}"/>
      <text x="50%" y="42%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="64">🧸</text>
      <text x="50%" y="56%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="22" fill="#0f172a">${safeTitle}</text>
      <text x="50%" y="64%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="15" fill="#475569">Happy Toys Store</text>
    </svg>`;
    return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
  }

  function init() {
    const seed = window.HAPPY_TOYS_SEED || { categories: [], products: [], settings: {} };
    state.categories = seed.categories || [];
    state.products = seed.products || [];
    const yearEl = document.getElementById("footerYear");
    if (yearEl) yearEl.textContent = new Date().getFullYear();
    bindEvents();
    renderCategories();
    renderProducts();
  }

  function bindEvents() {
    const drawer = document.getElementById("categoryDrawerContainer");
    const openBtn = document.getElementById("openCategoryDrawerBtn");
    const closeBtn = document.getElementById("closeCategoryDrawerBtn");
    const backdrop = document.getElementById("categoryDrawerBackdrop");
    const closeDrawer = () => drawer && drawer.classList.add("hidden");
    const openDrawer = () => drawer && drawer.classList.remove("hidden");

    if (openBtn) openBtn.addEventListener("click", openDrawer);
    if (closeBtn) closeBtn.addEventListener("click", closeDrawer);
    if (backdrop) backdrop.addEventListener("click", closeDrawer);

    const dSearch = document.getElementById("desktopSearchInput");
    const mSearch = document.getElementById("mobileSearchInput");
    const onSearch = (e) => {
      state.searchQuery = e.target.value.trim().toLowerCase();
      if (dSearch && dSearch !== e.target) dSearch.value = e.target.value;
      if (mSearch && mSearch !== e.target) mSearch.value = e.target.value;
      renderProducts();
    };
    if (dSearch) dSearch.addEventListener("input", onSearch);
    if (mSearch) mSearch.addEventListener("input", onSearch);

    const sortSelect = document.getElementById("sortSelect");
    if (sortSelect) sortSelect.addEventListener("change", (e) => { state.sortBy = e.target.value; renderProducts(); });

    const stockCheck = document.getElementById("inStockOnlyCheckbox");
    if (stockCheck) stockCheck.addEventListener("change", (e) => { state.inStockOnly = e.target.checked; renderProducts(); });

    const toggleEmpty = () => { state.emptyModeTest = !state.emptyModeTest; renderProducts(); closeDrawer(); };
    const emptyBtn = document.getElementById("toggleEmptyStateBtn");
    const mEmptyBtn = document.getElementById("mobileToggleEmptyBtn");
    if (emptyBtn) emptyBtn.addEventListener("click", toggleEmpty);
    if (mEmptyBtn) mEmptyBtn.addEventListener("click", toggleEmpty);
  }

  function renderCategories() {
    const horiz = document.getElementById("horizontalCategoryBar");
    const drawer = document.getElementById("drawerCategoryList");
    if (horiz) {
      horiz.innerHTML = state.categories.map((cat) => {
        const active = state.activeCategory === cat.slug ? "bg-blue-600 text-white border-blue-600" : "bg-slate-100 text-slate-700 border-transparent hover:bg-slate-200";
        return `<button onclick="HappyToysApp.selectCategory('${cat.slug}')" class="whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold border transition flex items-center gap-1.5 ${active}"><span>${cat.icon || "🧸"}</span><span>${cat.name}</span></button>`;
      }).join("");
    }
    if (drawer) {
      drawer.innerHTML = state.categories.map((cat) => {
        const active = state.activeCategory === cat.slug ? "bg-blue-50 text-blue-700 font-bold" : "text-slate-700 hover:bg-slate-100 font-medium";
        return `<button onclick="HappyToysApp.selectCategory('${cat.slug}')" class="w-full text-left px-3.5 py-2.5 rounded-xl text-sm flex items-center justify-between transition ${active}"><span class="flex items-center gap-2.5"><span>${cat.icon || "🧸"}</span><span>${cat.name}</span></span><span class="text-xs text-slate-400">→</span></button>`;
      }).join("");
    }
  }

  function selectCategory(slug) {
    state.activeCategory = slug;
    state.emptyModeTest = false;
    const drawer = document.getElementById("categoryDrawerContainer");
    if (drawer) drawer.classList.add("hidden");
    renderCategories();
    renderProducts();
  }

  function resetFilters() {
    state.activeCategory = "all";
    state.searchQuery = "";
    state.sortBy = "featured";
    state.inStockOnly = false;
    state.emptyModeTest = false;
    const dSearch = document.getElementById("desktopSearchInput");
    const mSearch = document.getElementById("mobileSearchInput");
    if (dSearch) dSearch.value = "";
    if (mSearch) mSearch.value = "";
    renderCategories();
    renderProducts();
  }

  function renderProducts() {
    const grid = document.getElementById("productGrid");
    const emptyState = document.getElementById("emptyCatalogState");
    const heading = document.getElementById("activeCategoryHeading");
    const countText = document.getElementById("productCountSubtext");
    const activeCatObj = state.categories.find((c) => c.slug === state.activeCategory);
    if (heading) heading.textContent = activeCatObj ? activeCatObj.name : "All Toys";

    let filtered = state.emptyModeTest ? [] : state.products.filter((p) => {
      if (!p.isPublished) return false;
      if (state.activeCategory !== "all") {
        if (state.activeCategory === "new-arrivals" && !p.isNewArrival) return false;
        else if (state.activeCategory === "best-sellers" && !p.isBestSeller) return false;
        else if (state.activeCategory === "special-offers" && !p.isSpecialOffer) return false;
        else if (!["new-arrivals", "best-sellers", "special-offers"].includes(state.activeCategory) && p.category !== state.activeCategory && p.subcategory !== state.activeCategory) return false;
      }
      if (state.inStockOnly && p.stockQty <= 0) return false;
      if (state.searchQuery) {
        const hay = `${p.name} ${p.shortDescription} ${p.sku} ${(p.tags || []).join(" ")}`.toLowerCase();
        if (!hay.includes(state.searchQuery)) return false;
      }
      return true;
    });

    filtered.sort((a, b) => {
      const pA = a.salePricePkr || a.pricePkr;
      const pB = b.salePricePkr || b.pricePkr;
      if (state.sortBy === "price-asc") return pA - pB;
      if (state.sortBy === "price-desc") return pB - pA;
      if (state.sortBy === "newest") return (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0);
      return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
    });

    if (countText) countText.textContent = `${filtered.length} ${filtered.length === 1 ? "toy" : "toys"} available`;

    if (filtered.length === 0) {
      if (grid) grid.innerHTML = "";
      if (emptyState) emptyState.classList.remove("hidden");
      return;
    }
    if (emptyState) emptyState.classList.add("hidden");

    if (grid) {
      grid.innerHTML = filtered.map((p) => {
        const hasDisc = p.salePricePkr && p.salePricePkr < p.pricePkr;
        const price = hasDisc ? p.salePricePkr : p.pricePkr;
        const discPct = hasDisc ? Math.round(((p.pricePkr - p.salePricePkr) / p.pricePkr) * 100) : 0;
        const fallback = getFallbackImageDataUri(p.fallbackSvgTitle || p.name, p.fallbackColor);
        return `
        <article class="toy-card bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col justify-between">
          <div>
            <div class="relative overflow-hidden bg-slate-100">
              <img src="${p.mainImage}" alt="${p.name}" onerror="this.onerror=null; this.src='${fallback}';" class="toy-card-img w-full" />
              <div class="absolute top-3 left-3 flex flex-col gap-1.5">
                ${hasDisc ? `<span class="px-2.5 py-1 rounded-full bg-red-500 text-white font-bold text-[11px] shadow">-${discPct}% OFF</span>` : ""}
                ${p.isBestSeller ? `<span class="px-2.5 py-1 rounded-full bg-amber-400 text-slate-900 font-bold text-[11px] shadow">🔥 Best Seller</span>` : ""}
              </div>
              ${p.ageGroup ? `<span class="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-slate-900/75 text-white font-semibold text-[11px]">${p.ageGroup}</span>` : ""}
            </div>
            <div class="p-4">
              <div class="flex items-center justify-between text-[11px] text-slate-400 font-medium mb-1">
                <span>SKU: ${p.sku}</span>
                <span class="${p.stockQty > 0 ? "text-emerald-600 font-semibold" : "text-red-500 font-semibold"}">${p.stockQty > 0 ? `● In Stock (${p.stockQty})` : "● Out of Stock"}</span>
              </div>
              <h3 class="font-bold text-slate-900 text-base leading-snug mb-1.5">${p.name}</h3>
              <p class="text-xs text-slate-500 mb-3">${p.shortDescription}</p>
              ${p.hasVariants ? `<div class="mb-2"><span class="inline-block text-[11px] font-semibold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700">✨ ${p.variants.length} Option(s) Available</span></div>` : ""}
            </div>
          </div>
          <div class="px-4 pb-4 pt-2 border-t border-slate-100">
            <div class="flex items-baseline gap-2 mb-3">
              <span class="text-lg font-extrabold text-blue-700">${formatPkr(price)}</span>
              ${hasDisc ? `<span class="text-xs text-slate-400 line-through">${formatPkr(p.pricePkr)}</span>` : ""}
            </div>
            <div class="grid grid-cols-2 gap-2">
              <button onclick="HappyToysApp.previewProductAlert('${p.id}')" class="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs">View Details</button>
              <button onclick="HappyToysApp.quickBuyAlert('${p.id}')" class="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs">Buy Now</button>
            </div>
          </div>
          <div class="rainbow-bar"></div>
        </article>`;
      }).join("");
    }
  }

  function previewProductAlert(id) {
    const p = state.products.find((i) => i.id === id);
    if (p) alert(`🧸 ${p.name}\nPrice: ${formatPkr(p.salePricePkr || p.pricePkr)}\n(Full modal connects in Phase 4)`);
  }

  function quickBuyAlert(id) {
    const p = state.products.find((i) => i.id === id);
    if (p) alert(`📲 WhatsApp Order: ${p.name}\nPrice: ${formatPkr(p.salePricePkr || p.pricePkr)}\n(WhatsApp & Cart Drawer connects in Phase 5)`);
  }

  return { init, selectCategory, resetFilters, previewProductAlert, quickBuyAlert };
})();
document.addEventListener("DOMContentLoaded", HappyToysApp.init);
