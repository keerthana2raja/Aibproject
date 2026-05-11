/**
 * seedFromCsv.js
 * Clears all asset/registration/activity data and seeds fresh from CSV data.
 * Usage: node scripts/seedFromCsv.js
 */

require("dotenv").config();
const { createClient } = require("@libsql/client");
const path = require("path");

const db = createClient({
  url:
    process.env.TURSO_DATABASE_URL ||
    `file:${path.join(process.cwd(), "data", "aimplify.sqlite")}`,
  authToken: process.env.TURSO_AUTH_TOKEN,
  intMode: "number",
});

// ── Asset data from CSV ───────────────────────────────────────────────────────
const ASSETS = [
  {
    id: "ATL-001",
    name: "DataSmith - Tableau to Looker Migration",
    family: "atlas",
    desc: "Discovery, Migration and Validation of Tableau dashboards to Looker",
    maturity: "experimental",
    effort: "low",
    demoReady: 1,
    solution: "Migration Factory",
    owner: "Manik",
    ownerInitials: "M",
    clouds: '["gcp","azure"]',
    tags: '["Tableau","Looker","DataSmith","Migration","Agentic AI"]',
    prerequisites: '["Hosted service"]',
    quickStart: "GUI based",
    stats_deploys: 0,
    stats_demos: 0,
    stats_projects: 0,
    stats_rating: null,
  },
  {
    id: "ATL-002",
    name: "DataSmith - Synthetic Data Generator",
    family: "atlas",
    desc: "Generates tens to millions of rows synthetic data statistically modeled on given input dataset",
    maturity: "validated",
    effort: "low",
    demoReady: 1,
    solution: "Master Data & Domain Context",
    owner: "Manik",
    ownerInitials: "M",
    clouds: '["gcp"]',
    tags: '["Data Generator","Data Generation","DataSmith"]',
    prerequisites: '["Hosted service"]',
    quickStart: "GUI based",
    stats_deploys: 0,
    stats_demos: 0,
    stats_projects: 0,
    stats_rating: null,
  },
  {
    id: "FRG-001",
    name: "Sprinter",
    family: "forge",
    desc: "AI-powered SDLC bot that expands user stories, generates tasks, test cases, code snippets, and release notes via a Kanban board.",
    maturity: "validated",
    effort: "medium",
    demoReady: 0,
    solution: "Engineering Productivity Office",
    owner: "Noumika",
    ownerInitials: "N",
    clouds: '["gcp"]',
    tags: '["SDLC","Agile","User Stories","Test Cases","Code Generation","Kanban","Release Notes","GPT","JIRA"]',
    prerequisites: '["Python 3.x, Node.js, React"]',
    quickStart: "",
    stats_deploys: 0,
    stats_demos: 0,
    stats_projects: 0,
    stats_rating: null,
  },
  {
    id: "FRG-002",
    name: "Code Migration Frameworks",
    family: "forge",
    desc: "AI-assisted COBOL-to-Java and .NET-to-Node.js code migration with real-time developer Q&A and context-aware conversion.",
    maturity: "validated",
    effort: "high",
    demoReady: 0,
    solution: "Modernization Factory",
    owner: "Hebin",
    ownerInitials: "H",
    clouds: '["gcp"]',
    tags: '["COBOL","Java","Springboot","Code Migration","Legacy Modernization",".NET","Node.js","GitHub Copilot","Gemini"]',
    prerequisites: '["Python 3.x, Java 17+, Node.js 18+, COBOL runtime"]',
    quickStart: "",
    stats_deploys: 0,
    stats_demos: 0,
    stats_projects: 0,
    stats_rating: null,
  },
  {
    id: "FRG-003",
    name: "ADLC Unified Framework",
    family: "forge",
    desc: "Webhook-triggered AI code reviewer that delivers line-by-line analysis, best practice feedback, and Slack notifications on every PR.",
    maturity: "validated",
    effort: "medium",
    demoReady: 0,
    solution: "Release Acceleration",
    owner: "Praty",
    ownerInitials: "P",
    clouds: '["gcp"]',
    tags: '["Code Review","Webhook","GitLab","Slack","CI/CD","GPT-4","SDLC","Automated Review","Pull Request"]',
    prerequisites: '["Python 3.x, GitLab CI/CD, Slack SDK"]',
    quickStart: "",
    stats_deploys: 0,
    stats_demos: 0,
    stats_projects: 0,
    stats_rating: null,
  },
  {
    id: "RLY-001",
    name: "Multiagent Call Center Automation",
    family: "relay",
    desc: "LangGraph multi-agent system with 6 specialized agents automating sentiment analysis, ticketing, recommendations, and resolution.",
    maturity: "validated",
    effort: "high",
    demoReady: 0,
    solution: "Customer Care Studio",
    owner: "Gokulram",
    ownerInitials: "G",
    clouds: '["gcp"]',
    tags: '["Multi-Agent","LangGraph","Call Center","Sentiment Analysis","JIRA","Automation","Agentic AI","Orchestration","Gemini"]',
    prerequisites: '["Python 3.x, LangGraph, PostgreSQL"]',
    quickStart: "",
    stats_deploys: 0,
    stats_demos: 0,
    stats_projects: 0,
    stats_rating: null,
  },
  {
    id: "RLY-002",
    name: "Healthcare Bot",
    family: "relay",
    desc: "Dual-persona RAG chatbot for hospital environments serving both patients and staff with role-tailored, policy-aware responses.",
    maturity: "validated",
    effort: "medium",
    demoReady: 0,
    solution: "Enterprise Knowledge Assistant",
    owner: "Abhiram",
    ownerInitials: "A",
    clouds: '["gcp"]',
    tags: '["RAG","Healthcare","Dual Persona","Chroma","Redis","Embeddings","Knowledge Retrieval","Gemini","FastAPI"]',
    prerequisites: '["Python 3.x, FastAPI, Redis, Chroma"]',
    quickStart: "",
    stats_deploys: 0,
    stats_demos: 0,
    stats_projects: 0,
    stats_rating: null,
  },
  {
    id: "RLY-003",
    name: "Contextual Intelligence - Speech Diarization",
    family: "relay",
    desc: "Real-time speech diarization that structures live customer conversations and serves contextual product data and trade-in options instantly.",
    maturity: "battle-tested",
    effort: "high",
    demoReady: 0,
    solution: "Customer Care Studio",
    owner: "Veera",
    ownerInitials: "V",
    clouds: '["gcp"]',
    tags: '["Speech Diarization","Real-Time","Conversational AI","Web Scraping","Redis","LangChain","Gemini","Speaker Attribution","Cart Integration"]',
    prerequisites: '["Python 3.x, React.js, FastAPI, Redis, LangChain"]',
    quickStart: "",
    stats_deploys: 0,
    stats_demos: 0,
    stats_projects: 0,
    stats_rating: null,
  },
  {
    id: "SNT-001",
    name: "Data Policy Anomaly Bot",
    family: "sentinel",
    desc: "Natural language compliance bot that validates organizational policies against live BigQuery datasets and flags anomalies by risk severity.",
    maturity: "validated",
    effort: "medium",
    demoReady: 0,
    solution: "Ops & Governance",
    owner: "Veera",
    ownerInitials: "V",
    clouds: '["gcp"]',
    tags: '["Compliance","Policy Governance","Anomaly Detection","BigQuery","GDPR","CCPA","LangChain","GPT-4","Vector Embeddings","Risk Classification"]',
    prerequisites: '["Python 3.x, Streamlit, Google BigQuery, Azure OpenAI"]',
    quickStart: "",
    stats_deploys: 0,
    stats_demos: 0,
    stats_projects: 0,
    stats_rating: null,
  },
  {
    id: "SNT-002",
    name: "Sentiment Analysis on Call Recordings",
    family: "sentinel",
    desc: "Gemini 1.5 Pro multimodal call analyzer that detects sentiment, tone, sarcasm, and compliance violations directly from audio - no transcription needed.",
    maturity: "validated",
    effort: "medium",
    demoReady: 0,
    solution: "Customer Care Studio",
    owner: "Gokulram",
    ownerInitials: "G",
    clouds: '["gcp"]',
    tags: '["Sentiment Analysis","Call Recordings","Compliance","Tone Detection","Gemini","Multimodal","Audio Processing","Call Center","QA Monitoring"]',
    prerequisites: '["Python 3.x, LangChain, Streamlit, Gemini 1.5 Pro"]',
    quickStart: "",
    stats_deploys: 0,
    stats_demos: 0,
    stats_projects: 0,
    stats_rating: null,
  },
  {
    id: "NXS-001",
    name: "SLM vs LLM Decision Playbook",
    family: "nexus",
    desc: "A systematic framework for choosing between Small Language Models and Large Language Models based on deployment constraints and business requirements.",
    maturity: "validated",
    effort: "medium",
    demoReady: 0,
    solution: "Model & Agent Operations",
    owner: "Dhanuvanth",
    ownerInitials: "D",
    clouds: '["gcp"]',
    tags: '["LLM Benchmarking","Cost Analysis","Token Cost","Model Selection","SLM","Embeddings","LangChain","LlamaIndex","GPT"]',
    prerequisites:
      '["React, TypeScript, Vite, Tailwind CSS, Google Generative AI SDK, Supabase"]',
    quickStart: "",
    stats_deploys: 0,
    stats_demos: 0,
    stats_projects: 0,
    stats_rating: null,
  },
  {
    id: "NXS-002",
    name: "PromptEval",
    family: "nexus",
    desc: "Shared prompt evaluation framework for testing, scoring, and iterating on prompts across all platform families and LLM providers.",
    maturity: "experimental",
    effort: "low",
    demoReady: 0,
    solution: "Common Infrastructure",
    owner: "",
    ownerInitials: "",
    clouds: '["gcp"]',
    tags: '["Prompt Engineering","Evaluation","Benchmarking","Quality","LLM Testing","Regression","Prompt Management"]',
    prerequisites: '["Python 3.x, LangChain, Azure OpenAI"]',
    quickStart: "",
    stats_deploys: 0,
    stats_demos: 0,
    stats_projects: 0,
    stats_rating: null,
  },
  {
    id: "NXS-003",
    name: "LIE - LLM Insight Engine",
    family: "nexus",
    desc: "Unified multi-LLM benchmarking platform that runs concurrent queries across GPT, Mistral, Llama, Gemini and compares responses side by side.",
    maturity: "battle-tested",
    effort: "high",
    demoReady: 0,
    solution: "Model & Agent Operations",
    owner: "Noumika",
    ownerInitials: "N",
    clouds: '["gcp"]',
    tags: '["LLM Benchmarking","Multi-LLM","GPT","Mistral","Llama","Gemini","Embeddings","Model Comparison","FAISS","LangChain","LlamaIndex"]',
    prerequisites:
      '["Python 3.x, React, LangChain, LlamaIndex, PyTorch, CUDA, FAISS"]',
    quickStart: "",
    stats_deploys: 0,
    stats_demos: 0,
    stats_projects: 0,
    stats_rating: null,
  },
];

