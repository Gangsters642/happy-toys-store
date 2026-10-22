const HappyToysApp = (() => {
  let state = { categories: [], products: [], activeCategory: "all", currentSort: "default" };
  let scrollObserver = null;
  let audioUnlockHandler = null;

  function formatPkr(amount) { return "PKR " + Number(amount || 0).toLocaleString("en-PK"); }
  function getProductById(id) { return state.products.find(x => x.id === id) || null; }
  function getAllProducts() { return state.products || []; }

  function setupVideoWithSound() {
    const v = document.getElementById("splashVideoPlayer");
    const btn = document.getElementById("unmuteNoticeBtn");
    if (!v) return;

    v.muted = false;
    v.volume = 1.0;

    const p = v.play();
    if (p !== undefined) {
      p.catch(() => {
        v.muted = true;
        v.play().catch(() => {});
        btn?.classList.remove("hidden");

        audioUnlockHandler = (e) => {
          if (e.target && e.target.closest("[onclick*='enterStore']")) return;
          const splash = document.getElementById("vipSplashScreen");
          if (!splash || splash.classList.contains("hidden")) return;
          v.muted = false;
          v.volume = 1.0;
          v.play().catch(() => {});
          btn?.classList.add("hidden");
          removeAudioListeners();
        };

        document.addEventListener("click", audioUnlockHandler);
        document.addEventListener("touchstart", audioUnlockHandler);
      });
    }
  }

  function removeAudioListeners() {
    if (audioUnlockHandler) {
      document.removeEventListener("click", audioUnlockHandler);
      document.removeEventListener("touchstart", audioUnlockHandler);
      audioUnlockHandler = null;
    }
  }

  function stopSplashVideoCompletely() {
    removeAudioListeners();
    const v = document.getElementById("splashVideoPlayer");
    if (v) {
      try {
        v.pause();
        v.muted = true;
        v.removeAttribute("src");
        v.load();
      } catch (e) {}
    }
  }

  function enterStore() {
    stopSplashVideoCompletely();
    const splash = document.getElementById("vipSplashScreen");
    document.body.classList.remove("splash-active");

    if (splash) {
      splash.style.pointerEvents = "none";
      splash.style.opacity = "0";
      setTimeout(() => {
        splash.classList.add("hidden");
        splash.style.display = "none";
      }, 300);
    }

    if (typeof confetti === "function") {
      confetti({ particleCount: 100, spread: 100, origin: { y: 0.6 } });
    }

    // Re-trigger 3D reveal on store entry
    document.querySelectorAll(".toy-card-reveal").forEach(c => c.classList.remove("is-visible"));
    setTimeout(() => initScrollAnimations(), 80);
  }

  function initScrollAnimations() {
    if (scrollObserver) scrollObserver.disconnect();
    scrollObserver = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
        } else {
          e.target.classList.remove("is-visible");
        }
      });
    }, { threshold: 0.08 });

    document.querySelectorAll(".toy-card-reveal").forEach((c, i) => {
      c.style.transitionDelay = `${(i % 4) * 75}ms`;
      scrollObserver.observe(c);
    });
  }

  function toggleHeartFill(btn, event) {
    if (event) event.stopPropagation();
    const svg = btn.querySelector("svg");
    if (svg) {
      const isFilled = btn.classList.toggle("text-rose-600");
      svg.style.fill = isFilled ? "#e11d48" : "none";
    }
    const cards = document.querySelectorAll(".toy-card");
    cards.forEach((card, idx) => {
      card.classList.remove("reanimate-3d-card", "is-visible");
      void card.offsetWidth;
      card.style.animationDelay = `${idx * 75}ms`;
      card.classList.add("reanimate-3d-card", "is-visible");
    });
  }

  function tapProductCard(id, el, event) {
    if (event) event.stopPropagation();
    document.querySelectorAll(".toy-card").forEach(c => c.classList.remove("card-selected-yellow"));
    const card = el ? el.closest(".toy-card") : null;
    if (card) card.classList.add("card-selected-yellow");
    setTimeout(() => {
      const p = getProductById(id);
      if (p && window.HappyToysModal) window.HappyToysModal.open(p);
    }, 160);
  }

  async function init() {
    setupVideoWithSound();
    const seed = window.HAPPY_TOYS_SEED || { categories: [], products: [] };
    state.categories = seed.categories || [];
    try { state.products = JSON.parse(localStorage.getItem("hts_custom_products") || "[]"); } catch (e) {}
    if (!state.products.length) state.products = seed.products || [];

    bindEvents();
    renderCategories();
    renderProducts();
    checkDirectLink();

    try {
      const res = await fetch("/api/store");
      if (res.ok) {
        const d = await res.json();
        if (d.products && d.products.length) {
          state.products = d.products;
          localStorage.setItem("hts_custom_products", JSON.stringify(d.products));
          renderProducts();
          checkDirectLink();
        }
      }
    } catch (e) {}
  }

  function checkDirectLink() {
    if (location.hash.includes("#product=")) {
      const id = location.hash.replace("#product=", "").trim();
      const p = getProductById(id);
      if (p && window.HappyToysModal) {
        stopSplashVideoCompletely();
        const splash = document.getElementById("vipSplashScreen");
        if (splash) { splash.classList.add("hidden"); splash.style.display = "none"; }
        document.body.classList.remove("splash-active");
        window.HappyToysModal.open(p);
      }
    }
  }

  function bindEvents() {
    const dr = document.getElementById("categoryDrawerContainer");
    document.getElementById("openCategoryDrawerBtn")?.addEventListener("click", () => dr?.classList.remove("hidden"));
    document.getElementById("closeCategoryDrawerBtn")?.addEventListener("click", () => dr?.classList.add("hidden"));
    document.getElementById("categoryDrawerBackdrop")?.addEventListener("click", () => dr?.classList.add("hidden"));
    window.addEventListener("hashchange", checkDirectLink);
  }

  function renderCategories() {
    const horiz = document.getElementById("horizontalCategoryBar");
    const drawer = document.getElementById("drawerCategoryList");
    if (horiz) {
      horiz.innerHTML = state.categories.map(c => {
        const act = state.activeCategory === c.slug
          ? "bg-amber-500 text-white border-amber-500 shadow-sm"
          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50";
        return `<button type="button" onclick="HappyToysApp.selectCategory('${c.slug}')" class="whitespace-nowrap px-4 py-2 rounded-full text-xs font-extrabold border transition flex items-center gap-2 cursor-pointer ${act}"><span>${c.icon}</span><span>${c.name}</span></button>`;
      }).join("");
    }
    if (drawer) {
      drawer.innerHTML = state.categories.map((c, i) => {
        const act = state.activeCategory === c.slug
          ? "bg-amber-100 text-amber-800 font-black border-l-4 border-amber-500"
          : "text-slate-700 hover:bg-slate-100 font-bold";
        return `<button type="button" onclick="HappyToysApp.selectCategory('${c.slug}')" style="animation-delay:${(i*0.04).toFixed(2)}s" class="drawer-category-item w-full text-left px-4 py-3 rounded-xl text-sm flex items-center justify-between cursor-pointer ${act}"><span class="flex items-center gap-3"><span>${c.icon}</span><span>${c.name}</span></span><span class="text-amber-500 font-black">→</span></button>`;
      }).join("");
    }
  }

  function selectCategory(slug) {
    state.activeCategory = slug;
    document.getElementById("categoryDrawerContainer")?.classList.add("hidden");
    renderCategories();
    renderProducts();
  }

  function resetFilters() { selectCategory("all"); }

  function sortProducts(sortVal) {
    state.currentSort = sortVal;
    renderProducts();
  }

  function renderProducts() {
    const grid = document.getElementById("productGrid");
    if (!grid) return;
    const catObj = state.categories.find(c => c.slug === state.activeCategory);
    const heading = document.getElementById("activeCategoryHeading");
    if (heading) heading.textContent = catObj ? catObj.name : "All Toys";

    let list = state.products.filter(p => p.isPublished && (state.activeCategory === "all" || p.category === state.activeCategory));

    if (state.currentSort === "price_asc") list.sort((a, b) => Number(a.pricePkr) - Number(b.pricePkr));
    else if (state.currentSort === "price_desc") list.sort((a, b) => Number(b.pricePkr) - Number(a.pricePkr));
    else if (state.currentSort === "az") list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    else if (state.currentSort === "za") list.sort((a, b) => (b.name || "").localeCompare(a.name || ""));

    if (!list.length) {
      grid.innerHTML = `<div class="col-span-full py-12 text-center text-slate-400 font-bold">No toys found in this category.</div>`;
      return;
    }

    const badges = ["🔥 Hot Deal", "✨ Bestseller", "★ New Arrival", "🔥 Trending"];
    const ratings = [
      { score: "4.8", count: "(120 reviews)" },
      { score: "4.7", count: "(98 reviews)" },
      { score: "4.6", count: "(75 reviews)" },
      { score: "4.5", count: "(62 reviews)" }
    ];

    grid.innerHTML = list.map((p, idx) => {
      const cat = state.categories.find(c => c.slug === p.category) || { icon: "🧠", name: "Educational Toys" };
      const r = ratings[idx % 4];
      const hasDiscount = p.comparePrice && Number(p.comparePrice) > Number(p.pricePkr);

      return `
      <article onclick="HappyToysApp.tapProductCard('${p.id}', this, event)" class="toy-card toy-card-reveal bg-white rounded-[1.6rem] border border-slate-100 overflow-hidden flex flex-col justify-between shadow-sm cursor-pointer p-2 sm:p-2.5">
        <div>
          <div class="relative aspect-square rounded-2xl overflow-hidden bg-slate-50 mb-2">
            <img src="${p.mainImage}" alt="${p.name}" class="w-full h-full object-cover" />
            <span class="absolute top-2 left-2 bg-gradient-to-r from-amber-300 to-yellow-400 text-slate-900 text-[9px] sm:text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs">${badges[idx % 4]}</span>
            <button type="button" onclick="HappyToysApp.toggleHeartFill(this, event)" class="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/95 text-rose-500 flex items-center justify-center shadow-md active:scale-125 transition cursor-pointer">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
            </button>
            <div class="card-rainbow-strip absolute bottom-0 left-0 right-0"></div>
          </div>

          <div class="px-0.5">
            <h3 class="font-extrabold text-slate-900 text-xs sm:text-sm leading-snug mb-0.5 truncate">${p.name}</h3>
            <div class="flex items-center gap-1 text-[10px] sm:text-[11px] text-slate-500 font-semibold mb-0.5">
              <span>${cat.icon}</span><span class="truncate">${cat.name}</span>
            </div>
            <div class="flex items-center gap-1 text-[10px] sm:text-[11px] mb-1">
              <span class="text-amber-400">★</span>
              <span class="font-extrabold text-slate-800">${r.score}</span>
              <span class="text-slate-400 font-medium">${r.count}</span>
            </div>
          </div>
        </div>

        <div class="px-0.5 pt-1">
          <div class="flex items-baseline gap-1.5 mb-1.5 flex-wrap">
            <span class="text-base sm:text-lg font-black text-blue-600">${formatPkr(p.pricePkr)}</span>
            ${hasDiscount ? `<del class="text-[10px] font-bold text-slate-400">${formatPkr(p.comparePrice)}</del>` : ""}
          </div>
          <div class="grid grid-cols-2 gap-1.5 w-full">
            <button type="button" onclick="event.stopPropagation(); HappyToysCart.addToCart('${p.id}');" class="w-full h-7 px-1 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-900 font-extrabold text-[10px] sm:text-[11px] shadow-xs flex items-center justify-center gap-1 active:scale-95 transition cursor-pointer">
              <span>🛒 Add to Cart</span>
            </button>
            <button type="button" onclick="HappyToysApp.tapProductCard('${p.id}', this, event)" class="w-full h-7 px-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[10px] sm:text-[11px] shadow-xs flex items-center justify-center gap-1 active:scale-95 transition cursor-pointer">
              <span>🛍️ Buy Now</span>
            </button>
          </div>
        </div>
      </article>`;
    }).join("");

    setTimeout(() => initScrollAnimations(), 80);
  }

  return { init, selectCategory, resetFilters, sortProducts, tapProductCard, toggleHeartFill, getProductById, getAllProducts, enterStore };
})();
window.HappyToysApp = HappyToysApp;
document.addEventListener("DOMContentLoaded", HappyToysApp.init);
