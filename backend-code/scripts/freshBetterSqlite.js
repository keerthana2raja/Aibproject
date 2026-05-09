/**
 * Rebuild / reinstall better-sqlite3 so the native addon matches **this** Node (ABI).
 * Stop nodemon / other node.exe if Windows reports EPERM on the .node file.
 */
const fs = require("fs");
const path = require("path");
const { execSync, spawnSync } = require("child_process");
const { ensureCorrectNodeVersion } = require("./checkNodeVersion");

const functionsRoot = path.join(__dirname, "..");
ensureCorrectNodeVersion(functionsRoot);

/** Prepend the running Node.exe directory so npm's scripts (prebuild-install / node-gyp) resolve the same ABI. */
function envForNpm() {
  const env = { ...process.env };
  const nodeBinDir = path.dirname(process.execPath);
  const sep = path.delimiter;
  env.PATH = `${nodeBinDir}${sep}${env.PATH || ""}`;
  return env;
}

function probe() {
  const r = spawnSync(
    process.execPath,
    ["-e", "require('better-sqlite3'); process.exit(0)"],
    { cwd: functionsRoot, encoding: "utf8" },
  );
  return r.status === 0;
}

console.log(
  `Node ${process.version} (NODE_MODULE_VERSION ${process.versions.modules})`,
);

try {
  execSync("npm rebuild better-sqlite3 --foreground-scripts", {
    stdio: "inherit",
    cwd: functionsRoot,
    env: envForNpm(),
  });
} catch {
  /* try full reinstall below */
}

if (probe()) {
  console.log("✅ better-sqlite3 loads correctly.");
  process.exit(0);
}

console.log("rebuild insufficient — removing package and reinstalling…");
const mod = path.join(functionsRoot, "node_modules", "better-sqlite3");
try {
  if (fs.existsSync(mod)) fs.rmSync(mod, { recursive: true, force: true });
} catch (e) {
  console.error(
    "Could not delete node_modules/better-sqlite3 (file may be locked). Stop nodemon/Task Manager node.exe, then run: npm run fresh-sqlite-addon",
    e.message,
  );
  process.exit(1);
}

execSync("npm install better-sqlite3 --foreground-scripts --no-save", {
  stdio: "inherit",
  cwd: functionsRoot,
  env: envForNpm(),
});

if (!probe()) {
  console.error(
    "better-sqlite3 still fails. Install MSVC Build Tools / Python if compile failed, then retry.",
  );
  process.exit(1);
}
console.log("✅ better-sqlite3 reinstall OK.");
