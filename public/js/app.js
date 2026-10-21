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
      try {
        const db = await initDB();
        return new Promise((resolve) => {
          const tx = db.transaction(storeName, "readonly");
          const req = tx.objectStore(storeName).get(key);
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => resolve(null);
        });
      } catch (e) { return null; }
    }
  };
})();

const HappyToysApp = (() => {
  let state = { categories: [], products: [], activeCategory: "all", searchQuery: "" };

  function formatPkr(amount) { return "PKR " + Number(amount || 0).toLocaleString("en-PK"); }

  function playSplashMedia(mediaSource) {
    if (!mediaSource) return;
    const isVideo = mediaSource.startsWith("data:video") || mediaSource.endsWith(".mp4") || mediaSource.includes("video");
    const videoEl = document.getElementById("splashVideoPlayer");
    const imgEl = document.getElementById("splashImgPlayer");
    const placeholder = document.getElementById("splashMediaPlaceholder");

    if (placeholder) placeholder.classList.add("hidden");

    if (isVideo && videoEl) {
      if (videoEl.src !== mediaSource) {
        videoEl.src = mediaSource;
        videoEl.classList.remove("hidden");
        videoEl.play().catch(() => {});
      }
    } else if (imgEl) {
      imgEl.src = mediaSource;
      imgEl.classList.remove("hidden");
    }
  }

  async function init() {
    const seed = window.HAPPY_TOYS_SEED || { categories: [], products: [] };
    state.categories = seed.categories || [];

    // 1. Check local storage first (so admin's own phone restores saved items immediately)
    let localProducts = null;
    const savedLocal = localStorage.getItem("hts_custom_products");
    if (savedLocal) {
      try { localProducts = JSON.parse(savedLocal); } catch (e) {}
    }

    const localVideo = await HTS_DB.get("splashMedia");
    const appSettings = JSON.parse(localStorage.getItem("hts_settings") || "{}");
    const localMediaSource = localVideo || appSettings.introGifUrl || "";

    if (localProducts && localProducts.length > 0) {
      state.products = localProducts;
    } else {
      state.products = seed.products || [];
    }

    if (localMediaSource) {
      playSplashMedia(localMediaSource);
    }

    bindEvents();
    renderCategories();
    renderProducts();

    // 2. Sync with Live Cloudflare KV Database for ALL devices
    try {
      const storeRes = await fetch("/api/store");
      if (storeRes.ok) {
        const liveData = await storeRes.json();
        if (liveData.products && liveData.products.length > 0) {
          state.products = liveData.products;
          renderProducts();
        } else if (localProducts && localProducts.length > 0) {
          // Auto-upload local products from admin's phone to Live Server!
          await fetch("/api/store", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ products: localProducts })
          });
        }
      }

      const videoRes = await fetch("/api/video");
      if (videoRes.ok) {
        const liveVid = await videoRes.json();
        if (liveVid.videoData) {
          playSplashMedia(liveVid.videoData);
        } else if (localMediaSource) {
          // Auto-upload local video from admin's phone to Live Server!
          await fetch("/api/video", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ videoData: localMediaSource })
          });
        }
      }
    } catch (err) {
      console.log("Offline or syncing:", err);
    }
  }

  function fireEnterStoreConfetti() {
    if (typeof confetti === "function") {
      confetti({ particleCount: 200, spread: 120, origin: { y: 0.5 }, zIndex: 200 });
    }
  }

  function enterStore() {
    const splash = document.getElementById("vipSplashScreen");
    const video = document.getElementById("splashVideoPlayer");
    const mainContent = document.getElementById("mainStoreContent");

    if (video) video.pause();

    if (splash) {
      splash.style.opacity = "0";
      setTimeout(() => {
        splash.classList.add("hidden");
        document.body.classList.remove("splash-active");
        mainContent.classList.remove("opacity-0", "h-0", "overflow-hidden");
        mainContent.classList.add("store-reveal");
        fireEnterStoreConfetti();
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
    const drawer = document.getElementById("drawerCategoryList");

    if (horiz) {
      horiz.innerHTML = state.categories.map((cat) => {
        const active = state.activeCategory === cat.slug ? "bg-amber-500 text-white border-amber-600 shadow-md scale-105" : "bg-white text-slate-700 hover:bg-amber-50 border-slate-200";
        return `<button onclick="HappyToysApp.selectCategory('${cat.slug}')" class="whitespace-nowrap px-4 py-2.5 rounded-2xl text-xs font-black border-2 transition-all flex items-center gap-2 ${active}"><span>${cat.icon}</span><span>${cat.name}</span></button>`;
      }).join("");
    }

    if (drawer) {
      drawer.innerHTML = state.categories.map((cat) => {
        const active = state.activeCategory === cat.slug ? "bg-amber-100 text-amber-800 font-black border-l-4 border-amber-500" : "text-slate-700 hover:bg-slate-100 font-bold";
        return `<button onclick="HappyToysApp.selectCategory('${cat.slug}')" class="w-full text-left px-4 py-3 rounded-xl text-sm flex items-center justify-between transition ${active}"><span class="flex items-center gap-3"><span>${cat.icon}</span><span>${cat.name}</span></span><span class="text-xs text-amber-500 font-extrabold">→</span></button>`;
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
    state.activeCategory = "all";
    state.searchQuery = "";
    renderCategories();
    renderProducts();
  }

  function openProductModal(id) {
    const p = state.products.find(x => x.id === id);
    if (p && window.HappyToysModal) window.HappyToysModal.open(p, state.products);
  }

  function renderProducts() {
    const grid = document.getElementById("productGrid");
    const activeCatObj = state.categories.find(c => c.slug === state.activeCategory);
    if (document.getElementById("activeCategoryHeading")) {
      document.getElementById("activeCategoryHeading").textContent = activeCatObj ? activeCatObj.name : "All Toys";
    }

    let filtered = state.products.filter((p) => {
      if (!p.isPublished) return false;
      if (state.activeCategory !== "all" && p.category !== state.activeCategory) return false;
      return true;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `<div class="col-span-full py-12 text-center text-slate-400 font-semibold">No toys found in this category.</div>`;
      return;
    }

    grid.innerHTML = filtered.map((p) => `
      <article class="toy-card bg-white rounded-3xl border-2 border-slate-100 overflow-hidden flex flex-col shadow-sm hover:shadow-xl transition-all duration-300">
        <div class="relative aspect-square p-3 bg-amber-50/40 cursor-pointer" onclick="HappyToysApp.openProductModal('${p.id}')">
          <img src="${p.mainImage}" alt="${p.name}" class="w-full h-full object-cover rounded-2xl" />
        </div>
        <div class="px-4 pt-3 pb-4 bg-white flex-1 flex flex-col justify-between">
          <h3 class="font-black text-slate-900 text-sm leading-snug mb-2 line-clamp-2 cursor-pointer" onclick="HappyToysApp.openProductModal('${p.id}')">${p.name}</h3>
          <div>
            <span class="text-xl font-black text-blue-600 block mb-3">${formatPkr(p.pricePkr)}</span>
            <button onclick="HappyToysApp.openProductModal('${p.id}')" class="w-full py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-md transition">Buy Now</button>
          </div>
        </div>
      </article>`).join("");
  }

  return { init, selectCategory, resetFilters, openProductModal, enterStore };
})();
document.addEventListener("DOMContentLoaded", HappyToysApp.init);
