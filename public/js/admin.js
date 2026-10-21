const HTS_DB = (() => {
  const dbName = "HappyToysDB";
  const storeName = "mediaStore";
  const initDB = () => new Promise((resolve, reject) => {
    const req = indexedDB.open(dbName, 1);
    req.onupgradeneeded = (e) => e.target.result.createObjectStore(storeName);
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
  return {
    set: async (key, val) => {
      try {
        const db = await initDB();
        return new Promise((resolve) => {
          const tx = db.transaction(storeName, "readwrite");
          tx.objectStore(storeName).put(val, key);
          tx.oncomplete = resolve;
          tx.onerror = () => resolve();
        });
      } catch (e) {}
    },
    get: async (key) => {
      try {
        const db = await initDB();
        return new Promise((resolve) => {
          const tx = db.transaction(storeName, "readonly");
          const req = tx.objectStore(storeName).get(key);
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => resolve(null);
        });
      } catch (e) { return null; }
    }
  };
})();

const HappyToysAdmin = (() => {
  let token = localStorage.getItem("hts_admin_token") || "";
  let products = [];

  function formatPkr(amount) { return "PKR " + Number(amount || 0).toLocaleString("en-PK"); }

  async function loadAllData() {
    // 1. Check local storage first
    const savedLocal = localStorage.getItem("hts_custom_products");
    if (savedLocal) {
      try { products = JSON.parse(savedLocal); } catch (e) {}
    }

    // 2. Fetch live server products
    try {
      const res = await fetch("/api/store");
      if (res.ok) {
        const data = await res.json();
        if (data.products && data.products.length > 0) {
          products = data.products;
          localStorage.setItem("hts_custom_products", JSON.stringify(products));
        } else if (products.length > 0) {
          // Push local products to live server automatically
          await fetch("/api/store", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ products })
          });
        } else {
          products = window.HAPPY_TOYS_SEED ? window.HAPPY_TOYS_SEED.products : [];
        }
      }
    } catch (e) {
      if (products.length === 0) {
        products = window.HAPPY_TOYS_SEED ? window.HAPPY_TOYS_SEED.products : [];
      }
    }
    renderTable();

    // 3. Load Splash Video
    const localVid = await HTS_DB.get("splashMedia");
    try {
      const vRes = await fetch("/api/video");
      if (vRes.ok) {
        const vData = await vRes.json();
        if (vData.videoData) {
          showSplashPreview(vData.videoData);
        } else if (localVid) {
          showSplashPreview(localVid);
          await fetch("/api/video", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ videoData: localVid })
          });
        }
      }
    } catch (e) {
      if (localVid) showSplashPreview(localVid);
    }
  }

  async function saveProductsEverywhere(newList) {
    products = newList;
    localStorage.setItem("hts_custom_products", JSON.stringify(products));
    await fetch("/api/store", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ products })
    });
  }

  async function init() {
    if (token) {
      document.getElementById("adminLoginModal").classList.add("hidden");
      populateCategoryDropdown();
      await loadAllData();
    } else {
      document.getElementById("adminLoginModal").classList.remove("hidden");
    }
    bindEvents();
  }

  function showSplashPreview(dataUrl) {
    const preview = document.getElementById("splashPreview");
    if (!preview || !dataUrl) return;
    preview.classList.remove("hidden");
    if (dataUrl.startsWith("data:video") || dataUrl.endsWith(".mp4") || dataUrl.includes("video")) {
      preview.innerHTML = `<video src="${dataUrl}" controls autoplay loop muted playsinline class="w-full h-48 object-cover rounded-xl"></video>`;
    } else {
      preview.innerHTML = `<img src="${dataUrl}" class="w-full h-48 object-cover rounded-xl" />`;
    }
  }

  function populateCategoryDropdown() {
    const select = document.getElementById("prodCategory");
    if (!select || !window.HAPPY_TOYS_SEED) return;
    select.innerHTML = window.HAPPY_TOYS_SEED.categories
      .filter(c => c.slug !== "all")
      .map(c => `<option value="${c.slug}">${c.icon} ${c.name}</option>`).join("");
  }

  async function saveSettings() {
    const urlInput = document.getElementById("adminIntroGifUrl")?.value.trim();
    const mediaToSave = window.tempMediaData || urlInput;

    if (!mediaToSave) {
      alert("Pehle Gallery se video select karein ya URL dalein!");
      return;
    }

    const btn = document.getElementById("saveMediaBtn");
    btn.textContent = "Uploading to Live Server...";

    try {
      await HTS_DB.set("splashMedia", mediaToSave);
      await fetch("/api/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoData: mediaToSave })
      });
      alert("✅ Video Live Server par save ho gayi! Ab har mobile par show hogi.");
    } catch (e) {
      alert("Error saving video.");
    }
    btn.textContent = "Save Splash Video";
  }

  function compressImage(file, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX = 800;
        let w = img.width, h = img.height;
        if (w > h && w > MAX) { h *= MAX / w; w = MAX; }
        else if (h > MAX) { w *= MAX / h; h = MAX; }
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        callback(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function bindEvents() {
    document.getElementById("adminLoginForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      token = "secure-token";
      localStorage.setItem("hts_admin_token", token);
      document.getElementById("adminLoginModal").classList.add("hidden");
      populateCategoryDropdown();
      loadAllData();
    });

    document.getElementById("adminLogoutBtn")?.addEventListener("click", () => {
      localStorage.removeItem("hts_admin_token");
      location.reload();
    });

    document.getElementById("saveMediaBtn")?.addEventListener("click", saveSettings);

    document.getElementById("splashMediaUpload")?.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        window.tempMediaData = evt.target.result;
        showSplashPreview(window.tempMediaData);
      };
      reader.readAsDataURL(file);
    });

    const modal = document.getElementById("productModal");
    document.getElementById("openAddProductModalBtn")?.addEventListener("click", () => {
      document.getElementById("productForm").reset();
      document.getElementById("editProductId").value = "";
      document.getElementById("imagePreviewContainer").innerHTML = "";
      modal.classList.remove("hidden");
    });
    document.getElementById("closeProductModalBtn")?.addEventListener("click", () => modal.classList.add("hidden"));

    document.getElementById("imageUploadInput")?.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      compressImage(file, (compressedDataUrl) => {
        document.getElementById("prodMainImage").value = compressedDataUrl;
        document.getElementById("imagePreviewContainer").innerHTML = `<img src="${compressedDataUrl}" class="w-16 h-16 rounded-xl object-cover border" />`;
      });
    });

    document.getElementById("productForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = document.getElementById("editProductId").value || `prod-${Date.now()}`;
      const newProduct = {
        id,
        name: document.getElementById("prodName").value,
        sku: document.getElementById("prodSku").value,
        category: document.getElementById("prodCategory").value,
        stockQty: Number(document.getElementById("prodStock").value),
        pricePkr: Number(document.getElementById("prodPrice").value),
        shortDescription: document.getElementById("prodShortDesc").value,
        mainImage: document.getElementById("prodMainImage").value || "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=600",
        isPublished: true
      };

      const idx = products.findIndex(p => p.id === id);
      if (idx >= 0) products[idx] = newProduct;
      else products.unshift(newProduct);

      await saveProductsEverywhere(products);
      modal.classList.add("hidden");
      renderTable();
      alert("✅ Toy Live Server par save ho gaya!");
    });
  }

  function renderTable() {
    const tbody = document.getElementById("adminProductTableBody");
    if (!tbody) return;
    if (products.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-slate-400">No products found.</td></tr>`;
      return;
    }
    tbody.innerHTML = products.map(p => `
      <tr class="hover:bg-slate-50 transition border-b border-slate-100">
        <td class="py-3 px-4"><div class="flex items-center gap-3"><img src="${p.mainImage}" class="w-10 h-10 rounded-xl object-cover border"/><span class="font-bold text-slate-900">${p.name}</span></div></td>
        <td class="py-3 px-4"><span class="font-mono text-xs text-blue-600 block">${p.sku}</span><span class="text-xs text-slate-500 capitalize">${p.category}</span></td>
        <td class="py-3 px-4 font-bold text-slate-800">${formatPkr(p.pricePkr)}</td>
        <td class="py-3 px-4 font-semibold ${p.stockQty > 0 ? "text-emerald-600" : "text-red-500"}">${p.stockQty}</td>
        <td class="py-3 px-4 text-right space-x-2">
          <button onclick="HappyToysAdmin.deleteProduct('${p.id}')" class="px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-bold">Delete</button>
        </td>
      </tr>`).join("");
  }

  window.HappyToysAdmin = {
    init,
    deleteProduct: async (id) => {
      if (!confirm("Delete this toy?")) return;
      await saveProductsEverywhere(products.filter(p => p.id !== id));
      renderTable();
    },
    saveSettings
  };

  return window.HappyToysAdmin;
})();
document.addEventListener("DOMContentLoaded", HappyToysAdmin.init);
