const HappyToysApp = (() => {
  let state = { categories: [], products: [], activeCategory: "all", searchQuery: "" };
  let appSettings = JSON.parse(localStorage.getItem("hts_settings") || "{}");

  function formatPkr(amount) { return "PKR " + Number(amount || 0).toLocaleString("en-PK"); }

  function init() {
    const seed = window.HAPPY_TOYS_SEED || { categories: [], products: [] };
    state.categories = seed.categories || [];
    
    // Setup Splash Screen Video
    const videoPlayer = document.getElementById("splashVideoPlayer");
    if(appSettings.introVideoUrl && videoPlayer) {
      videoPlayer.src = appSettings.introVideoUrl;
      videoPlayer.classList.remove("hidden");
    }

    const saved = localStorage.getItem("hts_custom_products");
    if (saved) {
      try { state.products = JSON.parse(saved); } catch (e) { state.products = seed.products || []; }
    } else {
      state.products = seed.products || [];
    }

    bindEvents();
    renderCategories();
    renderProducts();
  }

  function enterStore() {
    const splash = document.getElementById("vipSplashScreen");
    const video = document.getElementById("splashVideoPlayer");
    if(video) video.pause(); // save resources
    if(splash) {
      splash.style.opacity = '0';
      setTimeout(() => {
        splash.classList.add("hidden");
        document.body.classList.remove("splash-active");
      }, 700);
    }
  }

  function bindEvents() {
    const drawer = document.getElementById("categoryDrawerContainer");
    const closeDrawer = () => drawer && drawer.classList.add("hidden");
    const openDrawer = () => drawer && drawer.classList.remove("hidden");
    document.getElementById("openCategoryDrawerBtn")?.addEventListener("click", openDrawer);
    document.getElementById("closeCategoryDrawerBtn")?.addEventListener("click", closeDrawer);
    document.getElementById("categoryDrawerBackdrop")?.addEventListener("click", closeDrawer);

    const dSearch = document.getElementById("desktopSearchInput");
    const mSearch = document.getElementById("mobileSearchInput");
    const onSearch = (e) => {
      state.searchQuery = e.target.value.trim().toLowerCase();
      if (dSearch && dSearch !== e.target) dSearch.value = e.target.value;
      if (mSearch && mSearch !== e.target) mSearch.value = e.target.value;
      renderProducts();
    };
    dSearch?.addEventListener("input", onSearch);
    mSearch?.addEventListener("input", onSearch);
  }

  function renderCategories() {
    const horiz = document.getElementById("horizontalCategoryBar");
    const drawer = document.getElementById("drawerCategoryList");
    if (horiz) {
      horiz.innerHTML = state.categories.map((cat) => {
        const active = state.activeCategory === cat.slug ? "bg-blue-600 text-white border-blue-600" : "bg-slate-100 text-slate-700 hover:bg-slate-200 border-transparent";
        return `<button onclick="HappyToysApp.selectCategory('${cat.slug}')" class="whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold border transition flex items-center gap-1.5 ${active}"><span>${cat.icon}</span><span>${cat.name}</span></button>`;
      }).join("");
    }
    if (drawer) {
      drawer.innerHTML = state.categories.map((cat) => {
        const active = state.activeCategory === cat.slug ? "bg-blue-50 text-blue-700 font-bold" : "text-slate-700 hover:bg-slate-100 font-medium";
        return `<button onclick="HappyToysApp.selectCategory('${cat.slug}')" class="w-full text-left px-3.5 py-2.5 rounded-xl text-sm flex items-center justify-between transition ${active}"><span class="flex items-center gap-2.5"><span>${cat.icon}</span><span>${cat.name}</span></span><span class="text-xs text-slate-400">→</span></button>`;
      }).join("");
    }
  }

  function selectCategory(slug) {
    state.activeCategory = slug;
    document.getElementById("categoryDrawerContainer")?.classList.add("hidden");
    renderCategories();
    renderProducts();
  }

  function resetFilters() {
    state.activeCategory = "all"; state.searchQuery = "";
    document.getElementById("desktopSearchInput").value = "";
    document.getElementById("mobileSearchInput").value = "";
    renderCategories(); renderProducts();
  }

  function openProductModal(id) {
    const p = state.products.find(x => x.id === id);
    if (p && window.HappyToysModal) window.HappyToysModal.open(p, state.products);
  }

  function loadSamples() {
    localStorage.removeItem("hts_custom_products");
    init();
  }

  function renderProducts() {
    const grid = document.getElementById("productGrid");
    const emptyState = document.getElementById("emptyCatalogState");
    const activeCatObj = state.categories.find(c => c.slug === state.activeCategory);
    document.getElementById("activeCategoryHeading").textContent = activeCatObj ? activeCatObj.name : "All Toys";

    let filtered = state.products.filter((p) => {
      if (!p.isPublished) return false;
      if (state.activeCategory !== "all" && p.category !== state.activeCategory) return false;
      if (state.searchQuery && !`${p.name} ${p.sku}`.toLowerCase().includes(state.searchQuery)) return false;
      return true;
    });

    if (filtered.length === 0) {
      grid.innerHTML = "";
      emptyState.classList.remove("hidden");
      return;
    }
    emptyState.classList.add("hidden");

    grid.innerHTML = filtered.map((p) => `
      <article class="toy-card bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md transition">
        <div>
          <div class="relative overflow-hidden bg-slate-100 aspect-square">
            <img src="${p.mainImage}" alt="${p.name}" class="toy-card-img w-full h-full object-cover" />
          </div>
          <div class="p-4">
            <h3 class="font-bold text-slate-900 text-base leading-snug mb-1.5 line-clamp-2">${p.name}</h3>
            <p class="text-[11px] text-slate-400 font-medium mb-2">SKU: ${p.sku} | ${p.stockQty > 0 ? `<span class="text-emerald-600">In Stock</span>` : `<span class="text-red-500">Out of Stock</span>`}</p>
          </div>
        </div>
        <div class="px-4 pb-4 pt-2 border-t border-slate-100 bg-white">
          <div class="flex items-baseline gap-2 mb-3"><span class="text-lg font-extrabold text-blue-700">${formatPkr(p.pricePkr)}</span></div>
          <div class="grid grid-cols-2 gap-2">
            <button onclick="HappyToysApp.openProductModal('${p.id}')" class="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs">View Details</button>
            <button onclick="HappyToysApp.openProductModal('${p.id}')" class="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs">Buy Now</button>
          </div>
        </div>
        <div class="rainbow-bar"></div>
      </article>`).join("");
  }

  return { init, selectCategory, resetFilters, openProductModal, loadSamples, enterStore };
})();
document.addEventListener("DOMContentLoaded", HappyToysApp.init);
