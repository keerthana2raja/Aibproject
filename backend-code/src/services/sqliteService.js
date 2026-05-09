/** Data access when SQLite is active (see config/sqlite.js isSqliteMode). */

const path = require("path");
const fs = require("fs");
const { getDb } = require("../config/sqlite");
const { demoVideoUrlFromRelpath } = require("../utils/demoVideoUrl");

function parseJson(col, fallback) {
  try {
    const raw = col == null ? null : JSON.parse(col);
    if (raw === null || raw === undefined) return fallback;
    return raw;
  } catch {
    return fallback;
  }
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
    maturityMasterId:
      r.maturity_master_id != null ? r.maturity_master_id : undefined,
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
    // submission_status is set for assets created directly from a submission.
    // null means it is a normal fully-approved catalogue asset.
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

exports.catalogMastersSqlite = () => {
  const db = getDb();
  const types = db
    .prepare(
      "SELECT id, code, label, sort_order AS sortOrder FROM catalog_master_type ORDER BY sort_order",
    )
    .all();
  const values = db
    .prepare(
      `
      SELECT v.id, v.master_type_id AS masterTypeId, t.code AS typeCode, v.code, v.label, v.sort_order AS sortOrder
      FROM catalog_master_value v
      INNER JOIN catalog_master_type t ON v.master_type_id = t.id
      ORDER BY t.sort_order, v.sort_order
    `,
    )
    .all();
  return { types, values };
};

exports.resolveMasterValueIdSqlite = (typeCode, valueCode) => {
  if (!valueCode || !typeCode) return null;
  const db = getDb();
  const row = db
    .prepare(
      `
    SELECT v.id FROM catalog_master_value v
    INNER JOIN catalog_master_type t ON v.master_type_id = t.id
    WHERE t.code = ? AND LOWER(TRIM(v.code)) = LOWER(TRIM(?))
    `,
    )
    .get(typeCode, String(valueCode));
  return row?.id ?? null;
};

exports.nextAssetIdSqlite = (familyKey) => {
  const db = getDb();
  const { ASSET_FAMILY_PREFIX } = require("../config/sqlite");
  const fk = String(familyKey || "").toLowerCase();
  const prefix =
    ASSET_FAMILY_PREFIX[fk] ||
    fk
      .slice(0, 3)
      .toUpperCase()
      .replace(/[^A-Z]/g, "X")
      .padEnd(3, "X")
      .slice(0, 3);
  const like = `${prefix}-%`;
  const rows = db
    .prepare("SELECT id FROM assets WHERE id LIKE ? ORDER BY id DESC")
    .all(like);
  let maxNum = 0;
  const re = new RegExp(`^${prefix}-(\\d+)$`, "i");
  rows.forEach(({ id }) => {
    const m = String(id).match(re);
    if (m) maxNum = Math.max(maxNum, parseInt(m[1], 10));
  });
  return `${prefix}-${String(maxNum + 1).padStart(3, "0")}`;
};

exports.refreshFamilyStatsSqlite = (familyKey) => {
  const db = getDb();
  const fk = String(familyKey).toLowerCase();
  const row = db
    .prepare(
      `
    SELECT 
      COUNT(*) AS assets,
      COALESCE(SUM(stats_deploys), 0) AS deploys,
      SUM(CASE WHEN (${BATTLE_TESTED_SQL.replace(/\n/g, " ")}) THEN 1 ELSE 0 END) AS bt
    FROM assets WHERE LOWER(family) = ?
    `,
    )
    .get(fk);
  db.prepare(
    `UPDATE families SET stats_assets = ?, stats_deploys = ?, stats_battle_tested = ? WHERE LOWER(key) = ?`,
  ).run(row.assets, row.deploys, row.bt || 0, fk);
};

exports.assetCreateSqlite = (body, actor = {}) => {
  const db = getDb();
  const family = String(body.family || "")
    .trim()
    .toLowerCase();
  const famRow = db
    .prepare("SELECT key FROM families WHERE LOWER(key)=?")
    .get(family);
  if (!famRow)
    throw { statusCode: 400, message: `Unknown family '${body.family}'` };

  const maturityCode = String(body.maturity || "experimental")
    .trim()
    .toLowerCase();
  const mid = exports.resolveMasterValueIdSqlite("MATURITY", maturityCode);
  if (!mid)
    throw { statusCode: 400, message: `Unknown maturity '${body.maturity}'` };

  let effort = String(body.effort || "medium")
    .trim()
    .toLowerCase();
  let eid = exports.resolveMasterValueIdSqlite("EFFORT", effort);
  if (!eid) {
    effort = "medium";
    eid = exports.resolveMasterValueIdSqlite("EFFORT", "medium");
  }

  const cloudsIn = Array.isArray(body.clouds) ? body.clouds : [];
  const cloudsNorm = [
    ...new Set(
      cloudsIn.map((c) => String(c).trim().toLowerCase()).filter(Boolean),
    ),
  ];
  for (const c of cloudsNorm) {
    if (!exports.resolveMasterValueIdSqlite("CLOUD", c))
      throw { statusCode: 400, message: `Unknown cloud '${c}'` };
  }

  const id = body.id
    ? String(body.id).trim().toUpperCase()
    : exports.nextAssetIdSqlite(family);
  if (db.prepare("SELECT 1 FROM assets WHERE UPPER(id)=?").get(id))
    throw { statusCode: 409, message: `Asset id '${id}' already exists` };

  const name = String(body.name || "").trim();
  if (!name) throw { statusCode: 400, message: "Asset name is required" };

  const desc = String(body.desc || "").trim();
  const maturityText =
    db.prepare("SELECT code FROM catalog_master_value WHERE id=?").get(mid)
      ?.code || maturityCode;
  const effortText = eid
    ? db.prepare("SELECT code FROM catalog_master_value WHERE id=?").get(eid)
        ?.code || effort
    : effort;

  const demoReady =
    body.demoReady === true || body.demoReady === "true" || body.demoReady === 1
      ? 1
      : 0;
  const solution = String(body.solution || "").trim();
  const owner = String(body.owner || actor.name || "").trim() || "";
  const ownerInitials =
    String(body.ownerInitials || "").trim() ||
    owner
      .split(/\s+/)
      .filter(Boolean)
      .map((p) => p[0])
      .join("")
      .toUpperCase()
      .slice(0, 3);
  const statsD = Math.max(0, parseInt(body.statsDeploys, 10) || 0);
  const statsS = Math.max(0, parseInt(body.statsStars, 10) || 0);

  db.prepare(
    `
    INSERT INTO assets (id, name, desc, family, clouds, maturity, maturity_master_id, effort, effort_master_id, demoReady,
      solution, owner, ownerInitials, stats_deploys, stats_stars)
    VALUES (@id, @name, @desc, @family, @clouds, @maturity, @mid, @effort, @eid, @demoReady,
      @solution, @owner, @oin, @sd, @ss)
  `,
  ).run({
    id,
    name,
    desc,
    family,
    clouds: JSON.stringify(cloudsNorm),
    maturity: maturityText,
    mid,
    effort: effortText,
    eid: eid ?? null,
    demoReady,
    solution,
    owner,
    oin: ownerInitials,
    sd: statsD,
    ss: statsS,
  });

  exports.refreshFamilyStatsSqlite(family);
  exports.activityLogSqlite({
    actorName: actor.name || actor.email || "User",
    email: actor.email || "",
    action: "created",
    resourceType: "asset",
    description: id,
  });

  return exports.assetByIdSqlite(id);
};

function unlinkUploadRelpath(rel) {
  const s = String(rel || "")
    .trim()
    .replace(/^\/+/, "");
  if (!s) return;
  try {
    const full = path.join(process.cwd(), "data", "uploads", s);
    if (fs.existsSync(full)) fs.unlinkSync(full);
  } catch (_) {
    /* ignore */
  }
}

exports.assetSetDemoVideoSqlite = (assetId, relativePath) => {
  const db = getDb();
  const uid = String(assetId).toUpperCase();
  const row = db
    .prepare("SELECT demo_video_relpath FROM assets WHERE UPPER(id)=?")
    .get(uid);
  if (!row) throw { statusCode: 404, message: `Asset '${assetId}' not found` };
  const prev = String(row.demo_video_relpath || "").trim();
  if (prev && prev !== relativePath) unlinkUploadRelpath(prev);
  db.prepare(
    "UPDATE assets SET demo_video_relpath = ?, demoReady = 1, stats_demos = 1 WHERE UPPER(id)=?",
  ).run(relativePath, uid);
  return exports.assetByIdSqlite(uid);
};

exports.registrationSetDemoVideoSqlite = (registrationId, relativePath) => {
  const db = getDb();
  const uid = String(registrationId).toUpperCase();
  const row = db
    .prepare(
      "SELECT demo_video_relpath FROM registrations WHERE UPPER(registrationId)=?",
    )
    .get(uid);
  if (!row)
    throw {
      statusCode: 404,
      message: `Registration '${registrationId}' not found`,
    };
  const prev = String(row.demo_video_relpath || "").trim();
  if (prev && prev !== relativePath) unlinkUploadRelpath(prev);
  db.prepare(
    "UPDATE registrations SET demo_video_relpath=? WHERE UPPER(registrationId)=?",
  ).run(relativePath, uid);
  return exports.registrationByIdSqlite(uid);
};

exports.registrationAppendAttachmentsSqlite = (registrationId, metas) => {
  const db = getDb();
  const uid = String(registrationId).toUpperCase();
  const row = db
    .prepare(
      "SELECT submission_attachments FROM registrations WHERE UPPER(registrationId)=?",
    )
    .get(uid);
  if (!row)
    throw {
      statusCode: 404,
      message: `Registration '${registrationId}' not found`,
    };
  const cur = parseJson(row.submission_attachments, []);
  const merged = [...cur, ...metas];
  db.prepare(
    "UPDATE registrations SET submission_attachments=? WHERE UPPER(registrationId)=?",
  ).run(JSON.stringify(merged), uid);
  return exports.registrationByIdSqlite(uid);
};

/** When governance sets status to approved, enrich the pre-inserted catalogue asset with full details.
 * The asset was already created in registrationCreateSqlite, so we UPDATE instead of INSERT. */
exports.tryPromoteApprovedRegistrationSqlite = (
  registrationId,
  updatedByName,
) => {
  const db = getDb();
  const uid = String(registrationId).toUpperCase();
  const r = db
    .prepare("SELECT * FROM registrations WHERE UPPER(registrationId)=?")
    .get(uid);
  if (!r || r.status !== "approved") return null;

  // Find the pre-inserted asset linked to this submission
  const existingAsset = db
    .prepare("SELECT id FROM assets WHERE submission_id=?")
    .get(r.registrationId);

  let clouds = [];
  const c = String(r.cloud || "")
    .trim()
    .toLowerCase();
  if (c && exports.resolveMasterValueIdSqlite("CLOUD", c)) clouds = [c];
  else clouds = ["gcp"];

  const demoRel = String(r.demo_video_relpath || "").trim();
  const tags = String(r.tags || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const preq = String(r.prerequisites || "")
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const arch =
    String(r.architecture || "").trim() || String(r.gitUrl || "").trim() || "";
  const qs = String(r.quickStart || "").trim();
  const subsAtt = parseJson(r.submission_attachments, []);

  let aid;

  if (existingAsset) {
    // Update the existing pre-inserted asset: clear submission_status (it's now approved / full catalogue)
    aid = existingAsset.id;
    db.prepare(
      `
      UPDATE assets SET
        submission_status = NULL,
        clouds = ?,
        demoReady = ?,
        demo_video_relpath = ?,
        attachments = ?,
        tags = ?,
        prerequisites = ?,
        architecture = ?,
        quickStart = ?
      WHERE id = ?
    `,
    ).run(
      JSON.stringify(clouds),
      demoRel ? 1 : 0,
      demoRel || "",
      JSON.stringify(subsAtt),
      JSON.stringify(tags),
      JSON.stringify(preq),
      arch,
      qs,
      aid,
    );
    if (demoRel) {
      db.prepare("UPDATE assets SET stats_demos=1 WHERE id=?").run(aid);
    }
  } else {
    // Fallback: no pre-inserted asset found — create it now (old behaviour)
    if (String(r.promoted_asset_id || "").trim()) return r.promoted_asset_id;
    const actor = { name: updatedByName || "Governance", email: "" };
    const body = {
      family: String(r.family || "").toLowerCase(),
      name: r.name,
      desc: String(r.description || ""),
      clouds,
      maturity: String(r.maturity || "experimental").toLowerCase(),
      effort: "medium",
      demoReady: !!demoRel,
      solution: "",
      owner: String(r.owner || r.submitedBy || "").trim() || "Catalogue",
    };
    let created;
    try {
      created = exports.assetCreateSqlite(body, actor);
    } catch (e) {
      console.error(
        "tryPromoteApprovedRegistrationSqlite assetCreateSqlite",
        e.message || e,
      );
      throw e;
    }
    aid = created.id;
    if (demoRel) {
      db.prepare(
        "UPDATE assets SET demo_video_relpath=?, demoReady=1, stats_demos=1 WHERE id=?",
      ).run(demoRel, aid);
    }
    if (subsAtt.length)
      db.prepare("UPDATE assets SET attachments=? WHERE id=?").run(
        JSON.stringify(subsAtt),
        aid,
      );
    if (tags.length)
      db.prepare("UPDATE assets SET tags=? WHERE id=?").run(
        JSON.stringify(tags),
        aid,
      );
    db.prepare(
      "UPDATE assets SET prerequisites=?, architecture=?, quickStart=? WHERE id=?",
    ).run(JSON.stringify(preq), arch, qs, aid);
  }

  db.prepare(
    "UPDATE registrations SET promoted_asset_id=? WHERE registrationId=?",
  ).run(aid, r.registrationId);
  exports.refreshFamilyStatsSqlite(String(r.family || "").toLowerCase());
  return aid;
};

exports.registrationDistinctStatusesSqlite = () =>
  getDb()
    .prepare("SELECT DISTINCT status FROM registrations ORDER BY status")
    .all()
    .map((r) => r.status);

exports.recomputeAllFamilyStatsSqlite = () => {
  const db = getDb();
  const keys = db.prepare("SELECT key FROM families").all();
  keys.forEach(({ key }) => exports.refreshFamilyStatsSqlite(key));
};

exports.userByEmailSqlite = (email) =>
  getDb()
    .prepare(
      "SELECT email, name, role FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1",
    )
    .get(String(email || "").trim());

exports.assetsListSqlite = (filters = {}) => {
  const db = getDb();
  const where = [];
  const params = [];
  if (filters.family) {
    where.push("LOWER(family) = LOWER(?)");
    params.push(filters.family);
  }
  if (filters.maturity) {
    where.push("LOWER(maturity) = LOWER(?)");
    params.push(filters.maturity);
  }
  if (filters.submissionStatus) {
    where.push("submission_status = ?");
    params.push(filters.submissionStatus);
  }
  if (filters.demoReady !== undefined && filters.demoReady !== "") {
    where.push("demoReady = ?");
    params.push(filters.demoReady === "true" ? 1 : 0);
  }
  if (filters.cloud) {
    const clouds = filters.cloud.split(",").map((c) => c.trim().toLowerCase());
    clouds.forEach((c) => {
      where.push("LOWER(clouds) LIKE ?");
      params.push(`%"${c}"%`);
    });
  }
  if (filters.q) {
    where.push(
      "(LOWER(name) LIKE ? OR LOWER(desc) LIKE ? OR LOWER(id) LIKE ?)",
    );
    const like = `%${String(filters.q).toLowerCase()}%`;
    params.push(like, like, like);
  }
  const sql = `SELECT * FROM assets ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY id`;
  return db
    .prepare(sql)
    .all(...params)
    .map(mapAssetRow);
};

exports.assetsStatsSqlite = () => {
  const db = getDb();
  const totalAssets = db.prepare("SELECT COUNT(*) AS c FROM assets").get().c;
  const battleTested = db
    .prepare(`SELECT COUNT(*) AS c FROM assets WHERE ${BATTLE_TESTED_SQL}`)
    .get().c;
  const demoReady = db
    .prepare("SELECT COUNT(*) AS c FROM assets WHERE demoReady=1")
    .get().c;
  const agg = db.prepare("SELECT SUM(stats_deploys) AS t FROM assets").get();
  const topAssets = db
    .prepare("SELECT * FROM assets ORDER BY stats_deploys DESC LIMIT 5")
    .all()
    .map(mapAssetRow);
  return {
    totalAssets,
    battleTested,
    demoReady,
    totalDeploys: agg?.t || 0,
    topAssets,
  };
};

exports.assetByIdSqlite = (id) => {
  const db = getDb();
  const uid = String(id).toUpperCase();
  const r = db.prepare("SELECT * FROM assets WHERE UPPER(id)=?").get(uid);
  if (!r) throw { statusCode: 404, message: `Asset '${id}' not found` };
  const base = mapAssetRow(r);
  const relIds = parseJson(r.related_asset_ids, [])
    .map((x) => String(x).trim().toUpperCase())
    .filter(Boolean);
  let relatedAssets = [];
  if (relIds.length) {
    const ph = relIds.map(() => "?").join(",");
    relatedAssets = db
      .prepare(
        `SELECT id, name FROM assets WHERE UPPER(id) IN (${ph}) ORDER BY id`,
      )
      .all(...relIds)
      .map((x) => ({ id: x.id, name: x.name }));
  }
  return { ...base, relatedAssets };
};

exports.assetsByFamilySqlite = (key) => {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM assets WHERE LOWER(family)=LOWER(?) ORDER BY id")
    .all(key);
  return rows.map(mapAssetRow);
};

exports.familiesListSqlite = () => {
  const db = getDb();
  return db
    .prepare("SELECT * FROM families ORDER BY key")
    .all()
    .map(mapFamilyRow);
};

exports.familyByKeySqlite = (key) => {
  const db = getDb();
  const r = db
    .prepare("SELECT * FROM families WHERE LOWER(key)=LOWER(?)")
    .get(key);
  if (!r) throw { statusCode: 404, message: `Family '${key}' not found` };
  return mapFamilyRow(r);
};

exports.registrationsListSqlite = (status) => {
  const db = getDb();
  const rows = status
    ? db
        .prepare(
          "SELECT * FROM registrations WHERE status=? ORDER BY date DESC",
        )
        .all(status)
    : db.prepare("SELECT * FROM registrations ORDER BY date DESC").all();
  return rows.map(mapRegistrationRow);
};

exports.nextRegistrationIdSqlite = () => {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT registrationId FROM registrations ORDER BY id DESC LIMIT 1",
    )
    .get();
  if (!row) return "REG-001";
  const n = parseInt(String(row.registrationId).replace(/\D/g, ""), 10) + 1;
  return `REG-${String(n).padStart(3, "0")}`;
};

exports.registrationCreateSqlite = ({
  registrationId,
  name,
  family,
  description,
  submitedBy,
  owner,
  team,
  coContributors,
  version,
  cloud,
  maturity,
  gitUrl,
  architecture,
  prerequisites,
  tags,
  quickStart,
}) => {
  const db = getDb();
  const now = new Date().toISOString();
  const initialHistory = [
    {
      status: "ai-review",
      timestamp: now,
      changedBy: submitedBy || "System",
      note: "Submitted for AI review",
    },
  ];
  db.prepare(
    `
    INSERT INTO registrations (
      registrationId, name, family, description, submitedBy, date, status, aiFindings, statusHistory,
      owner, team, coContributors, version, cloud, maturity, gitUrl, architecture, prerequisites, tags, quickStart
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `,
  ).run(
    registrationId,
    name,
    family.toLowerCase(),
    description || "",
    submitedBy || "System",
    now,
    "ai-review",
    "[]",
    JSON.stringify(initialHistory),
    owner || "",
    team || "",
    coContributors || "",
    version || "",
    cloud || "",
    maturity || "experimental",
    gitUrl || "",
    architecture || "",
    prerequisites || "",
    tags || "",
    quickStart || "",
  );

  // ── Immediately insert a catalogue asset so the submission is visible in the
  //    Catalog page. submission_status tracks the pipeline state; it clears to
  //    null once the asset is fully approved via tryPromoteApprovedRegistrationSqlite.
  try {
    const fk = String(family || "").toLowerCase();
    const famRow = db
      .prepare("SELECT key FROM families WHERE LOWER(key)=?")
      .get(fk);
    if (famRow) {
      const assetId = exports.nextAssetIdSqlite(fk);
      const maturityCode = String(maturity || "experimental")
        .trim()
        .toLowerCase();
      const mid =
        exports.resolveMasterValueIdSqlite("MATURITY", maturityCode) ||
        exports.resolveMasterValueIdSqlite("MATURITY", "experimental");
      const eid = exports.resolveMasterValueIdSqlite("EFFORT", "medium");

      // Normalise cloud: use a single cloud if valid, else default to gcp
      const cloudNorm = String(cloud || "")
        .trim()
        .toLowerCase();
      const cloudValid =
        cloudNorm && exports.resolveMasterValueIdSqlite("CLOUD", cloudNorm)
          ? [cloudNorm]
          : ["gcp"];

      const ownerName = String(owner || submitedBy || "").trim();
      const ownerInitials = ownerName
        .split(/\s+/)
        .filter(Boolean)
        .map((p) => p[0])
        .join("")
        .toUpperCase()
        .slice(0, 3);

      const tagsArr = String(tags || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const preqArr = String(prerequisites || "")
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter(Boolean);

      db.prepare(
        `
        INSERT INTO assets (
          id, name, desc, family, clouds, maturity, maturity_master_id,
          effort, effort_master_id, demoReady, solution, owner, ownerInitials,
          architecture, quickStart, prerequisites, tags,
          stats_deploys, stats_stars, submission_status, submission_id
        ) VALUES (
          @id, @name, @desc, @family, @clouds, @maturity, @mid,
          'medium', @eid, 0, '', @owner, @oin,
          @arch, @qs, @preq, @tags,
          0, 0, 'ai-review', @subId
        )
      `,
      ).run({
        id: assetId,
        name,
        desc: description || "",
        family: fk,
        clouds: JSON.stringify(cloudValid),
        maturity: maturityCode,
        mid: mid || null,
        eid: eid || null,
        owner: ownerName,
        oin: ownerInitials,
        arch: String(architecture || "").trim(),
        qs: String(quickStart || "").trim(),
        preq: JSON.stringify(preqArr),
        tags: JSON.stringify(tagsArr),
        subId: registrationId,
      });

      // Link the new asset id back to the registration
      db.prepare(
        "UPDATE registrations SET promoted_asset_id=? WHERE registrationId=?",
      ).run(assetId, registrationId);
      exports.refreshFamilyStatsSqlite(fk);
    }
  } catch (e) {
    // Asset insert is best-effort — registration itself is already saved
    console.error(
      "registrationCreateSqlite: asset pre-insert failed:",
      e.message,
    );
  }

  simulateAIReviewSqlite(registrationId);

  return { id: registrationId, status: "ai-review" };
};

function simulateAIReviewSqlite(registrationId) {
  setTimeout(() => {
    try {
      const db = getDb();
      const score = Math.floor(Math.random() * 30) + 70;
      const findings =
        score >= 85
          ? [
              {
                category: "Security",
                status: "pass",
                detail: "No obvious security flags found",
              },
              {
                category: "Docs",
                status: "pass",
                detail: "Documentation looks complete",
              },
            ]
          : [
              {
                category: "Docs",
                status: "warn",
                detail: "Missing prerequisites section",
              },
              {
                category: "Architecture",
                status: "warn",
                detail: "Architecture diagram recommended",
              },
            ];
      const statusNew = score >= 85 ? "governance" : "remediation";
      const row = db
        .prepare("SELECT * FROM registrations WHERE registrationId=?")
        .get(registrationId);
      if (!row) return;
      const hist = parseJson(row.statusHistory, []);
      hist.push({
        status: statusNew,
        changedBy: "AI Engine",
        note: `AI score: ${score}/100`,
        timestamp: new Date().toISOString(),
      });
      db.prepare(
        `
        UPDATE registrations SET aiScore=?, aiFindings=?, status=?, statusHistory=?
        WHERE registrationId=?
      `,
      ).run(
        score,
        JSON.stringify(findings),
        statusNew,
        JSON.stringify(hist),
        registrationId,
      );
      // Keep the pre-inserted catalogue asset's submission_status in sync
      db.prepare(
        "UPDATE assets SET submission_status=? WHERE submission_id=?",
      ).run(statusNew, registrationId);
    } catch (e) {
      console.error("simulateAIReviewSqlite", e.message);
    }
  }, 3000);
}

exports.registrationByIdSqlite = (id) => {
  const db = getDb();
  const uid = String(id).toUpperCase();
  const r = db
    .prepare("SELECT * FROM registrations WHERE UPPER(registrationId)=?")
    .get(uid);
  if (!r) throw { statusCode: 404, message: `Registration '${id}' not found` };
  return mapRegistrationRow(r);
};

exports.registrationUpdateSqlite = (id, updates, updatedBy) => {
  const db = getDb();
  const uid = String(id).toUpperCase();
  const row = db
    .prepare("SELECT * FROM registrations WHERE UPPER(registrationId)=?")
    .get(uid);
  if (!row)
    throw { statusCode: 404, message: `Registration '${id}' not found` };

  const status = updates.status !== undefined ? updates.status : row.status;
  const aiScore = updates.aiScore !== undefined ? updates.aiScore : row.aiScore;
  let aiFindings = row.aiFindings;
  if (updates.aiFindings !== undefined)
    aiFindings = JSON.stringify(updates.aiFindings);
  const govReviewer =
    updates.govReviewer !== undefined ? updates.govReviewer : row.govReviewer;
  const govNotes =
    updates.govNotes !== undefined ? updates.govNotes : row.govNotes;

  let hist = parseJson(row.statusHistory, []);
  if (updates.status) {
    hist = hist.concat([
      {
        status: updates.status,
        timestamp: new Date().toISOString(),
        changedBy: updatedBy || "System",
        note: updates.govNotes || "",
      },
    ]);
  }

  db.prepare(
    `
    UPDATE registrations SET status=?, aiScore=?, aiFindings=?, govReviewer=?, govNotes=?, statusHistory=?
    WHERE registrationId=?
  `,
  ).run(
    status,
    aiScore,
    aiFindings,
    govReviewer,
    govNotes,
    JSON.stringify(hist),
    row.registrationId,
  );

  // Keep the pre-inserted catalogue asset's submission_status in sync with pipeline state
  if (updates.status) {
    const newAssetStatus =
      updates.status === "approved" ? null : updates.status;
    db.prepare(
      "UPDATE assets SET submission_status=? WHERE submission_id=?",
    ).run(newAssetStatus, row.registrationId);
  }

  if (updates.status === "approved") {
    try {
      exports.tryPromoteApprovedRegistrationSqlite(
        row.registrationId,
        updatedBy,
      );
    } catch (e) {
      console.error("Promotion to catalogue failed:", e.message || e);
    }
  }

  return exports.registrationByIdSqlite(row.registrationId);
};

exports.activityLogSqlite = ({
  userId = null,
  actorName,
  email = "",
  action,
  resourceType,
  description,
}) => {
  try {
    getDb()
      .prepare(
        "INSERT INTO activities (userId, name, email, action, resourceType, description) VALUES (?,?,?,?,?,?)",
      )
      .run(
        userId || null,
        actorName || "System",
        email,
        action,
        resourceType || "other",
        description || null,
      );
  } catch (e) {
    console.error("activityLogSqlite", e.message);
  }
};

exports.recentActivitiesSqlite = (limit = 15) =>
  getDb()
    .prepare(
      "SELECT name, action, description, resourceType, createdAt FROM activities ORDER BY createdAt DESC LIMIT ?",
    )
    .all(Number(limit))
    .map((r) => ({
      name: r.name,
      action: r.action,
      description: r.description,
      resourceType: r.resourceType,
      createdAt: r.createdAt,
    }));

exports.dashboardStatsSqlite = () => {
  const db = getDb();
  const totalAssets = db.prepare("SELECT COUNT(*) AS c FROM assets").get().c;
  const battleTested = db
    .prepare(`SELECT COUNT(*) AS c FROM assets WHERE ${BATTLE_TESTED_SQL}`)
    .get().c;
  const demoReady = db
    .prepare("SELECT COUNT(*) AS c FROM assets WHERE demoReady=1")
    .get().c;
  const deploySum =
    db.prepare("SELECT SUM(stats_deploys) AS t FROM assets").get().t || 0;
  const pendingSubmissions = db
    .prepare(
      "SELECT COUNT(*) AS c FROM registrations WHERE status IN ('ai-review','governance','remediation')",
    )
    .get().c;

  // notices and app_meta are created by applyCanonicalDemoUpserts — safe fallback in case of fresh DB
  let notices = [];
  try {
    const noticesRows = db
      .prepare(
        "SELECT headline, detail FROM notices WHERE active=1 ORDER BY sort_order, id",
      )
      .all();
    notices = noticesRows.map((row) => ({
      headline: row.headline,
      detail: row.detail,
    }));
  } catch (_) {
    // table may not exist yet on first init before seed runs
  }

  let deployMomPercent = null;
  try {
    const metaMom = db
      .prepare("SELECT value FROM app_meta WHERE key='mom_deploy_pct'")
      .get();
    deployMomPercent =
      metaMom?.value !== undefined ? Number(metaMom.value) || null : null;
  } catch (_) {
    // table may not exist yet on first init before seed runs
  }

  const familyCountDistinct =
    db
      .prepare(
        "SELECT COUNT(DISTINCT TRIM(LOWER(family))) AS c FROM assets WHERE TRIM(COALESCE(family,'')) != ''",
      )
      .get().c || 0;

  const families = exports.familiesListSqlite();
  return {
    totalAssets,
    battleTested,
    demoReady,
    totalDeploys: deploySum,
    pendingSubmissions,
    notices,
    familyCountDistinct,
    deployMomPercent,
    families,
  };
};

exports.popularAssetsSqlite = (limit) =>
  getDb()
    .prepare("SELECT * FROM assets ORDER BY stats_deploys DESC LIMIT ?")
    .all(Number(limit))
    .map(mapAssetRow);

exports.searchSuggestionsSqlite = (q) => {
  const db = getDb();
  const qt = String(q || "").trim();
  if (!qt) return { assets: [], families: [] };
  const term = `%${qt.toLowerCase()}%`;
  const assets = db
    .prepare(
      "SELECT id, name, family FROM assets WHERE LOWER(name) LIKE ? OR LOWER(id) LIKE ? LIMIT 6",
    )
    .all(term, term)
    .map((a) => ({ id: a.id, name: a.name, family: a.family, type: "asset" }));
  const families = db
    .prepare(
      "SELECT key AS id, name, tagline FROM families WHERE LOWER(name) LIKE ? LIMIT 4",
    )
    .all(term)
    .map((f) => ({
      id: f.id,
      name: f.name,
      tagline: f.tagline,
      type: "family",
    }));
  return { assets, families };
};

exports.pendingSubmissionCountSqlite = () =>
  getDb()
    .prepare(
      "SELECT COUNT(*) AS c FROM registrations WHERE status IN ('ai-review','governance','remediation')",
    )
    .get().c;

/** GET /users — same shape as Mongoose lean: { _id, email, name, role } */
exports.directoryUsersSqlite = (role) => {
  const db = getDb();
  const rows = role
    ? db
        .prepare(
          "SELECT id, email, name, role FROM users WHERE LOWER(role)=LOWER(?) ORDER BY email",
        )
        .all(role)
    : db
        .prepare("SELECT id, email, name, role FROM users ORDER BY email")
        .all();
  return rows.map((r) => ({
    _id: String(r.id),
    email: r.email,
    name: r.name,
    role: r.role,
  }));
};

exports.analyticsSummarySqlite = () => {
  const db = getDb();
  const totalDeploys =
    db.prepare("SELECT SUM(stats_deploys) AS t FROM assets").get().t || 0;
  const totalAssets = db.prepare("SELECT COUNT(*) AS c FROM assets").get().c;
  const battleTested = db
    .prepare(`SELECT COUNT(*) AS c FROM assets WHERE ${BATTLE_TESTED_SQL}`)
    .get().c;
  const registeredCount = db
    .prepare("SELECT COUNT(*) AS c FROM registrations")
    .get().c;
  const familyBreakdown = db
    .prepare(
      `
      SELECT family AS _id, COUNT(*) AS count, SUM(stats_deploys) AS deploys
      FROM assets GROUP BY family ORDER BY deploys DESC
    `,
    )
    .all();
  const topAssets = db
    .prepare(
      "SELECT id, name, family, stats_deploys FROM assets ORDER BY stats_deploys DESC LIMIT 5",
    )
    .all()
    .map((x) => ({
      id: x.id,
      name: x.name,
      family: x.family,
      stats: { deploys: x.stats_deploys },
    }));
  const topContributors = db
    .prepare(
      `SELECT submitedBy AS _id, COUNT(*) AS count FROM registrations
       WHERE submitedBy IS NOT NULL AND TRIM(submitedBy) != ''
       GROUP BY submitedBy ORDER BY count DESC LIMIT 5`,
    )
    .all();
  const now = new Date();
  const MONTH_NAMES = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const trend = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const count = db
      .prepare(
        `SELECT COUNT(*) AS c FROM registrations
         WHERE CAST(strftime('%Y', date) AS INT)=? AND CAST(strftime('%m', date) AS INT)=?`,
      )
      .get(d.getFullYear(), d.getMonth() + 1).c;
    trend.push({ month: MONTH_NAMES[d.getMonth()], count });
  }

  return {
    totalDeploys,
    totalAssets,
    battleTested,
    registeredCount,
    familyBreakdown,
    topAssets,
    monthlyTrend: trend,
    topContributors,
  };
};
