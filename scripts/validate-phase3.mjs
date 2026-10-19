import fs from "node:fs";
import { execSync } from "node:child_process";

const files = ["functions/api/products.js", "functions/api/categories.js", "public/admin.html", "public/js/admin.js"];
for (const f of files) {
  if (!fs.existsSync(f) || fs.statSync(f).size === 0) throw new Error("Missing or empty: " + f);
  console.log("[PASS] Exists:", f, `(${fs.statSync(f).size} bytes)`);
}

execSync("node --check functions/api/products.js", { stdio: "inherit" });
execSync("node --check functions/api/categories.js", { stdio: "inherit" });
console.log("=== ALL PHASE 3 SYNTAX & FILE CHECKS PASSED SUCCESSFULLY ===");
