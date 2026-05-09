const mongoose = require("mongoose");
require("dotenv").config();

// ── Models ────────────────────────────────────────────────────────────────────
const familySchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      enum: ["atlas", "forge", "relay", "sentinel", "nexus"],
    },
    name: { type: String, required: true, trim: true },
    tagline: { type: String, trim: true },
    longDesc: { type: String },
    useCases: [{ type: String }],
    solutions: [{ type: String }],
    dependsOn: [{ type: String }],
    enables: [{ type: String }],
    stats: {
      assets: { type: Number, default: 0 },
      deploys: { type: Number, default: 0 },
      battleTested: { type: Number, default: 0 },
    },
  },
  { timestamps: true },
);

const assetSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: { type: String, required: true, trim: true },
    desc: { type: String, trim: true },
    family: {
      type: String,
      required: true,
      enum: ["atlas", "forge", "relay", "sentinel", "nexus"],
    },
    clouds: [{ type: String, enum: ["aws", "gcp", "azure"] }],
    maturity: {
      type: String,
      enum: ["experimental", "validated", "battle-tested"],
      default: "experimental",
    },
    effort: { type: String, trim: true },
    demoReady: { type: Boolean, default: false },
    solution: { type: String, trim: true },
    owner: { type: String, trim: true },
    ownerInitials: { type: String, trim: true },
    architecture: { type: String, trim: true },
    quickStart: { type: String },
    prerequisites: [{ type: String }],
    tags: [{ type: String }],
    changelog: [{ type: String }],
    stats: {
      deploys: { type: Number, default: 0 },
      stars: { type: Number, default: 0 },
    },
  },
  { timestamps: true },
);

const Family = mongoose.model("Family", familySchema);
const Asset = mongoose.model("Asset", assetSchema);

// ── Seed Data ─────────────────────────────────────────────────────────────────
const families = [
  {
    key: "atlas",
    name: "Atlas",
    tagline: "Foundation layer for all AI initiatives",
    longDesc:
      "Atlas provides the foundational data infrastructure and AI scaffolding that all other families depend on. It covers everything from data lake modernisation to BI migration and synthetic data generation — the bedrock every AI initiative is built upon.",
    useCases: [
      "Data lake modernisation",
      "BI tool migration (Tableau → Looker)",
      "Synthetic data generation for testing",
      "Data cataloguing and governance",
    ],
    solutions: ["Data Migration", "Data Quality", "Data Platform"],
    dependsOn: [],
    enables: ["forge", "relay", "sentinel", "nexus"],
    stats: { assets: 3, deploys: 451, battleTested: 2 },
  },
  {
    key: "forge",
    name: "Forge",
    tagline: "Build and ship AI models faster",
    longDesc:
      "Forge accelerates the development, fine-tuning, and deployment of AI and LLM-powered applications. From prompt libraries and RAG pipelines to full model fine-tuning accelerators, Forge is where AI products are built.",
    useCases: [
      "LLM application development",
      "RAG system construction",
      "Prompt engineering and management",
      "Domain-specific model fine-tuning",
    ],
    solutions: ["Knowledge AI", "Prompt Engineering", "Model Development"],
    dependsOn: ["atlas"],
    enables: ["relay", "nexus"],
    stats: { assets: 3, deploys: 732, battleTested: 2 },
  },
  {
    key: "relay",
    name: "Relay",
    tagline: "Connect everything, integrate anywhere",
    longDesc:
      "Relay handles all integration, streaming, and API orchestration needs for AI-powered systems. It bridges internal services, third-party APIs, and real-time data streams so AI models always have access to what they need.",
    useCases: [
      "API gateway setup for AI services",
      "Real-time event streaming",
      "LLM proxy routing and load balancing",
      "Multi-system integration",
    ],
    solutions: ["Integration", "Data Streaming"],
    dependsOn: ["atlas"],
    enables: ["sentinel", "nexus"],
    stats: { assets: 2, deploys: 273, battleTested: 1 },
  },
  {
    key: "sentinel",
    name: "Sentinel",
    tagline: "Govern, protect, and monitor AI",
    longDesc:
      "Sentinel provides governance, privacy, and monitoring capabilities to keep AI systems safe, fair, and compliant. It covers PII redaction, bias detection, model drift monitoring, and regulatory compliance reporting.",
    useCases: [
      "AI bias and fairness monitoring",
      "PII detection and redaction",
      "Regulatory compliance reporting (GDPR, EU AI Act)",
      "Model drift and anomaly alerts",
    ],
    solutions: ["AI Governance", "Data Privacy"],
    dependsOn: ["atlas", "forge"],
    enables: ["nexus"],
    stats: { assets: 2, deploys: 271, battleTested: 1 },
  },
  {
    key: "nexus",
    name: "Nexus",
    tagline: "Operate AI at scale, optimise costs",
    longDesc:
      "Nexus provides MLOps and operational tooling to deploy, monitor, and optimise AI workloads in production. It ties together all other families — enabling teams to run AI at scale while keeping infrastructure costs under control.",
    useCases: [
      "End-to-end MLOps pipeline setup",
      "LLM cost optimisation and routing",
      "Model lifecycle and registry management",
      "Automated retraining and deployment",
    ],
    solutions: ["MLOps", "Cost Management"],
    dependsOn: ["atlas", "forge", "relay", "sentinel"],
    enables: [],
    stats: { assets: 2, deploys: 146, battleTested: 0 },
  },
];

