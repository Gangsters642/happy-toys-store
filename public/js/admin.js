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
    const savedLocal = localStorage.getItem("hts_custom_products");
    if (savedLocal) {
      try { products = JSON.parse(savedLocal); } catch (e) {}
    }

    try {
      const res = await fetch("/api/store");
      if (res.ok) {
        const data = await res.json();
        if (data.products && data.products.length > 0) {
          products = data.products;
          localStorage.setItem("hts_custom_products", JSON.stringify(products));
        } else if (products.length > 0) {
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

    const localVid = await HTS_DB.get("splashMedia");
    try {
      const vRes = await fetch("/api/video");
      if (vRes.ok) {
        const vData = await vRes.json();
        if (vData.videoData) {
          showSplashPreview(vData.videoData);
        } else if (localVid) {
          showSplashPreview(localVid);
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
      alert("Please choose a video from gallery or paste URL first!");
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
      alert("✅ Video saved to Live Server!");
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
    const varCheckbox = document.getElementById("prodHasVariants");
    const varBox = document.getElementById("variantPricesContainer");
    varCheckbox.checked = hasVar;
    varBox.classList.toggle("hidden", !hasVar);

    const findSizePrice = (label) => {
      if (!p.variants) return "";
      const found = p.variants.find(v => v.size.toLowerCase() === label.toLowerCase());
      return found ? found.pricePkr : "";
    };

    document.getElementById("varPriceSmall").value = findSizePrice("Small");
    document.getElementById("varPriceMedium").value = findSizePrice("Medium");
    document.getElementById("varPriceBig").value = findSizePrice("Big");

    document.getElementById("productModal").classList.remove("hidden");
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

    const varCheckbox = document.getElementById("prodHasVariants");
    const varContainer = document.getElementById("variantPricesContainer");
    varCheckbox?.addEventListener("change", () => {
      varContainer.classList.toggle("hidden", !varCheckbox.checked);
    });

    const modal = document.getElementById("productModal");
    document.getElementById("openAddProductModalBtn")?.addEventListener("click", () => {
      document.getElementById("productModalTitle").textContent = "Add New Toy Product";
      document.getElementById("productForm").reset();
      document.getElementById("editProductId").value = "";
      document.getElementById("prodMainImage").value = "";
      document.getElementById("imagePreviewContainer").innerHTML = "";
      varCheckbox.checked = false;
      varContainer.classList.add("hidden");
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
      const basePrice = Number(document.getElementById("prodPrice").value);
      const hasVariants = document.getElementById("prodHasVariants").checked;

      let variants = [];
      if (hasVariants) {
        const sPrice = Number(document.getElementById("varPriceSmall").value);
        const mPrice = Number(document.getElementById("varPriceMedium").value);
        const bPrice = Number(document.getElementById("varPriceBig").value);

        if (sPrice > 0) variants.push({ size: "Small", pricePkr: sPrice });
        if (mPrice > 0) variants.push({ size: "Medium", pricePkr: mPrice });
        if (bPrice > 0) variants.push({ size: "Big", pricePkr: bPrice });

        // Fallback if checkbox was ticked but fields were left empty
        if (variants.length === 0) {
          variants = [
            { size: "Small", pricePkr: basePrice },
            { size: "Medium", pricePkr: Math.round(basePrice * 1.25) },
            { size: "Big", pricePkr: Math.round(basePrice * 1.5) }
          ];
        }
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
      modal.classList.add("hidden");
      renderTable();
      alert("✅ Toy & Size Variants saved to Live Server!");
    });
  }

  function renderTable() {
    const tbody = document.getElementById("adminProductTableBody");
    if (!tbody) return;
    if (products.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-slate-400">No products found.</td></tr>`;
      return;
    }
    tbody.innerHTML = products.map(p => {
      const sizeBadges = (p.hasVariants && p.variants && p.variants.length > 0)
        ? p.variants.map(v => `<span class="inline-block bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-md mr-1 mt-1">${v.size}: ${formatPkr(v.pricePkr)}</span>`).join("")
        : `<span class="text-[11px] text-slate-400 block">Standard Size</span>`;

      return `
      <tr class="hover:bg-slate-50 transition border-b border-slate-100">
        <td class="py-3 px-4"><div class="flex items-center gap-3"><img src="${p.mainImage}" class="w-11 h-11 rounded-xl object-cover border"/><span class="font-black text-slate-900">${p.name}</span></div></td>
        <td class="py-3 px-4"><span class="font-mono text-xs text-blue-600 block">${p.sku} • ${p.category}</span>${sizeBadges}</td>
        <td class="py-3 px-4 font-black text-slate-800">${formatPkr(p.pricePkr)}</td>
        <td class="py-3 px-4 font-semibold ${p.stockQty > 0 ? "text-emerald-600" : "text-red-500"}">${p.stockQty}</td>
        <td class="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
          <button onclick="HappyToysAdmin.editProduct('${p.id}')" class="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-black">Edit / Sizes</button>
          <button onclick="HappyToysAdmin.deleteProduct('${p.id}')" class="px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-black">Delete</button>
        </td>
      </tr>`;
    }).join("");
  }

  window.HappyToysAdmin = {
    init,
    editProduct,
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
