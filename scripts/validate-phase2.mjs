import fs from "node:fs";

const files = ["wrangler.toml", "schema.sql"];
for (const f of files) {
  if (!fs.existsSync(f) || fs.statSync(f).size === 0) throw new Error("Missing or empty: " + f);
  console.log("[PASS] Exists:", f, `(${fs.statSync(f).size} bytes)`);
}
console.log("=== PHASE 2 CONFIG & SCHEMA PASSED SUCCESSFULLY ===");