const assets = [
  // ── ATLAS ──────────────────────────────────────────────────────────────────
  {
    id: "ATL-001",
    name: "DataSmith – Tableau to Looker Migration",
    desc: "Automates end-to-end migration of Tableau workbooks to Looker dashboards, preserving logic, filters, and calculations.",
    family: "atlas",
    clouds: ["aws", "gcp"],
    maturity: "battle-tested",
    effort: "2 weeks",
    demoReady: true,
    solution: "Data Migration",
    owner: "Priya Sharma",
    ownerInitials: "PS",
    architecture: "https://storage.aimplify.infovision.com/arch/atl-001.png",
    quickStart:
      "git clone https://github.com/infovision/datasmith-migrator\ncd datasmith-migrator\npip install -r requirements.txt\npython migrate.py --source tableau_workbook.twbx --target looker",
    prerequisites: [
      "Python 3.11+",
      "Tableau Desktop API key",
      "Looker SDK credentials",
      "GCP service account",
    ],
    tags: ["tableau", "looker", "migration", "bi", "data-engineering", "atlas"],
    changelog: [
      "v2.1.0 - Added support for LOD expressions",
      "v2.0.0 - Multi-dashboard batch migration",
      "v1.5.0 - Looker LookML auto-generation",
    ],
    stats: { deploys: 142, stars: 87 },
  },
  {
    id: "ATL-002",
    name: "DataSmith – Synthetic Data Generator",
    desc: "Generates statistically accurate synthetic datasets for testing and development, supporting PII masking and schema inference.",
    family: "atlas",
    clouds: ["aws", "azure", "gcp"],
    maturity: "validated",
    effort: "3 days",
    demoReady: true,
    solution: "Data Quality",
    owner: "Arjun Mehta",
    ownerInitials: "AM",
    architecture: "https://storage.aimplify.infovision.com/arch/atl-002.png",
    quickStart:
      "pip install datasmith-synth\ndatasmith generate --schema schema.json --rows 10000 --output output.csv",
    prerequisites: ["Python 3.10+", "Input schema JSON or sample CSV"],
    tags: ["synthetic-data", "pii", "data-masking", "testing", "atlas"],
    changelog: [
      "v1.3.0 - Time-series data support",
      "v1.2.0 - PII auto-detection",
      "v1.0.0 - Initial release",
    ],
    stats: { deploys: 98, stars: 64 },
  },
  {
    id: "ATL-003",
    name: "Data Lake Accelerator",
    desc: "Bootstraps a production-ready data lake with automated ingestion pipelines, cataloguing, and governance controls.",
    family: "atlas",
    clouds: ["aws", "gcp"],
    maturity: "battle-tested",
    effort: "4 weeks",
    demoReady: false,
    solution: "Data Platform",
    owner: "Keerthana Rajendran",
    ownerInitials: "KR",
    architecture: "https://storage.aimplify.infovision.com/arch/atl-003.png",
    quickStart: "terraform init\nterraform apply -var-file=config.tfvars",
    prerequisites: [
      "Terraform 1.5+",
      "AWS or GCP credentials",
      "S3 / GCS bucket permissions",
    ],
    tags: ["data-lake", "terraform", "ingestion", "cataloguing", "atlas"],
    changelog: [
      "v3.0.0 - Added Glue + Dataplex support",
      "v2.5.0 - Auto-schema detection",
      "v2.0.0 - Multi-cloud support",
    ],
    stats: { deploys: 211, stars: 134 },
  },
  // ── FORGE ──────────────────────────────────────────────────────────────────
  {
    id: "FRG-001",
    name: "Prompt Library",
    desc: "Curated, versioned library of enterprise-grade prompts for summarisation, extraction, and classification use cases.",
    family: "forge",
    clouds: ["aws", "azure", "gcp"],
    maturity: "battle-tested",
    effort: "1 day",
    demoReady: true,
    solution: "Prompt Engineering",
    owner: "Divya Nair",
    ownerInitials: "DN",
    architecture: "https://storage.aimplify.infovision.com/arch/frg-001.png",
    quickStart:
      "npm install @infovision/prompt-library\nimport { summarise } from '@infovision/prompt-library'\nconst result = await summarise(text, { model: 'gpt-4o' })",
    prerequisites: ["Node.js 18+", "OpenAI or Azure OpenAI API key"],
    tags: [
      "prompts",
      "llm",
      "summarisation",
      "extraction",
      "classification",
      "forge",
    ],
    changelog: [
      "v4.0.0 - Claude 3.5 Sonnet templates",
      "v3.2.0 - Multilingual prompts",
      "v3.0.0 - Versioned prompt registry",
    ],
    stats: { deploys: 389, stars: 201 },
  },
  {
    id: "FRG-002",
    name: "RAG Pipeline Kit",
    desc: "End-to-end RAG pipeline with ingestion, chunking, embedding, hybrid retrieval, and evaluation framework.",
    family: "forge",
    clouds: ["aws", "azure"],
    maturity: "battle-tested",
    effort: "2 weeks",
    demoReady: true,
    solution: "Knowledge AI",
    owner: "Rahul Krishnan",
    ownerInitials: "RK",
    architecture: "https://storage.aimplify.infovision.com/arch/frg-002.png",
    quickStart:
      "git clone https://github.com/infovision/rag-kit\ncd rag-kit\ndocker-compose up -d\npython ingest.py --source ./docs",
    prerequisites: [
      "Docker 24+",
      "OpenAI API key",
      "Pinecone or Weaviate account",
      "Python 3.11+",
    ],
    tags: [
      "rag",
      "embeddings",
      "retrieval",
      "chunking",
      "knowledge-base",
      "forge",
    ],
    changelog: [
      "v2.4.0 - Hybrid BM25 + vector search",
      "v2.0.0 - Evaluation framework added",
      "v1.5.0 - Multi-format ingestion",
    ],
    stats: { deploys: 276, stars: 189 },
  },
  {
    id: "FRG-003",
    name: "LLM Fine-Tuning Accelerator",
    desc: "Accelerates domain-specific fine-tuning of open-source LLMs with automated dataset prep, training pipelines, and evaluation.",
    family: "forge",
    clouds: ["aws", "gcp"],
    maturity: "validated",
    effort: "3 weeks",
    demoReady: false,
    solution: "Model Development",
    owner: "Suresh Babu",
    ownerInitials: "SB",
    architecture: "https://storage.aimplify.infovision.com/arch/frg-003.png",
    quickStart:
      "pip install aimplify-finetune\naimplify-finetune prepare --data ./raw_data\naimplify-finetune train --model mistral-7b --epochs 3",
    prerequisites: [
      "NVIDIA GPU (A100 recommended)",
      "CUDA 12.1+",
      "Python 3.11+",
      "Hugging Face token",
    ],
    tags: ["fine-tuning", "llm", "mistral", "llama", "training", "forge"],
    changelog: [
      "v1.2.0 - LoRA and QLoRA support",
      "v1.1.0 - Automated eval benchmarks",
      "v1.0.0 - Initial release",
    ],
    stats: { deploys: 67, stars: 93 },
  },
  // ── RELAY ──────────────────────────────────────────────────────────────────
  {
    id: "RLY-001",
    name: "API Gateway Accelerator",
    desc: "Production-ready API gateway with rate limiting, authentication, logging, and AI-specific LLM proxy middleware.",
    family: "relay",
    clouds: ["aws", "azure"],
    maturity: "battle-tested",
    effort: "1 week",
    demoReady: true,
    solution: "Integration",
    owner: "Anjali Verma",
    ownerInitials: "AV",
    architecture: "https://storage.aimplify.infovision.com/arch/rly-001.png",
    quickStart:
      "helm repo add aimplify https://charts.infovision.com\nhelm install api-gateway aimplify/api-gateway -f values.yaml",
    prerequisites: ["Kubernetes 1.28+", "Helm 3+", "TLS certificate"],
    tags: ["api-gateway", "rate-limiting", "auth", "llm-proxy", "relay"],
    changelog: [
      "v3.1.0 - LLM token usage tracking",
      "v3.0.0 - Multi-tenant support",
      "v2.5.0 - JWT + OAuth2",
    ],
    stats: { deploys: 184, stars: 112 },
  },
  {
    id: "RLY-002",
    name: "Event Streaming Connector",
    desc: "Real-time event streaming between Kafka, Pub/Sub, and AI inference endpoints with schema registry integration.",
    family: "relay",
    clouds: ["aws", "gcp"],
    maturity: "validated",
    effort: "2 weeks",
    demoReady: false,
    solution: "Data Streaming",
    owner: "Vikram Singh",
    ownerInitials: "VS",
    architecture: "https://storage.aimplify.infovision.com/arch/rly-002.png",
    quickStart:
      "docker pull infovision/event-connector:latest\ndocker run -e KAFKA_BROKERS=... -e PUBSUB_PROJECT=... infovision/event-connector",
    prerequisites: [
      "Kafka 3.5+ or Google Pub/Sub",
      "Docker 24+",
      "Schema Registry access",
    ],
    tags: ["kafka", "pubsub", "streaming", "real-time", "relay"],
    changelog: [
      "v1.4.0 - Dead-letter queue support",
      "v1.3.0 - Avro schema validation",
      "v1.0.0 - Initial release",
    ],
    stats: { deploys: 89, stars: 56 },
  },
  // ── SENTINEL ───────────────────────────────────────────────────────────────
  {
    id: "SNT-001",
    name: "AI Governance Dashboard",
    desc: "Centralised dashboard for monitoring AI model outputs, bias detection, drift alerts, and compliance reporting.",
    family: "sentinel",
    clouds: ["aws", "azure", "gcp"],
    maturity: "validated",
    effort: "2 weeks",
    demoReady: true,
    solution: "AI Governance",
    owner: "Meera Pillai",
    ownerInitials: "MP",
    architecture: "https://storage.aimplify.infovision.com/arch/snt-001.png",
    quickStart:
      "docker-compose -f governance-stack.yml up -d\nopen http://localhost:3000",
    prerequisites: [
      "Docker 24+",
      "PostgreSQL 15+",
      "Model inference logs in JSONL format",
    ],
    tags: [
      "governance",
      "bias-detection",
      "drift",
      "compliance",
      "monitoring",
      "sentinel",
    ],
    changelog: [
      "v2.0.0 - EU AI Act compliance module",
      "v1.5.0 - Real-time drift alerts",
      "v1.0.0 - Initial release",
    ],
    stats: { deploys: 73, stars: 98 },
  },
  {
    id: "SNT-002",
    name: "PII Redaction Engine",
    desc: "High-performance PII detection and redaction engine supporting 30+ entity types across structured and unstructured data.",
    family: "sentinel",
    clouds: ["aws", "azure"],
    maturity: "battle-tested",
    effort: "3 days",
    demoReady: true,
    solution: "Data Privacy",
    owner: "Anand Rajan",
    ownerInitials: "AR",
    architecture: "https://storage.aimplify.infovision.com/arch/snt-002.png",
    quickStart:
      "pip install aimplify-redact\nfrom aimplify_redact import RedactionEngine\nengine = RedactionEngine()\nclean = engine.redact(text)",
    prerequisites: ["Python 3.10+", "spaCy models downloaded"],
    tags: ["pii", "redaction", "privacy", "gdpr", "nlp", "sentinel"],
    changelog: [
      "v3.2.0 - Hindi and Tamil NER support",
      "v3.0.0 - Streaming redaction API",
      "v2.5.0 - 30+ entity types",
    ],
    stats: { deploys: 198, stars: 143 },
  },
  // ── NEXUS ──────────────────────────────────────────────────────────────────
  {
    id: "NXS-001",
    name: "MLOps Pipeline Starter",
    desc: "End-to-end MLOps starter with CI/CD for models, experiment tracking, model registry, and automated cloud deployment.",
    family: "nexus",
    clouds: ["aws", "gcp"],
    maturity: "validated",
    effort: "3 weeks",
    demoReady: false,
    solution: "MLOps",
    owner: "Karthik Sundaram",
    ownerInitials: "KS",
    architecture: "https://storage.aimplify.infovision.com/arch/nxs-001.png",
    quickStart:
      "git clone https://github.com/infovision/mlops-starter\ncd mlops-starter\nmake bootstrap ENV=dev",
    prerequisites: [
      "Terraform 1.5+",
      "GitHub Actions or GitLab CI",
      "MLflow or Vertex AI account",
      "Docker 24+",
    ],
    tags: ["mlops", "ci-cd", "mlflow", "model-registry", "deployment", "nexus"],
    changelog: [
      "v2.1.0 - Vertex AI Pipelines integration",
      "v2.0.0 - Model canary deployment",
      "v1.5.0 - Experiment tracking",
    ],
    stats: { deploys: 112, stars: 77 },
  },
  {
    id: "NXS-002",
    name: "AI Cost Optimizer",
    desc: "Analyses LLM API usage and recommends routing, caching, and batching strategies to reduce inference costs by up to 60%.",
    family: "nexus",
    clouds: ["aws", "azure", "gcp"],
    maturity: "experimental",
    effort: "1 week",
    demoReady: true,
    solution: "Cost Management",
    owner: "Deepa Krishnamurthy",
    ownerInitials: "DK",
    architecture: "https://storage.aimplify.infovision.com/arch/nxs-002.png",
    quickStart:
      "pip install aimplify-cost-optimizer\naimplify-cost analyze --logs ./api_logs.jsonl --report report.html",
    prerequisites: ["Python 3.11+", "LLM API usage logs in JSONL format"],
    tags: ["cost-optimization", "llm", "caching", "routing", "nexus"],
    changelog: [
      "v0.3.0 - Semantic caching recommendations",
      "v0.2.0 - Model routing engine",
      "v0.1.0 - Initial release",
    ],
    stats: { deploys: 34, stars: 58 },
  },
];

// ── Runner ────────────────────────────────────────────────────────────────────
async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ MongoDB connected\n");

  // Families
  await Family.deleteMany({});
  const insertedFamilies = await Family.insertMany(families);
  console.log(`✅ Inserted ${insertedFamilies.length} families:`);
  insertedFamilies.forEach((f) =>
    console.log(`   ${f.key.padEnd(10)} — ${f.name}`),
  );

  console.log();

  // Assets
  await Asset.deleteMany({});
  const insertedAssets = await Asset.insertMany(assets);
  console.log(`✅ Inserted ${insertedAssets.length} assets:`);
  insertedAssets.forEach((a) =>
    console.log(`   ${a.id.padEnd(10)} — ${a.name}`),
  );

  console.log("\n🎉 Seed complete!");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
