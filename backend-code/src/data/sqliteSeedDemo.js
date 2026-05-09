/**
 * Canonical demo catalogue for SQLite: upserts on API init keep UI + analytics DB-backed.
 * Bump DEMO_SEED_VERSION in sqlite.js when you change payloads so migrations can react.
 */

const DEMO_SEED_VERSION = "3";

const ATL002_QUICKSTART = `# Workspace path after access grant
cd data-lifecycle

# Install dependencies
pip install -r requirements.txt

# Configure and run
python setup.py --env=gcp --project=YOUR_PROJECT
python run_pipeline.py --mode=batch`;

/** Rows match assets table (+ JSON string columns as stored in SQLite). */
const DEMO_ASSETS = [
  {
    id: "ATL-001",
    name: "RAG Pipeline Patterns",
    desc: "Production ingestion, chunking, embedding, and retrieval pipelines.",
    family: "atlas",
    clouds: '["gcp","aws"]',
    maturity: "battle-tested",
    effort: "medium",
    demoReady: 1,
    solution: "AI Ready Data Estate",
    owner: "Vikram Nair",
    ownerInitials: "VN",
    stats_deploys: 42,
    stats_stars: 12,
    stats_demos: 3,
    stats_projects: 6,
    stats_rating: 91,
    tags: '["RAG","Vector","Embedding","Retrieval"]',
    prerequisites: '["GCP project","Network egress for APIs"]',
    changelog: '["v1.2 — Added hybrid search","v1.1 — Chunking presets"]',
    quickStart: "",
    attachments: "[]",
    related_asset_ids: '["ATL-002","RLY-001"]',
  },
  {
    id: "ATL-002",
    name: "Data Lifecycle v1.2",
    desc: "Data quality agent, pipeline monitoring, metadata on BigQuery/Dataflow.",
    family: "atlas",
    clouds: '["gcp"]',
    maturity: "battle-tested",
    effort: "medium",
    demoReady: 1,
    solution: "AI Ready Data Estate",
    owner: "Anika Desai",
    ownerInitials: "AD",
    stats_deploys: 28,
    stats_stars: 9,
    stats_demos: 4,
    stats_projects: 9,
    stats_rating: 94,
    tags: '["ETL","Data Ops","Governance","BigQuery","Dataflow","Batch","Streaming","Data Quality","Observability","GCP"]',
    prerequisites:
      '["Python 3.9+","GCP project with Dataflow API enabled","Service account with BigQuery Editor role","Apache Beam 2.45+"]',
    changelog: '["v1.2 — Lifecycle checkpoints","v1.0 — Initial release"]',
    quickStart: ATL002_QUICKSTART,
    attachments:
      '[{"name":"Architecture Overview.pdf","bytes":2516582},{"name":"Deployment Guide.pdf","bytes":1153434}]',
    related_asset_ids: '["ATL-001","ATL-004"]',
  },
  {
    id: "ATL-003",
    name: "Lakehouse Landing Zone",
    desc: "Opinionated storage layout and IAM bindings for curated vs raw zones.",
    family: "atlas",
    clouds: '["aws","azure"]',
    maturity: "validated",
    effort: "high",
    demoReady: 0,
    solution: "Atlas Foundation Sprint",
    owner: "Jordan Lee",
    ownerInitials: "JL",
    stats_deploys: 15,
    stats_stars: 5,
    stats_demos: 2,
    stats_projects: 4,
    stats_rating: 87,
    tags: '["Lakehouse","IAM","Landing zone"]',
    prerequisites: '["Org policy sign-off"]',
    changelog: '[]',
    quickStart: "",
    attachments: "[]",
    related_asset_ids: '["ATL-001"]',
  },
  {
    id: "ATL-004",
    name: "GCP Data Pipeline",
    desc: "Batch and streaming ingestion templates with lineage hooks.",
    family: "atlas",
    clouds: '["gcp"]',
    maturity: "validated",
    effort: "medium",
    demoReady: 1,
    solution: "AI Ready Data Estate",
    owner: "Meera Shah",
    ownerInitials: "MS",
    stats_deploys: 22,
    stats_stars: 7,
    stats_demos: 3,
    stats_projects: 5,
    stats_rating: 89,
    tags: '["Dataflow","Lineage"]',
    prerequisites: '[]',
    changelog: '[]',
    quickStart: "",
    attachments: "[]",
    related_asset_ids: '["ATL-002"]',
  },
  {
    id: "FRG-001",
    name: "Role Prompt Libraries",
    desc: "Curated prompt sets for developer, architect, QA, and PM personas.",
    family: "forge",
    clouds: '["aws","gcp","azure"]',
    maturity: "battle-tested",
    effort: "low",
    demoReady: 1,
    solution: "Engineering Productivity",
    owner: "Priya Sharma",
    ownerInitials: "PS",
    stats_deploys: 67,
    stats_stars: 28,
    stats_demos: 11,
    stats_projects: 18,
    stats_rating: 93,
    tags: '["Prompts","Personas"]',
    prerequisites: '[]',
    changelog: '["v3.1 — QE persona refresh"]',
    quickStart: "",
    attachments: "[]",
    related_asset_ids: '["FRG-002","FRG-003"]',
  },
  {
    id: "FRG-002",
    name: "Vibe Coding Templates",
    desc: "Standardized project scaffolds with pre-configured AI context files.",
    family: "forge",
    clouds: '["aws","gcp","azure"]',
    maturity: "battle-tested",
    effort: "low",
    demoReady: 0,
    solution: "Engineering Productivity",
    owner: "Alex Chen",
    ownerInitials: "AC",
    stats_deploys: 54,
    stats_stars: 19,
    stats_demos: 6,
    stats_projects: 12,
    stats_rating: 90,
    tags: '["Templates","DX"]',
    prerequisites: '[]',
    changelog: '[]',
    quickStart: "",
    attachments: "[]",
    related_asset_ids: '["FRG-001"]',
  },
  {
    id: "FRG-003",
    name: "AI Testing & Eval Framework",
    desc: "Prompt testing, LLM scoring, regression detection, CI/CD integration.",
    family: "forge",
    clouds: '["aws","gcp","azure"]',
    maturity: "validated",
    effort: "low",
    demoReady: 1,
    solution: "QE Intelligence",
    owner: "Sam Rivera",
    ownerInitials: "SR",
    stats_deploys: 41,
    stats_stars: 14,
    stats_demos: 5,
    stats_projects: 8,
    stats_rating: 88,
    tags: '["Eval","Regression","CI"]',
    prerequisites: '["CI runner quota"]',
    changelog: '[]',
    quickStart: "",
    attachments: "[]",
    related_asset_ids: '["FRG-001","SEN-002"]',
  },
  {
    id: "SEN-001",
    name: "Security & Compliance Guardrails",
    desc: "Prompt injection defense, PII detection, content filtering, audit logging.",
    family: "sentinel",
    clouds: '["aws","gcp","azure"]',
    maturity: "validated",
    effort: "low",
    demoReady: 0,
    solution: "Governance Office",
    owner: "Rina Chatterjee",
    ownerInitials: "RC",
    stats_deploys: 28,
    stats_stars: 9,
    stats_demos: 4,
    stats_projects: 7,
    stats_rating: 92,
    tags: '["Safety","Compliance","Audit"]',
    prerequisites: '["Logging sink"]',
    changelog: '[]',
    quickStart: "",
    attachments: "[]",
    related_asset_ids: '["SEN-002"]',
  },
  {
    id: "SEN-002",
    name: "Observability & Monitoring",
    desc: "OpenTelemetry tracing, cost tracking, latency & quality drift detection.",
    family: "sentinel",
    clouds: '["aws","gcp","azure"]',
    maturity: "validated",
    effort: "medium",
    demoReady: 1,
    solution: "Cost & Reliability",
    owner: "Olivia Tran",
    ownerInitials: "OT",
    stats_deploys: 33,
    stats_stars: 11,
    stats_demos: 6,
    stats_projects: 9,
    stats_rating: 90,
    tags: '["OTel","SLO"]',
    prerequisites: '[]',
    changelog: '[]',
    quickStart: "",
    attachments: "[]",
    related_asset_ids: '["FRG-003"]',
  },
  {
    id: "RLY-001",
    name: "IT Ops Agent",
    desc: "Runbook automation, incident triage, log analysis with IaC deployment.",
    family: "relay",
    clouds: '["aws","gcp"]',
    maturity: "validated",
    effort: "medium",
    demoReady: 1,
    solution: "Service Ops AI",
    owner: "Suresh Patel",
    ownerInitials: "SP",
    stats_deploys: 14,
    stats_stars: 6,
    stats_demos: 5,
    stats_projects: 5,
    stats_rating: 86,
    tags: '["Runbooks","IaC"]',
    prerequisites: '[]',
    changelog: '[]',
    quickStart: "",
    attachments: "[]",
    related_asset_ids: '["ATL-001"]',
  },
  {
    id: "RLY-002",
    name: "Invoice Extraction Agent",
    desc: "Layout-aware OCR and validation with ERP handoff adapters.",
    family: "relay",
    clouds: '["aws"]',
    maturity: "battle-tested",
    effort: "medium",
    demoReady: 1,
    solution: "Document AI",
    owner: "Dhanuvanth S.",
    ownerInitials: "DS",
    stats_deploys: 19,
    stats_stars: 8,
    stats_demos: 7,
    stats_projects: 7,
    stats_rating: 91,
    tags: '["OCR","ERP"]',
    prerequisites: '[]',
    changelog: '[]',
    quickStart: "",
    attachments: "[]",
    related_asset_ids: "[]",
  },
  {
    id: "RLY-003",
    name: "Customer Care Copilot Hooks",
    desc: "CRM-aligned agent tools with human-in-loop escalation tiers.",
    family: "relay",
    clouds: '["azure","aws"]',
    maturity: "experimental",
    effort: "high",
    demoReady: 0,
    solution: "CS AI",
    owner: "Neha Gupta",
    ownerInitials: "NG",
    stats_deploys: 9,
    stats_stars: 4,
    stats_demos: 2,
    stats_projects: 3,
    stats_rating: 82,
    tags: '["CRM"]',
    prerequisites: '[]',
    changelog: '[]',
    quickStart: "",
    attachments: "[]",
    related_asset_ids: "[]",
  },
  {
    id: "NXS-001",
    name: "Multi-Agent Orchestration",
    desc: "Reference architectures for supervisor, swarm, plan-execute agents.",
    family: "nexus",
    clouds: '["aws","gcp"]',
    maturity: "experimental",
    effort: "high",
    demoReady: 1,
    solution: "Shared Platform Infrastructure",
    owner: "Tanya Iyer",
    ownerInitials: "TI",
    stats_deploys: 18,
    stats_stars: 5,
    stats_demos: 4,
    stats_projects: 6,
    stats_rating: 85,
    tags: '["Agents","Orchestration"]',
    prerequisites: '[]',
    changelog: '[]',
    quickStart: "",
    attachments: "[]",
    related_asset_ids: '["NXS-002"]',
  },
  {
    id: "NXS-002",
    name: "Service Mesh Glue Kit",
    desc: "mTLS overlays, egress policies and traffic shadowing for AI services.",
    family: "nexus",
    clouds: '["aws","gcp"]',
    maturity: "experimental",
    effort: "high",
    demoReady: 0,
    solution: "Shared Platform Infrastructure",
    owner: "Chris Ng",
    ownerInitials: "CN",
    stats_deploys: 11,
    stats_stars: 4,
    stats_demos: 2,
    stats_projects: 3,
    stats_rating: 81,
    tags: '["Networking","Security"]',
    prerequisites: '[]',
    changelog: '[]',
    quickStart: "",
    attachments: "[]",
    related_asset_ids: '["NXS-001"]',
  },
  {
    id: "FRG-004",
    name: "ML Feature Store v1",
    desc: "Online/offline serving paths with drift alerts and reproducible pipelines.",
    family: "forge",
    clouds: '["aws","gcp"]',
    maturity: "battle-tested",
    effort: "high",
    demoReady: 1,
    solution: "AI & ML Foundations",
    owner: "Renju D.",
    ownerInitials: "RD",
    stats_deploys: 36,
    stats_stars: 15,
    stats_demos: 5,
    stats_projects: 10,
    stats_rating: 92,
    tags: '["Features","Serving"]',
    prerequisites: '[]',
    changelog: '[]',
    quickStart: "",
    attachments: "[]",
    related_asset_ids: '["ATL-001"]',
  },
];

