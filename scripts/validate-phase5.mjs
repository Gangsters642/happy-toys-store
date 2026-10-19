import fs from "node:fs";
import { execSync } from "node:child_process";

const files = ["functions/api/settings.js", "public/js/cart-whatsapp.js"];
for (const f of files) {
  if (!fs.existsSync(f) || fs.statSync(f).size === 0) throw new Error("Missing or empty: " + f);
  console.log("[PASS] Exists:", f, `(${fs.statSync(f).size} bytes)`);
}

execSync("node --check public/js/cart-whatsapp.js", { stdio: "inherit" });
console.log("=== PHASE 5 CART & WHATSAPP CHECK PASSED SUCCESSFULLY ===");
