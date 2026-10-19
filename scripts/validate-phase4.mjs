import fs from "node:fs";
import { execSync } from "node:child_process";

const files = ["public/js/product-modal.js"];
for (const f of files) {
  if (!fs.existsSync(f) || fs.statSync(f).size === 0) throw new Error("Missing or empty: " + f);
  console.log("[PASS] Exists:", f, `(${fs.statSync(f).size} bytes)`);
}

execSync("node --check public/js/product-modal.js", { stdio: "inherit" });
console.log("=== PHASE 4 PRODUCT MODAL PASSED SYNTAX & VALIDATION ===");
