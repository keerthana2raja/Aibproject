/** Data access when SQLite/Turso is active — fully async @libsql/client API. */

const { getDb } = require("../config/sqlite");
const { demoVideoUrlFromRelpath } = require("../utils/demoVideoUrl");
const { deleteBlob } = require("../utils/blobUpload");

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseJson(col, fallback) {
  try {
    const raw = col == null ? null : JSON.parse(col);
    if (raw === null || raw === undefined) return fallback;
    return raw;
  } catch { return fallback; }
}

function mapAssetRow(r) {
  const rel = String(r.demo_video_relpath ?? r.demoVideoRelpath ?? "").trim();
  return {
    id: r.id,
    name: r.name,
    desc: r.desc || "",
    family: r.family,
    clouds: parseJson(r.clouds, []),
    maturity: r.maturity,
    maturityMasterId: r.maturity_master_id != null ? r.maturity_master_id : undefined,
    effort: r.effort,
    effortMasterId: r.effort_master_id != null ? r.effort_master_id : undefined,
    demoReady: !!r.demoReady,
    solution: r.solution || "",
    demoVideoUrl: demoVideoUrlFromRelpath(rel || undefined),
    owner: r.owner,
    ownerInitials: r.ownerInitials || "",
    architecture: r.architecture || "",
    quickStart: r.quickStart || "",
    prerequisites: parseJson(r.prerequisites, []),
    tags: parseJson(r.tags, []),
    changelog: parseJson(r.changelog, []),
    attachments: parseJson(r.attachments, []),
    submissionStatus: r.submission_status || null,
    submissionId: r.submission_id || null,
    stats: {
      deploys: r.stats_deploys || 0,
      stars: r.stats_stars || 0,
      demos: Number(r.stats_demos) > 0 ? Number(r.stats_demos) : rel ? 1 : 0,
      projects: Number(r.stats_projects) || 0,
      rating: r.stats_rating != null ? Number(r.stats_rating) : null,
    },
  };
}

function mapFamilyRow(r) {
  return {
    key: r.key,
    name: r.name,
    tagline: r.tagline,
    longDesc: r.long_desc,
    useCases: parseJson(r.use_cases, []),
    solutions: parseJson(r.solutions, []),
    dependsOn: parseJson(r.depends_on, []),
    enables: parseJson(r.enables, []),
    stats: {
      assets: r.stats_assets || 0,
      deploys: r.stats_deploys || 0,
      battleTested: r.stats_battle_tested || 0,
    },
  };
}

function mapRegistrationRow(r) {
  const demoRel = String(r.demo_video_relpath || "").trim();
  return {
    _id: String(r.id),
    registrationId: r.registrationId,
    name: r.name,
    family: r.family,
    description: r.description || "",
    submitedBy: r.submitedBy || "",
    date: r.date ? new Date(r.date) : new Date(),
    status: r.status,
    aiScore: r.aiScore,
    aiFindings: parseJson(r.aiFindings, []),
    govReviewer: r.govReviewer || undefined,
    govNotes: r.govNotes || undefined,
    statusHistory: parseJson(r.statusHistory, []),
    owner: r.owner || "",
    team: r.team || "",
    coContributors: r.coContributors || "",
    version: r.version || "",
    cloud: r.cloud || "",
    maturity: r.maturity || "experimental",
    gitUrl: r.gitUrl || "",
    architecture: r.architecture || "",
    prerequisites: r.prerequisites || "",
    tags: r.tags || "",
    quickStart: r.quickStart || "",
    demoVideoUrl: demoVideoUrlFromRelpath(demoRel || undefined),
    submissionAttachments: parseJson(r.submission_attachments, []),
    promotedAssetId: String(r.promoted_asset_id || "").trim() || undefined,
  };
}

const BATTLE_TESTED_SQL = `
  LOWER(TRIM(maturity)) = 'battle-tested'
  OR maturity_master_id IN (
    SELECT v.id FROM catalog_master_value v
    JOIN catalog_master_type t ON v.master_type_id = t.id
    WHERE t.code = 'MATURITY' AND LOWER(v.code) = 'battle-tested'
  )
`;

// ── Catalog Masters ───────────────────────────────────────────────────────────

exports.catalogMastersSqlite = async () => {
  const db = getDb();
  const typesRes = await db.execute(
    "SELECT id, code, label, sort_order AS sortOrder FROM catalog_master_type ORDER BY sort_order"
  );
  const valuesRes = await db.execute(`
    SELECT v.id, v.master_type_id AS masterTypeId, t.code AS typeCode, v.code, v.label, v.sort_order AS sortOrder
    FROM catalog_master_value v
    INNER JOIN catalog_master_type t ON v.master_type_id = t.id
    ORDER BY t.sort_order, v.sort_order
  `);
  return { types: typesRes.rows, values: valuesRes.rows };
};

exports.resolveMasterValueIdSqlite = async (typeCode, valueCode) => {
  if (!valueCode || !typeCode) return null;
  const db = getDb();
  const res = await db.execute({
    sql: `SELECT v.id FROM catalog_master_value v
          INNER JOIN catalog_master_type t ON v.master_type_id = t.id
          WHERE t.code = ? AND LOWER(TRIM(v.code)) = LOWER(TRIM(?))`,
    args: [typeCode, String(valueCode)],
  });
  return res.rows[0]?.id ?? null;
};

// ── Asset ID generation ───────────────────────────────────────────────────────

