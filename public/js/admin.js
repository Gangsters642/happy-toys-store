const HTS_DB = (() => {
  const dbName = "HappyToysDB", storeName = "mediaStore";
  const initDB = () => new Promise((res, rej) => {
    const r = indexedDB.open(dbName, 1);
    r.onupgradeneeded = (e) => e.target.result.createObjectStore(storeName);
    r.onsuccess = (e) => res(e.target.result);
    r.onerror = (e) => rej(e.target.error);
  });
  return {
    set: async (k, v) => { try { const db = await initDB(); return new Promise(r => { const tx = db.transaction(storeName, "readwrite"); tx.objectStore(storeName).put(v, k); tx.oncomplete = r; tx.onerror = r; }); } catch (e) {} },
    get: async (k) => { try { const db = await initDB(); return new Promise(r => { const tx = db.transaction(storeName, "readonly"); const rq = tx.objectStore(storeName).get(k); rq.onsuccess = () => r(rq.result); rq.onerror = () => r(null); }); } catch (e) { return null; } }
  };
})();

const HappyToysAdmin = (() => {
  let token = localStorage.getItem("hts_admin_token") || "secure-token";
  localStorage.setItem("hts_admin_token", token);
  let products = [];

  const defaultDevices = [
    { num: 1, name: "NOW OR NEVER 456", id: "DEV-9F59NE-WBG7", date: "22/10/2026", isCurrent: true },
    { num: 2, name: "DO Or Die", id: "DEV-ARYMY8-FWF2", date: "22/10/2026", isCurrent: false },
    { num: 3, name: "Abubaker1K5", id: "DEV-FZNL73-9FD3", date: "22/10/2026", isCurrent: false }
  ];

  function formatPkr(n) { return "PKR " + Number(n || 0).toLocaleString("en-PK"); }

  function renderAuthorizedDevices() {
    const ctn = document.getElementById("authorizedDevicesContainer");
    if (!ctn) return;
    ctn.innerHTML = defaultDevices.map(d => `
      <div class="flex items-center justify-between p-3.5 rounded-2xl border ${d.isCurrent ? 'bg-emerald-50/70 border-emerald-300' : 'bg-amber-50/40 border-amber-200'}">
        <div class="flex items-center gap-3">
          <span class="w-8 h-8 rounded-xl ${d.isCurrent ? 'bg-emerald-500 text-white' : 'bg-amber-200 text-amber-900'} font-black text-xs flex items-center justify-center">#${d.num}</span>
          <div>
            <div class="font-black text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
              <span>${d.name}</span>
              ${d.isCurrent ? '<span class="bg-emerald-600 text-white text-[9px] px-2 py-0.5 rounded-md font-extrabold">This Device</span>' : ''}
            </div>
            <div class="text-[10px] text-slate-500 font-bold">ID: ${d.id} • Saved: ${d.date}</div>
          </div>
        </div>
        <span class="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-black">Active</span>
      </div>
    `).join("");
  }

  async function loadAllData() {
    renderAuthorizedDevices();
    try { products = JSON.parse(localStorage.getItem("hts_custom_products") || "[]"); } catch (e) {}
    try {
      const res = await fetch("/api/store");
      if (res.ok) {
        const d = await res.json();
        if (d.products && d.products.length) {
          products = d.products;
          localStorage.setItem("hts_custom_products", JSON.stringify(products));
        } else if (!products.length && window.HAPPY_TOYS_SEED) {
          products = window.HAPPY_TOYS_SEED.products || [];
        }
      }
    } catch (e) {}
    renderTable();
  }

  async function saveProductsEverywhere(list) {
    products = list;
    localStorage.setItem("hts_custom_products", JSON.stringify(products));
    await fetch("/api/store", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ products })
    });
  }

  function populateCategoryDropdown() {
    const s = document.getElementById("prodCategory");
    if (!s || !window.HAPPY_TOYS_SEED) return;
    s.innerHTML = window.HAPPY_TOYS_SEED.categories.filter(c => c.slug !== "all").map(c => `<option value="${c.slug}">${c.icon} ${c.name}</option>`).join("");
  }

  function compressImage(file, cb) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX = 800;
        let w = img.width, h = img.height;
        if (w > h && w > MAX) { h *= MAX / w; w = MAX; } else if (h > MAX) { w *= MAX / h; h = MAX; }
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        cb(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function addInchVariantRow(inches = "", price = "", imgData = "") {
    const list = document.getElementById("inchVariantsList");
    if (!list) return;
    const div = document.createElement("div");
    div.className = "inch-var-row bg-white p-3 rounded-xl border border-sky-200 shadow-xs space-y-2";
    div.innerHTML = `
      <div class="grid grid-cols-2 gap-2">
        <input type="text" class="iv-name w-full p-2 rounded-lg border border-slate-200 text-xs font-bold" placeholder="Inches (e.g. Small 7x5 Inch)" value="${inches}">
        <input type="number" class="iv-price w-full p-2 rounded-lg border border-slate-200 text-xs font-bold" placeholder="Price (PKR)" value="${price}">
      </div>
      <div class="flex items-center gap-2">
        <input type="file" class="iv-file flex-1 text-[10px] text-slate-600 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-black file:bg-sky-50 file:text-sky-700" accept="image/*">
        <input type="hidden" class="iv-data" value="${imgData}">
        <div class="iv-preview w-10 h-10 rounded-lg bg-slate-100 border shrink-0 overflow-hidden flex items-center justify-center text-[9px] text-slate-400 font-bold">
          ${imgData ? `<img src="${imgData}" class="w-full h-full object-cover">` : 'No Pic'}
        </div>
        <button type="button" class="w-8 h-8 rounded-lg bg-red-50 text-red-600 font-black text-xs" onclick="this.closest('.inch-var-row').remove()">✕</button>
      </div>
    `;
    const fileInput = div.querySelector(".iv-file");
    const dataInput = div.querySelector(".iv-data");
    const preview = div.querySelector(".iv-preview");
    fileInput.addEventListener("change", (e) => {
      if (e.target.files[0]) {
        compressImage(e.target.files[0], (d) => {
          dataInput.value = d;
          preview.innerHTML = `<img src="${d}" class="w-full h-full object-cover">`;
        });
      }
    });
    list.appendChild(div);
  }

  function addCustomVariantRow(name = "", price = "", imgData = "") {
    const list = document.getElementById("customVariantsList");
    if (!list) return;
    const div = document.createElement("div");
    div.className = "custom-var-row bg-white p-3 rounded-xl border border-indigo-200 shadow-xs space-y-2";
    div.innerHTML = `
      <div class="grid grid-cols-2 gap-2">
        <input type="text" class="cv-name w-full p-2 rounded-lg border border-slate-200 text-xs font-bold" placeholder="Option (e.g. Capital ABC / Urdu)" value="${name}">
        <input type="number" class="cv-price w-full p-2 rounded-lg border border-slate-200 text-xs font-bold" placeholder="Price (PKR)" value="${price}">
      </div>
      <div class="flex items-center gap-2">
        <input type="file" class="cv-file flex-1 text-[10px] text-slate-600 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-black file:bg-indigo-50 file:text-indigo-700" accept="image/*">
        <input type="hidden" class="cv-data" value="${imgData}">
        <div class="cv-preview w-10 h-10 rounded-lg bg-slate-100 border shrink-0 overflow-hidden flex items-center justify-center text-[9px] text-slate-400 font-bold">
          ${imgData ? `<img src="${imgData}" class="w-full h-full object-cover">` : 'No Pic'}
        </div>
        <button type="button" class="w-8 h-8 rounded-lg bg-red-50 text-red-600 font-black text-xs" onclick="this.closest('.custom-var-row').remove()">✕</button>
      </div>
    `;
    const fileInput = div.querySelector(".cv-file");
    const dataInput = div.querySelector(".cv-data");
    const preview = div.querySelector(".cv-preview");
    fileInput.addEventListener("change", (e) => {
      if (e.target.files[0]) {
        compressImage(e.target.files[0], (d) => {
          dataInput.value = d;
          preview.innerHTML = `<img src="${d}" class="w-full h-full object-cover">`;
        });
      }
    });
    list.appendChild(div);
  }

  function resetSizeImagePickers() {
    ["Small", "Medium", "Big"].forEach(k => {
      const inp = document.getElementById("varImg" + k);
      const prev = document.getElementById("varPrev" + k);
      const file = document.getElementById("varFile" + k);
      if (inp) inp.value = "";
      if (file) file.value = "";
      if (prev) prev.innerHTML = "No Pic";
    });
  }

  function editProduct(id) {
    const p = products.find(x => x.id === id);
    if (!p) return;
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

    window.tempImages = p.images || (p.mainImage ? [p.mainImage] : []);
    document.getElementById("imagePreviewContainer").innerHTML = window.tempImages.map(d => `<img src="${d}" class="w-12 h-12 rounded-lg object-cover border border-slate-200 inline-block mr-1 mb-1" />`).join("");

    // 1. Size Variants (Small / Medium / Large)
    resetSizeImagePickers();
    const hasVar = Boolean(p.hasVariants && p.variants && p.variants.length > 0);
    document.getElementById("prodHasVariants").checked = hasVar;
    document.getElementById("variantPricesContainer").classList.toggle("hidden", !hasVar);
    const findSizeObj = (names) => (p.variants || []).find(v => names.includes(v.size.toLowerCase()));

    const sObj = findSizeObj(["small"]);
    const mObj = findSizeObj(["medium"]);
    const lObj = findSizeObj(["large", "big"]);

    document.getElementById("varPriceSmall").value = sObj ? sObj.pricePkr : "";
    if (sObj && sObj.image) { document.getElementById("varImgSmall").value = sObj.image; document.getElementById("varPrevSmall").innerHTML = `<img src="${sObj.image}" class="w-full h-full object-cover">`; }

    document.getElementById("varPriceMedium").value = mObj ? mObj.pricePkr : "";
    if (mObj && mObj.image) { document.getElementById("varImgMedium").value = mObj.image; document.getElementById("varPrevMedium").innerHTML = `<img src="${mObj.image}" class="w-full h-full object-cover">`; }

    document.getElementById("varPriceBig").value = lObj ? lObj.pricePkr : "";
    if (lObj && lObj.image) { document.getElementById("varImgBig").value = lObj.image; document.getElementById("varPrevBig").innerHTML = `<img src="${lObj.image}" class="w-full h-full object-cover">`; }

    // 2. Extra Inches Variants
    const hasInch = Boolean(p.hasInchVariants && p.inchVariants && p.inchVariants.length > 0);
    const cbInch = document.getElementById("prodHasInchVariants");
    if (cbInch) {
      cbInch.checked = hasInch;
      document.getElementById("inchVariantsContainer").classList.toggle("hidden", !hasInch);
      document.getElementById("inchVariantsList").innerHTML = "";
      if (hasInch) {
        p.inchVariants.forEach(iv => addInchVariantRow(iv.inches, iv.pricePkr, iv.image || ""));
      }
    }

    // 3. Language Variants
    const hasLang = Boolean(p.hasLangVariants && p.langVariants && p.langVariants.length > 0);
    document.getElementById("prodHasLangVariants").checked = hasLang;
    document.getElementById("langVariantsContainer").classList.toggle("hidden", !hasLang);
    const getLangPrice = (l) => (p.langVariants || []).find(v => v.lang.toLowerCase() === l.toLowerCase())?.pricePkr || "";
    document.getElementById("langPriceEnglish").value = getLangPrice("English");
    document.getElementById("langPriceUrdu").value = getLangPrice("Urdu");

    // 4. Holes Variants
    const hasHoles = Boolean(p.hasHoleVariants && p.holeVariants && p.holeVariants.length > 0);
    document.getElementById("prodHasHolesVariants").checked = hasHoles;
    document.getElementById("holesVariantsContainer").classList.toggle("hidden", !hasHoles);
    if (hasHoles && p.holeVariants[0]) { document.getElementById("holeCount1").value = p.holeVariants[0].holes || "12 Holes"; document.getElementById("holePrice1").value = p.holeVariants[0].pricePkr || ""; }
    if (hasHoles && p.holeVariants[1]) { document.getElementById("holeCount2").value = p.holeVariants[1].holes || "36 Holes"; document.getElementById("holePrice2").value = p.holeVariants[1].pricePkr || ""; }
    if (hasHoles && p.holeVariants[2]) { document.getElementById("holeCount3").value = p.holeVariants[2].holes || "40 Holes"; document.getElementById("holePrice3").value = p.holeVariants[2].pricePkr || ""; }

    // 5. Extra Custom Variants
    const hasCustom = Boolean(p.hasCustomVariants && p.customVariants && p.customVariants.length > 0);
    document.getElementById("prodHasCustomVariants").checked = hasCustom;
    document.getElementById("customVariantsContainer").classList.toggle("hidden", !hasCustom);
    document.getElementById("customVariantsList").innerHTML = "";
    if (hasCustom) {
      p.customVariants.forEach(cv => addCustomVariantRow(cv.name, cv.pricePkr, cv.image || ""));
    }

    document.getElementById("productModal")?.classList.remove("hidden");
  }

  function init() {
    document.getElementById("adminLoginModal")?.classList.add("hidden");
    populateCategoryDropdown();
    loadAllData();

    document.getElementById("adminLoginForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      token = "secure-token";
      localStorage.setItem("hts_admin_token", token);
      document.getElementById("adminLoginModal")?.classList.add("hidden");
      populateCategoryDropdown();
      loadAllData();
    });

    document.getElementById("adminLogoutBtn")?.addEventListener("click", () => {
      document.getElementById("adminLoginModal")?.classList.remove("hidden");
    });

    document.getElementById("splashMediaUpload")?.addEventListener("change", (e) => {
      const f = e.target.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = (ev) => { window.tempMediaData = ev.target.result; };
      r.readAsDataURL(f);
    });

    document.getElementById("saveMediaBtn")?.addEventListener("click", async () => {
      const urlInput = document.getElementById("adminIntroGifUrl")?.value.trim();
      const media = window.tempMediaData || urlInput;
      if (!media) return alert("Select video first!");
      await HTS_DB.set("splashMedia", media);
      await fetch("/api/video", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ videoData: media }) });
      alert("✅ Splash Video Saved!");
    });

    // Bind Small / Medium / Large Image File Inputs
    ["Small", "Medium", "Big"].forEach(k => {
      const fileEl = document.getElementById("varFile" + k);
      const hiddenEl = document.getElementById("varImg" + k);
      const prevEl = document.getElementById("varPrev" + k);
      fileEl?.addEventListener("change", (e) => {
        if (e.target.files[0]) {
          compressImage(e.target.files[0], (d) => {
            if (hiddenEl) hiddenEl.value = d;
            if (prevEl) prevEl.innerHTML = `<img src="${d}" class="w-full h-full object-cover">`;
          });
        }
      });
    });

    const cbVar = document.getElementById("prodHasVariants");
    const ctnVar = document.getElementById("variantPricesContainer");
    cbVar?.addEventListener("change", () => ctnVar.classList.toggle("hidden", !cbVar.checked));

    const cbInch = document.getElementById("prodHasInchVariants");
    const ctnInch = document.getElementById("inchVariantsContainer");
    cbInch?.addEventListener("change", () => {
      ctnInch.classList.toggle("hidden", !cbInch.checked);
      if (cbInch.checked && document.getElementById("inchVariantsList").children.length === 0) {
        addInchVariantRow();
      }
    });
    document.getElementById("addInchVariantBtn")?.addEventListener("click", () => addInchVariantRow());

    const cbLang = document.getElementById("prodHasLangVariants");
    const ctnLang = document.getElementById("langVariantsContainer");
    cbLang?.addEventListener("change", () => ctnLang.classList.toggle("hidden", !cbLang.checked));

    const cbHoles = document.getElementById("prodHasHolesVariants");
    const ctnHoles = document.getElementById("holesVariantsContainer");
    cbHoles?.addEventListener("change", () => ctnHoles.classList.toggle("hidden", !cbHoles.checked));

    const cbCustom = document.getElementById("prodHasCustomVariants");
    const ctnCustom = document.getElementById("customVariantsContainer");
    cbCustom?.addEventListener("change", () => {
      ctnCustom.classList.toggle("hidden", !cbCustom.checked);
      if (cbCustom.checked && document.getElementById("customVariantsList").children.length === 0) {
        addCustomVariantRow();
      }
    });
    document.getElementById("addCustomVariantBtn")?.addEventListener("click", () => addCustomVariantRow());

    const modal = document.getElementById("productModal");
    document.getElementById("openAddProductModalBtn")?.addEventListener("click", () => {
      document.getElementById("productForm")?.reset();
      document.getElementById("editProductId").value = "";
      window.tempImages = [];
      resetSizeImagePickers();
      document.getElementById("imagePreviewContainer").innerHTML = "";
      document.getElementById("customVariantsList").innerHTML = "";
      if (document.getElementById("inchVariantsList")) document.getElementById("inchVariantsList").innerHTML = "";
      cbVar.checked = false; ctnVar.classList.add("hidden");
      if (cbInch) { cbInch.checked = false; ctnInch.classList.add("hidden"); }
      cbLang.checked = false; ctnLang.classList.add("hidden");
      cbHoles.checked = false; ctnHoles.classList.add("hidden");
      cbCustom.checked = false; ctnCustom.classList.add("hidden");
      document.getElementById("holeCount1").value = "12 Holes";
      document.getElementById("holeCount2").value = "36 Holes";
      document.getElementById("holeCount3").value = "40 Holes";
      modal?.classList.remove("hidden");
    });
    document.getElementById("closeProductModalBtn")?.addEventListener("click", () => modal?.classList.add("hidden"));

    document.getElementById("imageUploadInput")?.addEventListener("change", async (e) => {
      const files = Array.from(e.target.files).slice(0, 10);
      if (!files.length) return;
      window.tempImages = [];
      document.getElementById("imagePreviewContainer").innerHTML = "<span class='text-[10px] text-blue-600 font-bold'>Processing up to 10 images...</span>";
      for (let f of files) {
        await new Promise(r => compressImage(f, data => { window.tempImages.push(data); r(); }));
      }
      document.getElementById("imagePreviewContainer").innerHTML = window.tempImages.map(d => `<img src="${d}" class="w-12 h-12 rounded-lg object-cover border border-slate-200 inline-block mr-1 mb-1" />`).join("");
    });

    document.getElementById("productForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = document.getElementById("editProductId").value || `prod-${Date.now()}`;
      const basePrice = Number(document.getElementById("prodPrice").value);
      const comparePrice = Number(document.getElementById("prodComparePrice").value || 0) || null;

      // 1. Size Variants (Small, Medium, Large + Image)
      let variants = [];
      if (cbVar.checked) {
        const s = Number(document.getElementById("varPriceSmall").value || 0);
        const sImg = document.getElementById("varImgSmall")?.value || "";
        const m = Number(document.getElementById("varPriceMedium").value || 0);
        const mImg = document.getElementById("varImgMedium")?.value || "";
        const l = Number(document.getElementById("varPriceBig").value || 0);
        const lImg = document.getElementById("varImgBig")?.value || "";
        if (s > 0) variants.push({ size: "Small", pricePkr: s, image: sImg });
        if (m > 0) variants.push({ size: "Medium", pricePkr: m, image: mImg });
        if (l > 0) variants.push({ size: "Large", pricePkr: l, image: lImg });
      }

      // 2. Extra Inches Variants
      let inchVariants = [];
      if (cbInch && cbInch.checked) {
        document.querySelectorAll(".inch-var-row").forEach(row => {
          const n = row.querySelector(".iv-name").value.trim();
          const p = Number(row.querySelector(".iv-price").value || basePrice);
          const img = row.querySelector(".iv-data").value || "";
          if (n) inchVariants.push({ inches: n, pricePkr: p, image: img });
        });
      }

      // 3. Language Variants
      let langVariants = [];
      if (cbLang.checked) {
        const eng = Number(document.getElementById("langPriceEnglish").value || 0);
        const urd = Number(document.getElementById("langPriceUrdu").value || 0);
        if (eng > 0) langVariants.push({ lang: "English", pricePkr: eng });
        if (urd > 0) langVariants.push({ lang: "Urdu", pricePkr: urd });
      }

      // 4. Holes Variants
      let holeVariants = [];
      if (cbHoles.checked) {
        const c1 = document.getElementById("holeCount1").value.trim(); const p1 = Number(document.getElementById("holePrice1").value || 0);
        const c2 = document.getElementById("holeCount2").value.trim(); const p2 = Number(document.getElementById("holePrice2").value || 0);
        const c3 = document.getElementById("holeCount3").value.trim(); const p3 = Number(document.getElementById("holePrice3").value || 0);
        if (p1 > 0) holeVariants.push({ holes: c1 || "12 Holes", pricePkr: p1 });
        if (p2 > 0) holeVariants.push({ holes: c2 || "36 Holes", pricePkr: p2 });
        if (p3 > 0) holeVariants.push({ holes: c3 || "40 Holes", pricePkr: p3 });
      }

      // 5. Custom Variants
      let customVariants = [];
      if (cbCustom.checked) {
        document.querySelectorAll(".custom-var-row").forEach(row => {
          const n = row.querySelector(".cv-name").value.trim();
          const p = Number(row.querySelector(".cv-price").value || basePrice);
          const img = row.querySelector(".cv-data").value || "";
          if (n) customVariants.push({ name: n, pricePkr: p, image: img });
        });
      }

      let activeBasePrice = basePrice;
      if (customVariants.length > 0) activeBasePrice = customVariants[0].pricePkr;
      else if (variants.length > 0) activeBasePrice = variants[0].pricePkr;
      else if (inchVariants.length > 0) activeBasePrice = inchVariants[0].pricePkr;
      else if (langVariants.length > 0) activeBasePrice = langVariants[0].pricePkr;
      else if (holeVariants.length > 0) activeBasePrice = holeVariants[0].pricePkr;

      const imgArr = (window.tempImages && window.tempImages.length > 0)
        ? window.tempImages
        : (products.find(x => x.id === id)?.images || []);
      const mainImage = imgArr.length > 0
        ? imgArr[0]
        : (variants[0]?.image || inchVariants[0]?.image || customVariants[0]?.image || "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=600");

      const newProduct = {
        id,
        name: document.getElementById("prodName").value,
        sku: document.getElementById("prodSku").value,
        category: document.getElementById("prodCategory").value,
        stockQty: Number(document.getElementById("prodStock").value),
        pricePkr: activeBasePrice,
        comparePrice,
        dimensions: document.getElementById("prodDimensions").value.trim(),
        hasVariants: variants.length > 0,
        variants,
        hasInchVariants: inchVariants.length > 0,
        inchVariants,
        hasLangVariants: langVariants.length > 0,
        langVariants,
        hasHoleVariants: holeVariants.length > 0,
        holeVariants,
        hasCustomVariants: customVariants.length > 0,
        customVariants,
        shortDescription: document.getElementById("prodShortDesc").value,
        keyFeatures: document.getElementById("prodKeyFeatures").value,
        packageIncludes: document.getElementById("prodPackageIncludes").value,
        images: imgArr,
        mainImage,
        isPublished: true
      };

      const idx = products.findIndex(p => p.id === id);
      if (idx >= 0) products[idx] = newProduct;
      else products.unshift(newProduct);

      await saveProductsEverywhere(products);
      modal?.classList.add("hidden");
      renderTable();
      alert("✅ Toy Product Saved Successfully!");
    });
  }

  function renderTable() {
    const tbody = document.getElementById("adminProductTableBody");
    if (!tbody) return;
    tbody.innerHTML = products.map(p => {
      let badges = [];
      if (p.hasVariants) badges.push("Size (S/M/L)");
      if (p.hasInchVariants) badges.push(`Inches (${p.inchVariants.length})`);
      if (p.hasCustomVariants) badges.push(`Custom (${p.customVariants.length})`);
      if (p.hasLangVariants) badges.push("Book Languages");
      if (p.hasHoleVariants) badges.push("Bubble Holes");
      if (p.dimensions) badges.push(p.dimensions);
      const badgeHtml = badges.length ? `<div class="text-[10px] text-amber-600 font-extrabold mt-0.5">${badges.join(" • ")}</div>` : "";

      return `
      <tr class="border-b border-slate-100 hover:bg-slate-50 transition">
        <td class="py-3 px-4"><div class="flex items-center gap-3"><img src="${p.mainImage}" class="w-10 h-10 rounded-xl object-cover border bg-white"/><span class="font-bold text-slate-900">${p.name}</span></div></td>
        <td class="py-3 px-4 text-xs text-slate-600 font-semibold"><span class="capitalize">${p.category}</span>${badgeHtml}</td>
        <td class="py-3 px-4 font-bold text-slate-800">${formatPkr(p.pricePkr)}</td>
        <td class="py-3 px-4 font-semibold text-emerald-600">${p.stockQty}</td>
        <td class="py-3 px-4 text-right space-x-2 whitespace-nowrap">
          <button type="button" onclick="HappyToysAdmin.editProduct('${p.id}')" class="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold hover:bg-blue-100 cursor-pointer">Edit</button>
          <button type="button" onclick="HappyToysAdmin.deleteProduct('${p.id}')" class="px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 cursor-pointer">Delete</button>
        </td>
      </tr>`;
    }).join("");
  }

  return {
    init,
    editProduct,
    deleteProduct: async (id) => {
      if (!confirm("Delete this toy product?")) return;
      await saveProductsEverywhere(products.filter(p => p.id !== id));
      renderTable();
    }
  };
})();
window.HappyToysAdmin = HappyToysAdmin;
document.addEventListener("DOMContentLoaded", HappyToysAdmin.init);