/** Display names aligned with catalogue mockups — stats rebuilt from assets afterward. */
const DEMO_FAMILIES = [
  [
    "atlas",
    "Atlas",
    "Data & Context Platform",
    "Accelerators that make data AI-ready across lakehouse and operational stores.",
    '["Lakehouse","Governance","Lineage"]',
    '["Foundation sprints"]',
    '["Cloud landing zones"]',
    '["All agent families"]',
    3,
    124,
    2,
  ],
  [
    "forge",
    "Forge",
    "AI-Native Engineering Platform",
    "Prompts, scaffolds, and quality loops for accelerated delivery.",
    '["Shipping velocity","Reuse"]',
    '["Software factory programs"]',
    '["Git providers"]',
    '["Relay & Nexus"]',
    4,
    86,
    2,
  ],
  [
    "relay",
    "Relay",
    "Workflow & Agent Platform",
    "Agents and workflows for operations, docs, service, and document AI.",
    '["Operational efficiency"]',
    '["CS programmes"]',
    '["CRM & ITSM"]',
    '["Governed execution"]',
    4,
    64,
    1,
  ],
  [
    "sentinel",
    "Sentinel",
    "Governed Runtime & Managed AI Ops",
    "Safety, telemetry, compliance, and cost guardrails.",
    '["Responsible AI"]',
    '["GRC workflows"]',
    '["IAM & KMS"]',
    '["Production AI"]',
    3,
    42,
    0,
  ],
  [
    "nexus",
    "Nexus",
    "Shared Platform Infrastructure",
    "Shared networking, orchestration, and infra glue.",
    '["Platforms"]',
    '["Landing zones"]',
    '["Identity"]',
    '["Atlas & Forge workloads"]',
    2,
    18,
    0,
  ],
];