// ── Families ──────────────────────────────────────────────────────────────────
const FAMILIES = [
  [
    "atlas",
    "Atlas",
    "Data & Context Platform",
    "Accelerators that make data AI-ready across lakehouse and operational stores.",
    '["Lakehouse","Governance","Lineage"]',
    '["Foundation sprints"]',
    '["Cloud landing zones"]',
    '["All agent families"]',
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
  ],
];

async function columnExists(table, col) {
  const r = await db.execute(`PRAGMA table_info(${table})`);
  return r.rows.some((row) => row.name === col);
}

async function seed() {
  console.log("🗑  Clearing existing data...");
  await db.execute("DELETE FROM activities");
  await db.execute("DELETE FROM registrations");
  await db.execute("DELETE FROM assets");
  await db.execute("DELETE FROM notices").catch(() => {});
  await db.execute("DELETE FROM app_meta").catch(() => {});
  console.log("✅ Cleared assets, registrations, activities");

  // ── Ensure missing columns exist ──────────────────────────────────────────
  console.log("\n🔄 Checking schema columns...");
  const addA = async (col, def) => {
    if (!(await columnExists("assets", col))) {
      await db.execute(`ALTER TABLE assets ADD COLUMN ${col} ${def}`);
      console.log(`   Added assets.${col}`);
    }
  };
  await addA("stats_demos", "INTEGER NOT NULL DEFAULT 0");
  await addA("stats_projects", "INTEGER NOT NULL DEFAULT 0");
  await addA("stats_rating", "INTEGER");
  await addA("attachments", "TEXT DEFAULT '[]'");
  await addA("related_asset_ids", "TEXT DEFAULT '[]'");
  await addA("demo_video_relpath", "TEXT DEFAULT ''");
  await addA("submission_status", "TEXT DEFAULT NULL");
  await addA("submission_id", "TEXT DEFAULT NULL");
  await addA("maturity_master_id", "INTEGER");
  await addA("effort_master_id", "INTEGER");
  await addA("changelog", "TEXT DEFAULT '[]'");

  // ── Seed families ─────────────────────────────────────────────────────────
  console.log("\n🌱 Seeding families...");
  for (const [
    key,
    name,
    tagline,
    long_desc,
    use_cases,
    solutions,
    depends_on,
    enables,
  ] of FAMILIES) {
    await db.execute({
      sql: `INSERT INTO families (key, name, tagline, long_desc, use_cases, solutions, depends_on, enables)
            VALUES (?,?,?,?,?,?,?,?)
            ON CONFLICT(key) DO UPDATE SET
              name=excluded.name, tagline=excluded.tagline, long_desc=excluded.long_desc,
              use_cases=excluded.use_cases, solutions=excluded.solutions,
              depends_on=excluded.depends_on, enables=excluded.enables`,
      args: [
        key,
        name,
        tagline,
        long_desc,
        use_cases,
        solutions,
        depends_on,
        enables,
      ],
    });
  }
  console.log(`✅ ${FAMILIES.length} families seeded`);

  // ── Seed assets ───────────────────────────────────────────────────────────
  console.log("\n🌱 Seeding assets...");
  for (const a of ASSETS) {
    await db.execute({
      sql: `INSERT INTO assets (
              id, name, desc, family, clouds, maturity, effort, demoReady,
              solution, owner, ownerInitials, quickStart,
              prerequisites, tags, changelog, attachments, related_asset_ids,
              stats_deploys, stats_demos, stats_projects, stats_rating,
              submission_status, submission_id
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            ON CONFLICT(id) DO UPDATE SET
              name=excluded.name, desc=excluded.desc, family=excluded.family,
              clouds=excluded.clouds, maturity=excluded.maturity, effort=excluded.effort,
              demoReady=excluded.demoReady, solution=excluded.solution,
              owner=excluded.owner, ownerInitials=excluded.ownerInitials,
              quickStart=excluded.quickStart, prerequisites=excluded.prerequisites,
              tags=excluded.tags, changelog=excluded.changelog,
              stats_deploys=excluded.stats_deploys, stats_demos=excluded.stats_demos,
              stats_projects=excluded.stats_projects, stats_rating=excluded.stats_rating,
              submission_status=excluded.submission_status, submission_id=excluded.submission_id`,
      args: [
        a.id,
        a.name,
        a.desc,
        a.family,
        a.clouds,
        a.maturity,
        a.effort,
        a.demoReady,
        a.solution,
        a.owner,
        a.ownerInitials,
        a.quickStart,
        a.prerequisites,
        a.tags,
        "[]",
        "[]",
        "[]",
        a.stats_deploys,
        a.stats_demos,
        a.stats_projects,
        a.stats_rating ?? null,
        null,
        null,
      ],
    });
    console.log(`   ✅ ${a.id} — ${a.name}`);
  }

  // ── Backfill master IDs ───────────────────────────────────────────────────
  console.log("\n🔄 Backfilling maturity/effort master IDs...");
  await db.execute(`UPDATE assets SET maturity_master_id=(
    SELECT v.id FROM catalog_master_value v
    INNER JOIN catalog_master_type mt ON v.master_type_id=mt.id
    WHERE mt.code='MATURITY' AND LOWER(v.code)=LOWER(TRIM(assets.maturity))
  ) WHERE maturity_master_id IS NULL`);
  await db.execute(`UPDATE assets SET effort_master_id=(
    SELECT v.id FROM catalog_master_value v
    INNER JOIN catalog_master_type mt ON v.master_type_id=mt.id
    WHERE mt.code='EFFORT' AND LOWER(v.code)=LOWER(TRIM(assets.effort))
  ) WHERE effort_master_id IS NULL`);

  // ── Refresh family stats ──────────────────────────────────────────────────
  console.log("\n🔄 Refreshing family stats...");
  for (const [key] of FAMILIES) {
    const res = await db.execute({
      sql: `SELECT COUNT(*) AS assets, COALESCE(SUM(stats_deploys),0) AS deploys,
              SUM(CASE WHEN LOWER(maturity)='battle-tested' THEN 1 ELSE 0 END) AS bt
            FROM assets WHERE LOWER(family)=?`,
      args: [key],
    });
    const row = res.rows[0] || {};
    await db.execute({
      sql: "UPDATE families SET stats_assets=?, stats_deploys=?, stats_battle_tested=? WHERE key=?",
      args: [row.assets || 0, row.deploys || 0, row.bt || 0, key],
    });
  }

  // ── app_meta ──────────────────────────────────────────────────────────────
  await db.execute(
    `CREATE TABLE IF NOT EXISTS app_meta (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL)`,
  );
  await db.execute({
    sql: "INSERT INTO app_meta(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
    args: ["catalog_demo_seed_version", "csv-v1"],
  });
  await db.execute({
    sql: "INSERT INTO app_meta(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
    args: ["mom_deploy_pct", "0"],
  });

  console.log(`\n✅ Done! ${ASSETS.length} assets seeded from CSV data.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});
