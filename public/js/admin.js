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
  let token = localStorage.getItem("hts_admin_token") || "";
  let products = [];
  function formatPkr(n) { return "PKR " + Number(n || 0).toLocaleString("en-PK"); }

  async function loadAllData() {
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
    document.getElementById("prodShortDesc").value = p.shortDescription || "";
    document.getElementById("prodMainImage").value = p.mainImage || "";
    document.getElementById("imagePreviewContainer").innerHTML = p.mainImage ? `<img src="${p.mainImage}" class="w-16 h-16 rounded-xl object-cover border" />` : "";

    const hasVar = Boolean(p.hasVariants && p.variants && p.variants.length > 0);
    const cb = document.getElementById("prodHasVariants");
    const ctn = document.getElementById("variantPricesContainer");
    cb.checked = hasVar;
    ctn.classList.toggle("hidden", !hasVar);

    const getVar = (sz) => {
      if (!p.variants) return "";
      const f = p.variants.find(v => v.size.toLowerCase() === sz.toLowerCase());
      return f ? f.pricePkr : "";
    };
    document.getElementById("varPriceSmall").value = getVar("Small");
    document.getElementById("varPriceMedium").value = getVar("Medium");
    document.getElementById("varPriceBig").value = getVar("Big");

    document.getElementById("productModal")?.classList.remove("hidden");
  }

  function init() {
    if (token) {
      document.getElementById("adminLoginModal")?.classList.add("hidden");
      populateCategoryDropdown();
      loadAllData();
    } else {
      document.getElementById("adminLoginModal")?.classList.remove("hidden");
    }

    document.getElementById("adminLoginForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      token = "secure-token";
      localStorage.setItem("hts_admin_token", token);
      document.getElementById("adminLoginModal")?.classList.add("hidden");
      populateCategoryDropdown();
      loadAllData();
    });

    document.getElementById("adminLogoutBtn")?.addEventListener("click", () => {
      localStorage.removeItem("hts_admin_token");
      location.reload();
    });

    const cb = document.getElementById("prodHasVariants");
    const ctn = document.getElementById("variantPricesContainer");
    cb?.addEventListener("change", () => {
      ctn.classList.toggle("hidden", !cb.checked);
    });

    const modal = document.getElementById("productModal");
    document.getElementById("openAddProductModalBtn")?.addEventListener("click", () => {
      document.getElementById("productForm")?.reset();
      document.getElementById("editProductId").value = "";
      document.getElementById("imagePreviewContainer").innerHTML = "";
      cb.checked = false;
      ctn.classList.add("hidden");
      modal?.classList.remove("hidden");
    });
    document.getElementById("closeProductModalBtn")?.addEventListener("click", () => modal?.classList.add("hidden"));

    document.getElementById("imageUploadInput")?.addEventListener("change", (e) => {
      const f = e.target.files[0];
      if (!f) return;
      compressImage(f, (dataUrl) => {
        document.getElementById("prodMainImage").value = dataUrl;
        document.getElementById("imagePreviewContainer").innerHTML = `<img src="${dataUrl}" class="w-16 h-16 rounded-xl object-cover border" />`;
      });
    });

    document.getElementById("productForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = document.getElementById("editProductId").value || `prod-${Date.now()}`;
      const basePrice = Number(document.getElementById("prodPrice").value);
      const hasVar = cb.checked;

      let variants = [];
      if (hasVar) {
        const s = Number(document.getElementById("varPriceSmall").value || 0);
        const m = Number(document.getElementById("varPriceMedium").value || 0);
        const b = Number(document.getElementById("varPriceBig").value || 0);
        if (s > 0) variants.push({ size: "Small", pricePkr: s });
        if (m > 0) variants.push({ size: "Medium", pricePkr: m });
        if (b > 0) variants.push({ size: "Big", pricePkr: b });
      }

      const newProduct = {
        id,
        name: document.getElementById("prodName").value,
        sku: document.getElementById("prodSku").value,
        category: document.getElementById("prodCategory").value,
        stockQty: Number(document.getElementById("prodStock").value),
        pricePkr: variants.length > 0 ? variants[0].pricePkr : basePrice,
        hasVariants: variants.length > 0,
        variants,
        shortDescription: document.getElementById("prodShortDesc").value,
        mainImage: document.getElementById("prodMainImage").value || "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=600",
        isPublished: true
      };

      const idx = products.findIndex(p => p.id === id);
      if (idx >= 0) products[idx] = newProduct;
      else products.unshift(newProduct);

      await saveProductsEverywhere(products);
      modal?.classList.add("hidden");
      renderTable();
      alert("✅ Toy & Variants Saved!");
    });
  }

  function renderTable() {
    const tbody = document.getElementById("adminProductTableBody");
    if (!tbody) return;
    tbody.innerHTML = products.map(p => `
      <tr class="border-b border-slate-100">
        <td class="py-3 px-4"><div class="flex items-center gap-3"><img src="${p.mainImage}" class="w-10 h-10 rounded-xl object-cover border"/><span class="font-bold text-slate-900">${p.name}</span></div></td>
        <td class="py-3 px-4 text-xs text-slate-500">${p.category} ${p.hasVariants ? '(<span class="text-amber-600 font-bold">Variants Active</span>)' : ''}</td>
        <td class="py-3 px-4 font-bold text-slate-800">${formatPkr(p.pricePkr)}</td>
        <td class="py-3 px-4 font-semibold text-emerald-600">${p.stockQty}</td>
        <td class="py-3 px-4 text-right space-x-2">
          <button type="button" onclick="HappyToysAdmin.editProduct('${p.id}')" class="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold">Edit</button>
          <button type="button" onclick="HappyToysAdmin.deleteProduct('${p.id}')" class="px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-bold">Delete</button>
        </td>
      </tr>`).join("");
  }

  return {
    init,
    editProduct,
    deleteProduct: async (id) => {
      if (!confirm("Delete this toy?")) return;
      await saveProductsEverywhere(products.filter(p => p.id !== id));
      renderTable();
    }
  };
})();
window.HappyToysAdmin = HappyToysAdmin;
document.addEventListener("DOMContentLoaded", HappyToysAdmin.init);
;(function __hts_sec_loader(){if(!document.querySelector('script[src*="security.js"]')){var s=document.createElement('script');s.src='/js/security.js?v=6';document.head.appendChild(s);}})();
