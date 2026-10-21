const HappyToysApp = (() => {
  let state = { categories: [], products: [], activeCategory: "all", searchQuery: "" };
  let appSettings = JSON.parse(localStorage.getItem("hts_settings") || "{}");

  function formatPkr(amount) { return "PKR " + Number(amount || 0).toLocaleString("en-PK"); }

  function getFallbackImageDataUri(title, bgColor = "#e0f2fe") {
    const safeTitle = (title || "Happy Toys Store").replace(/&/g, "&amp;").replace(/</g, "&lt;");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600"><rect width="100%" height="100%" fill="${bgColor}"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="24" fill="#0f172a">${safeTitle}</text></svg>`;
    return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
  }

  function init() {
    const seed = window.HAPPY_TOYS_SEED || { categories: [], products: [] };
    state.categories = seed.categories || [];
    
    const saved = localStorage.getItem("hts_custom_products");
    if (saved) {
      try { state.products = JSON.parse(saved); } catch (e) { state.products = seed.products || []; }
    } else {
      state.products = seed.products || [];
    }

    // Now uses an IMG tag (for GIF or static image) which is NEVER blocked by browsers
    const visualPlayer = document.getElementById("splashVideoPlayer");
    const overlay = document.getElementById("videoOverlay");
    const gradient = document.getElementById("splashGradient");
    
    if (appSettings.introGifUrl && visualPlayer) {
        visualPlayer.src = appSettings.introGifUrl;
        
        visualPlayer.onload = () => {
            visualPlayer.classList.remove("hidden");
            visualPlayer.classList.remove("opacity-0");
            visualPlayer.classList.add("opacity-100");
            if(overlay) {
                overlay.classList.remove("hidden");
                overlay.style.backgroundColor = "rgba(15, 23, 42, 0.4)"; // Much lighter overlay 
            }
            if(gradient) gradient.classList.add("hidden");
        };
        
        visualPlayer.onerror = () => {
            console.error("Failed to load GIF/Image.");
        };
    }

    bindEvents();
    renderCategories();
    renderProducts();
  }

  function fireConfetti() {
      var duration = 3 * 1000;
      var animationEnd = Date.now() + duration;
      var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 150 };

      function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
      }

      var interval = setInterval(function() {
        var timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);
        var particleCount = 50 * (timeLeft / duration);
        if(typeof confetti === 'function') {
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
        }
      }, 250);
  }

  function enterStore() {
    const splash = document.getElementById("vipSplashScreen");
    const mainContent = document.getElementById("mainStoreContent");
    
    if(splash) {
      splash.style.transform = 'scale(1.2)';
      splash.style.opacity = '0';
      
      setTimeout(() => {
        splash.classList.add("hidden");
        document.body.classList.remove("splash-active");
        
        mainContent.classList.remove("opacity-0", "h-0", "overflow-hidden");
        mainContent.classList.add("store-reveal");
        
        fireConfetti();
      }, 800);
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
        const active = state.activeCategory === cat.slug ? "bg-blue-600 text-white border-blue-600 shadow-sm" : "bg-white text-slate-700 hover:bg-slate-100 border-slate-200";
        return `<button onclick="HappyToysApp.selectCategory('${cat.slug}')" class="whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold border transition flex items-center gap-1.5 ${active}"><span>${cat.icon}</span><span>${cat.name}</span></button>`;
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
      <article class="toy-card bg-white rounded-3xl border border-slate-200/60 overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-xl transition-all duration-300">
        <div>
          <div class="relative overflow-hidden bg-slate-50 aspect-square p-2">
            <img src="${p.mainImage}" alt="${p.name}" class="toy-card-img w-full h-full object-cover rounded-2xl" onerror="this.onerror=null; this.src='${getFallbackImageDataUri(p.name, "#e2e8f0")}';" />
            <div class="absolute top-4 left-4 flex flex-col gap-1.5">
              ${p.salePricePkr && p.salePricePkr < p.pricePkr ? `<span class="px-3 py-1 rounded-full bg-red-500 text-white font-extrabold text-[10px] shadow-sm tracking-wider uppercase">Sale</span>` : ""}
            </div>
          </div>
          <div class="px-5 pt-4 pb-2">
            <h3 class="font-extrabold text-slate-900 text-lg leading-tight mb-1 line-clamp-2">${p.name}</h3>
            <p class="text-[11px] font-bold text-slate-400 mb-2">SKU: ${p.sku} &bull; ${p.stockQty > 0 ? `<span class="text-emerald-500">IN STOCK</span>` : `<span class="text-red-500">SOLD OUT</span>`}</p>
          </div>
        </div>
        <div class="px-5 pb-5 bg-white">
          <div class="flex items-end gap-2 mb-4">
            <span class="text-2xl font-black text-blue-600">${formatPkr(p.salePricePkr || p.pricePkr)}</span>
            ${p.salePricePkr && p.salePricePkr < p.pricePkr ? `<span class="text-sm font-bold text-slate-400 line-through pb-1">${formatPkr(p.pricePkr)}</span>` : ""}
          </div>
          <button onclick="HappyToysApp.openProductModal('${p.id}')" class="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm transition-all shadow-md hover:shadow-lg">View Details</button>
        </div>
      </article>`).join("");
  }

  return { init, selectCategory, resetFilters, openProductModal, loadSamples, enterStore };
})();
document.addEventListener("DOMContentLoaded", HappyToysApp.init);