exports.nextAssetIdSqlite = async (familyKey) => {
  const db = getDb();
  const { ASSET_FAMILY_PREFIX } = require("../config/sqlite");
  const fk = String(familyKey || "").toLowerCase();
  const prefix = (ASSET_FAMILY_PREFIX[fk] || fk.slice(0, 3).toUpperCase())
    .replace(/[^A-Z]/g, "X").padEnd(3, "X").slice(0, 3);
  const like = `${prefix}-%`;
  const res = await db.execute({ sql: "SELECT id FROM assets WHERE id LIKE ? ORDER BY id DESC", args: [like] });
  let maxNum = 0;
  const re = new RegExp(`^${prefix}-(\\d+)$`, "i");
  res.rows.forEach(({ id }) => {
    const m = String(id).match(re);
    if (m) maxNum = Math.max(maxNum, parseInt(m[1], 10));
  });
  return `${prefix}-${String(maxNum + 1).padStart(3, "0")}`;
};

// ── Family stats ──────────────────────────────────────────────────────────────

exports.refreshFamilyStatsSqlite = async (familyKey) => {
  const db = getDb();
  const fk = String(familyKey).toLowerCase();
  const res = await db.execute({
    sql: `SELECT COUNT(*) AS assets,
            COALESCE(SUM(stats_deploys), 0) AS deploys,
            SUM(CASE WHEN (${BATTLE_TESTED_SQL.replace(/\n/g, " ")}) THEN 1 ELSE 0 END) AS bt
          FROM assets WHERE LOWER(family) = ?`,
    args: [fk],
  });
  const row = res.rows[0] || { assets: 0, deploys: 0, bt: 0 };
  await db.execute({
    sql: "UPDATE families SET stats_assets = ?, stats_deploys = ?, stats_battle_tested = ? WHERE LOWER(key) = ?",
    args: [row.assets, row.deploys, row.bt || 0, fk],
  });
};

exports.recomputeAllFamilyStatsSqlite = async () => {
  const db = getDb();
  const res = await db.execute("SELECT key FROM families");
  for (const { key } of res.rows) {
    await exports.refreshFamilyStatsSqlite(key);
  }
};

// ── Assets ────────────────────────────────────────────────────────────────────

exports.assetsListSqlite = async (filters = {}) => {
  const db = getDb();
  const where = [];
  const args = [];
  if (filters.family)           { where.push("LOWER(family) = LOWER(?)");     args.push(filters.family); }
  if (filters.maturity)         { where.push("LOWER(maturity) = LOWER(?)");   args.push(filters.maturity); }
  if (filters.submissionStatus) { where.push("submission_status = ?");         args.push(filters.submissionStatus); }
  if (filters.demoReady !== undefined && filters.demoReady !== "") {
    where.push("demoReady = ?");
    args.push(filters.demoReady === "true" ? 1 : 0);
  }
  if (filters.cloud) {
    filters.cloud.split(",").map((c) => c.trim().toLowerCase()).forEach((c) => {
      where.push('LOWER(clouds) LIKE ?');
      args.push(`%"${c}"%`);
    });
  }
  if (filters.q) {
    where.push(
      "(LOWER(name) LIKE ? OR LOWER(desc) LIKE ? OR LOWER(id) LIKE ?" +
      " OR LOWER(COALESCE(family,'')) LIKE ?" +
      " OR LOWER(COALESCE(tags,'')) LIKE ?" +
      " OR LOWER(COALESCE(solution,'')) LIKE ?" +
      " OR LOWER(COALESCE(owner,'')) LIKE ?" +
      " OR LOWER(COALESCE(clouds,'')) LIKE ?" +
      " OR LOWER(COALESCE(maturity,'')) LIKE ?" +
      " OR LOWER(COALESCE(effort,'')) LIKE ?)"
    );
    const like = `%${String(filters.q).toLowerCase()}%`;
    args.push(like, like, like, like, like, like, like, like, like, like);
  }
  const sql = `SELECT * FROM assets ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY id`;
  const res = await db.execute({ sql, args });
  return res.rows.map(mapAssetRow);
};

exports.assetsStatsSqlite = async () => {
  const db = getDb();
  const [ta, bt, dr, agg, top] = await Promise.all([
    db.execute("SELECT COUNT(*) AS c FROM assets"),
    db.execute(`SELECT COUNT(*) AS c FROM assets WHERE ${BATTLE_TESTED_SQL}`),
    db.execute("SELECT COUNT(*) AS c FROM assets WHERE demoReady=1"),
    db.execute("SELECT SUM(stats_deploys) AS t FROM assets"),
    db.execute("SELECT * FROM assets ORDER BY stats_deploys DESC LIMIT 5"),
  ]);
  return {
    totalAssets:  Number(ta.rows[0]?.c  || 0),
    battleTested: Number(bt.rows[0]?.c  || 0),
    demoReady:    Number(dr.rows[0]?.c  || 0),
    totalDeploys: Number(agg.rows[0]?.t || 0),
    topAssets: top.rows.map(mapAssetRow),
  };
};

exports.assetByIdSqlite = async (id) => {
  const db = getDb();
  const uid = String(id).toUpperCase();
  const res = await db.execute({ sql: "SELECT * FROM assets WHERE UPPER(id)=?", args: [uid] });
  const r = res.rows[0];
  if (!r) throw { statusCode: 404, message: `Asset '${id}' not found` };
  const base = mapAssetRow(r);
  const relIds = parseJson(r.related_asset_ids, [])
    .map((x) => String(x).trim().toUpperCase()).filter(Boolean);
  let relatedAssets = [];
  if (relIds.length) {
    const ph = relIds.map(() => "?").join(",");
    const rel = await db.execute({
      sql: `SELECT id, name FROM assets WHERE UPPER(id) IN (${ph}) ORDER BY id`,
      args: relIds,
    });
    relatedAssets = rel.rows.map((x) => ({ id: x.id, name: x.name }));
  }
  return { ...base, relatedAssets };
};

