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
      if(appSettings.introGifUrl) {
        document.getElementById("adminIntroGifUrl").value = appSettings.introGifUrl;
      }
    } else {
      document.getElementById("adminLoginModal").classList.remove("hidden");
    }
    bindEvents();
  }

  function populateCategoryDropdown() {
    const select = document.getElementById("prodCategory");
    if (!select || !window.HAPPY_TOYS_SEED) return;
    select.innerHTML = window.HAPPY_TOYS_SEED.categories
      .filter(c => c.slug !== "all" && c.slug !== "new-arrivals" && c.slug !== "best-sellers" && c.slug !== "special-offers")
      .map(c => `<option value="${c.slug}">${c.icon} ${c.name}</option>`)
      .join("");
  }

  function saveSettings() {
    const url = document.getElementById("adminIntroGifUrl").value.trim();
    appSettings.introGifUrl = url;
    localStorage.setItem("hts_settings", JSON.stringify(appSettings));
    alert("VIP Splash Screen Video updated successfully!");
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
      } else { alert("Incorrect password"); }
    });
    document.getElementById("adminLogoutBtn").addEventListener("click", () => {
      localStorage.removeItem("hts_admin_token"); location.reload();
    });

    const modal = document.getElementById("productModal");
    const openModal = (product = null) => {
      document.getElementById("productForm").reset();
      document.getElementById("imagePreviewContainer").innerHTML = "";
      if (product) {
        document.getElementById("productModalTitle").textContent = "Edit Toy: " + product.name;
        document.getElementById("editProductId").value = product.id;
        document.getElementById("prodName").value = product.name;
        document.getElementById("prodSku").value = product.sku;
        document.getElementById("prodCategory").value = product.category;
        document.getElementById("prodStock").value = product.stockQty;
        document.getElementById("prodPrice").value = product.pricePkr;
        document.getElementById("prodMainImage").value = product.mainImage || "";
      } else {
        document.getElementById("productModalTitle").textContent = "Add New Toy Product";
        document.getElementById("editProductId").value = "";
      }
      modal.classList.remove("hidden");
    };
    const closeModal = () => modal.classList.add("hidden");

    document.getElementById("openAddProductModalBtn").addEventListener("click", () => openModal());
    document.getElementById("closeProductModalBtn").addEventListener("click", closeModal);
    document.getElementById("cancelProductModalBtn").addEventListener("click", closeModal);

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

      let currentList = getStoredProducts();
      const idx = currentList.findIndex(p => p.id === id);
      if (idx >= 0) currentList[idx] = newProduct; else currentList.unshift(newProduct);
      saveStoredProducts(currentList);
      closeModal();
      renderTable();
      alert("Toy saved successfully! Now visible on website.");
    });
  }

  function loadAdminData() { products = getStoredProducts(); renderTable(); }

  function renderTable() {
    const tbody = document.getElementById("adminProductTableBody");
    document.getElementById("adminProductCount").textContent = products.length + " items";
    if (products.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-slate-400">No products found.</td></tr>`;
      return;
    }
    tbody.innerHTML = products.map(p => `
      <tr class="hover:bg-slate-50 transition border-b border-slate-100">
        <td class="py-3 px-4"><div class="flex items-center gap-3"><img src="${p.mainImage}" class="w-10 h-10 rounded-xl object-cover border"/><span class="font-bold text-slate-900">${p.name}</span></div></td>
        <td class="py-3 px-4"><span class="font-mono text-xs text-blue-600 block">${p.sku}</span><span class="text-xs text-slate-500 capitalize">${p.category}</span></td>
        <td class="py-3 px-4 font-bold text-slate-800">${formatPkr(p.pricePkr)}</td>
        <td class="py-3 px-4 font-semibold ${p.stockQty > 0 ? "text-emerald-600" : "text-red-500"}">${p.stockQty} in stock</td>
        <td class="py-3 px-4 text-right space-x-2">
          <button onclick="HappyToysAdmin.editProduct('${p.id}')" class="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs">Edit</button>
          <button onclick="HappyToysAdmin.deleteProduct('${p.id}')" class="px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs">Delete</button>
        </td>
      </tr>`).join("");
  }

  function editProduct(id) {
    const p = products.find(item => item.id === id);
    if (p) {
      document.getElementById("openAddProductModalBtn").click();
      setTimeout(() => {
        document.getElementById("editProductId").value = p.id;
        document.getElementById("prodName").value = p.name;
        document.getElementById("prodSku").value = p.sku;
        document.getElementById("prodCategory").value = p.category;
        document.getElementById("prodStock").value = p.stockQty;
        document.getElementById("prodPrice").value = p.pricePkr;
        document.getElementById("prodMainImage").value = p.mainImage || "";
      }, 50);
    }
  }

  function deleteProduct(id) {
    if (!confirm("Are you sure?")) return;
    saveStoredProducts(products.filter(p => p.id !== id));
    renderTable();
  }

  function exportBackup() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(products, null, 2));
    const dl = document.createElement("a");
    dl.setAttribute("href", dataStr);
    dl.setAttribute("download", "happy-toys-backup-" + new Date().toISOString().slice(0,10) + ".json");
    document.body.appendChild(dl); dl.click(); dl.remove();
  }

  return { init, deleteProduct, editProduct, exportBackup, saveSettings };
})();
document.addEventListener("DOMContentLoaded", HappyToysAdmin.init);
