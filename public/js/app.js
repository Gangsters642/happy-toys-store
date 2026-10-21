const HappyToysApp = (() => {
  let state = { categories: [], products: [], activeCategory: "all", searchQuery: "" };
  let scrollObserver = null;

  function formatPkr(amount) { return "PKR " + Number(amount || 0).toLocaleString("en-PK"); }

  function setupVideoWithSound() {
    const videoEl = document.getElementById("splashVideoPlayer");
    const unmuteBtn = document.getElementById("unmuteNoticeBtn");
    if (!videoEl) return;

    // 1. Force unmute and 100% volume
    videoEl.muted = false;
    videoEl.volume = 1.0;

    const playPromise = videoEl.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Browser blocked unmuted autoplay -> start playing muted so video doesn't freeze,
        // and unmute on the very first touch/click anywhere on the screen!
        videoEl.muted = true;
        videoEl.play().catch(() => {});
        if (unmuteBtn) unmuteBtn.classList.remove("hidden");

        const enableAudio = () => {
          videoEl.muted = false;
          videoEl.volume = 1.0;
          videoEl.play().catch(() => {});
          if (unmuteBtn) unmuteBtn.classList.add("hidden");
          document.removeEventListener("click", enableAudio);
          document.removeEventListener("touchstart", enableAudio);
        };

        document.addEventListener("click", enableAudio, { once: true });
        document.addEventListener("touchstart", enableAudio, { once: true });
      });
    }
  }

  function initScrollAnimations() {
    if (scrollObserver) scrollObserver.disconnect();

    scrollObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
        } else {
          // Re-animate smoothly when scrolling back up/down
          entry.target.classList.remove("is-visible");
        }
      });
    }, { threshold: 0.12 });

    const cards = document.querySelectorAll(".toy-card-reveal");
    cards.forEach((card, index) => {
      // Stagger delay so cards pop in one after another nicely
      card.style.transitionDelay = `${(index % 4) * 90}ms`;
      scrollObserver.observe(card);
    });
  }

  async function init() {
    setupVideoWithSound();

    const seed = window.HAPPY_TOYS_SEED || { categories: [], products: [] };
    state.categories = seed.categories || [];

    const savedLocal = localStorage.getItem("hts_custom_products");
    if (savedLocal) {
      try { state.products = JSON.parse(savedLocal); } catch (e) {}
    }
    if (!state.products || state.products.length === 0) {
      state.products = seed.products || [];
    }

    bindEvents();
    renderCategories();
    renderProducts();

    try {
      const storeRes = await fetch("/api/store");
      if (storeRes.ok) {
        const liveData = await storeRes.json();
        if (liveData.products && liveData.products.length > 0) {
          state.products = liveData.products;
          localStorage.setItem("hts_custom_products", JSON.stringify(liveData.products));
          renderProducts();
        }
      }
    } catch (err) {
      console.log("Background sync:", err);
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

    if (video) {
      video.pause();
      video.muted = true;
    }

    if (splash) {
      splash.style.opacity = "0";
      setTimeout(() => {
        splash.classList.add("hidden");
        document.body.classList.remove("splash-active");
        mainContent.classList.remove("opacity-0", "h-0", "overflow-hidden");
        mainContent.classList.add("store-reveal");
        fireEnterStoreConfetti();
        initScrollAnimations();
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

    grid.innerHTML = filtered.map((p, idx) => {
      const waveClass = idx % 2 === 0 ? "wave-even" : "wave-odd";
      return `
      <article class="toy-card toy-card-reveal ${waveClass} bg-white rounded-3xl border-2 border-slate-100 overflow-hidden flex flex-col shadow-md transition-all duration-300">
        <div class="relative aspect-square p-3 bg-gradient-to-br from-amber-50/60 via-white to-sky-50/40 cursor-pointer overflow-hidden group" onclick="HappyToysApp.openProductModal('${p.id}')">
          <img src="${p.mainImage}" alt="${p.name}" class="w-full h-full object-cover rounded-2xl transition-transform duration-500 group-hover:scale-105" />
          <span class="absolute top-4 right-4 bg-amber-400 text-slate-900 text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm">✨ HOT</span>
        </div>
        <div class="px-4 pt-3 pb-4 bg-white flex-1 flex flex-col justify-between">
          <h3 class="font-black text-slate-900 text-sm leading-snug mb-2 line-clamp-2 cursor-pointer hover:text-amber-600 transition" onclick="HappyToysApp.openProductModal('${p.id}')">${p.name}</h3>
          <div>
            <span class="text-xl font-black text-blue-600 block mb-3">${formatPkr(p.pricePkr)}</span>
            <button onclick="HappyToysApp.openProductModal('${p.id}')" class="w-full py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs shadow-md active:scale-95 transition-all">Buy Now 🛒</button>
          </div>
        </div>
      </article>`;
    }).join("");

    initScrollAnimations();
  }

  return { init, selectCategory, resetFilters, openProductModal, enterStore };
})();
document.addEventListener("DOMContentLoaded", HappyToysApp.init);
