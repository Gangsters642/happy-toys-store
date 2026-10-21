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

    // Load Uploaded Video into the new VIP UI Block
    const splashMedia = await HTS_DB.get('splashMedia');
    if (splashMedia) {
        const isVideo = splashMedia.startsWith("data:video");
        const videoEl = document.getElementById("splashVideoPlayer");
        const imgEl = document.getElementById("splashImgPlayer");
        const placeholder = document.getElementById("splashMediaPlaceholder");

        if (placeholder) placeholder.classList.add("hidden"); // Hide default placeholder

        if (isVideo && videoEl) {
            videoEl.src = splashMedia;
            videoEl.classList.remove("hidden");
            // Video attributes already set in HTML, just attempt play
            videoEl.play().catch(e => console.log("Autoplay issue (requires user interaction):", e));
        } else if (imgEl) {
            imgEl.src = splashMedia;
            imgEl.classList.remove("hidden");
        }
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
    
    if(video) video.pause(); // stop video to save battery
    
    if(splash) {
      splash.style.opacity = '0';
      setTimeout(() => {
        splash.classList.add("hidden");
        document.body.classList.remove("splash-active");
        mainContent.classList.remove("opacity-0", "h-0", "overflow-hidden");
        mainContent.classList.add("store-reveal");
        fireConfetti();
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
  }

  function renderCategories() {
    const horiz = document.getElementById("horizontalCategoryBar");
    if (horiz) {
      horiz.innerHTML = state.categories.map((cat) => {
        const active = state.activeCategory === cat.slug ? "bg-blue-600 text-white border-blue-600 shadow-sm" : "bg-white text-slate-700 border-slate-200";
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
    renderCategories(); renderProducts();
  }

  function openProductModal(id) {
    const p = state.products.find(x => x.id === id);
    if (p && window.HappyToysModal) window.HappyToysModal.open(p, state.products);
  }

  function renderProducts() {
    const grid = document.getElementById("productGrid");
    const activeCatObj = state.categories.find(c => c.slug === state.activeCategory);
    document.getElementById("activeCategoryHeading").textContent = activeCatObj ? activeCatObj.name : "All Toys";

    let filtered = state.products.filter((p) => {
      if (!p.isPublished) return false;
      if (state.activeCategory !== "all" && p.category !== state.activeCategory) return false;
      return true;
    });

    grid.innerHTML = filtered.map((p) => `
      <article class="toy-card bg-white rounded-3xl border border-slate-200/60 overflow-hidden flex flex-col shadow-sm hover:shadow-lg transition">
        <div class="relative aspect-square p-2 bg-slate-50">
          <img src="${p.mainImage}" alt="${p.name}" class="w-full h-full object-cover rounded-2xl" />
        </div>
        <div class="px-4 pt-3 pb-4 bg-white flex-1 flex flex-col">
          <h3 class="font-extrabold text-slate-900 text-sm leading-tight mb-2 line-clamp-2">${p.name}</h3>
          <div class="mt-auto">
            <span class="text-xl font-black text-blue-600 block mb-3">${formatPkr(p.pricePkr)}</span>
            <button onclick="HappyToysApp.openProductModal('${p.id}')" class="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs shadow-md">Buy Now</button>
          </div>
        </div>
      </article>`).join("");
  }

  return { init, selectCategory, resetFilters, openProductModal, enterStore };
})();
document.addEventListener("DOMContentLoaded", HappyToysApp.init);
