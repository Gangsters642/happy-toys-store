const HappyToysAdmin = (() => {
  let products = [];
  function formatPkr(n) { return "PKR " + Number(n || 0).toLocaleString("en-PK"); }

  async function loadAllData() {
    try { products = JSON.parse(localStorage.getItem("hts_custom_products") || "[]"); } catch (e) {}
    try { const res = await fetch("/api/store"); if (res.ok) { const d = await res.json(); if (d.products?.length) { products = d.products; localStorage.setItem("hts_custom_products", JSON.stringify(products)); } } } catch (e) {}
    renderTable();
  }

  async function saveProductsEverywhere(list) {
    products = list; localStorage.setItem("hts_custom_products", JSON.stringify(products));
    await fetch("/api/store", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ products }) });
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

  // --- Dynamic Custom Variants Logic ---
  function addCustomVariantRow(name='', price='', imgData='') {
    const list = document.getElementById("customVariantsList");
    const div = document.createElement("div");
    div.className = "custom-var-row bg-white p-2.5 rounded-xl border border-indigo-200 shadow-sm mb-2";
    div.innerHTML = `
      <div class="flex gap-2 mb-2">
        <input type="text" class="cv-name w-1/2 p-2 rounded-lg border text-xs font-bold" placeholder="Name (e.g. Urdu / Capital)" value="${name}">
        <input type="number" class="cv-price w-1/2 p-2 rounded-lg border text-xs font-bold" placeholder="Price (PKR)" value="${price}">
      </div>
      <div class="flex items-center gap-2">
        <input type="file" class="cv-file flex-1 text-[10px]" accept="image/*">
        <input type="hidden" class="cv-data" value="${imgData}">
        <div class="cv-preview w-8 h-8 rounded bg-slate-100 border shrink-0 overflow-hidden">${imgData ? `<img src="${imgData}" class="w-full h-full object-cover">` : ''}</div>
        <button type="button" class="text-red-500 font-black px-2 text-lg" onclick="this.closest('.custom-var-row').remove()">✕</button>
      </div>
    `;
    const fileInput = div.querySelector('.cv-file');
    const dataInput = div.querySelector('.cv-data');
    const preview = div.querySelector('.cv-preview');
    fileInput.addEventListener("change", (e) => {
      if(e.target.files[0]) compressImage(e.target.files[0], d => { dataInput.value = d; preview.innerHTML = `<img src="${d}" class="w-full h-full object-cover">`; });
    });
    list.appendChild(div);
  }

  function editProduct(id) {
    const p = products.find(x => x.id === id); if (!p) return;
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
    document.getElementById("imagePreviewContainer").innerHTML = window.tempImages.map(d => `<img src="${d}" class="w-10 h-10 rounded border inline-block mr-1 mb-1" />`).join("");

    // Custom Variants Load
    const hasCustom = Boolean(p.hasCustomVariants && p.customVariants && p.customVariants.length > 0);
    const cbCustom = document.getElementById("prodHasCustomVariants");
    cbCustom.checked = hasCustom;
    document.getElementById("customVariantsContainer").classList.toggle("hidden", !hasCustom);
    document.getElementById("customVariantsList").innerHTML = "";
    if (hasCustom) p.customVariants.forEach(cv => addCustomVariantRow(cv.name, cv.pricePkr, cv.image));

    // Basic Variants Load
    const setCb = (id, bool) => { document.getElementById(id).checked = bool; document.getElementById(id).dispatchEvent(new Event('change')); };
    setCb("prodHasVariants", Boolean(p.hasVariants && p.variants?.length));
    document.getElementById("varPriceSmall").value = p.variants?.find(v=>v.size==="Small")?.pricePkr || "";
    document.getElementById("varPriceMedium").value = p.variants?.find(v=>v.size==="Medium")?.pricePkr || "";
    document.getElementById("varPriceBig").value = p.variants?.find(v=>v.size==="Big")?.pricePkr || "";

    setCb("prodHasLangVariants", Boolean(p.hasLangVariants && p.langVariants?.length));
    document.getElementById("langPriceEnglish").value = p.langVariants?.find(v=>v.lang==="English")?.pricePkr || "";
    document.getElementById("langPriceUrdu").value = p.langVariants?.find(v=>v.lang==="Urdu")?.pricePkr || "";

    setCb("prodHasHolesVariants", Boolean(p.hasHoleVariants && p.holeVariants?.length));
    if (p.holeVariants?.length) {
      document.getElementById("holeCount1").value = p.holeVariants[0]?.holes || "12 Holes"; document.getElementById("holePrice1").value = p.holeVariants[0]?.pricePkr || "";
      document.getElementById("holeCount2").value = p.holeVariants[1]?.holes || "36 Holes"; document.getElementById("holePrice2").value = p.holeVariants[1]?.pricePkr || "";
      document.getElementById("holeCount3").value = p.holeVariants[2]?.holes || "40 Holes"; document.getElementById("holePrice3").value = p.holeVariants[2]?.pricePkr || "";
    }

    document.getElementById("productModal").classList.remove("hidden");
  }

  function init() {
    document.getElementById("prodCategory").innerHTML = window.HAPPY_TOYS_SEED?.categories.filter(c => c.slug !== "all").map(c => `<option value="${c.slug}">${c.icon} ${c.name}</option>`).join("");
    loadAllData();

    document.getElementById("adminLogoutBtn")?.addEventListener("click", () => { localStorage.removeItem("hts_admin_token"); location.reload(); });

    // Toggle Visibility
    ["prodHasCustomVariants", "prodHasVariants", "prodHasLangVariants", "prodHasHolesVariants"].forEach(id => {
      const cb = document.getElementById(id);
      cb?.addEventListener("change", () => {
        let tgt = id.replace("prodHas", "").toLowerCase();
        if(id === "prodHasCustomVariants") tgt = "customVariantsContainer";
        else if(id === "prodHasVariants") tgt = "variantPricesContainer";
        else tgt += "VariantsContainer";
        document.getElementById(tgt)?.classList.toggle("hidden", !cb.checked);
      });
    });

    document.getElementById("addCustomVariantBtn")?.addEventListener("click", () => addCustomVariantRow());

    const modal = document.getElementById("productModal");
    document.getElementById("openAddProductModalBtn")?.addEventListener("click", () => {
      document.getElementById("productForm").reset(); document.getElementById("editProductId").value = "";
      window.tempImages = []; document.getElementById("imagePreviewContainer").innerHTML = "";
      document.getElementById("customVariantsList").innerHTML = "";
      ["prodHasCustomVariants", "prodHasVariants", "prodHasLangVariants", "prodHasHolesVariants"].forEach(id => { const cb = document.getElementById(id); cb.checked=false; cb.dispatchEvent(new Event('change')); });
      modal.classList.remove("hidden");
    });
    document.getElementById("closeProductModalBtn")?.addEventListener("click", () => modal.classList.add("hidden"));

    document.getElementById("imageUploadInput")?.addEventListener("change", async (e) => {
      const files = Array.from(e.target.files).slice(0, 10); if(!files.length) return;
      window.tempImages = []; document.getElementById("imagePreviewContainer").innerHTML = "<span class='text-[10px] text-blue-600'>Processing...</span>";
      for(let f of files) await new Promise(r => compressImage(f, data => { window.tempImages.push(data); r(); }));
      document.getElementById("imagePreviewContainer").innerHTML = window.tempImages.map(d => `<img src="${d}" class="w-10 h-10 rounded border inline-block mr-1 mb-1" />`).join("");
    });

    document.getElementById("productForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = document.getElementById("editProductId").value || `prod-${Date.now()}`;
      const basePrice = Number(document.getElementById("prodPrice").value);
      const comparePrice = Number(document.getElementById("prodComparePrice").value || 0) || null;

      // Custom Dynamic Variants
      let customVariants = [];
      if (document.getElementById("prodHasCustomVariants").checked) {
        document.querySelectorAll(".custom-var-row").forEach(row => {
          const n = row.querySelector(".cv-name").value.trim();
          const p = Number(row.querySelector(".cv-price").value || 0);
          const img = row.querySelector(".cv-data").value;
          if (n && p > 0) customVariants.push({ name: n, pricePkr: p, image: img });
        });
      }

      let variants = [], langVariants = [], holeVariants = [];
      if(document.getElementById("prodHasVariants").checked) ["Small","Medium","Big"].forEach(sz => { const pr = Number(document.getElementById("varPrice"+sz).value||0); if(pr>0) variants.push({size:sz, pricePkr:pr}); });
      if(document.getElementById("prodHasLangVariants").checked) ["English","Urdu"].forEach(l => { const pr = Number(document.getElementById("langPrice"+l).value||0); if(pr>0) langVariants.push({lang:l, pricePkr:pr}); });
      if(document.getElementById("prodHasHolesVariants").checked) [1,2,3].forEach(i => { const c = document.getElementById("holeCount"+i).value.trim(); const pr = Number(document.getElementById("holePrice"+i).value||0); if(pr>0) holeVariants.push({holes:c, pricePkr:pr}); });

      let activeBasePrice = basePrice;
      if (customVariants.length > 0) activeBasePrice = customVariants[0].pricePkr;
      else if (variants.length > 0) activeBasePrice = variants[0].pricePkr;
      else if (langVariants.length > 0) activeBasePrice = langVariants[0].pricePkr;
      else if (holeVariants.length > 0) activeBasePrice = holeVariants[0].pricePkr;

      const imgArr = window.tempImages || (products.find(x => x.id === id)?.images || []);
      const mainImage = imgArr.length > 0 ? imgArr[0] : "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=600";

      const newProduct = {
        id, name: document.getElementById("prodName").value, sku: document.getElementById("prodSku").value, category: document.getElementById("prodCategory").value, stockQty: Number(document.getElementById("prodStock").value),
        pricePkr: activeBasePrice, comparePrice, dimensions: document.getElementById("prodDimensions").value.trim(),
        hasCustomVariants: customVariants.length > 0, customVariants,
        hasVariants: variants.length > 0, variants,
        hasLangVariants: langVariants.length > 0, langVariants,
        hasHoleVariants: holeVariants.length > 0, holeVariants,
        shortDescription: document.getElementById("prodShortDesc").value, keyFeatures: document.getElementById("prodKeyFeatures").value, packageIncludes: document.getElementById("prodPackageIncludes").value,
        images: imgArr, mainImage: mainImage, isPublished: true
      };

      const idx = products.findIndex(p => p.id === id); if (idx >= 0) products[idx] = newProduct; else products.unshift(newProduct);
      await saveProductsEverywhere(products); modal.classList.add("hidden"); renderTable(); alert("✅ Toy Saved!");
    });
  }

  function renderTable() {
    const tbody = document.getElementById("adminProductTableBody"); if (!tbody) return;
    tbody.innerHTML = products.map(p => `
      <tr class="border-b border-slate-100 hover:bg-slate-50 transition">
        <td class="py-3 px-4"><div class="flex items-center gap-3"><img src="${p.mainImage}" class="w-10 h-10 rounded-xl object-cover border bg-white"/><span class="font-bold text-slate-900">${p.name}</span></div></td>
        <td class="py-3 px-4 text-xs font-semibold capitalize">${p.category}</td>
        <td class="py-3 px-4 font-bold text-slate-800">${formatPkr(p.pricePkr)}</td>
        <td class="py-3 px-4 text-right space-x-2">
          <button type="button" onclick="HappyToysAdmin.editProduct('${p.id}')" class="px-2 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold">Edit</button>
        </td>
      </tr>`).join("");
  }

  return { init, editProduct };
})();
document.addEventListener("DOMContentLoaded", HappyToysAdmin.init);
