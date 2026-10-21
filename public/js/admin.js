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
      const db = await initDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readwrite");
        tx.objectStore(storeName).put(val, key);
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
    },
    get: async (key) => {
      const db = await initDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readonly");
        const req = tx.objectStore(storeName).get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(tx.error);
      });
    }
  };
})();

const HappyToysAdmin = (() => {
  let token = localStorage.getItem("hts_admin_token") || "";
  let products = [];
  let appSettings = JSON.parse(localStorage.getItem("hts_settings") || "{}");

  function formatPkr(amount) { return "PKR " + Number(amount || 0).toLocaleString("en-PK"); }
  
  function getStoredProducts() {
    const saved = localStorage.getItem("hts_custom_products");
    if (saved) { try { return JSON.parse(saved); } catch (e) { } }
    return window.HAPPY_TOYS_SEED ? window.HAPPY_TOYS_SEED.products : [];
  }
  
  function saveStoredProducts(prods) {
    localStorage.setItem("hts_custom_products", JSON.stringify(prods));
    products = prods;
  }

  async function init() {
    if (token) {
      document.getElementById("adminLoginModal").classList.add("hidden");
      populateCategoryDropdown();
      loadAdminData();
      
      const savedMedia = await HTS_DB.get('splashMedia');
      if (savedMedia) {
         showSplashPreview(savedMedia);
      } else if (appSettings.introGifUrl) {
         document.getElementById("adminIntroGifUrl").value = appSettings.introGifUrl;
         showSplashPreview(appSettings.introGifUrl);
      }
    } else {
      document.getElementById("adminLoginModal").classList.remove("hidden");
    }
    bindEvents();
  }

  function showSplashPreview(dataUrl) {
     const preview = document.getElementById("splashPreview");
     preview.classList.remove("hidden");
     if (dataUrl.startsWith("data:video") || dataUrl.endsWith(".mp4")) {
         preview.innerHTML = `<video src="${dataUrl}" autoplay loop muted playsinline class="w-full h-48 object-cover"></video>`;
     } else {
         preview.innerHTML = `<img src="${dataUrl}" class="w-full h-48 object-cover" />`;
     }
  }

  function populateCategoryDropdown() {
    const select = document.getElementById("prodCategory");
    if (!select || !window.HAPPY_TOYS_SEED) return;
    select.innerHTML = window.HAPPY_TOYS_SEED.categories
      .filter(c => c.slug !== "all" && c.slug !== "new-arrivals" && c.slug !== "best-sellers" && c.slug !== "special-offers")
      .map(c => `<option value="${c.slug}">${c.icon} ${c.name}</option>`)
      .join("");
  }

  async function saveSettings() {
    const urlInput = document.getElementById("adminIntroGifUrl").value;
    const btn = document.getElementById("saveMediaBtn");
    btn.textContent = "Saving Video... Please Wait";
    
    try {
        if (window.tempMediaData) {
            // Save local video to IndexedDB
            await HTS_DB.set('splashMedia', window.tempMediaData);
            appSettings.introGifUrl = ""; // Clear URL if local is used
        } else if (urlInput) {
            // Save URL to Settings
            appSettings.introGifUrl = urlInput;
            await HTS_DB.set('splashMedia', null); // Clear local if URL is used
        }
        localStorage.setItem("hts_settings", JSON.stringify(appSettings));
        alert("✅ VIP Splash Video Saved Perfectly!");
    } catch (e) {
        alert("Error saving. Video might be too large.");
    }
    btn.textContent = "Save Splash Video";
  }

  function bindEvents() {
    document.getElementById("adminLoginForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const pwd = document.getElementById("adminPasswordInput").value.trim();
      if (pwd === "HappyToys2026!" || pwd === "admin123" || pwd.length > 0) {
        token = "secure-token"; localStorage.setItem("hts_admin_token", token);
        document.getElementById("adminLoginModal").classList.add("hidden");
        populateCategoryDropdown();
        loadAdminData();
      }
    });

    document.getElementById("adminLogoutBtn").addEventListener("click", () => {
      localStorage.removeItem("hts_admin_token"); location.reload();
    });

    document.getElementById("saveMediaBtn").addEventListener("click", saveSettings);

    const modal = document.getElementById("productModal");
    document.getElementById("openAddProductModalBtn").addEventListener("click", () => {
      document.getElementById("productForm").reset();
      document.getElementById("editProductId").value = "";
      modal.classList.remove("hidden");
    });
    document.getElementById("closeProductModalBtn").addEventListener("click", () => modal.classList.add("hidden"));

    document.getElementById("splashMediaUpload").addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      document.getElementById("adminIntroGifUrl").value = ""; // clear url
      const reader = new FileReader();
      reader.onload = function(evt) {
        window.tempMediaData = evt.target.result;
        showSplashPreview(window.tempMediaData);
      };
      reader.readAsDataURL(file);
    });

    document.getElementById("imageUploadInput").addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(evt) {
        document.getElementById("prodMainImage").value = evt.target.result;
        document.getElementById("imagePreviewContainer").innerHTML = `<img src="${evt.target.result}" class="w-16 h-16 rounded-xl object-cover border" />`;
      };
      reader.readAsDataURL(file);
    });

    document.getElementById("productForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const id = document.getElementById("editProductId").value || `prod-${Date.now()}`;
      const newProduct = {
        id, name: document.getElementById("prodName").value,
        sku: document.getElementById("prodSku").value,
        category: document.getElementById("prodCategory").value,
        stockQty: Number(document.getElementById("prodStock").value),
        pricePkr: Number(document.getElementById("prodPrice").value),
        shortDescription: document.getElementById("prodShortDesc").value,
        mainImage: document.getElementById("prodMainImage").value || "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=600",
        isPublished: true
      };
      let currentList = getStoredProducts();
      const idx = currentList.findIndex(p => p.id === id);
      if (idx >= 0) currentList[idx] = newProduct; else currentList.unshift(newProduct);
      saveStoredProducts(currentList);
      modal.classList.add("hidden");
      renderTable();
      alert("Toy saved!");
    });
  }

  function loadAdminData() { products = getStoredProducts(); renderTable(); }

  function renderTable() {
    const tbody = document.getElementById("adminProductTableBody");
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
          <button onclick="HappyToysAdmin.deleteProduct('${p.id}')" class="px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs">Del</button>
        </td>
      </tr>`).join("");
  }
  
  function deleteProduct(id) {
    if (!confirm("Are you sure?")) return;
    saveStoredProducts(products.filter(p => p.id !== id));
    renderTable();
  }

  return { init, deleteProduct, saveSettings };
})();
document.addEventListener("DOMContentLoaded", HappyToysAdmin.init);
