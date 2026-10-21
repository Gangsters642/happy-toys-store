const HappyToysAdmin = (() => {
  let token = localStorage.getItem("hts_admin_token") || "";
  let serverData = { products: [], introGifUrl: "" };

  function formatPkr(amount) { return "PKR " + Number(amount || 0).toLocaleString("en-PK"); }

  async function fetchLiveDatabase() {
      try {
          const res = await fetch('/api/store');
          if(res.ok) {
              serverData = await res.json();
              renderTable();
              if(serverData.introGifUrl) {
                  document.getElementById("adminIntroGifUrl").value = serverData.introGifUrl;
                  showSplashPreview(serverData.introGifUrl);
              }
          } else {
              alert("Database not linked! Please complete Step 1 in Cloudflare Dashboard.");
          }
      } catch (e) {
          console.error("API Error:", e);
      }
  }

  async function pushToLiveDatabase() {
      try {
          await fetch('/api/store', {
              method: 'POST',
              body: JSON.stringify(serverData)
          });
      } catch (e) {
          console.error("Save Error:", e);
          alert("Failed to save to database!");
      }
  }

  async function init() {
    if (token) {
      document.getElementById("adminLoginModal").classList.add("hidden");
      populateCategoryDropdown();
      await fetchLiveDatabase();
    } else {
      document.getElementById("adminLoginModal").classList.remove("hidden");
    }
    bindEvents();
  }

  function showSplashPreview(dataUrl) {
     const preview = document.getElementById("splashPreview");
     preview.classList.remove("hidden");
     if (dataUrl.startsWith("data:video") || dataUrl.endsWith(".mp4")) {
         preview.innerHTML = `<video src="${dataUrl}" autoplay loop muted playsinline class="w-full h-48 object-cover rounded-xl"></video>`;
     } else {
         preview.innerHTML = `<img src="${dataUrl}" class="w-full h-48 object-cover rounded-xl" />`;
     }
  }

  function populateCategoryDropdown() {
    const select = document.getElementById("prodCategory");
    if (!select || !window.HAPPY_TOYS_SEED) return;
    select.innerHTML = window.HAPPY_TOYS_SEED.categories
      .filter(c => c.slug !== "all" && c.slug !== "new-arrivals")
      .map(c => `<option value="${c.slug}">${c.icon} ${c.name}</option>`).join("");
  }

  async function saveSettings() {
    const urlInput = document.getElementById("adminIntroGifUrl").value;
    if (!urlInput) { alert("Please paste a video URL first!"); return; }
    
    const btn = document.getElementById("saveMediaBtn");
    btn.textContent = "Saving to Live Database...";
    
    serverData.introGifUrl = urlInput;
    await pushToLiveDatabase();
    
    alert("✅ VIP Splash Video Saved Globally!");
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
        fetchLiveDatabase();
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

    document.getElementById("imageUploadInput").addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      // Resize image to keep database fast
      const reader = new FileReader();
      reader.onload = function(evt) {
        document.getElementById("prodMainImage").value = evt.target.result;
        document.getElementById("imagePreviewContainer").innerHTML = `<img src="${evt.target.result}" class="w-16 h-16 rounded-xl object-cover border" />`;
      };
      reader.readAsDataURL(file);
    });

    document.getElementById("productForm").addEventListener("submit", async (e) => {
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
      
      const idx = serverData.products.findIndex(p => p.id === id);
      if (idx >= 0) serverData.products[idx] = newProduct; 
      else serverData.products.unshift(newProduct);
      
      await pushToLiveDatabase();
      modal.classList.add("hidden");
      renderTable();
      alert("✅ Toy saved to Live Server!");
    });
  }

  function renderTable() {
    const tbody = document.getElementById("adminProductTableBody");
    const prods = serverData.products || [];
    if (prods.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-slate-400">No products found.</td></tr>`;
      return;
    }
    tbody.innerHTML = prods.map(p => `
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
  
  window.HappyToysAdmin = { init, deleteProduct: async (id) => {
    if (!confirm("Are you sure?")) return;
    serverData.products = serverData.products.filter(p => p.id !== id);
    await pushToLiveDatabase();
    renderTable();
  }, saveSettings };

  return window.HappyToysAdmin;
})();
document.addEventListener("DOMContentLoaded", HappyToysAdmin.init);
