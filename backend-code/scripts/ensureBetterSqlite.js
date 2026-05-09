/**
 * Before nodemon/start: if better-sqlite3 fails to load (ABI mismatch), reinstall it for this Node.
 */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { ensureCorrectNodeVersion } = require("./checkNodeVersion");

const root = path.join(__dirname, "..");
ensureCorrectNodeVersion(root);
const snippet = `
try {
  require('better-sqlite3');
  process.exit(0);
} catch (e) {
  if (String(e.code) === 'ERR_DLOPEN_FAILED') process.exit(2);
  if (/NODE_MODULE_VERSION|different Node/.test(String(e.message))) process.exit(2);
  console.error(e);
  process.exit(1);
}
`;

const r = spawnSync(process.execPath, ["-e", snippet], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});

if (r.status === 0) process.exit(0);

if (r.status !== 2) process.exit(r.status ?? 1);

console.log(`
[better-sqlite3] Addon did not load under ${process.version} — reinstalling for this Node…
`);
const fresh = spawnSync(
  process.execPath,
  [path.join(__dirname, "freshBetterSqlite.js")],
  {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  },
);
process.exit(fresh.status ?? 1);
