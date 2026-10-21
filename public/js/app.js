const HTS_DB = (() => {
  const dbName = "HappyToysDB";
  const storeName = "mediaStore";
  const initDB = () => new Promise((resolve, reject) => {
    const req = indexedDB.open(dbName, 1);
    req.onupgradeneeded = (e) => e.target.result.createObjectStore(storeName);
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
  return {
    get: async (key) => {
      const db = await initDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readonly");
        const req = tx.objectStore(storeName).get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(tx.error);
      });
    }
  };
})();

const HappyToysApp = (() => {
  let state = { categories: [], products: [], activeCategory: "all", searchQuery: "" };

  function formatPkr(amount) { return "PKR " + Number(amount || 0).toLocaleString("en-PK"); }

  async function init() {
    const seed = window.HAPPY_TOYS_SEED || { categories: [], products: [] };
    state.categories = seed.categories || [];
    const saved = localStorage.getItem("hts_custom_products");
    if (saved) {
      try { state.products = JSON.parse(saved); } catch (e) { state.products = seed.products || []; }
    } else {
      state.products = seed.products || [];
    }

    // Load Video from Advanced Storage
    const splashMedia = await HTS_DB.get('splashMedia');
    if (splashMedia) {
        const isVideo = splashMedia.startsWith("data:video");
        const videoEl = document.getElementById("splashVideoPlayer");
        const imgEl = document.getElementById("splashImgPlayer");
        const overlay = document.getElementById("videoOverlay");
        const gradient = document.getElementById("splashGradient");

        if (isVideo && videoEl) {
            videoEl.src = splashMedia;
            videoEl.classList.remove("hidden");
            videoEl.play().catch(e => console.log("Autoplay issue:", e));
        } else if (imgEl) {
            imgEl.src = splashMedia;
            imgEl.classList.remove("hidden");
        }
        
        if (overlay) overlay.classList.remove("hidden");
        if (gradient) gradient.classList.add("hidden");
    }

    bindEvents();
    renderCategories();
    renderProducts();
  }

  function fireConfetti() {
      if(typeof confetti !== 'function') return;
      var duration = 3 * 1000;
      var animationEnd = Date.now() + duration;
      var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 150 };
      function randomInRange(min, max) { return Math.random() * (max - min) + min; }
      var interval = setInterval(function() {
        var timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);
        var particleCount = 50 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
      }, 250);
  }

  function enterStore() {
    const splash = document.getElementById("vipSplashScreen");
    const video = document.getElementById("splashVideoPlayer");
    const mainContent = document.getElementById("mainStoreContent");
    
    if(video) video.pause();
    
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
      if (dSearch) dSearch.value = e.target.value;
      if (mSearch) mSearch.value = e.target.value;
      renderProducts();
    };
    dSearch?.addEventListener("input", onSearch);
    mSearch?.addEventListener("input", onSearch);
  }

  function renderCategories() {
    const horiz = document.getElementById("horizontalCategoryBar");
    if (horiz) {
      horiz.innerHTML = state.categories.map((cat) => {
        const active = state.activeCategory === cat.slug ? "bg-blue-600 text-white border-blue-600 shadow-sm" : "bg-white text-slate-700 hover:bg-slate-100 border-slate-200";
        return `<button onclick="HappyToysApp.selectCategory('${cat.slug}')" class="whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold border transition flex items-center gap-1.5 ${active}"><span>${cat.icon}</span><span>${cat.name}</span></button>`;
      }).join("");
    }
  }

  function selectCategory(slug) {
    state.activeCategory = slug;
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
    location.reload();
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
            <img src="${p.mainImage}" alt="${p.name}" class="toy-card-img w-full h-full object-cover rounded-2xl" />
          </div>
          <div class="px-5 pt-4 pb-2">
            <h3 class="font-extrabold text-slate-900 text-lg leading-tight mb-1 line-clamp-2">${p.name}</h3>
            <p class="text-[11px] font-bold text-slate-400 mb-2">SKU: ${p.sku}</p>
          </div>
        </div>
        <div class="px-5 pb-5 bg-white">
          <div class="flex items-end gap-2 mb-4"><span class="text-2xl font-black text-blue-600">${formatPkr(p.pricePkr)}</span></div>
          <div class="grid grid-cols-2 gap-2">
            <button onclick="HappyToysApp.openProductModal('${p.id}')" class="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-extrabold text-xs transition-all">Details</button>
            <button onclick="HappyToysApp.openProductModal('${p.id}')" class="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition-all shadow-md">Buy Now</button>
          </div>
        </div>
      </article>`).join("");
  }

  return { init, selectCategory, resetFilters, openProductModal, loadSamples, enterStore };
})();
document.addEventListener("DOMContentLoaded", HappyToysApp.init);
