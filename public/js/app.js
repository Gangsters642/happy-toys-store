const HappyToysApp = (() => {
  let state = { categories: [], products: [], activeCategory: "all" };
  let scrollObserver = null;

  function formatPkr(amount) { return "PKR " + Number(amount || 0).toLocaleString("en-PK"); }
  function getProductById(id) { return state.products.find(x => x.id === id) || null; }

  function setupVideoWithSound() {
    const v = document.getElementById("splashVideoPlayer");
    const btn = document.getElementById("unmuteNoticeBtn");
    if (!v) return;
    v.muted = false; v.volume = 1.0;
    const p = v.play();
    if (p !== undefined) {
      p.catch(() => {
        v.muted = true; v.play().catch(() => {});
        btn?.classList.remove("hidden");
        const unmute = () => { v.muted = false; v.volume = 1.0; v.play().catch(() => {}); btn?.classList.add("hidden"); };
        document.addEventListener("click", unmute, { once: true });
        document.addEventListener("touchstart", unmute, { once: true });
      });
    }
  }

  function initScrollAnimations() {
    if (scrollObserver) scrollObserver.disconnect();
    scrollObserver = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add("is-visible");
        else e.target.classList.remove("is-visible");
      });
    }, { threshold: 0.1 });
    document.querySelectorAll(".toy-card-reveal").forEach((c, i) => {
      c.style.transitionDelay = `${(i % 4) * 80}ms`;
      scrollObserver.observe(c);
    });
  }

  function triggerHeart3DAnimation(event) {
    if (event) event.stopPropagation();
    const cards = document.querySelectorAll(".toy-card");
    cards.forEach((card, idx) => {
      card.classList.remove("reanimate-3d-card", "is-visible");
      void card.offsetWidth;
      card.style.animationDelay = `${idx * 90}ms`;
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
    }, 220);
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
        document.getElementById("vipSplashScreen")?.classList.add("hidden");
        document.body.classList.remove("splash-active");
        document.getElementById("mainStoreContent")?.classList.remove("opacity-0", "h-0", "overflow-hidden");
        window.HappyToysModal.open(p);
      }
    }
  }

  function enterStore() {
    const splash = document.getElementById("vipSplashScreen");
    const video = document.getElementById("splashVideoPlayer");
    const main = document.getElementById("mainStoreContent");
    if (video) { video.pause(); video.muted = true; }
    if (splash) {
      splash.style.opacity = "0";
      setTimeout(() => {
        splash.classList.add("hidden");
        document.body.classList.remove("splash-active");
        main?.classList.remove("opacity-0", "h-0", "overflow-hidden");
        if (typeof confetti === "function") confetti({ particleCount: 180, spread: 110, origin: { y: 0.5 } });
        initScrollAnimations();
      }, 600);
    }
  }

  function bindEvents() {
    const dr = document.getElementById("categoryDrawerContainer");
    document.getElementById("openCategoryDrawerBtn")?.addEventListener("click", () => dr?.classList.remove("hidden"));
    document.getElementById("closeCategoryDrawerBtn")?.addEventListener("click", () => dr?.classList.add("hidden"));
    document.getElementById("categoryDrawerBackdrop")?.addEventListener("click", () => dr?.classList.add("hidden"));
  }

  function renderCategories() {
    const horiz = document.getElementById("horizontalCategoryBar");
    const drawer = document.getElementById("drawerCategoryList");
    if (horiz) {
      horiz.innerHTML = state.categories.map(c => {
        const act = state.activeCategory === c.slug ? "bg-amber-500 text-white border-amber-500 shadow-md" : "bg-white text-slate-700 border-slate-200";
        return `<button onclick="HappyToysApp.selectCategory('${c.slug}')" class="whitespace-nowrap px-4 py-2 rounded-full text-xs font-black border transition flex items-center gap-2 ${act}"><span>${c.icon}</span><span>${c.name}</span></button>`;
      }).join("");
    }
    if (drawer) {
      drawer.innerHTML = state.categories.map((c, i) => {
        const act = state.activeCategory === c.slug ? "bg-amber-100 text-amber-800 font-black border-l-4 border-amber-500" : "text-slate-700 font-bold";
        return `<button onclick="HappyToysApp.selectCategory('${c.slug}')" style="animation-delay:${(i*0.04).toFixed(2)}s" class="drawer-category-item w-full text-left px-4 py-3 rounded-xl text-sm flex items-center justify-between ${act}"><span class="flex items-center gap-3"><span>${c.icon}</span><span>${c.name}</span></span><span class="text-amber-500 font-black">→</span></button>`;
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

  function renderProducts() {
    const grid = document.getElementById("productGrid");
    if (!grid) return;
    const catObj = state.categories.find(c => c.slug === state.activeCategory);
    const heading = document.getElementById("activeCategoryHeading");
    if (heading) heading.textContent = catObj ? catObj.name : "All Toys";

    const list = state.products.filter(p => p.isPublished && (state.activeCategory === "all" || p.category === state.activeCategory));
    if (!list.length) {
      grid.innerHTML = `<div class="col-span-full py-12 text-center text-slate-400 font-bold">No toys found.</div>`;
      return;
    }

    const badges = ["🔥 Hot Deal", "✨ Bestseller", "★ New Arrival", "🔥 Trending"];
    const reviews = ["4.8 (120 reviews)", "4.7 (98 reviews)", "4.6 (75 reviews)", "4.5 (62 reviews)"];

    grid.innerHTML = list.map((p, idx) => {
      const cat = state.categories.find(c => c.slug === p.category) || { icon: "🧠", name: "Educational Toys" };
      const wave = idx % 2 === 0 ? "wave-even" : "wave-odd";
      return `
      <article onclick="HappyToysApp.tapProductCard('${p.id}', this, event)" class="toy-card toy-card-reveal ${wave} bg-white rounded-[1.75rem] border-2 border-slate-100 overflow-hidden flex flex-col shadow-md cursor-pointer p-2.5">
        <div class="relative aspect-square rounded-2xl overflow-hidden bg-amber-50/40">
          <img src="${p.mainImage}" alt="${p.name}" class="w-full h-full object-cover" />
          <span class="absolute top-2.5 left-2.5 bg-gradient-to-r from-amber-300 to-yellow-400 text-slate-900 text-[10px] font-black px-2.5 py-1 rounded-full shadow">${badges[idx % 4]}</span>
          <button onclick="HappyToysApp.triggerHeart3DAnimation(event)" class="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white text-red-500 flex items-center justify-center shadow-md active:scale-125 transition">❤️</button>
          <div class="card-rainbow-strip absolute bottom-0 left-0 right-0"></div>
        </div>

        <div class="pt-2.5 px-1 flex-1 flex flex-col justify-between">
          <div>
            <h3 class="font-black text-slate-900 text-sm leading-snug mb-1 line-clamp-1">${p.name}</h3>
            <div class="flex items-center gap-1 text-[11px] text-slate-500 font-bold mb-1">
              <span>${cat.icon}</span><span class="truncate">${cat.name}</span>
            </div>
            <div class="flex items-center gap-1 text-[11px] font-bold text-slate-700 mb-1.5">
              <span class="text-amber-400">★</span><span>${reviews[idx % 4]}</span>
            </div>
          </div>

          <div>
            <div class="text-lg sm:text-xl font-black text-blue-600 mb-2">${formatPkr(p.pricePkr)}</div>
            <div class="flex items-center gap-1.5">
              <button onclick="HappyToysApp.triggerHeart3DAnimation(event)" class="w-8 h-8 rounded-xl border border-slate-200 bg-white text-rose-500 flex items-center justify-center shadow-xs shrink-0 font-bold">♡</button>
              <button onclick="event.stopPropagation(); HappyToysCart.addToCart('${p.id}');" class="flex-1 py-2 px-1.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-white font-black text-[10px] shadow-sm flex items-center justify-center gap-1 whitespace-nowrap active:scale-95">🛒 Add to Cart</button>
              <button onclick="HappyToysApp.tapProductCard('${p.id}', this, event)" class="flex-1 py-2 px-1.5 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-black text-[10px] shadow-sm flex items-center justify-center gap-1 whitespace-nowrap active:scale-95">🛍️ Buy Now</button>
            </div>
          </div>
        </div>
      </article>`;
    }).join("");

    initScrollAnimations();
  }

  return { init, selectCategory, resetFilters, tapProductCard, triggerHeart3DAnimation, getProductById, enterStore };
})();
window.HappyToysApp = HappyToysApp;
document.addEventListener("DOMContentLoaded", HappyToysApp.init);