exports.assetsByFamilySqlite = async (key) => {
  const db = getDb();
  const res = await db.execute({ sql: "SELECT * FROM assets WHERE LOWER(family)=LOWER(?) ORDER BY id", args: [key] });
  return res.rows.map(mapAssetRow);
};

exports.assetCreateSqlite = async (body, actor = {}) => {
  const db = getDb();
  const family = String(body.family || "").trim().toLowerCase();
  const famRes = await db.execute({ sql: "SELECT key FROM families WHERE LOWER(key)=?", args: [family] });
  if (!famRes.rows[0]) throw { statusCode: 400, message: `Unknown family '${body.family}'` };

  const maturityCode = String(body.maturity || "experimental").trim().toLowerCase();
  const mid = await exports.resolveMasterValueIdSqlite("MATURITY", maturityCode);
  if (!mid) throw { statusCode: 400, message: `Unknown maturity '${body.maturity}'` };

  let effort = String(body.effort || "medium").trim().toLowerCase();
  let eid = await exports.resolveMasterValueIdSqlite("EFFORT", effort);
  if (!eid) { effort = "medium"; eid = await exports.resolveMasterValueIdSqlite("EFFORT", "medium"); }

  const cloudsIn = Array.isArray(body.clouds) ? body.clouds : [];
  const cloudsNorm = [...new Set(cloudsIn.map((c) => String(c).trim().toLowerCase()).filter(Boolean))];
  for (const c of cloudsNorm) {
    if (!await exports.resolveMasterValueIdSqlite("CLOUD", c))
      throw { statusCode: 400, message: `Unknown cloud '${c}'` };
  }

  const id = body.id ? String(body.id).trim().toUpperCase() : await exports.nextAssetIdSqlite(family);
  const existRes = await db.execute({ sql: "SELECT 1 FROM assets WHERE UPPER(id)=?", args: [id] });
  if (existRes.rows[0]) throw { statusCode: 409, message: `Asset id '${id}' already exists` };

  const name = String(body.name || "").trim();
  if (!name) throw { statusCode: 400, message: "Asset name is required" };

  const mvRes = await db.execute({ sql: "SELECT code FROM catalog_master_value WHERE id=?", args: [mid] });
  const maturityText = mvRes.rows[0]?.code || maturityCode;
  const evRes = eid ? await db.execute({ sql: "SELECT code FROM catalog_master_value WHERE id=?", args: [eid] }) : null;
  const effortText = evRes?.rows[0]?.code || effort;

  const demoReady = (body.demoReady === true || body.demoReady === "true" || body.demoReady === 1) ? 1 : 0;
  const solution = String(body.solution || "").trim();
  const owner = String(body.owner || actor.name || "").trim() || "";
  const ownerInitials = String(body.ownerInitials || "").trim() ||
    owner.split(/\s+/).filter(Boolean).map((p) => p[0]).join("").toUpperCase().slice(0, 3);
  const statsD = Math.max(0, parseInt(body.statsDeploys, 10) || 0);
  const statsS = Math.max(0, parseInt(body.statsStars, 10)  || 0);

  await db.execute({
    sql: `INSERT INTO assets (id, name, desc, family, clouds, maturity, maturity_master_id, effort, effort_master_id,
            demoReady, solution, owner, ownerInitials, stats_deploys, stats_stars)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    args: [id, name, String(body.desc || "").trim(), family, JSON.stringify(cloudsNorm),
           maturityText, mid, effortText, eid ?? null,
           demoReady, solution, owner, ownerInitials, statsD, statsS],
  });

  await exports.refreshFamilyStatsSqlite(family);
  await exports.activityLogSqlite({
    actorName: actor.name || actor.email || "User",
    email: actor.email || "",
    action: "created",
    resourceType: "asset",
    description: id,
  });

  return exports.assetByIdSqlite(id);
};

exports.assetSetDemoVideoSqlite = async (assetId, blobUrl) => {
  const db = getDb();
  const uid = String(assetId).toUpperCase();
  const res = await db.execute({ sql: "SELECT demo_video_relpath FROM assets WHERE UPPER(id)=?", args: [uid] });
  if (!res.rows[0]) throw { statusCode: 404, message: `Asset '${assetId}' not found` };
  const prev = String(res.rows[0].demo_video_relpath || "").trim();
  if (prev && prev !== blobUrl) await deleteBlob(prev);
  await db.execute({ sql: "UPDATE assets SET demo_video_relpath=?, demoReady=1, stats_demos=1 WHERE UPPER(id)=?", args: [blobUrl, uid] });
  return exports.assetByIdSqlite(uid);
};

// ── Families ──────────────────────────────────────────────────────────────────

exports.familiesListSqlite = async () => {
  const db = getDb();
  const res = await db.execute("SELECT * FROM families ORDER BY key");
  return res.rows.map(mapFamilyRow);
};

exports.familyByKeySqlite = async (key) => {
  const db = getDb();
  const res = await db.execute({ sql: "SELECT * FROM families WHERE LOWER(key)=LOWER(?)", args: [key] });
  if (!res.rows[0]) throw { statusCode: 404, message: `Family '${key}' not found` };
  return mapFamilyRow(res.rows[0]);
};

// ── Registrations ─────────────────────────────────────────────────────────────

exports.registrationDistinctStatusesSqlite = async () => {
  const db = getDb();
  const res = await db.execute("SELECT DISTINCT status FROM registrations ORDER BY status");
  return res.rows.map((r) => r.status);
};

exports.registrationsListSqlite = async (status) => {
  const db = getDb();
  const res = status
    ? await db.execute({ sql: "SELECT * FROM registrations WHERE status=? ORDER BY date DESC", args: [status] })
    : await db.execute("SELECT * FROM registrations ORDER BY date DESC");
  return res.rows.map(mapRegistrationRow);
};

exports.nextRegistrationIdSqlite = async () => {
  const db = getDb();
  const res = await db.execute("SELECT registrationId FROM registrations ORDER BY id DESC LIMIT 1");
  if (!res.rows[0]) return "REG-001";
  const n = parseInt(String(res.rows[0].registrationId).replace(/\D/g, ""), 10) + 1;
  return `REG-${String(n).padStart(3, "0")}`;
};

exports.registrationByIdSqlite = async (id) => {
  const db = getDb();
  const uid = String(id).toUpperCase();
  const res = await db.execute({ sql: "SELECT * FROM registrations WHERE UPPER(registrationId)=?", args: [uid] });
  if (!res.rows[0]) throw { statusCode: 404, message: `Registration '${id}' not found` };
  return mapRegistrationRow(res.rows[0]);
};

exports.registrationCreateSqlite = async ({
  registrationId, name, family, description, submitedBy,
  owner, team, coContributors, version, cloud, maturity,
  gitUrl, architecture, prerequisites, tags, quickStart,
}) => {
  const db = getDb();
  const now = new Date().toISOString();
  const initialHistory = JSON.stringify([{
    status: "ai-review", timestamp: now,
    changedBy: submitedBy || "System", note: "Submitted for AI review",
  }]);

  await db.execute({
    sql: `INSERT INTO registrations (
            registrationId, name, family, description, submitedBy, date, status, aiFindings, statusHistory,
            owner, team, coContributors, version, cloud, maturity, gitUrl, architecture, prerequisites, tags, quickStart
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    args: [
      registrationId, name, String(family || "").toLowerCase(), description || "",
      submitedBy || "System", now, "ai-review", "[]", initialHistory,
      owner || "", team || "", coContributors || "", version || "",
      cloud || "", maturity || "experimental", gitUrl || "",
      architecture || "", prerequisites || "", tags || "", quickStart || "",
    ],
  });

  // Pre-insert catalogue asset so submission appears in catalog immediately
  try {
    const fk = String(family || "").toLowerCase();
    const famRes = await db.execute({ sql: "SELECT key FROM families WHERE LOWER(key)=?", args: [fk] });
    if (famRes.rows[0]) {
      const assetId = await exports.nextAssetIdSqlite(fk);
      const maturityCode = String(maturity || "experimental").trim().toLowerCase();
      const mid = await exports.resolveMasterValueIdSqlite("MATURITY", maturityCode)
               || await exports.resolveMasterValueIdSqlite("MATURITY", "experimental");
      const eid = await exports.resolveMasterValueIdSqlite("EFFORT", "medium");
      const cloudNorm = String(cloud || "").trim().toLowerCase();
      const cloudValid = cloudNorm && await exports.resolveMasterValueIdSqlite("CLOUD", cloudNorm)
        ? [cloudNorm] : ["gcp"];
      const ownerName = String(owner || submitedBy || "").trim();
      const ownerInitials = ownerName.split(/\s+/).filter(Boolean).map((p) => p[0]).join("").toUpperCase().slice(0, 3);
      const tagsArr = String(tags || "").split(",").map((t) => t.trim()).filter(Boolean);
      const preqArr = String(prerequisites || "").split(/[\n,]/).map((s) => s.trim()).filter(Boolean);

      await db.execute({
        sql: `INSERT INTO assets (
                id, name, desc, family, clouds, maturity, maturity_master_id,
                effort, effort_master_id, demoReady, solution, owner, ownerInitials,
                architecture, quickStart, prerequisites, tags,
                stats_deploys, stats_stars, submission_status, submission_id
              ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        args: [
          assetId, name, description || "", fk, JSON.stringify(cloudValid),
          maturityCode, mid || null, "medium", eid || null,
          0, "", ownerName, ownerInitials,
          String(architecture || "").trim(), String(quickStart || "").trim(),
          JSON.stringify(preqArr), JSON.stringify(tagsArr),
          0, 0, "ai-review", registrationId,
        ],
      });

      await db.execute({
        sql: "UPDATE registrations SET promoted_asset_id=? WHERE registrationId=?",
        args: [assetId, registrationId],
      });
      await exports.refreshFamilyStatsSqlite(fk);
    }
  } catch (e) {
    console.error("registrationCreateSqlite: asset pre-insert failed:", e.message);
  }

  simulateAIReviewSqlite(registrationId);
  return { id: registrationId, status: "ai-review" };
};

function simulateAIReviewSqlite(registrationId) {
  setTimeout(async () => {
    try {
      const db = getDb();
      const score = Math.floor(Math.random() * 30) + 70;
      const findings = score >= 85
        ? [{ category: "Security", status: "pass", detail: "No obvious security flags found" },
           { category: "Docs",     status: "pass", detail: "Documentation looks complete" }]
        : [{ category: "Docs",         status: "warn", detail: "Missing prerequisites section" },
           { category: "Architecture", status: "warn", detail: "Architecture diagram recommended" }];
      const statusNew = score >= 85 ? "governance" : "remediation";
      const rowRes = await db.execute({ sql: "SELECT * FROM registrations WHERE registrationId=?", args: [registrationId] });
      const row = rowRes.rows[0];
      if (!row) return;
      const hist = parseJson(row.statusHistory, []);
      hist.push({ status: statusNew, changedBy: "AI Engine", note: `AI score: ${score}/100`, timestamp: new Date().toISOString() });
      await db.execute({
        sql: "UPDATE registrations SET aiScore=?, aiFindings=?, status=?, statusHistory=? WHERE registrationId=?",
        args: [score, JSON.stringify(findings), statusNew, JSON.stringify(hist), registrationId],
      });
      await db.execute({ sql: "UPDATE assets SET submission_status=? WHERE submission_id=?", args: [statusNew, registrationId] });
    } catch (e) {
      console.error("simulateAIReviewSqlite", e.message);
    }
  }, 3000);
}

exports.registrationUpdateSqlite = async (id, updates, updatedBy) => {
  const db = getDb();
  const uid = String(id).toUpperCase();
  const rowRes = await db.execute({ sql: "SELECT * FROM registrations WHERE UPPER(registrationId)=?", args: [uid] });
  const row = rowRes.rows[0];
  if (!row) throw { statusCode: 404, message: `Registration '${id}' not found` };

  const status     = updates.status     !== undefined ? updates.status     : row.status;
  const aiScore    = updates.aiScore    !== undefined ? updates.aiScore    : row.aiScore;
  const aiFindings = updates.aiFindings !== undefined ? JSON.stringify(updates.aiFindings) : row.aiFindings;
  const govReviewer = updates.govReviewer !== undefined ? updates.govReviewer : row.govReviewer;
  const govNotes    = updates.govNotes    !== undefined ? updates.govNotes    : row.govNotes;

  let hist = parseJson(row.statusHistory, []);
  if (updates.status) {
    hist = hist.concat([{ status: updates.status, timestamp: new Date().toISOString(), changedBy: updatedBy || "System", note: updates.govNotes || "" }]);
  }

  await db.execute({
    sql: "UPDATE registrations SET status=?, aiScore=?, aiFindings=?, govReviewer=?, govNotes=?, statusHistory=? WHERE registrationId=?",
    args: [status, aiScore, aiFindings, govReviewer, govNotes, JSON.stringify(hist), row.registrationId],
  });

  if (updates.status) {
    const newAssetStatus = updates.status === "approved" ? null : updates.status;
    await db.execute({ sql: "UPDATE assets SET submission_status=? WHERE submission_id=?", args: [newAssetStatus, row.registrationId] });
  }

  if (updates.status === "approved") {
    try { await exports.tryPromoteApprovedRegistrationSqlite(row.registrationId, updatedBy); }
    catch (e) { console.error("Promotion to catalogue failed:", e.message || e); }
  }

  return exports.registrationByIdSqlite(row.registrationId);
};

exports.registrationSetDemoVideoSqlite = async (registrationId, blobUrl) => {
  const db = getDb();
  const uid = String(registrationId).toUpperCase();
  const res = await db.execute({
    sql: "SELECT demo_video_relpath, promoted_asset_id FROM registrations WHERE UPPER(registrationId)=?",
    args: [uid],
  });
  if (!res.rows[0]) throw { statusCode: 404, message: `Registration '${registrationId}' not found` };
  const prev = String(res.rows[0].demo_video_relpath || "").trim();
  if (prev && prev !== blobUrl) await deleteBlob(prev);

  // Update registrations table
  await db.execute({ sql: "UPDATE registrations SET demo_video_relpath=? WHERE UPPER(registrationId)=?", args: [blobUrl, uid] });

  // Sync to asset table — use promoted_asset_id or fall back to submission_id lookup
  let assetId = String(res.rows[0].promoted_asset_id || "").trim();
  if (!assetId) {
    try {
      const fallback = await db.execute({ sql: "SELECT id FROM assets WHERE submission_id=? LIMIT 1", args: [uid] });
      assetId = String(fallback.rows[0]?.id || "").trim();
      // also patch promoted_asset_id so future calls don't need the fallback
      if (assetId) {
        await db.execute({ sql: "UPDATE registrations SET promoted_asset_id=? WHERE UPPER(registrationId)=?", args: [assetId, uid] });
      }
    } catch (_) {}
  }
  if (assetId) {
    try {
      await db.execute({
        sql: "UPDATE assets SET demo_video_relpath=?, demoReady=1, stats_demos=1 WHERE id=?",
        args: [blobUrl, assetId],
      });
    } catch (e) {
      console.error("registrationSetDemoVideoSqlite: asset sync failed:", e.message);
    }
  }

  return exports.registrationByIdSqlite(uid);
};

exports.registrationAppendAttachmentsSqlite = async (registrationId, metas) => {
  const db = getDb();
  const uid = String(registrationId).toUpperCase();
  const res = await db.execute({
    sql: "SELECT submission_attachments, promoted_asset_id FROM registrations WHERE UPPER(registrationId)=?",
    args: [uid],
  });
  if (!res.rows[0]) throw { statusCode: 404, message: `Registration '${registrationId}' not found` };
  const merged = [...parseJson(res.rows[0].submission_attachments, []), ...metas];

  // Update registrations table
  await db.execute({
    sql: "UPDATE registrations SET submission_attachments=? WHERE UPPER(registrationId)=?",
    args: [JSON.stringify(merged), uid],
  });

  // Sync to asset table immediately so GET /assets/:id returns attachments
  let assetId2 = String(res.rows[0].promoted_asset_id || "").trim();
  if (!assetId2) {
    try {
      const fallback = await db.execute({ sql: "SELECT id FROM assets WHERE submission_id=? LIMIT 1", args: [uid] });
      assetId2 = String(fallback.rows[0]?.id || "").trim();
      if (assetId2) await db.execute({ sql: "UPDATE registrations SET promoted_asset_id=? WHERE UPPER(registrationId)=?", args: [assetId2, uid] });
    } catch (_) {}
  }
  if (assetId2) {
    try {
      const assetRes = await db.execute({ sql: "SELECT attachments FROM assets WHERE id=?", args: [assetId2] });
      const prevAttachments = parseJson(assetRes.rows[0]?.attachments, []);
      const mergedAsset = [...prevAttachments, ...metas];
      await db.execute({
        sql: "UPDATE assets SET attachments=? WHERE id=?",
        args: [JSON.stringify(mergedAsset), assetId2],
      });
    } catch (e) {
      console.error("registrationAppendAttachmentsSqlite: asset sync failed:", e.message);
    }
  }

  return exports.registrationByIdSqlite(uid);
};

exports.registrationSetArchitectureSqlite = async (registrationId, blobUrl) => {
  const db = getDb();
  const uid = String(registrationId).toUpperCase();
  const res = await db.execute({
    sql: "SELECT promoted_asset_id FROM registrations WHERE UPPER(registrationId)=?",
    args: [uid],
  });
  if (!res.rows[0]) throw { statusCode: 404, message: `Registration '${registrationId}' not found` };

  // Update registrations table
  await db.execute({
    sql: "UPDATE registrations SET architecture=? WHERE UPPER(registrationId)=?",
    args: [blobUrl, uid],
  });

  // Immediately sync blob URL to the pre-inserted asset — fallback to submission_id lookup
  let archAssetId = String(res.rows[0].promoted_asset_id || "").trim();
  if (!archAssetId) {
    try {
      const fallback = await db.execute({ sql: "SELECT id FROM assets WHERE submission_id=? LIMIT 1", args: [uid] });
      archAssetId = String(fallback.rows[0]?.id || "").trim();
      if (archAssetId) await db.execute({ sql: "UPDATE registrations SET promoted_asset_id=? WHERE UPPER(registrationId)=?", args: [archAssetId, uid] });
    } catch (_) {}
  }
  if (archAssetId) {
    try {
      await db.execute({
        sql: "UPDATE assets SET architecture=? WHERE id=?",
        args: [blobUrl, archAssetId],
      });
    } catch (e) {
      console.error("registrationSetArchitectureSqlite: asset sync failed:", e.message);
    }
  }

  return exports.registrationByIdSqlite(uid);
};

exports.tryPromoteApprovedRegistrationSqlite = async (registrationId, updatedByName) => {
  const db = getDb();
  const uid = String(registrationId).toUpperCase();
  const rRes = await db.execute({ sql: "SELECT * FROM registrations WHERE UPPER(registrationId)=?", args: [uid] });
  const r = rRes.rows[0];
  if (!r || r.status !== "approved") return null;

  const existRes = await db.execute({ sql: "SELECT id FROM assets WHERE submission_id=?", args: [r.registrationId] });
  const existingAsset = existRes.rows[0];

  let clouds = [];
  const c = String(r.cloud || "").trim().toLowerCase();
  if (c && await exports.resolveMasterValueIdSqlite("CLOUD", c)) clouds = [c];
  else clouds = ["gcp"];

  const demoRel  = String(r.demo_video_relpath || "").trim();
  const tags     = String(r.tags  || "").split(",").map((t) => t.trim()).filter(Boolean);
  const preq     = String(r.prerequisites || "").split(/[\n,]/).map((s) => s.trim()).filter(Boolean);
  const arch     = String(r.architecture || "").trim() || String(r.gitUrl || "").trim() || "";
  const qs       = String(r.quickStart || "").trim();
  const subsAtt  = parseJson(r.submission_attachments, []);

  let aid;

  if (existingAsset) {
    aid = existingAsset.id;
    await db.execute({
      sql: `UPDATE assets SET submission_status=NULL, clouds=?, demoReady=?, demo_video_relpath=?,
              attachments=?, tags=?, prerequisites=?, architecture=?, quickStart=? WHERE id=?`,
      args: [JSON.stringify(clouds), demoRel ? 1 : 0, demoRel || "",
             JSON.stringify(subsAtt), JSON.stringify(tags), JSON.stringify(preq), arch, qs, aid],
    });
    if (demoRel) await db.execute({ sql: "UPDATE assets SET stats_demos=1 WHERE id=?", args: [aid] });
  } else {
    const paRes = await db.execute({ sql: "SELECT promoted_asset_id FROM registrations WHERE registrationId=?", args: [r.registrationId] });
    if (String(paRes.rows[0]?.promoted_asset_id || "").trim()) return paRes.rows[0].promoted_asset_id;
    const created = await exports.assetCreateSqlite(
      { family: String(r.family || "").toLowerCase(), name: r.name, desc: String(r.description || ""),
        clouds, maturity: String(r.maturity || "experimental").toLowerCase(), effort: "medium",
        demoReady: !!demoRel, solution: "", owner: String(r.owner || r.submitedBy || "").trim() || "Catalogue" },
      { name: updatedByName || "Governance", email: "" }
    );
    aid = created.id;
    if (demoRel) await db.execute({ sql: "UPDATE assets SET demo_video_relpath=?, demoReady=1, stats_demos=1 WHERE id=?", args: [demoRel, aid] });
    if (subsAtt.length) await db.execute({ sql: "UPDATE assets SET attachments=? WHERE id=?", args: [JSON.stringify(subsAtt), aid] });
    if (tags.length)    await db.execute({ sql: "UPDATE assets SET tags=? WHERE id=?",        args: [JSON.stringify(tags), aid] });
    await db.execute({ sql: "UPDATE assets SET prerequisites=?, architecture=?, quickStart=? WHERE id=?", args: [JSON.stringify(preq), arch, qs, aid] });
  }

  await db.execute({ sql: "UPDATE registrations SET promoted_asset_id=? WHERE registrationId=?", args: [aid, r.registrationId] });
  await exports.refreshFamilyStatsSqlite(String(r.family || "").toLowerCase());
  return aid;
};

// ── Users ─────────────────────────────────────────────────────────────────────

exports.userByEmailSqlite = async (email) => {
  const db = getDb();
  const res = await db.execute({
    sql: "SELECT email, name, role, password FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1",
    args: [String(email || "").trim()],
  });
  return res.rows[0] || null;
};

exports.directoryUsersSqlite = async (role) => {
  const db = getDb();
  const res = role
    ? await db.execute({ sql: "SELECT id, email, name, role FROM users WHERE LOWER(role)=LOWER(?) ORDER BY email", args: [role] })
    : await db.execute("SELECT id, email, name, role FROM users ORDER BY email");
  return res.rows.map((r) => ({ _id: String(r.id), email: r.email, name: r.name, role: r.role }));
};

// ── Activities ────────────────────────────────────────────────────────────────

exports.activityLogSqlite = async ({ userId = null, actorName, email = "", action, resourceType, description }) => {
  try {
    await getDb().execute({
      sql: "INSERT INTO activities (userId, name, email, action, resourceType, description) VALUES (?,?,?,?,?,?)",
      args: [userId || null, actorName || "System", email, action, resourceType || "other", description || null],
    });
  } catch (e) {
    console.error("activityLogSqlite", e.message);
  }
};

exports.recentActivitiesSqlite = async (limit = 15) => {
  const res = await getDb().execute({
    sql: "SELECT name, action, description, resourceType, createdAt FROM activities ORDER BY createdAt DESC LIMIT ?",
    args: [Number(limit)],
  });
  return res.rows.map((r) => ({ name: r.name, action: r.action, description: r.description, resourceType: r.resourceType, createdAt: r.createdAt }));
};

// ── Dashboard ─────────────────────────────────────────────────────────────────

exports.dashboardStatsSqlite = async () => {
  const db = getDb();

  // Guard: check if catalog_master_value exists before using BATTLE_TESTED_SQL subquery
  let battleTestedSql = `LOWER(TRIM(maturity)) = 'battle-tested'`;
  try {
    await db.execute("SELECT 1 FROM catalog_master_value LIMIT 1");
    battleTestedSql = BATTLE_TESTED_SQL;
  } catch (_) {}

  const [ta, bt, dr, dep, pend, famDist, fams] = await Promise.all([
    db.execute("SELECT COUNT(*) AS c FROM assets").catch(() => ({ rows: [{ c: 0 }] })),
    db.execute(`SELECT COUNT(*) AS c FROM assets WHERE ${battleTestedSql}`).catch(() => ({ rows: [{ c: 0 }] })),
    db.execute("SELECT COUNT(*) AS c FROM assets WHERE demoReady=1").catch(() => ({ rows: [{ c: 0 }] })),
    db.execute("SELECT SUM(stats_deploys) AS t FROM assets").catch(() => ({ rows: [{ t: 0 }] })),
    db.execute("SELECT COUNT(*) AS c FROM registrations WHERE status IN ('ai-review','governance','remediation')").catch(() => ({ rows: [{ c: 0 }] })),
    db.execute("SELECT COUNT(DISTINCT TRIM(LOWER(family))) AS c FROM assets WHERE TRIM(COALESCE(family,'')) != ''").catch(() => ({ rows: [{ c: 0 }] })),
    exports.familiesListSqlite().catch(() => []),
  ]);

  let notices = [];
  try {
    const nr = await db.execute("SELECT headline, detail FROM notices WHERE active=1 ORDER BY sort_order, id");
    notices = nr.rows.map((row) => ({ headline: row.headline, detail: row.detail }));
  } catch (_) {}

  let deployMomPercent = null;
  try {
    const mr = await db.execute("SELECT value FROM app_meta WHERE key='mom_deploy_pct'");
    deployMomPercent = mr.rows[0]?.value !== undefined ? Number(mr.rows[0].value) || null : null;
  } catch (_) {}

  return {
    totalAssets:        Number(ta.rows[0]?.c   || 0),
    battleTested:       Number(bt.rows[0]?.c   || 0),
    demoReady:          Number(dr.rows[0]?.c   || 0),
    totalDeploys:       Number(dep.rows[0]?.t  || 0),
    pendingSubmissions: Number(pend.rows[0]?.c || 0),
    familyCountDistinct:Number(famDist.rows[0]?.c || 0),
    notices,
    deployMomPercent,
    families: fams,
  };
};

exports.popularAssetsSqlite = async (limit) => {
  const res = await getDb().execute({ sql: "SELECT * FROM assets ORDER BY stats_deploys DESC LIMIT ?", args: [Number(limit)] });
  return res.rows.map(mapAssetRow);
};

// ── Search ────────────────────────────────────────────────────────────────────

exports.searchSuggestionsSqlite = async (q) => {
  const db = getDb();
  const qt = String(q || "").trim();
  if (!qt) return { assets: [], families: [] };
  const term = `%${qt.toLowerCase()}%`;
  const [aRes, fRes, dRes] = await Promise.all([
    db.execute({ sql: "SELECT id, name, family FROM assets WHERE LOWER(name) LIKE ? OR LOWER(id) LIKE ? OR LOWER(desc) LIKE ? OR LOWER(tags) LIKE ? OR LOWER(solution) LIKE ? OR LOWER(family) LIKE ? OR LOWER(COALESCE(owner,'')) LIKE ? OR LOWER(COALESCE(clouds,'')) LIKE ? OR LOWER(COALESCE(maturity,'')) LIKE ? OR LOWER(COALESCE(effort,'')) LIKE ? LIMIT 6", args: [term, term, term, term, term, term, term, term, term, term] }),
    db.execute({ sql: "SELECT key AS id, name, tagline FROM families WHERE LOWER(name) LIKE ? OR LOWER(tagline) LIKE ? OR LOWER(long_desc) LIKE ? OR LOWER(solutions) LIKE ? OR LOWER(use_cases) LIKE ? LIMIT 4", args: [term, term, term, term, term] }),
    db.execute({ sql: "SELECT family, SUM(stats_deploys) AS deploys FROM assets WHERE LOWER(family) LIKE ? GROUP BY family", args: [term] }),
  ]);
  const deploysByFamily = {};
  dRes.rows.forEach((r) => { deploysByFamily[r.family] = Number(r.deploys || 0); });

  // Collect family keys already returned by direct family match
  const directFamilyIds = new Set(fRes.rows.map((f) => String(f.id).toLowerCase()));

  // For each matched asset, fetch its parent family if not already in results
  const assetFamilyKeys = [...new Set(
    aRes.rows
      .map((a) => String(a.family || "").toLowerCase())
      .filter((fk) => fk && !directFamilyIds.has(fk))
  )];

  let extraFamilies = [];
  if (assetFamilyKeys.length) {
    const placeholders = assetFamilyKeys.map(() => "?").join(",");
    const efRes = await db.execute({
      sql: `SELECT key AS id, name, tagline FROM families WHERE LOWER(key) IN (${placeholders}) LIMIT 4`,
      args: assetFamilyKeys,
    });
    extraFamilies = efRes.rows;
  }

  const allFamilies = [
    ...fRes.rows.map((f) => ({ id: f.id, name: f.name, tagline: f.tagline, type: "family", deploys: deploysByFamily[f.id] ?? 0 })),
    ...extraFamilies.map((f) => ({ id: f.id, name: f.name, tagline: f.tagline, type: "family", deploys: deploysByFamily[f.id] ?? 0 })),
  ];

  // If no assets matched directly but families matched, fetch assets belonging to those families
  let allAssets = aRes.rows.map((a) => ({ id: a.id, name: a.name, family: a.family, type: "asset" }));
  if (allAssets.length === 0 && allFamilies.length > 0) {
    const familyKeysForAssets = allFamilies.map((f) => String(f.id).toLowerCase());
    const placeholders2 = familyKeysForAssets.map(() => "?").join(",");
    const fallbackAssets = await db.execute({
      sql: `SELECT id, name, family FROM assets WHERE LOWER(family) IN (${placeholders2}) ORDER BY stats_deploys DESC LIMIT 6`,
      args: familyKeysForAssets,
    });
    allAssets = fallbackAssets.rows.map((a) => ({ id: a.id, name: a.name, family: a.family, type: "asset" }));
  }

  return {
    assets:   allAssets,
    families: allFamilies,
  };
};

exports.pendingSubmissionCountSqlite = async () => {
  const res = await getDb().execute(
    "SELECT COUNT(*) AS c FROM registrations WHERE status IN ('ai-review','governance','remediation')"
  );
  return Number(res.rows[0]?.c || 0);
};

// ── Analytics ─────────────────────────────────────────────────────────────────

exports.analyticsSummarySqlite = async () => {
  const db = getDb();
  const [dep, ta, bt, reg, famBrk, topA, topC] = await Promise.all([
    db.execute("SELECT SUM(stats_deploys) AS t FROM assets"),
    db.execute("SELECT COUNT(*) AS c FROM assets"),
    db.execute(`SELECT COUNT(*) AS c FROM assets WHERE ${BATTLE_TESTED_SQL}`),
    db.execute("SELECT COUNT(*) AS c FROM registrations"),
    db.execute("SELECT family AS _id, COUNT(*) AS count, SUM(stats_deploys) AS deploys FROM assets GROUP BY family ORDER BY deploys DESC"),
    db.execute("SELECT id, name, family, stats_deploys FROM assets ORDER BY stats_deploys DESC LIMIT 5"),
    db.execute(`SELECT submitedBy AS _id, COUNT(*) AS count FROM registrations
                WHERE submitedBy IS NOT NULL AND TRIM(submitedBy) != ''
                GROUP BY submitedBy ORDER BY count DESC LIMIT 5`),
  ]);

  const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  // Single query replacing 6 sequential round-trips
  const trendRes = await db.execute({
    sql: `SELECT strftime('%Y', date) AS yr, strftime('%m', date) AS mo, COUNT(*) AS c
          FROM registrations
          WHERE date >= date('now', '-5 months', 'start of month')
          GROUP BY yr, mo
          ORDER BY yr, mo`,
    args: [],
  });
  const trendMap = {};
  for (const row of trendRes.rows) {
    trendMap[`${row.yr}-${row.mo}`] = Number(row.c || 0);
  }
  const now = new Date();
  const trend = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const yr = String(d.getFullYear());
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    trend.push({ month: MONTH_NAMES[d.getMonth()], count: trendMap[`${yr}-${mo}`] || 0 });
  }

  return {
    totalDeploys:    Number(dep.rows[0]?.t || 0),
    totalAssets:     Number(ta.rows[0]?.c  || 0),
    battleTested:    Number(bt.rows[0]?.c  || 0),
    registeredCount: Number(reg.rows[0]?.c || 0),
    familyBreakdown: famBrk.rows,
    topAssets: topA.rows.map((x) => ({ id: x.id, name: x.name, family: x.family, stats: { deploys: x.stats_deploys } })),
    monthlyTrend: trend,
    topContributors: topC.rows,
  };
};
