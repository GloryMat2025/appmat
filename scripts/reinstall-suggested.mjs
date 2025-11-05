import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const cwd = process.cwd();

// find the most recent package-fix-report
const files = fs.readdirSync(cwd)
  .filter(f => f.startsWith("package-fix-report.") && f.endsWith(".json"))
  .sort((a, b) => fs.statSync(path.join(cwd, b)).mtimeMs - fs.statSync(path.join(cwd, a)).mtimeMs);

if (!files.length) {
  console.error("❌ No package-fix-report.*.json found.");
  process.exit(1);
}

const latest = files[0];
const reportPath = path.join(cwd, latest);
const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));

const pkgs = Object.entries(report.suggestions)
  .filter(([_, v]) => v)
  .map(([name, version]) => `${name}@${version}`);

if (!pkgs.length) {
  console.log("No suggested versions available in", latest);
  process.exit(0);
}

console.log(`📦 Installing ${pkgs.length} packages from ${latest}:`);
console.log("  " + pkgs.join(" "));

try {
  execSync(`npm install ${pkgs.join(" ")}`, { stdio: "inherit" });
  console.log("\n✅ Installation complete.");
} catch (e) {
  console.error("\n❌ npm install failed:", e.message);
  process.exit(2);
}