function isoDaysAgo(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
}

/** Pipeline demo rows — distinct registrationIds for upsert. */
const DEMO_REGISTRATIONS = [
  {
    registrationId: "SUB-INV-001",
    name: "Invoice Extraction Agent",
    family: "relay",
    description: "Intelligent extraction pipeline for invoices and PO matching.",
    submitedBy: "Dhanuvanth S.",
    date: isoDaysAgo(0.1),
    status: "governance",
    aiScore: 88,
    aiFindings:
      '[{"category":"Security","status":"pass","detail":"Secrets scan clean"},{"category":"Docs","status":"pass"}]',
    govReviewer: "",
    govNotes: "",
    statusHistory: `[]`,
  },
  {
    registrationId: "SUB-GLU-001",
    name: "AWS Glue Accelerator",
    family: "atlas",
    description: "ETL patterns into curated zones with DQ gates.",
    submitedBy: "Keerthana R.",
    date: isoDaysAgo(1),
    status: "governance",
    aiScore: 91,
    aiFindings: "[]",
    govReviewer: "",
    govNotes: "",
    statusHistory: "[]",
  },
  {
    registrationId: "SUB-MLF-001",
    name: "ML Feature Store v1",
    family: "forge",
    description: "Feature registry with online store and reproducible pipelines.",
    submitedBy: "Renju D.",
    date: isoDaysAgo(1.2),
    status: "governance",
    aiScore: 90,
    aiFindings: "[]",
    govReviewer: "",
    govNotes: "",
    statusHistory: "[]",
  },
  {
    registrationId: "SUB-LC-020",
    name: "Data Lifecycle v2.0",
    family: "atlas",
    description: "Lifecycle checkpoints for batch/stream with governance overlays.",
    submitedBy: "Manikandan L.",
    date: isoDaysAgo(2),
    status: "approved",
    aiScore: 93,
    aiFindings: "[]",
    govReviewer: "Governance BOT",
    govNotes: "",
    statusHistory:
      '[{"status":"approved","changedBy":"Governance","note":"Evidence complete","timestamp":"' +
      isoDaysAgo(2) +
      '"}]',
  },
  {
    registrationId: "SUB-ANA-050",
    name: "Real-time Analytics Hub",
    family: "atlas",
    description: "Low-latency analytics mesh with KPI contracts.",
    submitedBy: "Raghavendra K.",
    date: isoDaysAgo(2.1),
    status: "ai-review",
    aiScore: null,
    aiFindings: "[]",
    govReviewer: "",
    govNotes: "",
    statusHistory: `[{"status":"ai-review","changedBy":"System","note":"Submitted","timestamp":"${isoDaysAgo(2.1)}"}]`,
  },
  {
    registrationId: "SUB-CICD-090",
    name: "CI/CD Deployment Kit v3",
    family: "forge",
    description: "Progressive rollout templates for inference endpoints.",
    submitedBy: "Balram A.",
    date: isoDaysAgo(3),
    status: "remediation",
    aiScore: 68,
    aiFindings: '[{"category":"Docs","status":"warn","detail":"Missing rollback evidence"}]',
    govReviewer: "",
    govNotes: "",
    statusHistory:
      `[{"status":"remediation","changedBy":"Governance","note":"Need rollback drill","timestamp":"${isoDaysAgo(3)}"}]`,
  },
  {
    registrationId: "SUB-GCP-CO-022",
    name: "GCP Cost Optimizer",
    family: "nexus",
    description: "FinOps policies for autoscaled inference clusters.",
    submitedBy: "Swetha P.",
    date: isoDaysAgo(4),
    status: "governance",
    aiScore: 86,
    aiFindings: "[]",
    govReviewer: "",
    govNotes: "",
    statusHistory: "[]",
  },
  {
    registrationId: "SUB-SEM-033",
    name: "Semantic Search Engine",
    family: "atlas",
    description: "Hybrid lexical + semantic ranking with entitlement-aware queries.",
    submitedBy: "Abhilash V.",
    date: isoDaysAgo(5),
    status: "approved",
    aiScore: 95,
    aiFindings: "[]",
    govReviewer: "Governance",
    govNotes: "",
    statusHistory:
      `[{"status":"approved","changedBy":"Governance","timestamp":"${isoDaysAgo(5)}"}]`,
  },
];

