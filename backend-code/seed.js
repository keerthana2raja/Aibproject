require("dotenv").config();
const { createClient } = require("@libsql/client");
const { put } = require("@vercel/blob");
const fs = require("fs");
const path = require("path");
const os = require("os");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
ffmpeg.setFfmpegPath(ffmpegPath);

// ─── Config ───────────────────────────────────────────────────────────────────
const MAX_VIDEO_MB = 50;  // compress any video larger than this

if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
  console.error("❌ TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set in .env");
  process.exit(1);
}

const BLOB_TOKEN =
  process.env.BLOB_PUBLIC_READ_WRITE_TOKEN ||
  process.env.BLOB_READ_WRITE_TOKEN;

if (!BLOB_TOKEN) {
  console.error("❌ BLOB_PUBLIC_READ_WRITE_TOKEN or BLOB_READ_WRITE_TOKEN must be set in .env");
  process.exit(1);
}

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN.trim(),
  intMode: "number",
});

// Local folder that contains DataSmith.mp4, MultiagentDemo.mp4, etc.
const MEDIA_DIR = path.join(__dirname, "Videos and Screenshots");

// ─── Blob uploader ────────────────────────────────────────────────────────────
// Reads the file from MEDIA_DIR, uploads to Vercel Blob, returns public URL.
// Returns "" if the filename is empty or the file doesn't exist locally.
async function uploadMediaToBlob(filename, blobFolder, id, existingUrl = "") {
  if (!filename || !filename.trim()) return "";
  if (/^https?:\/\//i.test(filename)) return filename; // already a URL
  // ✅ Skip upload if DB already has a valid blob URL for this asset
  if (existingUrl && /^https?:\/\//i.test(existingUrl)) {
    console.log(`   ⏭️  Reusing existing blob URL for ${filename}`);
    return existingUrl;
  }

  let localPath = path.join(MEDIA_DIR, filename);
  if (!fs.existsSync(localPath)) {
    console.warn(`   ⚠️  Not found, skipping: ${localPath}`);
    return "";
  }

  const ext = path.extname(filename).toLowerCase();
  const mimeMap = {
    ".mp4": "video/mp4", ".mov": "video/quicktime", ".webm": "video/webm",
    ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  };
  const contentType = mimeMap[ext] || "application/octet-stream";

  // ─── Auto-compress large videos before upload ──────────────────────────────
  const isVideo = [".mp4", ".mov", ".webm"].includes(ext);
  if (isVideo) {
    const sizeMB = fs.statSync(localPath).size / (1024 * 1024);
    if (sizeMB > MAX_VIDEO_MB) {
      console.log(`   🗜️  ${filename} is ${sizeMB.toFixed(1)} MB > ${MAX_VIDEO_MB} MB — compressing...`);
      const tmpPath = path.join(os.tmpdir(), `compressed-${id}-${Date.now()}${ext}`);
      try {
        await new Promise((resolve, reject) => {
          ffmpeg(localPath)
            .videoCodec("libx264")
            .audioCodec("aac")
            .audioBitrate("96k")
            .outputOptions(["-crf 28", "-preset fast", "-vf scale=1280:-2"])
            .on("end", resolve)
            .on("error", reject)
            .save(tmpPath);
        });
        const newMB = fs.statSync(tmpPath).size / (1024 * 1024);
        console.log(`   ✅ Compressed: ${sizeMB.toFixed(1)} MB → ${newMB.toFixed(1)} MB`);
        localPath = tmpPath;
      } catch (e) {
        console.warn(`   ⚠️  Compression failed, uploading original. Error: ${e.message}`);
      }
    } else {
      console.log(`   📏 ${filename} is ${sizeMB.toFixed(1)} MB — no compression needed`);
    }
  }

  const baseName = path.basename(filename, ext).replace(/\s+/g, "-").replace(/[^a-zA-Z0-9_-]/g, "");
  const blobPathname = `${blobFolder}/${id}-${baseName}-${Date.now()}${ext}`;

  console.log(`   📤 Uploading ${filename} → ${blobPathname}`);
  const buffer = fs.readFileSync(localPath);
  const { url } = await put(blobPathname, buffer, {
    access: "public",
    token: BLOB_TOKEN,
    contentType,
  });
  console.log(`   ✅ ${url}`);
  return url;
}

// ─── Schema guard ─────────────────────────────────────────────────────────────
async function columnExists(table, col) {
  const r = await db.execute(`PRAGMA table_info(${table})`);
  return r.rows.some((row) => row.name === col);
}
async function addCol(table, col, def) {
  if (!(await columnExists(table, col))) {
    await db.execute(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`);
    console.log(`   ➕ Added ${table}.${col}`);
  }
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const FAMILIES = [
  ["atlas",   "Atlas",    "Data & Context Platform",            "Accelerators that make data AI-ready across lakehouse and operational stores.",  '["Lakehouse","Governance","Lineage"]',       '["Foundation sprints"]',        '["Cloud landing zones"]', '["All agent families"]'],
  ["forge",   "Forge",    "AI-Native Engineering Platform",     "Prompts, scaffolds, and quality loops for accelerated delivery.",               '["Shipping velocity","Reuse"]',              '["Software factory programs"]', '["Git providers"]',       '["Relay & Nexus"]'],
  ["relay",   "Relay",    "Workflow & Agent Platform",          "Agents and workflows for operations, docs, service, and document AI.",          '["Operational efficiency"]',                '["CS programmes"]',             '["CRM & ITSM"]',          '["Governed execution"]'],
  ["sentinel","Sentinel", "Governed Runtime & Managed AI Ops",  "Safety, telemetry, compliance, and cost guardrails.",                          '["Responsible AI"]',                        '["GRC workflows"]',             '["IAM & KMS"]',           '["Production AI"]'],
  ["nexus",   "Nexus",    "Shared Platform Infrastructure",     "Shared networking, orchestration, and infra glue.",                            '["Platforms"]',                             '["Landing zones"]',             '["Identity"]',            '["Atlas & Forge workloads"]'],
];

// Every field that exists in the assets table — demo_video (filename) is
// resolved to a blob URL at seed time and stored in demo_video_relpath.
const ASSETS = [
  {
    id: "ATL-001",
    name: "DataSmith – Tableau to Looker Migration",
    family: "atlas",
    solution: "Migration Factory",
    desc: "Discovery, Migration and Validation of Tableau dashboards to Looker",
    long_desc: "Discovery - Lineage analysis, schema analysis, cluster analysis",
    maturity: "experimental", effort: "low", demoReady: 1,
    clouds: '["azure"]',
    tags: '["Tableau","Looker","DataSmith","Migration","Agentic AI"]',
    quickStart: "GUI based",
    repoUrl: "Request for Repo", demoUrl: "datasmith.infovision.io",
    owner: "Manikandan Loganathan", ownerInitials: "ML",
    ownerEmail: "Manikandan.Loganathan@infovision.com",
    prerequisites: '["Hosted service"]',
    stats_deploys: 0, stats_demos: 2, stats_projects: 0, stats_rating: null,
    demo_video: "DataSmith.mp4",
  },
  {
    id: "ATL-002",
    name: "DataSmith – Synthetic Data Generator",
    family: "atlas",
    solution: "Master Data & Domain Context",
    desc: "Generates tens to millions of rows of synthetic data statistically modelled on a given input dataset",
    long_desc: "Generates tens to millions of rows of synthetic data statistically modelled on a given input dataset",
    maturity: "validated", effort: "low", demoReady: 1,
    clouds: '[]',
    tags: '["Data Generator","Data Generation","DataSmith"]',
    quickStart: "GUI based",
    repoUrl: "Request for Repo", demoUrl: "Not Available Yet",
    owner: "Manikandan Loganathan", ownerInitials: "ML",
    ownerEmail: "Manikandan.Loganathan@infovision.com",
    prerequisites: '["Hosted service"]',
    stats_deploys: 0, stats_demos: 4, stats_projects: 1, stats_rating: 50,
    demo_video: "SyntheticDataGenerator.mp4",
  },
  {
    id: "ATL-003",
    name: "Data Policy Anomaly Bot",
    family: "atlas",
    solution: "Master Data & Domain Context",
    desc: "Natural language compliance bot that validates organisational policies against live BigQuery datasets and flags anomalies by risk severity.",
    long_desc: "The Data Policy Anomaly Bot is an AI-powered compliance accelerator that enables non-technical users to query organisational policies in plain English and validate them against live datasets in real time.",
    maturity: "validated", effort: "medium", demoReady: 1,
    clouds: '["azure","gcp"]',
    tags: '["Compliance","Policy Governance","Anomaly Detection","BigQuery","GDPR","CCPA","LangChain","GPT-4","Vector Embeddings","Risk Classification"]',
    quickStart: "GUI based",
    repoUrl: "Request for Repo", demoUrl: "Not Available Yet",
    owner: "Abhiram Kalidindi", ownerInitials: "AK",
    ownerEmail: "Abhiram.Kalidindi@infovision.com",
    prerequisites: '["Python 3.x","Streamlit","Google BigQuery","Azure OpenAI"]',
    stats_deploys: 0, stats_demos: 0, stats_projects: 0, stats_rating: null,
    demo_video: "PolicyAnomalyBot.mp4",
  },
  {
    id: "FRG-001",
    name: "Sprinter",
    family: "forge",
    solution: "Engineering Productivity Office",
    desc: "AI-powered SDLC bot that expands user stories, generates tasks, test cases, code snippets, and release notes via a Kanban board.",
    long_desc: "Sprinter is a web application integrated with GPT-3.5-turbo that streamlines the entire software development lifecycle.",
    maturity: "validated", effort: "medium", demoReady: 1,
    clouds: '["azure"]',
    tags: '["SDLC","Agile","User Stories","Test Cases","Code Generation","Kanban","Release Notes","GPT","JIRA"]',
    quickStart: "GUI based",
    repoUrl: "Request for Repo", demoUrl: "Not Available Yet",
    owner: "Noumika Balaji", ownerInitials: "NB",
    ownerEmail: "Noumika.Balaji@infovision.com",
    prerequisites: '["Python 3.x","Node.js","React"]',
    stats_deploys: 0, stats_demos: 8, stats_projects: 0, stats_rating: null,
    demo_video: "Sprinter.mp4",
  },
  {
    id: "FRG-002",
    name: "Code Migration Frameworks",
    family: "forge",
    solution: "Modernization Factory",
    desc: "AI-assisted COBOL-to-Java and .NET-to-Node.js code migration with real-time developer Q&A and context-aware conversion.",
    long_desc: "Code Migration Frameworks is a multi-language modernization accelerator that uses GitHub Copilot and Gemini code assist plugins to convert legacy codebases to modern tech stacks.",
    maturity: "validated", effort: "high", demoReady: 1,
    clouds: '["azure","gcp"]',
    tags: '["COBOL","Java","Springboot","Code Migration","Legacy Modernization",".NET","Node.js","GitHub Copilot","Gemini"]',
    quickStart: "Console / GUI based",
    repoUrl: "Request for Repo", demoUrl: "Not Available Yet",
    owner: "Blesson Roy", ownerInitials: "BR",
    ownerEmail: "Blesson.Roy@infovision.com",
    prerequisites: '["Python 3.x","Java 17+","Node.js 18+","COBOL runtime"]',
    stats_deploys: 0, stats_demos: 0, stats_projects: 0, stats_rating: null,
    demo_video: "",
  },
  {
    id: "FRG-003",
    name: "AI Code Reviewer",
    family: "forge",
    solution: "Release Acceleration",
    desc: "Webhook-triggered AI code reviewer that delivers line-by-line analysis, best practice feedback, and Slack notifications on every PR.",
    long_desc: "Webhook-driven SDLC optimisation bot that automates code review on every pull or merge request.",
    maturity: "validated", effort: "medium", demoReady: 1,
    clouds: '["azure"]',
    tags: '["Code Review","Webhook","GitLab","Slack","CI/CD","GPT-4","SDLC","Automated Review","Pull Request"]',
    quickStart: "Integrated with Slack and Jira",
    repoUrl: "Request for Repo", demoUrl: "Not Available Yet",
    owner: "Pratyoosh Patel", ownerInitials: "PP",
    ownerEmail: "Pratyoosh.Patel@infovision.com",
    prerequisites: '["Python 3.x","GitLab CI/CD","Slack SDK"]',
    stats_deploys: 0, stats_demos: 0, stats_projects: 0, stats_rating: null,
    demo_video: "AutomatedCodeReviews.mp4",
  },
  {
    id: "FRG-004",
    name: "ADLC Unified Framework",
    family: "forge",
    solution: "Engineering Productivity Office",
    desc: "Unified AI Enabler Framework for AIDLC",
    long_desc: "AI Enabler Framework in a coding IDE to analyse, design, build, test and audit components for different roles — BA, Front End Dev, Back End Dev, DBA and QA for any application SDLC.",
    maturity: "battle-tested", effort: "medium", demoReady: 1,
    clouds: '[]',
    tags: '["AI SDLC","AI enabled development","AI framework for SDLC","front end development","back end development","BA Analysis","Reverse Analysis"]',
    quickStart: "IDE",
    repoUrl: "Request for Repo", demoUrl: "Not Available Yet",
    owner: "Priyanka Fulewale", ownerInitials: "PF",
    ownerEmail: "Priyanka.Fulewale@infovision.com",
    prerequisites: '["IDE deployment - autosetup"]',
    stats_deploys: 1, stats_demos: 1, stats_projects: 1, stats_rating: 85,
    demo_video: "ADLCUnifiedFramework-Screenshot.png",
  },
  {
    id: "FRG-005",
    name: "Autonomous SDLC Framework",
    family: "forge",
    solution: "Engineering Productivity Office",
    desc: "AI Enabler to perform autonomous AIDLC",
    long_desc: "AI Enabler Framework to do an Autonomous SDLC from ADO entry to feature rollout through complete SDLC.",
    maturity: "experimental", effort: "medium", demoReady: 1,
    clouds: '[]',
    tags: '["Autonomous SDLC","AI SDLC","AI enabled development","AI framework for SDLC"]',
    quickStart: "IDE",
    repoUrl: "Request for Repo", demoUrl: "Video available",
    owner: "Nainik K", ownerInitials: "NK",
    ownerEmail: "Nainik.K@infovision.com",
    prerequisites: '["ADO","Github","IDE deployment (VSCode)"]',
    stats_deploys: 0, stats_demos: 2, stats_projects: 0, stats_rating: null,
    demo_video: "",
  },
  {
    id: "RLY-001",
    name: "Multiagent Call Center Automation",
    family: "relay",
    solution: "Customer Care Studio",
    desc: "LangGraph multi-agent system with 6 specialised agents automating sentiment analysis, ticketing, recommendations, and resolution.",
    long_desc: "The Multiagent Call Center Automation System is an AI-driven solution built on a LangGraph-based multi-agent framework that optimises call center operations through specialised autonomous agents.",
    maturity: "validated", effort: "high", demoReady: 1,
    clouds: '["gcp"]',
    tags: '["Multi-Agent","LangGraph","Call Center","Sentiment Analysis","JIRA","Automation","Agentic AI","Orchestration","Gemini"]',
    quickStart: "Embedded into IVR system",
    repoUrl: "https://github.com/by-Gokulram/multiagent_callcenter_automation.git",
    demoUrl: "Not Available Yet",
    owner: "Noumika Balaji", ownerInitials: "NB",
    ownerEmail: "Noumika.Balaji@infovision.com",
    prerequisites: '["Python 3.x","LangGraph","PostgreSQL"]',
    stats_deploys: 1, stats_demos: 5, stats_projects: 1, stats_rating: 75,
    demo_video: "MultiagentDemo.mp4",
  },
  {
    id: "RLY-002",
    name: "Healthcare Bot",
    family: "relay",
    solution: "Enterprise Knowledge Assistant",
    desc: "Dual-persona RAG chatbot for hospital environments serving both patients and staff with role-tailored, policy-aware responses.",
    long_desc: "The Healthcare Bot is a dual-persona RAG-powered conversational agent designed for hospital environments.",
    maturity: "validated", effort: "medium", demoReady: 1,
    clouds: '["azure","gcp"]',
    tags: '["RAG","Healthcare","Dual Persona","Chroma","Redis","Embeddings","Knowledge Retrieval","Gemini","FastAPI"]',
    quickStart: "GUI based",
    repoUrl: "Request for Repo", demoUrl: "Not Available Yet",
    owner: "Abhiram Kalidindi", ownerInitials: "AK",
    ownerEmail: "Abhiram.Kalidindi@infovision.com",
    prerequisites: '["Python 3.x","FastAPI","Redis","Chroma"]',
    stats_deploys: 1, stats_demos: 4, stats_projects: 1, stats_rating: 50,
    demo_video: "HealthcareBot.mp4",
  },
  {
    id: "RLY-003",
    name: "Contextual Intelligence – Speech Diarization",
    family: "relay",
    solution: "Customer Care Studio",
    desc: "Real-time speech diarization that structures live customer conversations and serves contextual product data and trade-in options instantly.",
    long_desc: "Real-time conversational intelligence accelerator built for high-engagement customer interactions.",
    maturity: "battle-tested", effort: "high", demoReady: 1,
    clouds: '["gcp","azure"]',
    tags: '["Speech Diarization","Real-Time","Conversational AI","Web Scraping","Redis","LangChain","Gemini","Speaker Attribution","Cart Integration"]',
    quickStart: "Mobile device based GUI",
    repoUrl: "Request for Repo", demoUrl: "Not Available Yet",
    owner: "Pratyoosh Patel", ownerInitials: "PP",
    ownerEmail: "Pratyoosh.Patel@infovision.com",
    prerequisites: '["Python 3.x","React.js","FastAPI","Redis","LangChain"]',
    stats_deploys: 1, stats_demos: 7, stats_projects: 1, stats_rating: 75,
    demo_video: "SpeechDiarization.mp4",
  },
  {
    id: "RLY-004",
    name: "AIOps",
    family: "relay",
    solution: "Service & Order Operations AI",
    desc: "Agentic AI Platform to monitor, triage and resolve production incidents",
    long_desc: "Agentic AI Platform for AI Operations in a Multi-Agent setup to monitor, triage and resolve production incidents in a guided autonomy mode.",
    maturity: "experimental", effort: "high", demoReady: 1,
    clouds: '["azure"]',
    tags: '["AIOps","Production Support","Incident monitoring","Incident resolution","Agentic AI for Ops"]',
    quickStart: "GUI based",
    repoUrl: "Request for Repo", demoUrl: "http://74.249.248.133:8887/",
    owner: "Balasubramani Murugesan", ownerInitials: "BM",
    ownerEmail: "Balasubramani.Murugesan@infovision.com",
    prerequisites: '["Hosted service"]',
    stats_deploys: 1, stats_demos: 3, stats_projects: 1, stats_rating: 70,
    demo_video: "",
  },
  {
    id: "SNT-001",
    name: "Sentiment Analysis on Call Recordings",
    family: "sentinel",
    solution: "Customer Care Studio",
    desc: "Gemini 1.5 Pro multimodal call analyser that detects sentiment, tone, sarcasm, and compliance violations directly from audio — no transcription needed.",
    long_desc: "Uses Google Gemini 1.5 Pro's native multimodal audio processing to analyse customer service calls end-to-end without requiring a separate transcription step.",
    maturity: "validated", effort: "medium", demoReady: 1,
    clouds: '["gcp"]',
    tags: '["Sentiment Analysis","Call Recordings","Compliance","Tone Detection","Gemini","Multimodal","Audio Processing","Call Center","QA Monitoring"]',
    quickStart: "Embedded into IVR system",
    repoUrl: "https://github.com/by-Gokulram/tone_sentiment_analysis.git",
    demoUrl: "Not Available Yet",
    owner: "Pratyoosh Patel", ownerInitials: "PP",
    ownerEmail: "Pratyoosh.Patel@infovision.com",
    prerequisites: '["Python 3.x","LangChain","Streamlit","Gemini 1.5 Pro"]',
    stats_deploys: 1, stats_demos: 3, stats_projects: 1, stats_rating: 65,
    demo_video: "SentimentAnalysisDemo.mp4",
  },
  {
    id: "SNT-002",
    name: "Responsible AI Automation",
    family: "sentinel",
    solution: "AI Run Office",
    desc: "Agent-based decision automation for Responsible AI",
    long_desc: "RAIE is an enterprise-grade Responsible AI governance platform with agentic architecture that transforms manual approval workflows into an intelligent, autonomous system.",
    maturity: "experimental", effort: "high", demoReady: 1,
    clouds: '["azure","gcp","aws"]',
    tags: '["AI Governance","Responsible AI","Enterprise Compliance","Risk Management","Regulatory Compliance"]',
    quickStart: "GUI based",
    repoUrl: "Request for Repo", demoUrl: "Not Available Yet",
    owner: "Hasham Ul Haq", ownerInitials: "HH",
    ownerEmail: "Hasham.UlHaq@infovision.com",
    prerequisites: '["Hosted service"]',
    stats_deploys: 1, stats_demos: 5, stats_projects: 1, stats_rating: 75,
    demo_video: "ResponsibleAIAgentic.mp4",
  },
  {
    id: "NXS-001",
    name: "SLM vs LLM Decision Playbook",
    family: "nexus",
    solution: "Model & Agent Operations",
    desc: "A systematic framework for choosing between Small Language Models and Large Language Models based on deployment constraints and business requirements.",
    long_desc: "Cost-analysis and benchmarking tool that helps engineering teams make informed model selection decisions before committing to a tech stack.",
    maturity: "validated", effort: "low", demoReady: 1,
    clouds: '["vercel"]',
    tags: '["LLM Benchmarking","Cost Analysis","Token Cost","Model Selection","SLM","Embeddings","LangChain","LlamaIndex","GPT"]',
    quickStart: "GUI based",
    repoUrl: "Request for Repo", demoUrl: "https://arch-eval-wx7y.vercel.app/",
    owner: "Dhanuvanth Senthilkumar", ownerInitials: "DS",
    ownerEmail: "Dhanuvanth.SenthilKumar@infovision.com",
    prerequisites: '["React and React DOM","TypeScript","Vite","Tailwind CSS","Google Generative AI SDK","Supabase client"]',
    stats_deploys: 0, stats_demos: 3, stats_projects: 0, stats_rating: null,
    demo_video: "",
  },
  {
    id: "NXS-002",
    name: "PromptEval",
    family: "nexus",
    solution: "Common Infrastructure",
    desc: "Shared prompt evaluation framework for testing, scoring, and iterating on prompts across all platform families and LLM providers.",
    long_desc: "Cross-platform prompt quality evaluation framework that provides a structured methodology for testing, scoring, and iterating on prompts before production deployment.",
    maturity: "experimental", effort: "low", demoReady: 1,
    clouds: '["azure","gcp"]',
    tags: '["Prompt Engineering","Evaluation","Benchmarking","Quality","LLM Testing","Regression","Prompt Management"]',
    quickStart: "Console / Chat interface / GUI based",
    repoUrl: "Request for Repo", demoUrl: "Not Available Yet",
    owner: "Kishore Bodelu", ownerInitials: "KB",
    ownerEmail: "Kishore.Bodelu@infovision.com",
    prerequisites: '["Python 3.x","LangChain","Azure OpenAI"]',
    stats_deploys: 1, stats_demos: 2, stats_projects: 1, stats_rating: 80,
    demo_video: "",
  },
  {
    id: "NXS-003",
    name: "LIE – LLM Insight Engine",
    family: "nexus",
    solution: "Model & Agent Operations",
    desc: "Unified multi-LLM benchmarking platform that runs concurrent queries across GPT, Mistral, Llama, Gemini and compares responses side by side.",
    long_desc: "Single unified platform enabling development teams to benchmark any combination of LLMs and embedding models against the same training document and query set.",
    maturity: "battle-tested", effort: "high", demoReady: 1,
    clouds: '["azure","gcp"]',
    tags: '["LLM Benchmarking","Multi-LLM","GPT","Mistral","Llama","Gemini","Embeddings","Model Comparison","FAISS","LangChain","LlamaIndex"]',
    quickStart: "GUI based",
    repoUrl: "Request for Repo", demoUrl: "Not Available Yet",
    owner: "Noumika Balaji", ownerInitials: "NB",
    ownerEmail: "Noumika.Balaji@infovision.com",
    prerequisites: '["Python 3.x","React","LangChain","LlamaIndex","PyTorch","CUDA","FAISS"]',
    stats_deploys: 1, stats_demos: 7, stats_projects: 1, stats_rating: 70,
    demo_video: "LLMInsightEngine.mp4",
  },
  {
    id: "NXS-004",
    name: "Video Intelligence Platform (VIP)",
    family: "nexus",
    solution: "Multi-Agent Orchestration",
    desc: "Video Intelligence Platform for multi-agent orchestration and analysis",
    long_desc: "Video Intelligence Platform (VIP) — multi-agent video analysis and orchestration platform.",
    maturity: "experimental", effort: "medium", demoReady: 1,
    clouds: '[]',
    tags: '["Video Intelligence","Multi-Agent","VIP"]',
    quickStart: "",
    repoUrl: "", demoUrl: "",
    owner: "Abhiram Kalidindi", ownerInitials: "AK",
    ownerEmail: "Abhiram.Kalidindi@infovision.com",
    prerequisites: '[]',
    stats_deploys: 0, stats_demos: 0, stats_projects: 0, stats_rating: null,
    demo_video: "VIPDemo.mp4",
  },
];

// Registrations — every field from registrationCreateSqlite / mapRegistrationRow
const REGISTRATIONS = [
  {
    registrationId: "REG-001",
    name: "Voice of Customer Analyser",
    family: "sentinel",
    description: "Gemini-powered sentiment and tone classifier for live call recordings and post-call surveys. Detects sentiment intensity, flags compliance violations, and generates trend reports.",
    submitedBy: "Pratyoosh Patel",
    status: "ai-review",
    aiScore: null, govReviewer: "", govNotes: "",
    owner: "Pratyoosh Patel", team: "Customer Care Studio",
    coContributors: "", version: "1.0", cloud: "gcp",
    maturity: "validated", gitUrl: "",
    architecture: "", prerequisites: "Python 3.x, LangChain, Streamlit",
    tags: "Sentiment Analysis, Compliance, Gemini, Audio Processing",
    quickStart: "GUI based",
    demo_video: "SentimentAnalysisDemo.mp4",
  },
  {
    registrationId: "REG-002",
    name: "Agentic Workflow Orchestrator",
    family: "relay",
    description: "LangGraph-based multi-agent orchestration framework for automating end-to-end enterprise workflows including ticketing, CRM sync, and intelligent routing across 6 specialised agents.",
    submitedBy: "Noumika Balaji",
    status: "remediation",
    aiScore: 62, govReviewer: "", govNotes: "Needs clearer data-residency documentation before governance sign-off.",
    owner: "Noumika Balaji", team: "Customer Care Studio",
    coContributors: "", version: "1.0", cloud: "gcp",
    maturity: "validated", gitUrl: "https://github.com/by-Gokulram/multiagent_callcenter_automation.git",
    architecture: "", prerequisites: "Python 3.x, LangGraph, PostgreSQL",
    tags: "Multi-Agent, LangGraph, Call Center, Agentic AI, Gemini",
    quickStart: "Embedded into IVR system",
    demo_video: "MultiagentDemo.mp4",
  },
  {
    registrationId: "REG-003",
    name: "Code Quality Accelerator v2",
    family: "forge",
    description: "Webhook-triggered AI code review bot with enhanced security scanning, dependency analysis, and auto-generated remediation suggestions delivered via Slack.",
    submitedBy: "Pratyoosh Patel",
    status: "governance",
    aiScore: 84, govReviewer: "Hasham Ul Haq", govNotes: "Security controls verified. Pending final IP sign-off.",
    owner: "Pratyoosh Patel", team: "Release Acceleration",
    coContributors: "", version: "2.0", cloud: "azure",
    maturity: "validated", gitUrl: "",
    architecture: "", prerequisites: "Python 3.x, GitLab CI/CD, Slack SDK",
    tags: "Code Review, Webhook, GitLab, Slack, CI/CD, GPT-4",
    quickStart: "Integrated with Slack and Jira",
    demo_video: "AutomatedCodeReviews.mp4",
  },
  {
    registrationId: "REG-004",
    name: "ADLC Framework – IDE Plugin",
    family: "forge",
    description: "IDE-embedded AI enabler for full SDLC coverage — BA analysis, front-end and back-end code generation, reverse engineering, DBA scripting, and QA test generation in a single plugin.",
    submitedBy: "Priyanka Fulewale",
    status: "approved",
    aiScore: 91, govReviewer: "Hasham Ul Haq", govNotes: "Approved. Promoted to catalogue as FRG-004.",
    owner: "Priyanka Fulewale", team: "Engineering Productivity Office",
    coContributors: "", version: "1.0", cloud: "",
    maturity: "battle-tested", gitUrl: "",
    architecture: "", prerequisites: "IDE deployment - autosetup",
    tags: "AI SDLC, AI enabled development, AI framework for SDLC",
    quickStart: "IDE",
    demo_video: "ADLCUnifiedFramework-Screenshot.png",
  },
  {
    registrationId: "REG-005",
    name: "Real-Time Speech Intelligence",
    family: "relay",
    description: "Live speech diarization accelerator that attributes utterances per speaker, extracts intent signals, and surfaces real-time product recommendations for CSR-assisted sales.",
    submitedBy: "Veerasekhar",
    status: "approved",
    aiScore: 88, govReviewer: "Hasham Ul Haq", govNotes: "Approved. Promoted to catalogue as RLY-003.",
    owner: "Pratyoosh Patel", team: "Customer Care Studio",
    coContributors: "Veerasekhar, Abhiram, Blesson, Padma Priya, Satish, Rahul",
    version: "1.0", cloud: "gcp",
    maturity: "battle-tested", gitUrl: "",
    architecture: "", prerequisites: "Python 3.x, React.js, FastAPI, Redis, LangChain",
    tags: "Speech Diarization, Real-Time, Conversational AI, LangChain, Gemini",
    quickStart: "Mobile device based GUI",
    demo_video: "SpeechDiarization.mp4",
  },
  {
    registrationId: "REG-006",
    name: "Responsible AI Governance Engine",
    family: "sentinel",
    description: "Agentic platform that automates Responsible AI approval workflows — enriching submissions with risk, compliance, and budget data, auto-approving low-risk cases and routing complex ones for human review.",
    submitedBy: "Hasham Ul Haq",
    status: "ai-review",
    aiScore: null, govReviewer: "", govNotes: "",
    owner: "Hasham Ul Haq", team: "AI Run Office",
    coContributors: "", version: "0.9", cloud: "azure",
    maturity: "experimental", gitUrl: "",
    architecture: "", prerequisites: "Hosted service",
    tags: "AI Governance, Responsible AI, Enterprise Compliance, Risk Management",
    quickStart: "GUI based",
    demo_video: "ResponsibleAIAgentic.mp4",
  },
];

// ─── Runner ───────────────────────────────────────────────────────────────────
async function seed() {

  // 1. Ensure extra columns exist on both tables
  console.log("🔄 Checking schema columns...");
  await addCol("assets", "long_desc",         "TEXT DEFAULT ''");
  await addCol("assets", "repo_url",          "TEXT DEFAULT ''");
  await addCol("assets", "demo_url",          "TEXT DEFAULT ''");
  await addCol("assets", "owner_email",       "TEXT DEFAULT ''");
  await addCol("assets", "stats_demos",       "INTEGER NOT NULL DEFAULT 0");
  await addCol("assets", "stats_projects",    "INTEGER NOT NULL DEFAULT 0");
  await addCol("assets", "stats_rating",      "INTEGER");
  await addCol("assets", "attachments",       "TEXT DEFAULT '[]'");
  await addCol("assets", "related_asset_ids", "TEXT DEFAULT '[]'");
  await addCol("assets", "demo_video_relpath","TEXT DEFAULT ''");
  await addCol("assets", "submission_status", "TEXT DEFAULT NULL");
  await addCol("assets", "submission_id",     "TEXT DEFAULT NULL");
  await addCol("assets", "changelog",         "TEXT DEFAULT '[]'");

  await addCol("registrations", "demo_video_relpath", "TEXT DEFAULT ''");
  await addCol("registrations", "owner",              "TEXT DEFAULT ''");
  await addCol("registrations", "team",               "TEXT DEFAULT ''");
  await addCol("registrations", "coContributors",     "TEXT DEFAULT ''");
  await addCol("registrations", "version",            "TEXT DEFAULT ''");
  await addCol("registrations", "cloud",              "TEXT DEFAULT ''");
  await addCol("registrations", "maturity",           "TEXT DEFAULT 'experimental'");
  await addCol("registrations", "gitUrl",             "TEXT DEFAULT ''");
  await addCol("registrations", "architecture",       "TEXT DEFAULT ''");
  await addCol("registrations", "prerequisites",      "TEXT DEFAULT ''");
  await addCol("registrations", "tags",               "TEXT DEFAULT ''");
  await addCol("registrations", "quickStart",         "TEXT DEFAULT ''");
  await addCol("registrations", "submission_attachments", "TEXT DEFAULT '[]'");
  await addCol("registrations", "promoted_asset_id", "TEXT DEFAULT ''");
  console.log("✅ Schema OK\n");

  // 2. Clear existing data
  await db.execute("DELETE FROM assets").catch(() => {});
  await db.execute("DELETE FROM registrations").catch(() => {});
  await db.execute("DELETE FROM activities").catch(() => {});
  console.log("🗑  Cleared assets, registrations, activities\n");

  // 3. Seed families
  console.log("🌱 Seeding families...");
  for (const [key, name, tagline, long_desc, use_cases, solutions, depends_on, enables] of FAMILIES) {
    await db.execute({
      sql: `INSERT INTO families (key, name, tagline, long_desc, use_cases, solutions, depends_on, enables)
            VALUES (?,?,?,?,?,?,?,?)
            ON CONFLICT(key) DO UPDATE SET
              name=excluded.name, tagline=excluded.tagline, long_desc=excluded.long_desc,
              use_cases=excluded.use_cases, solutions=excluded.solutions,
              depends_on=excluded.depends_on, enables=excluded.enables`,
      args: [key, name, tagline, long_desc, use_cases, solutions, depends_on, enables],
    });
  }
  console.log(`✅ ${FAMILIES.length} families seeded\n`);

  // 4. Seed assets — upload blob first, then INSERT with all fields + blob URL
  console.log("🌱 Seeding assets...");
  for (const a of ASSETS) {
    console.log(`⏳ ${a.id} — ${a.name}`);

    // Check DB for existing blob URL — skip re-upload if already there
    const existingAsset = await db.execute({ sql: "SELECT demo_video_relpath FROM assets WHERE id=?", args: [a.id] }).catch(() => ({ rows: [] }));
    const existingAssetUrl = existingAsset.rows[0]?.demo_video_relpath || "";
    const demoVideoUrl = await uploadMediaToBlob(a.demo_video, "demos", a.id, existingAssetUrl);

    await db.execute({
      sql: `INSERT INTO assets (
              id, name, desc, long_desc, family, clouds, maturity, effort, demoReady,
              solution, owner, ownerInitials, owner_email, quickStart,
              repo_url, demo_url, prerequisites, tags, changelog,
              attachments, related_asset_ids,
              demo_video_relpath,
              stats_deploys, stats_demos, stats_projects, stats_rating,
              submission_status, submission_id
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            ON CONFLICT(id) DO UPDATE SET
              name=excluded.name, desc=excluded.desc, long_desc=excluded.long_desc,
              family=excluded.family, clouds=excluded.clouds,
              maturity=excluded.maturity, effort=excluded.effort, demoReady=excluded.demoReady,
              solution=excluded.solution, owner=excluded.owner,
              ownerInitials=excluded.ownerInitials, owner_email=excluded.owner_email,
              quickStart=excluded.quickStart, repo_url=excluded.repo_url,
              demo_url=excluded.demo_url, prerequisites=excluded.prerequisites,
              tags=excluded.tags, demo_video_relpath=excluded.demo_video_relpath,
              stats_deploys=excluded.stats_deploys, stats_demos=excluded.stats_demos,
              stats_projects=excluded.stats_projects, stats_rating=excluded.stats_rating`,
      args: [
        a.id, a.name, a.desc, a.long_desc, a.family,
        a.clouds, a.maturity, a.effort, a.demoReady,
        a.solution, a.owner, a.ownerInitials, a.ownerEmail, a.quickStart,
        a.repoUrl, a.demoUrl, a.prerequisites, a.tags, "[]",
        "[]", "[]",
        demoVideoUrl,           // ← blob URL stored in demo_video_relpath
        a.stats_deploys, a.stats_demos, a.stats_projects, a.stats_rating ?? null,
        null, null,
      ],
    });
    console.log(`   ✅ ${a.id} seeded  [video: ${demoVideoUrl || "none"}]\n`);
  }

  // 5. Refresh family stats
  console.log("🔄 Refreshing family stats...");
  for (const [key] of FAMILIES) {
    const res = await db.execute({
      sql: `SELECT COUNT(*) AS assets,
              COALESCE(SUM(stats_deploys),0) AS deploys,
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
  console.log("✅ Family stats refreshed\n");

  // 6. Seed registrations — upload blob first, then INSERT with ALL fields
  console.log("🌱 Seeding registrations...");
  const now = new Date().toISOString();
  for (const reg of REGISTRATIONS) {
    console.log(`⏳ ${reg.registrationId} — ${reg.name}`);

    // Check DB for existing blob URL — skip re-upload if already there
    const existingReg = await db.execute({ sql: "SELECT demo_video_relpath FROM registrations WHERE registrationId=?", args: [reg.registrationId] }).catch(() => ({ rows: [] }));
    const existingRegUrl = existingReg.rows[0]?.demo_video_relpath || "";
    const demoVideoUrl = await uploadMediaToBlob(reg.demo_video, "submissions", reg.registrationId, existingRegUrl);

    const initialHistory = JSON.stringify([{
      status: reg.status,
      timestamp: now,
      changedBy: reg.submitedBy || "System",
      note: reg.govNotes || "Seeded",
    }]);

    await db.execute({
      sql: `INSERT INTO registrations (
              registrationId, name, family, description, submitedBy, date, status,
              aiScore, aiFindings, govReviewer, govNotes, statusHistory,
              owner, team, coContributors, version, cloud, maturity,
              gitUrl, architecture, prerequisites, tags, quickStart,
              demo_video_relpath,
              submission_attachments, promoted_asset_id
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            ON CONFLICT(registrationId) DO UPDATE SET
              name=excluded.name, family=excluded.family,
              description=excluded.description, submitedBy=excluded.submitedBy,
              status=excluded.status, aiScore=excluded.aiScore,
              govReviewer=excluded.govReviewer, govNotes=excluded.govNotes,
              owner=excluded.owner, team=excluded.team,
              coContributors=excluded.coContributors, version=excluded.version,
              cloud=excluded.cloud, maturity=excluded.maturity,
              gitUrl=excluded.gitUrl, architecture=excluded.architecture,
              prerequisites=excluded.prerequisites, tags=excluded.tags,
              quickStart=excluded.quickStart,
              demo_video_relpath=excluded.demo_video_relpath`,
      args: [
        reg.registrationId, reg.name, reg.family, reg.description,
        reg.submitedBy, now, reg.status,
        reg.aiScore ?? null, "[]",
        reg.govReviewer || "", reg.govNotes || "",
        initialHistory,
        reg.owner || reg.submitedBy || "",
        reg.team || "",
        reg.coContributors || "",
        reg.version || "",
        reg.cloud || "",
        reg.maturity || "experimental",
        reg.gitUrl || "",
        reg.architecture || "",
        reg.prerequisites || "",
        reg.tags || "",
        reg.quickStart || "",
        demoVideoUrl,           // ← blob URL stored in demo_video_relpath
        "[]", "",
      ],
    });
    console.log(`   ✅ ${reg.registrationId} seeded  [video: ${demoVideoUrl || "none"}]\n`);
  }

  console.log(`🎉 Done! ${ASSETS.length} assets + ${REGISTRATIONS.length} registrations seeded.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err.message, err.stack);
  process.exit(1);
});
