const HappyToysApp = (() => {
  let state = { categories: [], products: [], activeCategory: "all" };
  let scrollObserver = null;
  let isStoreEntered = false;

  function formatPkr(amount) { return "PKR " + Number(amount || 0).toLocaleString("en-PK"); }
  function getProductById(id) { return state.products.find(x => x.id === id) || null; }

  // FULL-WIDTH EDGE-TO-EDGE 3D SPLASH & LAG-FREE VIDEO FIX
  function fixSplashScreen() {
    const splash = document.getElementById("vipSplashScreen");
    if (!splash) return;

    // Inject high-priority CSS directly into <head> so browser cache can never block it
    if (!document.getElementById("vipEdgeToEdgeStyles")) {
      const styleEl = document.createElement("style");
      styleEl.id = "vipEdgeToEdgeStyles";
      styleEl.textContent = `
        #vipSplashScreen {
          position: fixed !important;
          inset: 0 !important;
          width: 100vw !important;
          height: 100dvh !important;
          max-width: 100vw !important;
          max-height: 100dvh !important;
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          z-index: 999999 !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: space-between !important;
          box-sizing: border-box !important;
          overflow: hidden !important;
          /* 3D Yellow Border right on Chrome edges - zero empty space outside */
          border: 5px solid #f59e0b !important;
          border-radius: 24px !important;
          box-shadow: inset 0 0 0 2px #fde68a, inset 0 10px 25px rgba(245, 158, 11, 0.18), inset 0 -10px 25px rgba(245, 158, 11, 0.15) !important;
        }
        .vip-full-inner {
          width: 100% !important;
          height: 100% !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: space-between !important;
          padding: 10px 12px 14px 12px !important;
          box-sizing: border-box !important;
          background: radial-gradient(circle at 20% 20%, rgba(254, 243, 199, 0.35), transparent 40%),
                      radial-gradient(circle at 80% 80%, rgba(252, 231, 243, 0.35), transparent 40%),
                      #ffffff !important;
        }
        .vip-video-box {
          position: relative !important;
          width: 100% !important;
          flex: 1 1 auto !important;
          min-height: 190px !important;
          max-height: 44dvh !important;
          border-radius: 18px !important;
          overflow: hidden !important;
          background: #0f172a !important;
          border: 3px solid #fde68a !important;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.18), 0 4px 10px -2px rgba(245, 158, 11, 0.25) !important;
          transform: translateZ(0) !important;
        }
        .vip-video-box video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          display: block !important;
          transform: translate3d(0, 0, 0) !important;
          backface-visibility: hidden !important;
          will-change: transform !important;
        }
        .vip-unmute-pill {
          position: absolute !important;
          bottom: 12px !important;
          left: 12px !important;
          background: rgba(15, 23, 42, 0.85) !important;
          color: #ffffff !important;
          border: 2px solid #fbbf24 !important;
          border-radius: 999px !important;
          padding: 6px 14px !important;
          font-size: 12px !important;
          font-weight: 800 !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 6px !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35) !important;
          cursor: pointer !important;
          z-index: 30 !important;
          white-space: nowrap !important;
        }
        .vip-unmute-pill:active {
          transform: scale(0.95) !important;
        }
        .vip-close-x {
          position: absolute !important;
          top: 10px !important;
          right: 10px !important;
          width: 34px !important;
          height: 34px !important;
          border-radius: 50% !important;
          background: rgba(255, 255, 255, 0.92) !important;
          color: #475569 !important;
          font-size: 16px !important;
          font-weight: 900 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          border: 2px solid #e2e8f0 !important;
          box-shadow: 0 4px 10px rgba(0,0,0,0.15) !important;
          cursor: pointer !important;
          z-index: 30 !important;
        }
        .vip-badge-3d {
          border-radius: 16px !important;
          padding: 10px 4px !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
          text-align: center !important;
          box-shadow: 0 6px 0 rgba(0,0,0,0.06), 0 8px 15px rgba(0,0,0,0.05) !important;
          border: 1.5px solid rgba(255,255,255,0.9) !important;
        }
        @keyframes enterBtnPulse3D {
          0%, 100% {
            transform: scale(1) translateY(0);
            box-shadow: 0 6px 0 #c2410c, 0 12px 20px rgba(249, 115, 22, 0.4);
          }
          50% {
            transform: scale(1.02) translateY(-3px);
            box-shadow: 0 9px 0 #c2410c, 0 18px 28px rgba(249, 115, 22, 0.6);
          }
        }
        .vip-enter-btn-3d {
          width: 100% !important;
          padding: 15px 20px !important;
          border-radius: 999px !important;
          background: linear-gradient(90deg, #f97316 0%, #fb923c 50%, #f59e0b 100%) !important;
          color: #ffffff !important;
          font-size: 18px !important;
          font-weight: 900 !important;
          border: 2px solid #fed7aa !important;
          cursor: pointer !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 8px !important;
          animation: enterBtnPulse3D 1.6s infinite ease-in-out !important;
          text-shadow: 0 1px 2px rgba(0,0,0,0.2) !important;
        }
        .vip-enter-btn-3d:active {
          transform: translateY(4px) !important;
          box-shadow: 0 2px 0 #c2410c !important;
        }
      `;
      document.head.appendChild(styleEl);
    }

    // Preserve existing video element so buffer is not lost
    let existingVideo = document.getElementById("splashVideoPlayer") || splash.querySelector("video");
    let videoSrc = "";
    if (existingVideo) {
      videoSrc = existingVideo.currentSrc || existingVideo.getAttribute("src") || existingVideo.querySelector("source")?.src || "";
    }

    // Build exact Full-Width layout matching the "Correct (Full Width)" design
    splash.innerHTML = `
      <div class="vip-full-inner">
        <!-- Top Video Section -->
        <div class="vip-video-box" id="vipVideoWrapper">
          <button type="button" class="vip-close-x" onclick="HappyToysApp.enterStore()" aria-label="Close">✕</button>
          <button type="button" id="unmuteToggleBtn" class="vip-unmute-pill">🔇 Tap to Unmute</button>
        </div>

        <!-- Middle Title & Teddy Logo -->
        <div style="text-align:center; margin: 6px 0;">
          <h1 style="font-size: clamp(22px, 6vw, 28px); font-weight: 900; color: #f59e0b; letter-spacing: 0.5px; margin: 0; text-shadow: 0 2px 0 #fef3c7, 0 4px 8px rgba(245,158,11,0.2);">
            HAPPY TOYS STORE
          </h1>
          <p style="font-size: 13px; font-weight: 800; color: #64748b; margin: 4px 0 10px 0;">
            ✨ Best Toys for Every Smile ✨
          </p>
          <div style="width: 72px; height: 72px; margin: 0 auto; border-radius: 50%; background: #fef3c7; border: 4px solid #f59e0b; box-shadow: 0 6px 0 #d97706, 0 10px 20px rgba(245,158,11,0.3); display: flex; align-items: center; justify-content: center; font-size: 40px;">
            🧸
          </div>
        </div>

        <!-- 3 Feature Cards (Premium Quality, Fast Delivery, Happy Kids) -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; width: 100%; margin: 6px 0 10px 0;">
          <div class="vip-badge-3d" style="background: #eff6ff; border-color: #bfdbfe;">
            <span style="font-size: 22px; margin-bottom: 4px;">🛡️</span>
            <span style="font-size: 10px; font-weight: 900; color: #1e40af; line-height: 1.1;">PREMIUM QUALITY</span>
          </div>
          <div class="vip-badge-3d" style="background: #fefce8; border-color: #fef08a;">
            <span style="font-size: 22px; margin-bottom: 4px;">🚀</span>
            <span style="font-size: 10px; font-weight: 900; color: #92400e; line-height: 1.1;">FAST DELIVERY</span>
          </div>
          <div class="vip-badge-3d" style="background: #fdf2f8; border-color: #fbcfe8;">
            <span style="font-size: 22px; margin-bottom: 4px;">😊</span>
            <span style="font-size: 10px; font-weight: 900; color: #9d174d; line-height: 1.1;">HAPPY KIDS</span>
          </div>
        </div>

        <!-- Animated Enter Store 3D Button -->
        <div style="width: 100%; padding-bottom: 2px;">
          <button type="button" onclick="HappyToysApp.enterStore()" class="vip-enter-btn-3d">
            <span>Enter Store</span>
            <span>➔</span>
          </button>
        </div>
      </div>
    `;

    // Setup smooth hardware-accelerated video inside the wrapper
    const videoWrapper = document.getElementById("vipVideoWrapper");
    if (videoWrapper) {
      const v = existingVideo || document.createElement("video");
      v.id = "splashVideoPlayer";
      if (videoSrc && !v.getAttribute("src") && !v.querySelector("source")) {
        v.src = videoSrc;
      }
      v.muted = true;
      v.defaultMuted = true;
      v.loop = true;
      v.playsInline = true;
      v.autoplay = true;
      v.preload = "auto";
      v.setAttribute("playsinline", "");
      v.setAttribute("webkit-playsinline", "");
      v.setAttribute("muted", "");
      v.setAttribute("autoplay", "");
      v.setAttribute("preload", "auto");
      v.disablePictureInPicture = true;

      videoWrapper.insertBefore(v, videoWrapper.firstChild);

      // Start smooth playback immediately when ready
      const startSmoothPlay = () => {
        const p = v.play();
        if (p !== undefined) {
          p.catch(() => {
            v.muted = true;
            v.play().catch(() => {});
          });
        }
      };

      if (v.readyState >= 2) {
        startSmoothPlay();
      } else {
        v.addEventListener("canplay", startSmoothPlay, { once: true });
        startSmoothPlay();
      }

      // Unmute toggle button logic
      const unmuteBtn = document.getElementById("unmuteToggleBtn");
      if (unmuteBtn) {
        unmuteBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          v.muted = !v.muted;
          if (!v.muted) {
            v.volume = 1.0;
            v.play().catch(() => {});
            unmuteBtn.innerHTML = "🔊 Sound On";
            unmuteBtn.style.background = "rgba(22, 163, 74, 0.92)";
          } else {
            unmuteBtn.innerHTML = "🔇 Tap to Unmute";
            unmuteBtn.style.background = "rgba(15, 23, 42, 0.85)";
          }
        });
      }
    }
  }

  function enterStore() {
    isStoreEntered = true;
    const splash = document.getElementById("vipSplashScreen");
    const v = document.getElementById("splashVideoPlayer");
    if (v) { try { v.pause(); v.removeAttribute("src"); v.load(); } catch (e) {} }
    document.body.classList.remove("splash-active");

    if (splash) {
      splash.style.display = "none";
      splash.remove();
    }

    if (typeof confetti === "function") {
      confetti({ particleCount: 90, spread: 90, origin: { y: 0.6 } });
    }
    
    // Exact same one-by-one product animation (UNTOUCHED)
    initScrollAnimations(true);
  }

  function initScrollAnimations(forceReset = false) {
    if (!isStoreEntered) return; 

    if (scrollObserver) scrollObserver.disconnect();
    
    let delay = 0;
    let timer = null;

    scrollObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.style.animationDelay = `${delay}ms`;
          e.target.classList.add("is-visible");
          observer.unobserve(e.target);
          
          delay += 100; 
          
          clearTimeout(timer);
          timer = setTimeout(() => { delay = 0; }, 300); 
        }
      });
    }, { threshold: 0.05, rootMargin: "0px 0px -20px 0px" });

    document.querySelectorAll(".toy-card-reveal").forEach((c) => {
      if(forceReset) c.classList.remove("is-visible");
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
  }

  function tapProductCard(id, el, event) {
    if (event) event.stopPropagation();
    document.querySelectorAll(".toy-card").forEach(c => c.classList.remove("card-selected-yellow"));
    const card = el ? el.closest(".toy-card") : null;
    if (card) card.classList.add("card-selected-yellow");
    setTimeout(() => {
      const p = getProductById(id);
      if (p && window.HappyToysModal) window.HappyToysModal.open(p);
    }, 180);
  }

  async function init() {
    fixSplashScreen();

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
        isStoreEntered = true;
        const splash = document.getElementById("vipSplashScreen");
        if (splash) { splash.style.display = "none"; splash.remove(); }
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

  function renderProducts() {
    const grid = document.getElementById("productGrid");
    if (!grid) return;
    const catObj = state.categories.find(c => c.slug === state.activeCategory);
    const heading = document.getElementById("activeCategoryHeading");
    if (heading) heading.textContent = catObj ? catObj.name : "All Toys";

    const list = state.products.filter(p => p.isPublished && (state.activeCategory === "all" || p.category === state.activeCategory));
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
          <div class="text-base sm:text-lg font-black text-blue-600 mb-1.5">${formatPkr(p.pricePkr)}</div>
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

    setTimeout(() => initScrollAnimations(true), 50);
  }

  return { init, selectCategory, resetFilters, tapProductCard, toggleHeartFill, getProductById, enterStore };
})();
window.HappyToysApp = HappyToysApp;
document.addEventListener("DOMContentLoaded", HappyToysApp.init);
