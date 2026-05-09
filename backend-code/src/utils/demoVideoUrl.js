/** Build public URL for a stored demo file (path under data/uploads). */
function demoVideoUrlFromRelpath(rel) {
  const s = String(rel || "").trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  const p = s.replace(/^\/+/, "");
  return `/v1/uploads/${p}`;
}

module.exports = { demoVideoUrlFromRelpath };
