import fs from "fs";
import path from "path";

const SRC_DIR = path.resolve("./src");

// Detect all .jsx files
function getJSXFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getJSXFiles(fullPath));
    } else if (entry.name.endsWith(".jsx")) {
      files.push(fullPath);
    }
  }

  return files;
}

// Check & inject PropTypes block if missing
function addPropTypes(filePath) {
  const code = fs.readFileSync(filePath, "utf8");

  if (code.includes("propTypes")) return; // already has propTypes

  // Find component name
  const match = code.match(/export default function (\w+)/);
  if (!match) return;

  const componentName = match[1];
  const propTypesBlock = `
${componentName}.propTypes = {
  // TODO: define props here (auto added)
};
`;

  const newCode = code.includes("export default")
    ? code.replace(/export default/, `${propTypesBlock}\nexport default`)
    : code + propTypesBlock;

  fs.writeFileSync(filePath, newCode, "utf8");
  console.log(`✅ Added PropTypes placeholder to ${filePath}`);
}

// Run script
const files = getJSXFiles(SRC_DIR);
files.forEach(addPropTypes);

console.log(`\n✨ Completed adding PropTypes placeholders to ${files.length} files.`);
