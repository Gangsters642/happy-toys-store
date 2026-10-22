(() => {
  if (window.__HTS_SECURITY_LOADED__) return;
  window.__HTS_SECURITY_LOADED__ = true;

  const MAX_DEVICES = 3;
  const DEVICE_ID_KEY = "hts_sec_device_uid_v2";
  const LOCAL_CONFIG_KEY = "hts_sec_config_v2";
  const HIDDEN_PRODUCT_ID = "__HTS_SECURITY_CONFIG__";

  // 1. Generate or read persistent unique Device ID for this browser/phone
  function getMyDeviceId() {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = "DEV-" + Math.random().toString(36).substring(2, 8).toUpperCase() + "-" + Date.now().toString(36).slice(-4).toUpperCase();
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  }

  // 2. Detect readable Device Name & Model from User-Agent
  function detectDeviceName() {
    const ua = navigator.userAgent || "";
    let os = "Device";
    const androidMatch = ua.match(/Android\s+([0-9.]+)?;\s*([^;)]+)/i);
    if (androidMatch && androidMatch[2]) {
      os = androidMatch[2].replace(/Build\/.*/i, "").trim();
    } else if (/iPhone/i.test(ua)) {
      os = "iPhone";
    } else if (/iPad/i.test(ua)) {
      os = "iPad";
    } else if (/Android/i.test(ua)) {
      os = "Android Phone";
    } else if (/Windows/i.test(ua)) {
      os = "Windows PC";
    } else if (/Mac/i.test(ua)) {
      os = "Mac";
    } else if (/Linux/i.test(ua)) {
      os = "Linux Device";
    }

    let browser = "Browser";
    if (/Edg/i.test(ua)) browser = "Edge";
    else if (/Chrome/i.test(ua)) browser = "Chrome";
    else if (/Safari/i.test(ua)) browser = "Safari";
    else if (/Firefox/i.test(ua)) browser = "Firefox";

    return `${os} (${browser})`;
  }

  const myDeviceId = getMyDeviceId();
  let cachedConfig = loadLocalConfig();

  function loadLocalConfig() {
    try {
      const raw = localStorage.getItem(LOCAL_CONFIG_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.devices)) return parsed;
      }
    } catch (e) {}
    return { isLocked: false, hidePublicNow: true, devices: [] };
  }

  function saveLocalConfig(cfg) {
    cachedConfig = cfg;
    try {
      localStorage.setItem(LOCAL_CONFIG_KEY, JSON.stringify(cfg));
    } catch (e) {}
  }

  // Clean hidden security record out of localStorage custom products so it never shows as a toy
  function cleanLocalProducts() {
    try {
      const raw = localStorage.getItem("hts_custom_products");
      if (!raw) return;
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        const secItem = arr.find(p => p && p.id === HIDDEN_PRODUCT_ID);
        if (secItem && secItem.securityConfig) {
          saveLocalConfig(secItem.securityConfig);
        }
        const filtered = arr.filter(p => p && p.id !== HIDDEN_PRODUCT_ID);
        if (filtered.length !== arr.length) {
          localStorage.setItem("hts_custom_products", JSON.stringify(filtered));
        }
      }
    } catch (e) {}
  }
  cleanLocalProducts();

  // 3. Intercept fetch("/api/store") so security config syncs across ALL devices automatically
  const originalFetch = window.fetch.bind(window);
  window.fetch = async function (input, init) {
    const url = typeof input === "string" ? input : (input && input.url) || "";

    // When Admin saves products/video to /api/store, keep the hidden security item inside products
    if (url.includes("/api/store") && init && init.method && init.method.toUpperCase() !== "GET" && init.body) {
      try {
        const bodyObj = JSON.parse(init.body);
        if (bodyObj && Array.isArray(bodyObj.products)) {
          bodyObj.products = bodyObj.products.filter(p => p && p.id !== HIDDEN_PRODUCT_ID);
          bodyObj.products.push({
            id: HIDDEN_PRODUCT_ID,
            name: "Security Config",
            category: "all",
            pricePkr: 0,
            stock: 0,
            mainImage: "",
            isPublished: false,
            securityConfig: cachedConfig
          });
          bodyObj.securityConfig = cachedConfig;
          init.body = JSON.stringify(bodyObj);
        }
      } catch (e) {}
    }

    const response = await originalFetch(input, init);

    // When Storefront or Admin fetches /api/store, extract securityConfig & hide the dummy record
    if (url.includes("/api/store") && (!init || !init.method || init.method.toUpperCase() === "GET")) {
      try {
        const clone = response.clone();
        const data = await clone.json();
        let updated = false;

        if (data && data.securityConfig && Array.isArray(data.securityConfig.devices)) {
          saveLocalConfig(data.securityConfig);
          updated = true;
        }
        if (data && Array.isArray(data.products)) {
          const secRecord = data.products.find(p => p && p.id === HIDDEN_PRODUCT_ID);
          if (secRecord && secRecord.securityConfig && Array.isArray(secRecord.securityConfig.devices)) {
            saveLocalConfig(secRecord.securityConfig);
            updated = true;
          }
          data.products = data.products.filter(p => p && p.id !== HIDDEN_PRODUCT_ID);
        }

        if (updated) {
          applyStorefrontProtection();
          renderAdminSecurityCard(true);
        }

        return new Response(JSON.stringify(data), {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        });
      } catch (e) {
        return response;
      }
    }

    return response;
  };

  // Fetch latest security config from /api/store on startup
  async function syncFromServer() {
    try {
      await window.fetch("/api/store?t=" + Date.now());
    } catch (e) {}
  }

  // Save updated security config to both localStorage AND /api/store server
  async function pushConfigToServer(newConfig) {
    saveLocalConfig(newConfig);
    try {
      const res = await originalFetch("/api/store?t=" + Date.now());
      let storeData = { categories: [], products: [] };
      if (res.ok) {
        storeData = await res.json();
      }
      if (!Array.isArray(storeData.products)) {
        try {
          storeData.products = JSON.parse(localStorage.getItem("hts_custom_products") || "[]");
        } catch (e) {
          storeData.products = [];
        }
      }
      storeData.products = storeData.products.filter(p => p && p.id !== HIDDEN_PRODUCT_ID);
      storeData.products.push({
        id: HIDDEN_PRODUCT_ID,
        name: "Security Config",
        category: "all",
        pricePkr: 0,
        stock: 0,
        mainImage: "",
        isPublished: false,
        securityConfig: newConfig
      });
      storeData.securityConfig = newConfig;

      const headers = { "Content-Type": "application/json" };
      // Include any admin token/password if stored by admin panel
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (/token|pass|auth|admin/i.test(k)) {
          const val = localStorage.getItem(k);
          if (val && val.length < 200) {
            headers["Authorization"] = `Bearer ${val}`;
            headers["x-admin-token"] = val;
            headers["x-admin-password"] = val;
          }
        }
      }

      await originalFetch("/api/store", {
        method: "POST",
        headers,
        body: JSON.stringify(storeData)
      });
    } catch (e) {}
  }

  function isCurrentPageAdmin() {
    const path = window.location.pathname.toLowerCase();
    if (path.includes("admin")) return true;
    const txt = document.body ? document.body.textContent : "";
    return txt.includes("VIP Splash Intro Video") || txt.includes("Happy Toys Admin") || txt.includes("Save Splash Video");
  }

  // 4. Hide Admin Button on Storefront for unauthorized devices
  function applyStorefrontProtection() {
    const cfg = cachedConfig;
    const isMyDeviceAuthorized = cfg.devices.some(d => d.id === myDeviceId);
    const isFull = cfg.devices.length >= MAX_DEVICES;
    const shouldHideAdminButton = cfg.isLocked && cfg.devices.length > 0 && !isMyDeviceAuthorized && (cfg.hidePublicNow !== false || isFull);

    // Toggle Admin button visibility in Store Header
    const candidates = document.querySelectorAll("a, button, span");
    candidates.forEach(el => {
      const text = (el.textContent || "").trim();
      const href = (el.getAttribute && el.getAttribute("href")) || "";
      if (text === "Admin" || href.includes("/admin")) {
        if (shouldHideAdminButton) {
          el.style.setProperty("display", "none", "important");
          el.style.setProperty("visibility", "hidden", "important");
          el.style.setProperty("pointer-events", "none", "important");
          el.setAttribute("data-hts-hidden-admin", "1");
        } else if (el.getAttribute("data-hts-hidden-admin") === "1") {
          el.style.removeProperty("display");
          el.style.removeProperty("visibility");
          el.style.removeProperty("pointer-events");
        }
      }
    });

    // If someone unauthorized opens the Admin Page after all 3 devices are full, block them completely!
    if (isCurrentPageAdmin() && cfg.isLocked && isFull && !isMyDeviceAuthorized) {
      document.body.innerHTML = `
        <div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#f8fafc;padding:24px;text-align:center;font-family:sans-serif;">
          <div style="font-size:64px;margin-bottom:12px;">🔒</div>
          <h1 style="font-size:24px;font-weight:900;color:#0f172a;margin:0 0 8px 0;">Admin Access Locked (3/3 Full)</h1>
          <p style="font-size:14px;font-weight:700;color:#dc2626;max-width:400px;margin:0 0 18px 0;">
            अभी किसी और को इसका एक्सेस नहीं दिया जा सकता। यह एडमिन पैनल सिर्फ रजिस्टर्ड 3 डिवाइसेस के पास ही है।
          </p>
          <a href="/" style="padding:12px 24px;border-radius:999px;background:#f59e0b;color:#fff;font-weight:900;text-decoration:none;box-shadow:0 4px 12px rgba(245,158,11,0.3);">
            ← Back to Store
          </a>
        </div>
      `;
    }
  }

  // Secret 5-tap on "Happy Toys" logo so owner can open Admin on their 2nd or 3rd device while slots < 3
  function setupOwnerSecretTap() {
    let taps = 0;
    let tapTimer = null;
    document.addEventListener("click", (e) => {
      const target = e.target.closest("header, nav, a, div, span");
      if (!target) return;
      const txt = (target.textContent || "").trim();
      if (txt.includes("Happy Toys") && !isCurrentPageAdmin()) {
        const cfg = cachedConfig;
        const isMyDeviceAuthorized = cfg.devices.some(d => d.id === myDeviceId);
        // Only works if this device is authorized OR fewer than 3 devices are registered
        if (isMyDeviceAuthorized || cfg.devices.length < MAX_DEVICES) {
          taps++;
          clearTimeout(tapTimer);
          tapTimer = setTimeout(() => { taps = 0; }, 1800);
          if (taps >= 5) {
            taps = 0;
            window.location.href = "/admin.html";
          }
        }
      }
    });
  }

  // 5. Render the Security Card inside the Admin Dashboard
  function renderAdminSecurityCard(forceUpdate = false) {
    if (!isCurrentPageAdmin()) return;

    const existing = document.getElementById("hts-admin-security-card");
    if (existing && !forceUpdate) return;

    // Find the first card on the Admin Page ("VIP Splash Intro Video" or "Store Products")
    const headings = Array.from(document.querySelectorAll("h1, h2, h3, h4, div, span"));
    const splashHeading = headings.find(el => {
      const t = (el.textContent || "").trim();
      return t === "🎬 VIP Splash Intro Video" || t.includes("VIP Splash Intro Video") || t.includes("Store Products");
    });

    if (!splashHeading) return;

    // Find the outer card container of "VIP Splash Intro Video"
    let refCard = splashHeading.closest("section, .bg-white, [class*='rounded-']");
    if (!refCard) refCard = splashHeading.parentElement;
    if (!refCard || !refCard.parentElement) return;

    const cfg = cachedConfig;
    const usedCount = cfg.devices.length;
    const remainingCount = Math.max(0, MAX_DEVICES - usedCount);
    const myDeviceObj = cfg.devices.find(d => d.id === myDeviceId);
    const isMyDeviceSaved = Boolean(myDeviceObj);
    const defaultName = myDeviceObj ? myDeviceObj.name : detectDeviceName();

    const card = existing || document.createElement("div");
    card.id = "hts-admin-security-card";
    card.style.cssText = "background:#ffffff;border:3px solid #f59e0b;border-radius:24px;padding:20px;margin-bottom:22px;box-shadow:0 12px 28px rgba(245,158,11,0.14);font-family:inherit;";

    const devicesRowsHtml = cfg.devices.length > 0
      ? cfg.devices.map((d, idx) => `
          <div style="display:flex;align-items:center;justify-content:space-between;background:#f8fafc;border:1.5px solid ${d.id === myDeviceId ? '#10b981' : '#e2e8f0'};border-radius:14px;padding:10px 12px;margin-bottom:8px;">
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="width:32px;height:32px;border-radius:50%;background:${d.id === myDeviceId ? '#d1fae5' : '#fef3c7'};display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:900;color:#0f172a;">
                #${idx + 1}
              </span>
              <div>
                <div style="font-size:13px;font-weight:900;color:#0f172a;">
                  ${d.name}
                  ${d.id === myDeviceId ? '<span style="background:#10b981;color:#fff;font-size:10px;padding:2px 7px;border-radius:999px;margin-left:6px;">This Device ✓</span>' : ''}
                </div>
                <div style="font-size:11px;font-weight:700;color:#64748b;">ID: ${d.id} • Saved: ${d.date}</div>
              </div>
            </div>
            <button type="button" data-remove-device="${d.id}" style="background:#fee2e2;color:#dc2626;border:1px solid #fecaca;border-radius:10px;padding:6px 10px;font-size:11px;font-weight:800;cursor:pointer;">
              Remove
            </button>
          </div>
        `).join("")
      : `<div style="text-align:center;padding:12px;color:#64748b;font-size:12px;font-weight:700;background:#f8fafc;border-radius:12px;border:1px dashed #cbd5e1;">
           अभी कोई डिवाइस सेव नहीं है (Admin बटन अभी सबको दिख रहा है)।
         </div>`;

    card.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:10px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:24px;">🔐</span>
          <h2 style="font-size:18px;font-weight:900;color:#0f172a;margin:0;">Admin Security & Device Lock</h2>
        </div>
        <span style="background:${remainingCount === 0 ? '#fee2e2' : '#fef3c7'};color:${remainingCount === 0 ? '#dc2626' : '#b45309'};font-size:12px;font-weight:900;padding:5px 12px;border-radius:999px;border:1.5px solid ${remainingCount === 0 ? '#fca5a5' : '#fde68a'};">
          Remaining Device Access: ${remainingCount} / ${MAX_DEVICES}
        </span>
      </div>

      <p style="font-size:12px;font-weight:700;color:#475569;margin:0 0 14px 0;line-height:1.4;">
        यहाँ से अपने एडमिन पैनल को सिर्फ अपनी <b>3 डिवाइसेस</b> तक लॉक करें। इसके बाद किसी और को वेबसाइट पर <b>Admin</b> का बटन तक शो नहीं होगा।
      </p>

      <!-- Show on Just This Device Toggle & Save Box -->
      <div style="background:#fffbeb;border:2px solid #fde68a;border-radius:16px;padding:14px;margin-bottom:14px;">
        <label style="display:flex;align-items:center;gap:10px;cursor:pointer;margin-bottom:10px;">
          <input type="checkbox" id="htsShowOnThisDeviceChk" ${isMyDeviceSaved ? "checked" : ""} ${!isMyDeviceSaved && remainingCount === 0 ? "disabled" : ""} style="width:20px;height:20px;accent-color:#f59e0b;cursor:pointer;" />
          <span style="font-size:14px;font-weight:900;color:#0f172a;">
            Show on just this device <span style="font-size:11px;color:#b45309;">(केवल मेरी इसी डिवाइस पर एडमिन शो हो)</span>
          </span>
        </label>

        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">
          <input type="text" id="htsDeviceNameInput" value="${defaultName}" placeholder="Enter Device Name (e.g. My Phone 1)" style="flex:1;min-width:170px;padding:10px 12px;border-radius:12px;border:1.5px solid #cbd5e1;font-size:13px;font-weight:700;color:#0f172a;background:#fff;" />
          <button type="button" id="htsSaveDeviceBtn" style="padding:10px 18px;border-radius:12px;background:linear-gradient(90deg,#f59e0b,#ea580c);color:#fff;font-size:13px;font-weight:900;border:none;cursor:pointer;box-shadow:0 4px 12px rgba(234,88,12,0.3);">
            💾 Save on This Device
          </button>
        </div>

        <div style="margin-top:10px;padding-top:10px;border-top:1px dashed #fcd34d;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
          <span style="font-size:12px;font-weight:800;color:#78350f;">
            📊 Remaining Device Access: <b style="font-size:14px;color:${remainingCount === 0 ? '#dc2626' : '#059669'};">${remainingCount}</b> (Max 3 Devices)
          </span>
          ${usedCount > 0 && usedCount < MAX_DEVICES ? `
            <label style="display:flex;align-items:center;gap:6px;font-size:11px;font-weight:800;color:#334155;cursor:pointer;">
              <input type="checkbox" id="htsKeepOpenFor2nd3rdChk" ${cfg.hidePublicNow === false ? "checked" : ""} style="width:15px;height:15px;accent-color:#2563eb;" />
              <span>2nd/3rd डिवाइस जोड़ने के लिए अभी Admin बटन शो रखें</span>
            </label>
          ` : ""}
        </div>
      </div>

      ${remainingCount === 0 ? `
        <div style="background:#fef2f2;border:2px solid #ef4444;border-radius:14px;padding:12px;margin-bottom:14px;color:#b91c1c;font-size:12px;font-weight:900;text-align:center;">
          🚫 Access Completed (3/3 Full): अभी किसी और को इसका एक्सेस नहीं दिया जा सकता! सिर्फ नीचे दी गई आप तीनों की डिवाइसेस के पास ही एडमिन एक्सेस रहेगा और बाकी सबके लिए Admin बटन पूरी तरह लॉक/हाइड हो चुका है।
        </div>
      ` : ""}

      <!-- Registered Devices List -->
      <div>
        <div style="font-size:12px;font-weight:900;color:#334155;text-transform:uppercase;margin-bottom:8px;">
          📱 Authorized Devices List (${usedCount} / ${MAX_DEVICES}):
        </div>
        ${devicesRowsHtml}
      </div>
    `;

    if (!existing) {
      refCard.parentElement.insertBefore(card, refCard);
    }

    // Bind Save Button
    const saveBtn = document.getElementById("htsSaveDeviceBtn");
    if (saveBtn) {
      saveBtn.onclick = async () => {
        const chk = document.getElementById("htsShowOnThisDeviceChk");
        const nameInput = document.getElementById("htsDeviceNameInput");
        const devName = (nameInput && nameInput.value.trim()) || detectDeviceName();

        const nextCfg = JSON.parse(JSON.stringify(cachedConfig));
        const existingIdx = nextCfg.devices.findIndex(d => d.id === myDeviceId);

        if (chk && chk.checked) {
          if (existingIdx === -1 && nextCfg.devices.length >= MAX_DEVICES) {
            alert("Access Full! पहले से 3 डिवाइसेस रजिस्टर हो चुकी हैं। अब किसी और डिवाइस को एक्सेस नहीं दिया जा सकता।");
            return;
          }
          const entry = {
            id: myDeviceId,
            name: devName,
            date: new Date().toLocaleDateString("en-PK")
          };
          if (existingIdx >= 0) {
            nextCfg.devices[existingIdx] = entry;
          } else {
            nextCfg.devices.push(entry);
          }
          nextCfg.isLocked = true;
          // If all 3 slots are full, strictly hide Admin everywhere else
          if (nextCfg.devices.length >= MAX_DEVICES) {
            nextCfg.hidePublicNow = true;
          }
        } else {
          if (existingIdx >= 0) {
            nextCfg.devices.splice(existingIdx, 1);
          }
          if (nextCfg.devices.length === 0) {
            nextCfg.isLocked = false;
          }
        }

        saveBtn.textContent = "⏳ Saving...";
        await pushConfigToServer(nextCfg);
        renderAdminSecurityCard(true);
        applyStorefrontProtection();
        saveBtn.textContent = "✅ Saved!";
        setTimeout(() => renderAdminSecurityCard(true), 700);
      };
    }

    // Bind Checkbox for keeping Admin button visible while adding 2nd/3rd device
    const keepOpenChk = document.getElementById("htsKeepOpenFor2nd3rdChk");
    if (keepOpenChk) {
      keepOpenChk.onchange = async () => {
        const nextCfg = JSON.parse(JSON.stringify(cachedConfig));
        nextCfg.hidePublicNow = !keepOpenChk.checked;
        await pushConfigToServer(nextCfg);
        renderAdminSecurityCard(true);
      };
    }

    // Bind Remove Device Buttons
    card.querySelectorAll("[data-remove-device]").forEach(btn => {
      btn.onclick = async () => {
        const targetId = btn.getAttribute("data-remove-device");
        if (!confirm("क्या आप इस डिवाइस से एडमिन एक्सेस हटाना चाहते हैं?")) return;
        const nextCfg = JSON.parse(JSON.stringify(cachedConfig));
        nextCfg.devices = nextCfg.devices.filter(d => d.id !== targetId);
        if (nextCfg.devices.length === 0) nextCfg.isLocked = false;
        await pushConfigToServer(nextCfg);
        renderAdminSecurityCard(true);
        applyStorefrontProtection();
      };
    });
  }

  // Run continuously & on DOM mutations so it works instantly on both Storefront and Admin Page
  function boot() {
    applyStorefrontProtection();
    renderAdminSecurityCard();
    setupOwnerSecretTap();
    syncFromServer();

    const obs = new MutationObserver(() => {
      applyStorefrontProtection();
      renderAdminSecurityCard();
    });
    if (document.body) {
      obs.observe(document.body, { childList: true, subtree: true });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
