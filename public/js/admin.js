const HTS_DB = (() => {
  const dbName = "HappyToysDB", storeName = "mediaStore";
  const initDB = () => new Promise((res, rej) => { const r = indexedDB.open(dbName, 1); r.onupgradeneeded = (e) => e.target.result.createObjectStore(storeName); r.onsuccess = (e) => res(e.target.result); r.onerror = (e) => rej(e.target.error); });
  return {
    set: async (k, v) => { try { const db = await initDB(); return new Promise(r => { const tx = db.transaction(storeName, "readwrite"); tx.objectStore(storeName).put(v, k); tx.oncomplete = r; tx.onerror = r; }); } catch (e) {} },
    get: async (k) => { try { const db = await initDB(); return new Promise(r => { const tx = db.transaction(storeName, "readonly"); const rq = tx.objectStore(storeName).get(k); rq.onsuccess = () => r(rq.result); rq.onerror = () => r(null); }); } catch (e) { return null; } }
  };
})();

const HappyToysAdmin = (() => {
  let token = localStorage.getItem("hts_admin_token") || "";
  let products = [];
  function formatPkr(n) { return "PKR " + Number(n || 0).toLocaleString("en-PK"); }

  async function loadAllData() {
    try { products = JSON.parse(localStorage.getItem("hts_custom_products") || "[]"); } catch (e) {}
    try { const res = await fetch("/api/store"); if (res.ok) { const d = await res.json(); if (d.products && d.products.length) { products = d.products; localStorage.setItem("hts_custom_products", JSON.stringify(products)); } else if (!products.length && window.HAPPY_TOYS_SEED) { products = window.HAPPY_TOYS_SEED.products || []; } } } catch (e) {}
    renderTable();
  }

  async function saveProductsEverywhere(list) {
    products = list; localStorage.setItem("hts_custom_products", JSON.stringify(products));
    await fetch("/api/store", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ products }) });
  }

  function populateCategoryDropdown() {
    const s = document.getElementById("prodCategory"); if (!s || !window.HAPPY_TOYS_SEED) return;
    s.innerHTML = window.HAPPY_TOYS_SEED.categories.filter(c => c.slug !== "all").map(c => `<option value="${c.slug}">${c.icon} ${c.name}</option>`).join("");
  }

  function compressImage(file, cb) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas"); const MAX = 800; let w = img.width, h = img.height;
        if (w > h && w > MAX) { h *= MAX / w; w = MAX; } else if (h > MAX) { w *= MAX / h; h = MAX; }
        canvas.width = w; canvas.height = h; canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        cb(canvas.toDataURL("image/jpeg", 0.82));
      }; img.src = e.target.result;
    }; reader.readAsDataURL(file);
  }

  function editProduct(id) {
    const p = products.find(x => x.id === id); if (!p) return;
    document.getElementById("productModalTitle").textContent = "Edit Toy Product";
    document.getElementById("editProductId").value = p.id;
    document.getElementById("prodName").value = p.name || "";
    document.getElementById("prodSku").value = p.sku || "";
    document.getElementById("prodCategory").value = p.category || "educational-toys";
    document.getElementById("prodStock").value = p.stockQty ?? 10;
    document.getElementById("prodPrice").value = p.pricePkr || "";
    document.getElementById("prodComparePrice").value = p.comparePrice || "";
    document.getElementById("prodDimensions").value = p.dimensions || "";
    document.getElementById("prodShortDesc").value = p.shortDescription || "";
    document.getElementById("prodKeyFeatures").value = p.keyFeatures || "";
    document.getElementById("prodPackageIncludes").value = p.packageIncludes || "";
    
    // Multi Images Setup
    window.tempImages = p.images || (p.mainImage ? [p.mainImage] : []);
    document.getElementById("imagePreviewContainer").innerHTML = window.tempImages.map(d => `<img src="${d}" class="w-12 h-12 rounded-lg object-cover border border-slate-200 inline-block mr-1 mb-1" />`).join("");

    const hasVar = Boolean(p.hasVariants && p.variants && p.variants.length > 0);
    const cbVar = document.getElementById("prodHasVariants"); const ctnVar = document.getElementById("variantPricesContainer");
    cbVar.checked = hasVar; ctnVar.classList.toggle("hidden", !hasVar);
    const getVarPrice = (sz) => { if (!p.variants) return ""; const f = p.variants.find(v => v.size.toLowerCase() === sz.toLowerCase()); return f ? f.pricePkr : ""; };
    document.getElementById("varPriceSmall").value = getVarPrice("Small"); document.getElementById("varPriceMedium").value = getVarPrice("Medium"); document.getElementById("varPriceBig").value = getVarPrice("Big");

    const hasLang = Boolean(p.hasLangVariants && p.langVariants && p.langVariants.length > 0);
    const cbLang = document.getElementById("prodHasLangVariants"); const ctnLang = document.getElementById("langVariantsContainer");
    cbLang.checked = hasLang; ctnLang.classList.toggle("hidden", !hasLang);
    const getLangPrice = (l) => { if (!p.langVariants) return ""; const f = p.langVariants.find(v => v.lang.toLowerCase() === l.toLowerCase()); return f ? f.pricePkr : ""; };
    document.getElementById("langPriceEnglish").value = getLangPrice("English"); document.getElementById("langPriceUrdu").value = getLangPrice("Urdu");

    const hasHoles = Boolean(p.hasHoleVariants && p.holeVariants && p.holeVariants.length > 0);
    const cbHoles = document.getElementById("prodHasHolesVariants"); const ctnHoles = document.getElementById("holesVariantsContainer");
    cbHoles.checked = hasHoles; ctnHoles.classList.toggle("hidden", !hasHoles);
    if (hasHoles && p.holeVariants[0]) { document.getElementById("holeCount1").value = p.holeVariants[0].holes || "12 Holes"; document.getElementById("holePrice1").value = p.holeVariants[0].pricePkr || ""; }
    if (hasHoles && p.holeVariants[1]) { document.getElementById("holeCount2").value = p.holeVariants[1].holes || "36 Holes"; document.getElementById("holePrice2").value = p.holeVariants[1].pricePkr || ""; }
    if (hasHoles && p.holeVariants[2]) { document.getElementById("holeCount3").value = p.holeVariants[2].holes || "40 Holes"; document.getElementById("holePrice3").value = p.holeVariants[2].pricePkr || ""; }

    document.getElementById("productModal")?.classList.remove("hidden");
  }

  function init() {
    if (token) { document.getElementById("adminLoginModal")?.classList.add("hidden"); populateCategoryDropdown(); loadAllData(); } 
    else { document.getElementById("adminLoginModal")?.classList.remove("hidden"); }

    document.getElementById("adminLoginForm")?.addEventListener("submit", (e) => { e.preventDefault(); token = "secure-token"; localStorage.setItem("hts_admin_token", token); document.getElementById("adminLoginModal")?.classList.add("hidden"); populateCategoryDropdown(); loadAllData(); });
    document.getElementById("adminLogoutBtn")?.addEventListener("click", () => { localStorage.removeItem("hts_admin_token"); location.reload(); });

    document.getElementById("splashMediaUpload")?.addEventListener("change", (e) => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = (ev) => { window.tempMediaData = ev.target.result; }; r.readAsDataURL(f); });
    document.getElementById("saveMediaBtn")?.addEventListener("click", async () => { const urlInput = document.getElementById("adminIntroGifUrl")?.value.trim(); const media = window.tempMediaData || urlInput; if (!media) return alert("Select video first!"); await HTS_DB.set("splashMedia", media); await fetch("/api/video", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ videoData: media }) }); alert("✅ Splash Video Saved!"); });

    const cbVar = document.getElementById("prodHasVariants"); const ctnVar = document.getElementById("variantPricesContainer"); cbVar?.addEventListener("change", () => ctnVar.classList.toggle("hidden", !cbVar.checked));
    const cbLang = document.getElementById("prodHasLangVariants"); const ctnLang = document.getElementById("langVariantsContainer"); cbLang?.addEventListener("change", () => ctnLang.classList.toggle("hidden", !cbLang.checked));
    const cbHoles = document.getElementById("prodHasHolesVariants"); const ctnHoles = document.getElementById("holesVariantsContainer"); cbHoles?.addEventListener("change", () => ctnHoles.classList.toggle("hidden", !cbHoles.checked));

    const modal = document.getElementById("productModal");
    document.getElementById("openAddProductModalBtn")?.addEventListener("click", () => {
      document.getElementById("productForm")?.reset(); document.getElementById("editProductId").value = "";
      window.tempImages = []; document.getElementById("imagePreviewContainer").innerHTML = "";
      cbVar.checked = false; ctnVar.classList.add("hidden"); cbLang.checked = false; ctnLang.classList.add("hidden"); cbHoles.checked = false; ctnHoles.classList.add("hidden");
      document.getElementById("holeCount1").value = "12 Holes"; document.getElementById("holeCount2").value = "36 Holes"; document.getElementById("holeCount3").value = "40 Holes";
      modal?.classList.remove("hidden");
    });
    document.getElementById("closeProductModalBtn")?.addEventListener("click", () => modal?.classList.add("hidden"));

    document.getElementById("imageUploadInput")?.addEventListener("change", async (e) => {
      const files = Array.from(e.target.files).slice(0, 10);
      if(!files.length) return;
      window.tempImages = [];
      document.getElementById("imagePreviewContainer").innerHTML = "<span class='text-[10px] text-blue-600 font-bold'>Processing images...</span>";
      for(let f of files) {
        await new Promise(r => compressImage(f, data => { window.tempImages.push(data); r(); }));
      }
      document.getElementById("imagePreviewContainer").innerHTML = window.tempImages.map(d => `<img src="${d}" class="w-12 h-12 rounded-lg object-cover border border-slate-200 inline-block mr-1 mb-1" />`).join("");
    });

    document.getElementById("productForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = document.getElementById("editProductId").value || `prod-${Date.now()}`;
      const basePrice = Number(document.getElementById("prodPrice").value);
      const comparePrice = Number(document.getElementById("prodComparePrice").value || 0) || null;

      let variants = [];
      if (cbVar.checked) {
        const s = Number(document.getElementById("varPriceSmall").value || 0); const m = Number(document.getElementById("varPriceMedium").value || 0); const b = Number(document.getElementById("varPriceBig").value || 0);
        if (s > 0) variants.push({ size: "Small", pricePkr: s }); if (m > 0) variants.push({ size: "Medium", pricePkr: m }); if (b > 0) variants.push({ size: "Big", pricePkr: b });
      }

      let langVariants = [];
      if (cbLang.checked) {
        const eng = Number(document.getElementById("langPriceEnglish").value || 0); const urd = Number(document.getElementById("langPriceUrdu").value || 0);
        if (eng > 0) langVariants.push({ lang: "English", pricePkr: eng }); if (urd > 0) langVariants.push({ lang: "Urdu", pricePkr: urd });
      }

      let holeVariants = [];
      if (cbHoles.checked) {
        const c1 = document.getElementById("holeCount1").value.trim(); const p1 = Number(document.getElementById("holePrice1").value || 0);
        const c2 = document.getElementById("holeCount2").value.trim(); const p2 = Number(document.getElementById("holePrice2").value || 0);
        const c3 = document.getElementById("holeCount3").value.trim(); const p3 = Number(document.getElementById("holePrice3").value || 0);
        if (p1 > 0) holeVariants.push({ holes: c1 || "12 Holes", pricePkr: p1 }); if (p2 > 0) holeVariants.push({ holes: c2 || "36 Holes", pricePkr: p2 }); if (p3 > 0) holeVariants.push({ holes: c3 || "40 Holes", pricePkr: p3 });
      }

      let activeBasePrice = basePrice;
      if (variants.length > 0) activeBasePrice = variants[0].pricePkr; else if (langVariants.length > 0) activeBasePrice = langVariants[0].pricePkr; else if (holeVariants.length > 0) activeBasePrice = holeVariants[0].pricePkr;

      const imgArr = window.tempImages || (products.find(x => x.id === id)?.images || []);
      const mainImage = imgArr.length > 0 ? imgArr[0] : "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=600";

      const newProduct = {
        id, name: document.getElementById("prodName").value, sku: document.getElementById("prodSku").value, category: document.getElementById("prodCategory").value, stockQty: Number(document.getElementById("prodStock").value),
        pricePkr: activeBasePrice, comparePrice, dimensions: document.getElementById("prodDimensions").value.trim(),
        hasVariants: variants.length > 0, variants, hasLangVariants: langVariants.length > 0, langVariants, hasHoleVariants: holeVariants.length > 0, holeVariants,
        shortDescription: document.getElementById("prodShortDesc").value, keyFeatures: document.getElementById("prodKeyFeatures").value, packageIncludes: document.getElementById("prodPackageIncludes").value,
        images: imgArr, mainImage: mainImage, isPublished: true
      };

      const idx = products.findIndex(p => p.id === id); if (idx >= 0) products[idx] = newProduct; else products.unshift(newProduct);
      await saveProductsEverywhere(products); modal?.classList.add("hidden"); renderTable(); alert("✅ Toy Product Saved Successfully!");
    });
  }

  function renderTable() {
    const tbody = document.getElementById("adminProductTableBody"); if (!tbody) return;
    tbody.innerHTML = products.map(p => `
      <tr class="border-b border-slate-100 hover:bg-slate-50 transition">
        <td class="py-3 px-4"><div class="flex items-center gap-3"><img src="${p.mainImage}" class="w-10 h-10 rounded-xl object-cover border bg-white"/><span class="font-bold text-slate-900">${p.name}</span></div></td>
        <td class="py-3 px-4 text-xs text-slate-600 font-semibold"><span class="capitalize">${p.category}</span></td>
        <td class="py-3 px-4 font-bold text-slate-800">${formatPkr(p.pricePkr)}</td>
        <td class="py-3 px-4 font-semibold text-emerald-600">${p.stockQty}</td>
        <td class="py-3 px-4 text-right space-x-2">
          <button type="button" onclick="HappyToysAdmin.editProduct('${p.id}')" class="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold hover:bg-blue-100">Edit</button>
          <button type="button" onclick="HappyToysAdmin.deleteProduct('${p.id}')" class="px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100">Delete</button>
        </td>
      </tr>`).join("");
  }

  return { init, editProduct, deleteProduct: async (id) => { if (!confirm("Delete this toy product?")) return; await saveProductsEverywhere(products.filter(p => p.id !== id)); renderTable(); } };
})();
window.HappyToysAdmin = HappyToysAdmin; document.addEventListener("DOMContentLoaded", HappyToysAdmin.init);
