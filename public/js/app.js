const HappyToysApp = (() => {
  let state = {
    categories: [],
    products: [],
    activeCategory: "all",
    searchQuery: "",
    favorites: []
  };
  let scrollObserver = null;

  function formatPkr(amount) {
    return "PKR " + Number(amount || 0).toLocaleString("en-PK");
  }

  function loadFavorites() {
    try {
      const saved = JSON.parse(localStorage.getItem("hts_favorites") || "[]");
      state.favorites = Array.isArray(saved) ? saved : [];
    } catch (e) {
      state.favorites = [];
    }
  }

  function toggleFavorite(productId, event, fromModal = false) {
    if (event) event.stopPropagation();
    const idx = state.favorites.indexOf(productId);
    if (idx > -1) {
      state.favorites.splice(idx, 1);
    } else {
      state.favorites.push(productId);
    }
    localStorage.setItem("hts_favorites", JSON.stringify(state.favorites));
    renderProducts();

    if (fromModal) {
      const modalBtn = document.getElementById(`modalFavBtn-${productId}`);
      if (modalBtn) {
        const svg = modalBtn.querySelector("svg");
        if (svg) {
          svg.setAttribute("fill", state.favorites.includes(productId) ? "currentColor" : "none");
        }
      }
    }
  }

  function setupVideoWithSound() {
    const videoEl = document.getElementById("splashVideoPlayer");
    const unmuteBtn = document.getElementById("unmuteNoticeBtn");
    if (!videoEl) return;

    videoEl.muted = false;
    videoEl.volume = 1.0;

    const playPromise = videoEl.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
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
        }
      });
    }, { threshold: 0.08 });

    const cards = document.querySelectorAll(".toy-card-reveal");
    cards.forEach((card, index) => {
      card.style.transitionDelay = `${(index % 4) * 50}ms`;
      scrollObserver.observe(card);
    });
  }

  async function init() {
    setupVideoWithSound();
    loadFavorites();

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
    checkForDirectProductLink();

    try {
      const storeRes = await fetch("/api/store");
      if (storeRes.ok) {
        const liveData = await storeRes.json();
        if (liveData.products && liveData.products.length > 0) {
          state.products = liveData.products;
          localStorage.setItem("hts_custom_products", JSON.stringify(liveData.products));
          renderProducts();
          checkForDirectProductLink();
        }
      }
    } catch (err) {
      console.log("Background sync:", err);
    }
  }

  function checkForDirectProductLink() {
    const hash = window.location.hash;
    if (hash && hash.includes("#product=")) {
      const prodId = hash.replace("#product=", "");
      const p = state.products.find(x => x.id === prodId);
      if (p && window.HappyToysModal) {
        window.HappyToysModal.open(p, state.products);
      }
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
        const active = state.activeCategory === cat.slug
          ? "bg-amber-500 text-white border-amber-500 shadow-md"
          : "bg-white text-slate-700 hover:bg-amber-50 border-slate-200";
        return `<button onclick="HappyToysApp.selectCategory('${cat.slug}')" class="whitespace-nowrap px-4 py-2 rounded-full text-xs font-extrabold border transition-all flex items-center gap-2 ${active}"><span>${cat.icon}</span><span>${cat.name}</span></button>`;
      }).join("");
    }

    if (drawer) {
      drawer.innerHTML = state.categories.map((cat, index) => {
        const active = state.activeCategory === cat.slug
          ? "bg-amber-100 text-amber-800 font-black border-l-4 border-amber-500"
          : "text-slate-700 hover:bg-slate-100 font-bold";
        const delay = (index * 0.04).toFixed(2);
        return `<button onclick="HappyToysApp.selectCategory('${cat.slug}')" style="animation-delay: ${delay}s;" class="drawer-category-item w-full text-left px-4 py-3 rounded-xl text-sm flex items-center justify-between transition ${active}"><span class="flex items-center gap-3"><span>${cat.icon}</span><span>${cat.name}</span></span><span class="text-xs text-amber-500 font-extrabold">→</span></button>`;
      }).join("");
    }
  }

  function selectCategory(slug) {
    state.activeCategory = slug;
    document.getElementById("categoryDrawerContainer")?.classList.add("hidden");
    renderCategories();
    renderProducts();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetFilters() {
    state.activeCategory = "all";
    state.searchQuery = "";
    renderCategories();
    renderProducts();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openProductModal(id) {
    const p = state.products.find(x => x.id === id);
    if (p && window.HappyToysModal) window.HappyToysModal.open(p, state.products);
  }

  function buyNowDirectWhatsApp(id, event) {
    if (event) event.stopPropagation();
    const p = state.products.find(x => x.id === id);
    if (!p) return;

    const whatsappNumber = "923707116317";
    const productLink = window.location.origin + "/#product=" + p.id;
    const message = `Hello Happy Toys Store! I want to order this product:\n\n* Name: ${p.name}\n* Price: ${formatPkr(p.pricePkr)}\n* Product Link: ${productLink}\n\nPlease confirm my order!`;

    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, "_blank");
  }

  function getCategoryDisplay(catSlug) {
    const found = state.categories.find(c => c.slug === catSlug);
    if (found && found.slug !== "all") {
      return { icon: found.icon || "🧸", label: found.name };
    }
    if (!catSlug || catSlug === "all") return { icon: "🧸", label: "For kids" };
    const lower = String(catSlug).toLowerCase();
    if (lower.includes("edu") || lower.includes("learn")) return { icon: "🧠", label: "Educational Toys" };
    if (lower.includes("book") || lower.includes("board")) return { icon: "📖", label: "Educational Toys" };
    return { icon: "🧸", label: catSlug.replace(/-/g, " ") };
  }

  function renderProducts() {
    const grid = document.getElementById("productGrid");
    if (!grid) return;

    // Expand grid width on mobile (-mx-2) so cards are wider and aligned side-by-side
    grid.className = "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 -mx-2 sm:mx-0";

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

    const badges = [
      { icon: "🔥", text: "Hot Deal" },
      { icon: "✨", text: "Bestseller" },
      { icon: "★", text: "New Arrival" },
      { icon: "🔥", text: "Trending" }
    ];
    const sampleRatings = [
      { score: "4.8", count: 120 },
      { score: "4.7", count: 98 },
      { score: "4.6", count: 75 },
      { score: "4.5", count: 62 }
    ];

    grid.innerHTML = filtered.map((p, idx) => {
      const badge = badges[idx % badges.length];
      const reviewInfo = sampleRatings[idx % sampleRatings.length];
      const catInfo = getCategoryDisplay(p.category);
      const isFavorited = state.favorites.includes(p.id);

      return `
      <article class="toy-card-reveal w-full overflow-hidden bg-white rounded-[1.35rem] p-2 sm:p-3 border border-slate-100 shadow-[0_4px_18px_-4px_rgba(15,23,42,0.08)] flex flex-col justify-between transition-all duration-300">
        
        <!-- Top Image & Details -->
        <div class="w-full">
          <!-- Square/4:3 Image Box -->
          <div class="relative aspect-[1.04/1] w-full rounded-2xl overflow-hidden bg-slate-50 cursor-pointer group" onclick="HappyToysApp.openProductModal('${p.id}')">
            <img src="${p.mainImage}" alt="${p.name}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            
            <!-- Top-Left Yellow Badge -->
            <span class="absolute top-2 left-2 bg-[#FACC15] text-slate-900 text-[10px] sm:text-xs font-extrabold px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1 leading-tight">
              <span>${badge.icon}</span>
              <span>${badge.text}</span>
            </span>

            <!-- Top-Right Red Heart Circle -->
            <button onclick="HappyToysApp.toggleFavorite('${p.id}', event)" 
                    aria-label="Favorite"
                    class="absolute top-2 right-2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/95 hover:bg-white flex items-center justify-center shadow-md active:scale-90 transition">
              <svg class="w-4 h-4 text-rose-500 fill-current" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </button>

            <!-- Rainbow Bottom Strip -->
            <div class="absolute bottom-0 inset-x-0 h-1 flex">
              <span class="flex-1 bg-rose-500"></span>
              <span class="flex-1 bg-amber-400"></span>
              <span class="flex-1 bg-emerald-400"></span>
              <span class="flex-1 bg-sky-500"></span>
              <span class="flex-1 bg-purple-500"></span>
            </div>
          </div>

          <!-- Product Text Details -->
          <div class="pt-2.5 px-0.5">
            <!-- 1. Product Name -->
            <h3 class="font-extrabold text-[#0F172A] text-[13.5px] sm:text-base leading-tight line-clamp-1 cursor-pointer hover:text-blue-600 transition" onclick="HappyToysApp.openProductModal('${p.id}')">
              ${p.name}
            </h3>

            <!-- 2. Small Category Icon & Name -->
            <div class="flex items-center gap-1.5 mt-1 text-[11px] sm:text-xs text-[#475569] font-semibold">
              <span class="text-xs sm:text-sm leading-none shrink-0">${catInfo.icon}</span>
              <span class="capitalize truncate">${catInfo.label}</span>
            </div>

            <!-- 3. Star Rating & Reviews -->
            <div class="flex items-center gap-1 mt-1 text-[11px] sm:text-xs">
              <svg class="w-3.5 h-3.5 text-amber-400 fill-current shrink-0" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
              <span class="font-extrabold text-slate-800">${p.rating || reviewInfo.score}</span>
              <span class="text-[#64748B] font-medium truncate">(${p.reviewsCount || reviewInfo.count} reviews)</span>
            </div>

            <!-- 4. Price in Blue -->
            <div class="mt-1.5 mb-2">
              <span class="text-[16px] sm:text-xl font-black text-[#0066FF] tracking-tight block leading-none">
                ${formatPkr(p.pricePkr)}
              </span>
            </div>
          </div>
        </div>

        <!-- 5. Locked Inside-Card Grid Row: [ ♡ ] [ 🛒 Add to Cart ] [ 🛍️ Buy Now ] -->
        <div class="grid grid-cols-[28px_1.18fr_1fr] sm:grid-cols-[36px_1.15fr_1fr] items-center gap-1 sm:gap-1.5 w-full pt-0.5">
          <!-- Favorite Outline Heart Button -->
          <button onclick="HappyToysApp.toggleFavorite('${p.id}', event)" 
                  aria-label="Save Favorite"
                  class="w-[28px] h-[28px] sm:w-9 sm:h-9 rounded-lg sm:rounded-xl border border-slate-200 bg-white hover:bg-rose-50 flex items-center justify-center shrink-0 active:scale-90 transition">
            <svg class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500 transition-transform" fill="${isFavorited ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>
          </button>

          <!-- Add to Cart Button (Fits 100% Inside Card) -->
          <button onclick="event.stopPropagation(); HappyToysCart.addToCart('${p.id}');" 
                  class="w-full min-w-0 h-[28px] sm:h-9 px-1 sm:px-2.5 rounded-full bg-[#F59E0B] hover:bg-amber-600 text-white font-extrabold text-[8.8px] sm:text-xs tracking-tight active:scale-95 transition flex items-center justify-center gap-1 overflow-hidden">
            <svg class="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-current shrink-0" fill="none" stroke-width="2.2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
            <span class="truncate">Add to Cart</span>
          </button>

          <!-- Buy Now Button (Fits 100% Inside Card -> Direct WhatsApp) -->
          <button onclick="HappyToysApp.buyNowDirectWhatsApp('${p.id}', event)" 
                  class="w-full min-w-0 h-[28px] sm:h-9 px-1 sm:px-2.5 rounded-full bg-[#0066FF] hover:bg-blue-700 text-white font-extrabold text-[8.8px] sm:text-xs tracking-tight active:scale-95 transition flex items-center justify-center gap-1 overflow-hidden">
            <svg class="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" viewBox="0 0 24 24" fill="none">
              <path d="M9 6V5a3 3 0 016 0v1" stroke="white" stroke-width="2.2" stroke-linecap="round"/>
              <path fill-rule="evenodd" clip-rule="evenodd" d="M5.6 6h12.8c.95 0 1.74.74 1.8 1.69l.65 11A2 2 0 0118.86 21H5.14a2 2 0 01-1.99-2.31l.65-11C3.86 6.74 4.65 6 5.6 6zm6.4 8.2l-2.3-2.5h4.6L12 14.2z" fill="white"/>
            </svg>
            <span class="truncate">Buy Now</span>
          </button>
        </div>

      </article>`;
    }).join("");

    initScrollAnimations();
  }

  return {
    init,
    selectCategory,
    resetFilters,
    openProductModal,
    buyNowDirectWhatsApp,
    toggleFavorite,
    enterStore
  };
})();
document.addEventListener("DOMContentLoaded", HappyToysApp.init);
