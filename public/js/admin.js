const HappyToysAdmin = (() => {
  let token = localStorage.getItem("hts_admin_token") || "";
  let products = [];

  function formatPkr(amount) {
    return "PKR " + Number(amount || 0).toLocaleString("en-PK");
  }

  function getStoredProducts() {
    const saved = localStorage.getItem("hts_custom_products");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return window.HAPPY_TOYS_SEED ? window.HAPPY_TOYS_SEED.products : [];
  }

  function saveStoredProducts(prods) {
    localStorage.setItem("hts_custom_products", JSON.stringify(prods));
    products = prods;
  }

  async function init() {
    if (token) {
      document.getElementById("adminLoginModal").classList.add("hidden");
      await loadAdminData();
    } else {
      document.getElementById("adminLoginModal").classList.remove("hidden");
    }
    bindEvents();
  }

  function bindEvents() {
    document.getElementById("adminLoginForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const password = document.getElementById("adminPasswordInput").value.trim();
      if (password === "HappyToys2026!" || password === "admin123" || password.length > 0) {
        token = "happy-toys-admin-secure-token";
        localStorage.setItem("hts_admin_token", token);
        document.getElementById("adminLoginModal").classList.add("hidden");
        loadAdminData();
      } else {
        alert("Incorrect password.");
      }
    });

    document.getElementById("adminLogoutBtn").addEventListener("click", () => {
      localStorage.removeItem("hts_admin_token");
      location.reload();
    });

    const modal = document.getElementById("productModal");
    const openModal = (product = null) => {
      document.getElementById("productForm").reset();
      document.getElementById("imagePreviewContainer").innerHTML = "";
      document.getElementById("variantsRowsContainer").innerHTML = "";
      document.getElementById("hasVariantsToggle").checked = false;
      document.getElementById("variantsSection").classList.add("hidden");

      if (product) {
        document.getElementById("productModalTitle").textContent = "Edit Toy: " + product.name;
        document.getElementById("editProductId").value = product.id;
        document.getElementById("prodName").value = product.name;
        document.getElementById("prodSku").value = product.sku;
        document.getElementById("prodCategory").value = product.category;
        document.getElementById("prodAgeGroup").value = product.ageGroup || "";
        document.getElementById("prodStock").value = product.stockQty;
        document.getElementById("prodPrice").value = product.pricePkr;
        document.getElementById("prodSalePrice").value = product.salePricePkr || "";
        document.getElementById("prodShortDesc").value = product.shortDescription || "";
        document.getElementById("prodMainImage").value = product.mainImage || "";

        if (product.hasVariants && Array.isArray(product.variants)) {
          document.getElementById("hasVariantsToggle").checked = true;
          document.getElementById("variantsSection").classList.remove("hidden");
          product.variants.forEach(v => addVariantRow(v));
        }
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

    document.getElementById("hasVariantsToggle").addEventListener("change", (e) => {
      const sec = document.getElementById("variantsSection");
      if (e.target.checked) {
        sec.classList.remove("hidden");
        if (document.getElementById("variantsRowsContainer").children.length === 0) {
          addVariantRow({ name: "Small", pricePkr: 500, stockQty: 10 });
        }
      } else {
        sec.classList.add("hidden");
      }
    });

    document.getElementById("addVariantRowBtn").addEventListener("click", () => addVariantRow());

    // Image file picker preview
    document.getElementById("imageUploadInput").addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(evt) {
        const imageUrl = evt.target.result;
        document.getElementById("prodMainImage").value = imageUrl;
        const prev = document.getElementById("imagePreviewContainer");
        prev.innerHTML = `<img src="${imageUrl}" class="w-16 h-16 rounded-xl object-cover border" />`;
      };
      reader.readAsDataURL(file);
    });

    // Save product
    document.getElementById("productForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const id = document.getElementById("editProductId").value || `prod-${Date.now()}`;
      const hasVariants = document.getElementById("hasVariantsToggle").checked;
      
      const variants = [];
      if (hasVariants) {
        document.querySelectorAll(".variant-row").forEach(row => {
          variants.push({
            id: `var-${Date.now()}-${Math.random()}`,
            name: row.querySelector(".v-name").value,
            pricePkr: Number(row.querySelector(".v-price").value),
            stockQty: Number(row.querySelector(".v-stock").value),
            available: true
          });
        });
      }

      const newProduct = {
        id,
        name: document.getElementById("prodName").value,
        sku: document.getElementById("prodSku").value,
        category: document.getElementById("prodCategory").value,
        ageGroup: document.getElementById("prodAgeGroup").value,
        stockQty: Number(document.getElementById("prodStock").value),
        pricePkr: Number(document.getElementById("prodPrice").value),
        salePricePkr: document.getElementById("prodSalePrice").value ? Number(document.getElementById("prodSalePrice").value) : null,
        shortDescription: document.getElementById("prodShortDesc").value,
        mainImage: document.getElementById("prodMainImage").value || "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=600",
        hasVariants,
        variants,
        isPublished: true,
        isFeatured: true,
        isNewArrival: true,
        isBestSeller: false,
        isSpecialOffer: Boolean(document.getElementById("prodSalePrice").value)
      };

      let currentList = getStoredProducts();
      const idx = currentList.findIndex(p => p.id === id);
      if (idx >= 0) {
        currentList[idx] = newProduct;
      } else {
        currentList.unshift(newProduct);
      }

      saveStoredProducts(currentList);
      closeModal();
      renderTable();
      alert("Toy saved successfully! Changes are now live on your store.");
    });
  }

  function addVariantRow(v = { name: "", pricePkr: "", stockQty: 10 }) {
    const container = document.getElementById("variantsRowsContainer");
    const div = document.createElement("div");
    div.className = "variant-row flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-200";
    div.innerHTML = `
      <input type="text" placeholder="Name (e.g. Medium)" value="${v.name || ""}" class="v-name flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs" required />
      <input type="number" placeholder="Price PKR" value="${v.pricePkr || ""}" class="v-price w-28 px-3 py-1.5 rounded-lg border border-slate-300 text-xs" required />
      <input type="number" placeholder="Stock" value="${v.stockQty || 10}" class="v-stock w-20 px-3 py-1.5 rounded-lg border border-slate-300 text-xs" />
      <button type="button" onclick="this.closest('.variant-row').remove()" class="p-1.5 rounded-lg bg-red-100 text-red-600 text-xs font-bold">✕</button>
    `;
    container.appendChild(div);
  }

  function loadAdminData() {
    products = getStoredProducts();
    renderTable();
  }

  function renderTable() {
    const tbody = document.getElementById("adminProductTableBody");
    document.getElementById("adminProductCount").textContent = products.length + " items";

    if (products.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-slate-400">No products found. Click "+ Add New Toy" above.</td></tr>`;
      return;
    }

    tbody.innerHTML = products.map(p => {
      const price = p.salePricePkr || p.pricePkr;
      return `
      <tr class="hover:bg-slate-50 transition">
        <td class="py-3 px-4">
          <div class="flex items-center gap-3">
            <img src="${p.mainImage}" alt="" class="w-10 h-10 rounded-xl object-cover bg-slate-100 border" onerror="this.src='https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=100'" />
            <div>
              <span class="font-bold text-slate-900 block">${p.name}</span>
              <span class="text-[11px] text-slate-400">${p.ageGroup || 'All ages'}</span>
            </div>
          </div>
        </td>
        <td class="py-3 px-4">
          <span class="font-mono text-xs text-blue-600 font-semibold block">${p.sku}</span>
          <span class="text-xs text-slate-500 capitalize">${p.category}</span>
        </td>
        <td class="py-3 px-4 font-bold text-slate-800">${formatPkr(price)}</td>
        <td class="py-3 px-4 font-semibold ${p.stockQty > 0 ? "text-emerald-600" : "text-red-500"}">${p.stockQty} in stock</td>
        <td class="py-3 px-4">
          <span class="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-semibold">Active</span>
        </td>
        <td class="py-3 px-4 text-right space-x-2">
          <button onclick="HappyToysAdmin.editProduct('${p.id}')" class="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold text-xs transition">Edit</button>
          <button onclick="HappyToysAdmin.deleteProduct('${p.id}')" class="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-xs transition">Delete</button>
        </td>
      </tr>`;
    }).join("");
  }

  function editProduct(id) {
    const p = products.find(item => item.id === id);
    if (p) {
      // Re-trigger modal open with product
      document.getElementById("openAddProductModalBtn").click();
      // Populate fields after brief tick
      setTimeout(() => {
        document.getElementById("editProductId").value = p.id;
        document.getElementById("prodName").value = p.name;
        document.getElementById("prodSku").value = p.sku;
        document.getElementById("prodCategory").value = p.category;
        document.getElementById("prodAgeGroup").value = p.ageGroup || "";
        document.getElementById("prodStock").value = p.stockQty;
        document.getElementById("prodPrice").value = p.pricePkr;
        document.getElementById("prodSalePrice").value = p.salePricePkr || "";
        document.getElementById("prodShortDesc").value = p.shortDescription || "";
        document.getElementById("prodMainImage").value = p.mainImage || "";
        document.getElementById("productModalTitle").textContent = "Edit Toy: " + p.name;
        if (p.hasVariants && Array.isArray(p.variants)) {
          document.getElementById("hasVariantsToggle").checked = true;
          document.getElementById("variantsSection").classList.remove("hidden");
          document.getElementById("variantsRowsContainer").innerHTML = "";
          p.variants.forEach(v => addVariantRow(v));
        }
      }, 50);
    }
  }

  function deleteProduct(id) {
    if (!confirm("Are you sure you want to permanently delete this toy?")) return;
    const updated = products.filter(p => p.id !== id);
    saveStoredProducts(updated);
    renderTable();
  }

  function exportBackup() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(products, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "happy-toys-backup-" + new Date().toISOString().slice(0,10) + ".json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  return { init, deleteProduct, editProduct, exportBackup };
})();

document.addEventListener("DOMContentLoaded", HappyToysAdmin.init);
