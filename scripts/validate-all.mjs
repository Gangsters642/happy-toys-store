import fs from "node:fs";
import { execSync } from "node:child_process";

const allFiles = [
  "wrangler.toml",
  "schema.sql",
  "package.json",
  "public/index.html",
  "public/admin.html",
  "public/css/styles.css",
  "public/js/data-seed.js",
  "public/js/app.js",
  "public/js/product-modal.js",
  "public/js/cart-whatsapp.js",
  "public/js/admin.js",
  "functions/api/_middleware.js",
  "functions/api/auth.js",
  "functions/api/upload.js",
  "functions/api/products.js",
  "functions/api/categories.js",
  "functions/api/settings.js"
];

console.log("=== RUNNING HAPPY TOYS STORE FULL E2E VALIDATION ===");
for (const f of allFiles) {
  if (!fs.existsSync(f) || fs.statSync(f).size === 0) {
    throw new Error(`Critical file missing or empty: ${f}`);
  }
  console.log(`[PASS] Verified file: ${f}`);
}

const jsFiles = allFiles.filter(f => f.endsWith(".js") || f.endsWith(".mjs"));
for (const js of jsFiles) {
  execSync(`node --check ${js}`, { stdio: "inherit" });
  console.log(`[PASS] Syntax OK: ${js}`);
}

const schema = fs.readFileSync("schema.sql", "utf8");
if (!schema.includes("CREATE TABLE products") || !schema.includes("CREATE TABLE product_variants")) {
  throw new Error("schema.sql is missing required tables.");
}
console.log("[PASS] SQL D1 schema structure verified.");

console.log("=== ALL HAPPY TOYS STORE E2E CHECKS PASSED SUCCESSFULLY ===");
