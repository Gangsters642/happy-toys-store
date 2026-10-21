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
      alert("Video Saved!");
    });

    const modal = document.getElementById("productModal");
    document.getElementById("openAddProductModalBtn")?.addEventListener("click", () => {
      document.getElementById("productForm")?.reset();
      document.getElementById("editProductId").value = "";
      document.getElementById("imagePreviewContainer").innerHTML = "";
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
      const sPrice = Number(document.getElementById("varPriceSmall")?.value || 0);
      const mPrice = Number(document.getElementById("varPriceMedium")?.value || 0);
      const bPrice = Number(document.getElementById("varPriceBig")?.value || 0);

      let variants = [];
      if (sPrice > 0) variants.push({ size: "Small", pricePkr: sPrice });
      if (mPrice > 0) variants.push({ size: "Medium", pricePkr: mPrice });
      if (bPrice > 0) variants.push({ size: "Big", pricePkr: bPrice });

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
      alert("✅ Toy Saved!");
    });
  }

  function renderTable() {
    const tbody = document.getElementById("adminProductTableBody");
    if (!tbody) return;
    tbody.innerHTML = products.map(p => `
      <tr class="border-b border-slate-100">
        <td class="py-3 px-4"><div class="flex items-center gap-3"><img src="${p.mainImage}" class="w-10 h-10 rounded-xl object-cover border"/><span class="font-bold text-slate-900">${p.name}</span></div></td>
        <td class="py-3 px-4 text-xs text-slate-500">${p.category}</td>
        <td class="py-3 px-4 font-bold text-slate-800">${formatPkr(p.pricePkr)}</td>
        <td class="py-3 px-4 font-semibold text-emerald-600">${p.stockQty}</td>
        <td class="py-3 px-4 text-right">
          <button onclick="HappyToysAdmin.deleteProduct('${p.id}')" class="px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-bold">Delete</button>
        </td>
      </tr>`).join("");
  }

  return {
    init,
    deleteProduct: async (id) => {
      if (!confirm("Delete this toy?")) return;
      await saveProductsEverywhere(products.filter(p => p.id !== id));
      renderTable();
    }
  };
})();
window.HappyToysAdmin = HappyToysAdmin;
document.addEventListener("DOMContentLoaded", HappyToysAdmin.init);