function applyCanonicalDemoUpserts(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS notices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      headline TEXT NOT NULL,
      detail TEXT NOT NULL DEFAULT '',
      active INTEGER NOT NULL DEFAULT 1
    );
  `);

  const insMeta = database.prepare(
    "INSERT INTO app_meta (key, value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
  );
  insMeta.run("mom_deploy_pct", "12");
  insMeta.run("catalog_demo_seed_version", DEMO_SEED_VERSION);

  database.prepare("DELETE FROM notices").run();
  const insNotice = database.prepare(
    "INSERT INTO notices (sort_order, headline, detail, active) VALUES (?,?,?,1)",
  );
  [[0, "Recommendation", "Three experimental assets exceed 90d without deploy signals — review Data Lifecycle v1.2 lineage checks."],
   [1, "Trending", "Invoice Extraction Agent — spike in access_requested activity logged this week."]
  ].forEach((r) => insNotice.run(r[0], r[1], r[2]));

  const upsertAsset = database.prepare(`
    INSERT INTO assets (
      id, name, desc, family, clouds, maturity, effort, demoReady,
      solution, owner, ownerInitials, architecture,
      quickStart, prerequisites, tags, changelog,
      stats_deploys, stats_stars, stats_demos, stats_projects, stats_rating,
      attachments, related_asset_ids
    ) VALUES (
      @id, @name, @desc, @family, @clouds, @maturity, @effort, @demoReady,
      @solution, @owner, @ownerInitials, COALESCE(@architecture, ''),
      @quickStart, @prerequisites, @tags, @changelog,
      @stats_deploys, @stats_stars, @stats_demos, @stats_projects, @stats_rating,
      @attachments, @related_asset_ids
    )
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      desc = excluded.desc,
      family = excluded.family,
      clouds = excluded.clouds,
      maturity = excluded.maturity,
      effort = excluded.effort,
      demoReady = excluded.demoReady,
      solution = excluded.solution,
      owner = excluded.owner,
      ownerInitials = excluded.ownerInitials,
      architecture = excluded.architecture,
      quickStart = excluded.quickStart,
      prerequisites = excluded.prerequisites,
      tags = excluded.tags,
      changelog = excluded.changelog,
      stats_deploys = excluded.stats_deploys,
      stats_stars = excluded.stats_stars,
      stats_demos = excluded.stats_demos,
      stats_projects = excluded.stats_projects,
      stats_rating = excluded.stats_rating,
      attachments = excluded.attachments,
      related_asset_ids = excluded.related_asset_ids
  `);

  DEMO_ASSETS.forEach((a) =>
    upsertAsset.run({
      ...a,
      architecture: a.architecture || "",
    }),
  );

  const upsertFam = database.prepare(`
    INSERT INTO families (
      key, name, tagline, long_desc, use_cases, solutions, depends_on, enables,
      stats_assets, stats_deploys, stats_battle_tested
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(key) DO UPDATE SET
      name = excluded.name,
      tagline = excluded.tagline,
      long_desc = excluded.long_desc,
      use_cases = excluded.use_cases,
      solutions = excluded.solutions,
      depends_on = excluded.depends_on,
      enables = excluded.enables
  `);

  DEMO_FAMILIES.forEach((row) => upsertFam.run(row));

  const upsertReg = database.prepare(`
    INSERT INTO registrations (
      registrationId, name, family, description, submitedBy, date,
      status, aiScore, aiFindings, govReviewer, govNotes, statusHistory
    ) VALUES (
      @registrationId, @name, @family, @description, @submitedBy, @date,
      @status, @aiScore, @aiFindings, @govReviewer, @govNotes, @statusHistory
    )
    ON CONFLICT(registrationId) DO UPDATE SET
      name = excluded.name,
      family = excluded.family,
      description = excluded.description,
      submitedBy = excluded.submitedBy,
      date = excluded.date,
      status = excluded.status,
      aiScore = excluded.aiScore,
      aiFindings = excluded.aiFindings,
      govReviewer = excluded.govReviewer,
      govNotes = excluded.govNotes,
      statusHistory = excluded.statusHistory
  `);

  DEMO_REGISTRATIONS.forEach((r) => upsertReg.run(r));

  const demoActRows = database
    .prepare("SELECT COUNT(*) AS c FROM activities WHERE is_demo_seed = 1")
    .get().c;
  if (demoActRows === 0) {
    const insA = database.prepare(`
      INSERT INTO activities (name, email, action, resourceType, description, is_demo_seed)
      VALUES (?,?,?,?,?,1)
    `);
    [
      ["Governance BOT", "", "approval_batch", "pipeline", "DEMO_PIPELINE: Weekly governance queue sweep"],
      ["Abhilash V.", "abhilash.v@infovision.com", "access_requested", "asset", "DEMO_ACTIVITY: Invoice Extraction Agent"],
      ["Keerthana R.", "", "published", "asset", "DEMO_ACTIVITY: ATL-004 usage"],
      ["System", "", "indexed", "catalogue", "DEMO_ACTIVITY: Search index refresh"],
      ["Priya Sharma", "", "demo_opened", "asset", "DEMO_ACTIVITY: Role Prompt Libraries"],
      ["Telemetry", "", "deploy_recorded", "asset", "DEMO_ACTIVITY: Batch deploy rollup"],
    ].forEach((row) => insA.run(...row));
  }

  console.log(`✅ SQLite demo catalogue upserted (seed v${DEMO_SEED_VERSION}, ${DEMO_ASSETS.length} assets).`);
}

module.exports = { applyCanonicalDemoUpserts, DEMO_SEED_VERSION };
