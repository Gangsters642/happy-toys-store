import fs from "node:fs";
import { execSync } from "node:child_process";

const files = [".gitignore", "package.json", "public/index.html", "public/css/styles.css", "public/js/data-seed.js", "public/js/app.js"];
for (const f of files) {
  if (!fs.existsSync(f) || fs.statSync(f).size === 0) throw new Error("Missing or empty: " + f);
  console.log("[PASS] Exists:", f, `(${fs.statSync(f).size} bytes)`);
}
execSync("node --check public/js/data-seed.js", { stdio: "inherit" });
execSync("node --check public/js/app.js", { stdio: "inherit" });
console.log("=== ALL PHASE 1 CHECKS PASSED SUCCESSFULLY ===");
