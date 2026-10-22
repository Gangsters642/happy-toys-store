const HappyToysApp = (() => {
  let state = { categories: [], products: [], activeCategory: "all", currentSort: "default" };
  let scrollObserver = null;
  function formatPkr(amount) { return "PKR " + Number(amount || 0).toLocaleString("en-PK"); }
  function getProductById(id) { return state.products.find(x => x.id === id) || null; }

  function initScrollAnimations() {
    if (scrollObserver) scrollObserver.disconnect();
    scrollObserver = new IntersectionObserver((entries) => { entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("is-visible"); }); }, { threshold: 0.08 });
    document.querySelectorAll(".toy-card-reveal").forEach((c, i) => { c.style.transitionDelay = `${(i % 4) * 60}ms`; scrollObserver.observe(c); });
  }

  function toggleHeartFill(btn, event) {
    if (event) event.stopPropagation();
    const isFilled = btn.classList.toggle("text-rose-600");
    const svg = btn.querySelector("svg"); if(svg) svg.style.fill = isFilled ? "#e11d48" : "none";
  }

  function tapProductCard(id, el, event) {
    if (event) event.stopPropagation();
    document.querySelectorAll(".toy-card").forEach(c => c.classList.remove("card-selected-yellow"));
    if (el) el.closest(".toy-card").classList.add("card-selected-yellow");
    setTimeout(() => { const p = getProductById(id); if (p && window.HappyToysModal) window.HappyToysModal.open(p); }, 150);
  }

  async function init() {
    const seed = window.HAPPY_TOYS_SEED || { categories: [], products: [] };
    state.categories = seed.categories || [];
    try { state.products = JSON.parse(localStorage.getItem("hts_custom_products") || "[]"); } catch (e) {}
    if (!state.products.length) state.products = seed.products || [];
    bindEvents(); renderCategories(); renderProducts(); checkDirectLink();
    try { const res = await fetch("/api/store"); if (res.ok) { const d = await res.json(); if (d.products && d.products.length) { state.products = d.products; localStorage.setItem("hts_custom_products", JSON.stringify(d.products)); renderProducts(); } } } catch (e) {}
  }

  function checkDirectLink() {
    if (location.hash.includes("#product=")) {
      const id = location.hash.replace("#product=", "").trim(); const p = getProductById(id);
      if (p && window.HappyToysModal) window.HappyToysModal.open(p);
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
    if (horiz) {
      horiz.innerHTML = state.categories.map(c => {
        const act = state.activeCategory === c.slug ? "bg-amber-500 text-white border-amber-500" : "bg-white text-slate-700 border-slate-200";
        return `<button onclick="HappyToysApp.selectCategory('${c.slug}')" class="whitespace-nowrap px-4 py-2 rounded-full text-xs font-extrabold border transition flex items-center gap-2 ${act}"><span>${c.icon}</span><span>${c.name}</span></button>`;
      }).join("");
    }
  }

  function selectCategory(slug) { state.activeCategory = slug; document.getElementById("categoryDrawerContainer")?.classList.add("hidden"); renderProducts(); }
  function resetFilters() { selectCategory("all"); }
  function sortProducts(val) { state.currentSort = val; renderProducts(); }

  function renderProducts() {
    const grid = document.getElementById("productGrid"); if (!grid) return;
    const catObj = state.categories.find(c => c.slug === state.activeCategory);
    const heading = document.getElementById("activeCategoryHeading"); if (heading) heading.textContent = catObj ? catObj.name : "All Toys";

    let list = state.products.filter(p => p.isPublished && (state.activeCategory === "all" || p.category === state.activeCategory));
    
    // Habiba Store Feature: Sorting System
    if(state.currentSort === "price_asc") list.sort((a,b) => a.pricePkr - b.pricePkr);
    else if(state.currentSort === "price_desc") list.sort((a,b) => b.pricePkr - a.pricePkr);
    else if(state.currentSort === "az") list.sort((a,b) => a.name.localeCompare(b.name));

    if (!list.length) { grid.innerHTML = `<div class="col-span-full py-12 text-center text-slate-400 font-bold">No toys found.</div>`; return; }

    grid.innerHTML = list.map((p, idx) => {
      const cat = state.categories.find(c => c.slug === p.category) || { icon: "🧠", name: "Educational" };
      // Sale Pricing UI
      const isSale = p.comparePrice && p.comparePrice > p.pricePkr;
      const badgeHtml = isSale ? `<span class="absolute top-2 left-2 bg-red-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow-xs">SALE</span>` : `<span class="absolute top-2 left-2 bg-gradient-to-r from-amber-300 to-yellow-400 text-slate-900 text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow-xs">🔥 Hot Deal</span>`;
      
      return `
      <article onclick="HappyToysApp.tapProductCard('${p.id}', this, event)" class="toy-card toy-card-reveal bg-white rounded-[1.6rem] border border-slate-100 overflow-hidden flex flex-col justify-between shadow-sm cursor-pointer p-2 sm:p-2.5">
        <div>
          <div class="relative aspect-square rounded-2xl overflow-hidden bg-slate-50 mb-2">
            <img src="${p.mainImage}" alt="${p.name}" class="w-full h-full object-cover" />
            ${badgeHtml}
            <button type="button" onclick="HappyToysApp.toggleHeartFill(this, event)" class="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/95 text-rose-300 flex items-center justify-center shadow-md active:scale-125 transition"><svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg></button>
            <div class="card-rainbow-strip absolute bottom-0 left-0 right-0"></div>
          </div>
          <div class="px-0.5">
            <h3 class="font-extrabold text-slate-900 text-xs sm:text-sm leading-snug mb-0.5 truncate">${p.name}</h3>
            <div class="flex items-center gap-1 text-[11px] text-slate-500 font-semibold mb-1"><span>${cat.icon}</span><span class="truncate">${cat.name}</span></div>
          </div>
        </div>
        <div class="px-0.5 pt-1">
          <div class="flex items-end gap-1.5 mb-1.5 flex-wrap">
            <span class="text-base sm:text-lg font-black ${isSale ? 'text-red-600' : 'text-blue-600'}">${formatPkr(p.pricePkr)}</span>
            ${isSale ? `<del class="text-[10px] text-slate-400 font-bold">${formatPkr(p.comparePrice)}</del>` : ''}
          </div>
          <div class="grid grid-cols-2 gap-1.5 w-full">
            <button type="button" onclick="event.stopPropagation(); HappyToysCart.addToCart('${p.id}');" class="w-full h-7 px-1 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-900 font-extrabold text-[10px] shadow-xs flex items-center justify-center gap-1 active:scale-95 transition">🛒 Cart</button>
            <button type="button" onclick="HappyToysApp.tapProductCard('${p.id}', this, event)" class="w-full h-7 px-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[10px] shadow-xs flex items-center justify-center gap-1 active:scale-95 transition">🛍️ Buy Now</button>
          </div>
        </div>
      </article>`;
    }).join("");
    setTimeout(() => initScrollAnimations(), 50);
  }

  return { init, selectCategory, resetFilters, sortProducts, tapProductCard, toggleHeartFill, getProductById };
})();
window.HappyToysApp = HappyToysApp; document.addEventListener("DOMContentLoaded", HappyToysApp.init);
