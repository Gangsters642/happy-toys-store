const HappyToysAdmin = (() => {
  let products = [];
  function formatPkr(n) { return "PKR " + Number(n || 0).toLocaleString("en-PK"); }

  async function loadAllData() {
    try { products = JSON.parse(localStorage.getItem("hts_custom_products") || "[]"); } catch (e) {}
    try { const res = await fetch("/api/store"); if (res.ok) { const d = await res.json(); if (d.products && d.products.length) products = d.products; } } catch (e) {}
    renderTable();
  }
  async function saveProductsEverywhere(list) {
    products = list; localStorage.setItem("hts_custom_products", JSON.stringify(products));
    await fetch("/api/store", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ products }) });
  }
  function populateCategoryDropdown() {
    document.getElementById("prodCategory").innerHTML = window.HAPPY_TOYS_SEED.categories.filter(c => c.slug !== "all").map(c => `<option value="${c.slug}">${c.icon} ${c.name}</option>`).join("");
  }
  function compressImage(file, cb) {
    const reader = new FileReader(); reader.onload = (e) => {
      const img = new Image(); img.onload = () => {
        const canvas = document.createElement("canvas"); const MAX = 800; let w = img.width, h = img.height;
        if (w > h && w > MAX) { h *= MAX / w; w = MAX; } else if (h > MAX) { w *= MAX / h; h = MAX; }
        canvas.width = w; canvas.height = h; canvas.getContext("2d").drawImage(img, 0, 0, w, h); cb(canvas.toDataURL("image/jpeg", 0.82));
      }; img.src = e.target.result;
    }; reader.readAsDataURL(file);
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
    document.getElementById("prodMainImage").value = p.mainImage || "";
    document.getElementById("imagePreviewContainer").innerHTML = p.mainImage ? `<img src="${p.mainImage}" class="w-16 h-16 rounded-xl object-cover border" />` : "";

    const cbVar = document.getElementById("prodHasVariants"); cbVar.checked = !!(p.hasVariants && p.variants?.length); document.getElementById("variantPricesContainer").classList.toggle("hidden", !cbVar.checked);
    document.getElementById("varPriceSmall").value = cbVar.checked && p.variants.find(v=>v.size==="Small") ? p.variants.find(v=>v.size==="Small").pricePkr : "";
    document.getElementById("varPriceMedium").value = cbVar.checked && p.variants.find(v=>v.size==="Medium") ? p.variants.find(v=>v.size==="Medium").pricePkr : "";
    document.getElementById("varPriceBig").value = cbVar.checked && p.variants.find(v=>v.size==="Big") ? p.variants.find(v=>v.size==="Big").pricePkr : "";

    const cbLang = document.getElementById("prodHasLangVariants"); cbLang.checked = !!(p.hasLangVariants && p.langVariants?.length); document.getElementById("langVariantsContainer").classList.toggle("hidden", !cbLang.checked);
    document.getElementById("langPriceEnglish").value = cbLang.checked && p.langVariants.find(v=>v.lang==="English") ? p.langVariants.find(v=>v.lang==="English").pricePkr : "";
    document.getElementById("langPriceUrdu").value = cbLang.checked && p.langVariants.find(v=>v.lang==="Urdu") ? p.langVariants.find(v=>v.lang==="Urdu").pricePkr : "";

    const cbHoles = document.getElementById("prodHasHolesVariants"); cbHoles.checked = !!(p.hasHoleVariants && p.holeVariants?.length); document.getElementById("holesVariantsContainer").classList.toggle("hidden", !cbHoles.checked);
    document.getElementById("productModal").classList.remove("hidden");
  }

  function init() {
    populateCategoryDropdown(); loadAllData();
    ["prodHasVariants","prodHasLangVariants","prodHasHolesVariants"].forEach(id => {
      const cb = document.getElementById(id); cb?.addEventListener("change", () => document.getElementById(id.replace("prodHas","").toLowerCase() + (id.includes("Holes")?"VariantsContainer":id.includes("Lang")?"VariantsContainer":"PricesContainer")).classList.toggle("hidden", !cb.checked));
    });
    document.getElementById("openAddProductModalBtn")?.addEventListener("click", () => { document.getElementById("productForm").reset(); document.getElementById("editProductId").value = ""; document.getElementById("productModal").classList.remove("hidden"); });
    document.getElementById("closeProductModalBtn")?.addEventListener("click", () => document.getElementById("productModal").classList.add("hidden"));
    document.getElementById("imageUploadInput")?.addEventListener("change", (e) => { if(e.target.files[0]) compressImage(e.target.files[0], d => { document.getElementById("prodMainImage").value = d; document.getElementById("imagePreviewContainer").innerHTML = `<img src="${d}" class="w-16 rounded" />`; }); });

    document.getElementById("productForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = document.getElementById("editProductId").value || `prod-${Date.now()}`;
      let variants = [], langVariants = [], holeVariants = [];
      if(document.getElementById("prodHasVariants").checked) {
        ["Small","Medium","Big"].forEach(sz => { const pr = Number(document.getElementById("varPrice"+sz).value||0); if(pr>0) variants.push({size:sz, pricePkr:pr}); });
      }
      if(document.getElementById("prodHasLangVariants").checked) {
        ["English","Urdu"].forEach(l => { const pr = Number(document.getElementById("langPrice"+l).value||0); if(pr>0) langVariants.push({lang:l, pricePkr:pr}); });
      }
      const newProd = {
        id, name: document.getElementById("prodName").value, sku: document.getElementById("prodSku").value, category: document.getElementById("prodCategory").value, stockQty: Number(document.getElementById("prodStock").value),
        pricePkr: variants.length ? variants[0].pricePkr : Number(document.getElementById("prodPrice").value),
        comparePrice: Number(document.getElementById("prodComparePrice").value) || null,
        dimensions: document.getElementById("prodDimensions").value.trim(),
        hasVariants: variants.length>0, variants, hasLangVariants: langVariants.length>0, langVariants, hasHoleVariants: false, holeVariants: [],
        shortDescription: document.getElementById("prodShortDesc").value, keyFeatures: document.getElementById("prodKeyFeatures").value, packageIncludes: document.getElementById("prodPackageIncludes").value,
        mainImage: document.getElementById("prodMainImage").value || "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=600", isPublished: true
      };
      const idx = products.findIndex(p => p.id === id); if (idx >= 0) products[idx] = newProd; else products.unshift(newProd);
      await saveProductsEverywhere(products); document.getElementById("productModal").classList.add("hidden"); renderTable(); alert("✅ Toy Saved!");
    });
  }

  function renderTable() {
    const tbody = document.getElementById("adminProductTableBody"); if (!tbody) return;
    tbody.innerHTML = products.map(p => `
      <tr class="border-b border-slate-100 hover:bg-slate-50">
        <td class="py-2 px-4 flex items-center gap-2"><img src="${p.mainImage}" class="w-8 h-8 rounded object-cover"/><span class="font-bold text-xs truncate w-32">${p.name}</span></td>
        <td class="py-2 px-4 text-xs font-bold">${formatPkr(p.pricePkr)} ${p.comparePrice ? `<del class="text-red-500 text-[10px] block">${formatPkr(p.comparePrice)}</del>` : ''}</td>
        <td class="py-2 px-4 space-x-1"><button onclick="HappyToysAdmin.editProduct('${p.id}')" class="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-bold">Edit</button></td>
      </tr>`).join("");
  }
  return { init, editProduct };
})();
window.HappyToysAdmin = HappyToysAdmin; document.addEventListener("DOMContentLoaded", HappyToysAdmin.init);
