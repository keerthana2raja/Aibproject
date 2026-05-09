const fs = require("fs");
const path = require("path");

function readNvmrc(root) {
  const nvmrcPath = path.join(root, ".nvmrc");
  if (!fs.existsSync(nvmrcPath)) return null;

  const content = fs.readFileSync(nvmrcPath, "utf8").trim();
  const line = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find((l) => l && !l.startsWith("#"));

  if (!line) return null;
  const match = line.match(/^(\d+)/);
  return match ? Number(match[1]) : null;
}

function readPackageEngine(root) {
  const pkgPath = path.join(root, "package.json");
  if (!fs.existsSync(pkgPath)) return null;

  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  const engine = pkg.engines && pkg.engines.node;
  if (!engine || typeof engine !== "string") return null;

  const match = engine.match(/(\d+)/);
  return match ? Number(match[1]) : null;
}

function getExpectedNodeMajor(root) {
  const nvmrcMajor = readNvmrc(root);
  if (nvmrcMajor !== null) return nvmrcMajor;
  return readPackageEngine(root);
}

function ensureCorrectNodeVersion(root) {
  const expected = getExpectedNodeMajor(root);
  if (expected === null) return;

  const actual = Number(process.versions.node.split(".")[0]);
  if (actual === expected) return;

  console.error("\nERROR: Unsupported Node version for this project.");
  console.error(
    `Expected Node ${expected}.x as defined by ${path.join(root, ".nvmrc")}, but found Node ${process.version}.`,
  );
  console.error(
    "Use `nvm use 20` or install Node 20 before running the backend.",
  );
  console.error(
    "If you are intentionally using a newer Node version, update .nvmrc and package.json engines first.\n",
  );
  process.exit(1);
}

module.exports = {
  ensureCorrectNodeVersion,
};
