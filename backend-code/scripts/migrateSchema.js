/**
 * migrateSchema.js
 * Seeds assets from CSV data into Turso DB.
 * Also clears: registrations, activities, notices, app_meta.
 * Usage: node scripts/migrateSchema.js
 */

require("dotenv").config();
const { createClient } = require("@libsql/client");

if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
  console.error("❌ TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set in .env");
  process.exit(1);
}

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN.trim(),
  intMode: "number",
});

// ── Asset data from CSV ────────────────────────────────────────────────────────────────────
const ASSETS = [
  {
    id: "ATL-001",
    name: "DataSmith - Tableau to Looker Migration",
    family: "atlas",
    solution: "Migraton Factory",
    desc: "Discovery, Migration and Validation of Tableau dashboards to Looker",
    long_desc: "Discovery - Lineage analysis, schema analysis, cluster analysis",
    maturity: "experimental",
    effort: "low",
    demoReady: 1,
    clouds: '["azure"]',
    tags: '["Tableau","Looker","DataSmith","Migration","Agentic AI"]',
    quickStart: "GUI based",
    repoUrl: "Request for Repo",
    demoUrl: "datasmith.infovision.io",
    owner: "Manikandan Loganathan",
    ownerInitials: "ML",
    ownerEmail: "Manikandan.Loganathan@infovision.com",
    status: "active",
    prerequisites: '["Hosted service"]',
    stats_deploys: 0,
    stats_demos: 2,
    stats_projects: 0,
    stats_rating: null,
    demo_video: "DataSmith.mp4",
  },
  {
    id: "ATL-002",
    name: "DataSmith - Synthetic Data Generator",
    family: "atlas",
    solution: "Master Data & Domain Context",
    desc: "Generates tens to millions of rows synthetic data statistically modeled on given input dataset",
    long_desc: "Generates tens to millions of rows synthetic data statistically modeled on given input dataset",
    maturity: "validated",
    effort: "low",
    demoReady: 1,
    clouds: '[]',
    tags: '["Data Generator","Data Generation","DataSmith"]',
    quickStart: "GUI based",
    repoUrl: "Request for Repo",
    demoUrl: "Not Available Yet",
    owner: "Manikandan Loganathan",
    ownerInitials: "ML",
    ownerEmail: "Manikandan.Loganathan@infovision.com",
    status: "active",
    prerequisites: '["Hosted service"]',
    stats_deploys: 0,
    stats_demos: 4,
    stats_projects: 1,
    stats_rating: 50,
    demo_video: "SyntheticDataGenerator.mp4",
  },
  {
    id: "ATL-003",
    name: "Data Policy Anomaly Bot",
    family: "atlas",
    solution: "Master Data & Domain Context",
    desc: "Natural language compliance bot that validates organizational policies against live BigQuery datasets and flags anomalies by risk severity.",
    long_desc: "The Data Policy Anomaly Bot is an AI-powered compliance accelerator that enables non-technical users to query organizational policies in plain English and validate them against live datasets in real time. Built on Azure GPT-4 + LangChain + BigQuery, the bot retrieves relevant policy documents via vector embeddings, generates structured validation queries, and runs them against live data to detect schema-level and data-level violations.\n\nAnomaly detection results are classified by risk severity and surfaced as clear, actionable bullet-point summaries - no SQL expertise required.\n\nKnown limitations: token limits can constrain validation on very large BigQuery datasets; complex edge-case queries may need refinement. Processing time for large dataset validation averages 5-10 minutes per query.\n\nTeam: Abhiram, Veerasekar, Renju | Owner: Veera",
    maturity: "validated",
    effort: "medium",
    demoReady: 1,
    clouds: '["azure","gcp"]',
    tags: '["Compliance","Policy Governance","Anomaly Detection","BigQuery","GDPR","CCPA","LangChain","GPT-4","Vector Embeddings","Risk Classification"]',
    quickStart: "GUI based",
    repoUrl: "Request for Repo",
    demoUrl: "Not Available Yet",
    owner: "Abhiram Kalidindi",
    ownerInitials: "AK",
    ownerEmail: "Abhiram.Kalidindi@infovision.com",
    status: "active",
    prerequisites: '["Python 3.x","Streamlit","Google BigQuery","Azure OpenAI"]',
    stats_deploys: 0,
    stats_demos: 0,
    stats_projects: 0,
    stats_rating: null,
    demo_video: "PolicyAnomalyBot.mp4",
  },
  {
    id: "FRG-001",
    name: "Sprinter",
    family: "forge",
    solution: "Engineering Productivity Office",
    desc: "AI-powered SDLC bot that expands user stories, generates tasks, test cases, code snippets, and release notes via a Kanban board.",
    long_desc: "Sprinter is a web application integrated with GPT-3.5-turbo that streamlines the entire software development lifecycle. It automates repetitive SDLC tasks including user story expansion with personas, goals and acceptance criteria, task and subtask generation, code snippet generation across multiple languages, test case creation, test code generation, release notes compilation, and weekly/monthly status reports.\n\nThe interface mirrors a JIRA-style Kanban board with four columns: To-Do, In Progress, QA, and Done - each unlocking relevant AI-powered actions at that stage. Project Managers, Developers, and QA Engineers each benefit from role-specific automation that reduces manual effort, improves consistency, and accelerates delivery timelines.\n\nKey challenges solved: manual test case/story creation is error-prone and slow; no tooling existed to leverage historical data for risk prediction and story point estimation.",
    maturity: "validated",
    effort: "medium",
    demoReady: 1,
    clouds: '["azure"]',
    tags: '["SDLC","Agile","User Stories","Test Cases","Code Generation","Kanban","Release Notes","GPT","JIRA"]',
    quickStart: "GUI based",
    repoUrl: "Request for Repo",
    demoUrl: "Not Available Yet",
    owner: "Noumika Balaji",
    ownerInitials: "NB",
    ownerEmail: "Noumika.Balaji@infovision.com",
    status: "active",
    prerequisites: '["Python 3.x","Node.js","React"]',
    stats_deploys: 0,
    stats_demos: 8,
    stats_projects: 0,
    stats_rating: null,
    demo_video: "Sprinter.mp4",
  },
  {
    id: "FRG-002",
    name: "Code Migration Frameworks",
    family: "forge",
    solution: "Modernization Factory",
    desc: "AI-assisted COBOL-to-Java and .NET-to-Node.js code migration with real-time developer Q&A and context-aware conversion.",
    long_desc: "Code Migration Frameworks is a multi-language modernization accelerator that uses GitHub Copilot and Gemini code assist plugins to convert legacy codebases to modern tech stacks. Currently proven for COBOL + C (with Python Flask API) to Java Springboot, and .NET C# to Node.js migrations.\n\nThe solution analyzes the source project's full file structure and codebase context, then assists developers through automated code conversion while answering real-time contextual queries. Additional capabilities include logging, test case generation, and SQL injection anomaly detection baked into the converted output.\n\nKey challenges solved: manual code migration from legacy systems takes months, creates bottlenecks, and requires senior developer expertise. This accelerator reduces conversion time dramatically while keeping developers in the loop through a conversational AI interface.",
    maturity: "validated",
    effort: "high",
    demoReady: 1,
    clouds: '["azure","gcp"]',
    tags: '["COBOL","Java","Springboot","Code Migration","Legacy Modernization",".NET","Node.js","GitHub Copilot","Gemini"]',
    quickStart: "Console / GUI based",
    repoUrl: "Request for Repo",
    demoUrl: "Not Available Yet",
    owner: "Blesson Roy",
    ownerInitials: "BR",
    ownerEmail: "Blesson.Roy@infovision.com",
    status: "active",
    prerequisites: '["Python 3.x","Java 17+","Node.js 18+","COBOL runtime"]',
    stats_deploys: 0,
    stats_demos: 0,
    stats_projects: 0,
    stats_rating: null,
    demo_video: "",
  },
  {
    id: "FRG-003",
    name: "AI Code Reviewer",
    family: "forge",
    solution: "Release Acceleration",
    desc: "Webhook-triggered AI code reviewer that delivers line-by-line analysis, best practice feedback, and Slack notifications on every PR.",
    long_desc: "The ADLC Unified Framework (Senior Dev GPT) is a webhook-driven SDLC optimization bot that automates code review on every pull or merge request. When a developer submits a PR in GitLab, the bot is triggered automatically via webhook, receives the committed code, and acts as a senior developer performing detailed line-by-line analysis.\n\nFeedback is delivered through a Slack app called Senior Dev in a conversational format, providing best practice recommendations, security vulnerability detection, and performance optimization suggestions in real time. The entire loop - from PR submission to feedback delivery - completes in minutes rather than hours.\n\nIntegrates with: GitLab, GitHub, Bitbucket (via webhooks), Slack (notifications), GitLab CI/CD pipeline.",
    maturity: "validated",
    effort: "medium",
    demoReady: 1,
    clouds: '["azure"]',
    tags: '["Code Review","Webhook","GitLab","Slack","CI/CD","GPT-4","SDLC","Automated Review","Pull Request"]',
    quickStart: "Integrated with Slack and Jira",
    repoUrl: "Request for Repo",
    demoUrl: "Not Available Yet",
    owner: "Pratyoosh Patel",
    ownerInitials: "PP",
    ownerEmail: "Pratyoosh.Patel@infovision.com",
    status: "active",
    prerequisites: '["Python 3.x","GitLab CI/CD","Slack SDK"]',
    stats_deploys: 0,
    stats_demos: 0,
    stats_projects: 0,
    stats_rating: null,
    demo_video: "AutomatedCodeReviews.mp4",
  },
  {
    id: "FRG-004",
    name: "ADLC Unified Framework",
    family: "forge",
    solution: "Engineering Productivity Office",
    desc: "Unified AI Enabler Framework for AIDLC",
    long_desc: "AI Enabler Framework in a coding IDE to analyze, design, build, test and audit components for different roles - BA, Front End Dev, Back End Dev, DBA and QA for any application SDLC",
    maturity: "battle-tested",
    effort: "medium",
    demoReady: 1,
    clouds: '[]',
    tags: '["AI SDLC","AI enabled development","AI framework for SDLC","front end development","back end development","BA Analysis","Reverse Analysis"]',
    quickStart: "IDE",
    repoUrl: "Request for Repo",
    demoUrl: "Not Available Yet",
    owner: "Priyanka Fulewale",
    ownerInitials: "PF",
    ownerEmail: "Priyanka.Fulewale@infovision.com",
    status: "active",
    prerequisites: '["IDE deployment - autosetup"]',
    stats_deploys: 1,
    stats_demos: 1,
    stats_projects: 1,
    stats_rating: 85,
    demo_video: "ADLCUnifiedFramework-Screenshot.png",
  },
  {
    id: "FRG-005",
    name: "Autonomous SDLC Framework",
    family: "forge",
    solution: "Engineering Productivity Office",
    desc: "AI Enabler to perform autonomous AIDLC",
    long_desc: "AI Enabler Framework to do an Autonomous SDLC from ADO entry to feature rollout through complete SDLC",
    maturity: "experimental",
    effort: "medium",
    demoReady: 1,
    clouds: '[]',
    tags: '["Autonomous SDLC","AI SDLC","AI enabled development","AI framework for SDLC"]',
    quickStart: "IDE",
    repoUrl: "Request for Repo",
    demoUrl: "Video available",
    owner: "Nainik K",
    ownerInitials: "NK",
    ownerEmail: "Nainik.K@infovision.com",
    status: "active",
    prerequisites: '["ADO","Github","IDE deployment (VSCode)"]',
    stats_deploys: 0,
    stats_demos: 2,
    stats_projects: 0,
    stats_rating: null,
    demo_video: "", // AutonomousSDLC.mp4 not present in Videos and Screenshots folder
  },
  {
    id: "RLY-001",
    name: "Multiagent Call Center Automation",
    family: "relay",
    solution: "Customer Care Studio",
    desc: "LangGraph multi-agent system with 6 specialized agents automating sentiment analysis, ticketing, recommendations, and resolution.",
    long_desc: "The Multiagent Call Center Automation System is an AI-driven solution built on a LangGraph-based multi-agent framework that optimizes call center operations through specialized autonomous agents. Six agents work in concert: Sentiment Analysis (real-time tone detection), Customer Profile Update (CRM sync), Call Avoidance (proactive deflection), Support Ticket Management (JIRA integration), Recommendation (personalized suggestions), and Resolution (case closure).\n\nAgents integrate seamlessly with PostgreSQL for data management, JIRA for ticket lifecycle, and email platforms for outbound communication. The LangGraph framework enables agents to operate both autonomously and collaboratively via a shared state memory object - allowing contextual handoffs between agents without data loss.\n\nOwner: Gokulram | Repo: https://github.com/by-Gokulram/multiagent_callcenter_automation.git",
    maturity: "validated",
    effort: "high",
    demoReady: 1,
    clouds: '["gcp"]',
    tags: '["Multi-Agent","LangGraph","Call Center","Sentiment Analysis","JIRA","Automation","Agentic AI","Orchestration","Gemini"]',
    quickStart: "Embedded into IVR system",
    repoUrl: "https://github.com/by-Gokulram/multiagent_callcenter_automation.git",
    demoUrl: "Not Available Yet",
    owner: "Noumika Balaji",
    ownerInitials: "NB",
    ownerEmail: "Noumika.Balaji@infovision.com",
    status: "active",
    prerequisites: '["Python 3.x","LangGraph","PostgreSQL"]',
    stats_deploys: 1,
    stats_demos: 5,
    stats_projects: 1,
    stats_rating: 75,
    demo_video: "MultiagentDemo.mp4",
  },
  {
    id: "RLY-002",
    name: "Healthcare Bot",
    family: "relay",
    solution: "Enterprise Knowledge Assistant",
    desc: "Dual-persona RAG chatbot for hospital environments serving both patients and staff with role-tailored, policy-aware responses.",
    long_desc: "The Healthcare Bot is a dual-persona RAG-powered conversational agent designed for hospital environments. It serves two distinct user groups - Patients and Staff - each with a dedicated portal pathway and persona-customized responses drawn from role-specific data sources.\n\nFor patients, the bot handles medical history queries, appointment details, medication reminders, and general health inquiries. For staff, it provides instant access to HR policies, leave balances, compliance documentation, and operational guidelines. Semantic search powered by Chroma vector store and Redis caching (40% response time reduction) ensures fast, accurate retrieval.\n\nCross-industry note: the dual-persona architecture is domain-agnostic - the same pattern applies to Finance (advisor + client), Retail (staff + customer), or any organization with two distinct user classes accessing different knowledge bases.",
    maturity: "validated",
    effort: "medium",
    demoReady: 1,
    clouds: '["azure","gcp"]',
    tags: '["RAG","Healthcare","Dual Persona","Chroma","Redis","Embeddings","Knowledge Retrieval","Gemini","FastAPI"]',
    quickStart: "GUI based",
    repoUrl: "Request for Repo",
    demoUrl: "Not Available Yet",
    owner: "Abhiram Kalidindi",
    ownerInitials: "AK",
    ownerEmail: "Abhiram.Kalidindi@infovision.com",
    status: "active",
    prerequisites: '["Python 3.x","FastAPI","Redis","Chroma"]',
    stats_deploys: 1,
    stats_demos: 4,
    stats_projects: 1,
    stats_rating: 50,
    demo_video: "HealthcareBot.mp4",
  },
  {
    id: "RLY-003",
    name: "Contextual Intelligence - Speech Diarization",
    family: "relay",
    solution: "Customer Care Studio",
    desc: "Real-time speech diarization that structures live customer conversations and serves contextual product data and trade-in options instantly.",
    long_desc: "The Contextual Intelligence Speech Diarization System is a real-time conversational intelligence accelerator built for high-engagement customer interactions (retail, telecom). It listens to live audio between a CSR and customer, converts speech to text, attributes each utterance to the correct speaker (90% accuracy with clean audio), and extracts structured insights categorized by products, plans, and information requests - all with timestamps.\n\nSimultaneously, the system performs dynamic web scraping via Selenium and LangChain to fetch real-time product availability, pricing, color options, and trade-in values from external sources. Results are cached in Redis (40% latency improvement) and surfaced on an interactive iPad interface.\n\nClassification: Accelerator (100% reusable) | Owner: Veera | Team: Veerasekhar, Abhiram, Blesson, Padma Priya, Satish, Rahul",
    maturity: "battle-tested",
    effort: "high",
    demoReady: 1,
    clouds: '["gcp","azure"]',
    tags: '["Speech Diarization","Real-Time","Conversational AI","Web Scraping","Redis","LangChain","Gemini","Speaker Attribution","Cart Integration"]',
    quickStart: "Mobile device based GUI",
    repoUrl: "Request for Repo",
    demoUrl: "Not Available Yet",
    owner: "Pratyoosh Patel",
    ownerInitials: "PP",
    ownerEmail: "Pratyoosh.Patel@infovision.com",
    status: "active",
    prerequisites: '["Python 3.x","React.js","FastAPI","Redis","LangChain"]',
    stats_deploys: 1,
    stats_demos: 7,
    stats_projects: 1,
    stats_rating: 75,
    demo_video: "SpeechDiarization.mp4",
  },
  {
    id: "RLY-004",
    name: "AIOps",
    family: "relay",
    solution: "Service & Order Operations AI",
    desc: "Agentic AI Platform to monitor, triage and resolve production incidents",
    long_desc: "Agentic AI Platform for AI Operations in a Multi-Agent setup to monitor, triage and resolve production incidents in a guided autonomy mode",
    maturity: "experimental",
    effort: "high",
    demoReady: 1,
    clouds: '["azure"]',
    tags: '["AIOps","Production Support","Incident monitoring","Incident resolution","Agentic AI for Ops"]',
    quickStart: "GUI based",
    repoUrl: "Request for Repo",
    demoUrl: "http://74.249.248.133:8887/",
    owner: "Balasubramani Murugesan",
    ownerInitials: "BM",
    ownerEmail: "Balasubramani.Murugesan@infovision.com",
    status: "active",
    prerequisites: '["Hosted service"]',
    stats_deploys: 1,
    stats_demos: 3,
    stats_projects: 1,
    stats_rating: 70,
    demo_video: "",
  },
  {
    id: "SNT-001",
    name: "Sentiment Analysis on Call Recordings",
    family: "sentinel",
    solution: "Customer Care Studio",
    desc: "Gemini 1.5 Pro multimodal call analyzer that detects sentiment, tone, sarcasm, and compliance violations directly from audio - no transcription needed.",
    long_desc: "The Sentiment Analysis on Call Recordings system uses Google Gemini 1.5 Pro's native multimodal audio processing to analyze customer service calls end-to-end without requiring a separate transcription step. Gemini directly evaluates both audio content and vocal tone to assess sentiment intensity, tone sarcasm, and linguistic compliance markers.\n\nThe system flags calls for compliance violations based on predefined regulatory keywords and thresholds, and generates customizable reports highlighting sentiment trends, risk areas, and agent performance metrics.\n\nValidated on Verizon call center data. Repo available.\nOwner: Gokulram | Repo: https://github.com/by-Gokulram/tone_sentiment_analysis.git",
    maturity: "validated",
    effort: "medium",
    demoReady: 1,
    clouds: '["gcp"]',
    tags: '["Sentiment Analysis","Call Recordings","Compliance","Tone Detection","Gemini","Multimodal","Audio Processing","Call Center","QA Monitoring"]',
    quickStart: "Embedded into IVR system",
    repoUrl: "https://github.com/by-Gokulram/tone_sentiment_analysis.git",
    demoUrl: "Not Available Yet",
    owner: "Pratyoosh Patel",
    ownerInitials: "PP",
    ownerEmail: "Pratyoosh.Patel@infovision.com",
    status: "active",
    prerequisites: '["Python 3.x","LangChain","Streamlit","Gemini 1.5 Pro"]',
    stats_deploys: 1,
    stats_demos: 3,
    stats_projects: 1,
    stats_rating: 65,
    demo_video: "SentimentAnalysisDemo.mp4",
  },
  {
    id: "SNT-002",
    name: "Responsible AI Automation",
    family: "sentinel",
    solution: "AI Run Office",
    desc: "Agent based decision automation for Responsible AI",
    long_desc: "RAIE is an enterprise-grade Responsible AI governance platform, designed with agentic architecture to transform manual, multi-stakeholder approval workflows into an intelligent, autonomous system. Purpose-built AI agents automatically enrich submissions by gathering data requirements, infrastructure specs, risk assessments, budget availability, and compliance inputs from enterprise systems - eliminating the manual back-and-forth that typically drives approval cycles to 45+ days.\n\nA multi-agent orchestration layer routes requests through parallel enrichment and compliance checks, enabling approximately 80% of use cases to be auto-approved against preset policy thresholds while flagging high-risk initiatives for streamlined human-in-the-loop review with pre-populated context. The platform maintains full auditability, explainability, and fail-safe guardrails - ensuring nothing that requires human oversight is ever auto-approved. RAIE reduces total cost of approvals by up to 71% while accelerating AI adoption at enterprise scale.",
    maturity: "experimental",
    effort: "high",
    demoReady: 1,
    clouds: '["azure","gcp","aws"]',
    tags: '["AI Governance","Responsible AI","Enterprise Compliance","Risk Management","Regulatory Compliance"]',
    quickStart: "GUI based",
    repoUrl: "Request for Repo",
    demoUrl: "Not Available Yet",
    owner: "Hasham Ul Haq",
    ownerInitials: "HH",
    ownerEmail: "Hasham.UlHaq@infovision.com",
    status: "active",
    prerequisites: '["Hosted service"]',
    stats_deploys: 1,
    stats_demos: 5,
    stats_projects: 1,
    stats_rating: 75,
    demo_video: "ResponsibleAIAgentic.mp4",
  },
  {
    id: "NXS-001",
    name: "SLM vs LLM Decision Playbook",
    family: "nexus",
    solution: "Model & Agent Operations",
    desc: "A systematic framework for choosing between Small Language Models (SLM) and Large Language Models (LLM) based on deployment constraints, operational readiness, and business requirements.",
    long_desc: "The SLM vs LLM Decision Playbook is a cost-analysis and benchmarking tool that helps engineering teams make informed model selection decisions before committing to a tech stack. Built with LangChain, LlamaIndex, and Tiktoken, the tool lets users select from multiple LLMs and embedding models, run queries against a shared dataset, and compare cost per 1K tokens, input/output/embedding token counts, and total query cost side by side.\n\nOutputs include bar chart visualizations of cost breakdowns per model combination and a word cloud of the most semantically relevant terms in the retrieved data.\n\nOwner: Noumika | Contributors: Pravallika Hazarath, Noumika Balaji",
    maturity: "validated",
    effort: "low",
    demoReady: 1,
    clouds: '["vercel"]',
    tags: '["LLM Benchmarking","Cost Analysis","Token Cost","Model Selection","SLM","Embeddings","LangChain","LlamaIndex","GPT"]',
    quickStart: "GUI based",
    repoUrl: "Request for Repo",
    demoUrl: "https://arch-eval-wx7y.vercel.app/",
    owner: "Dhanuvanth Senthilkumar",
    ownerInitials: "DS",
    ownerEmail: "Dhanuvanth.SenthilKumar@infovision.com",
    status: "active",
    prerequisites: '["React and React DOM","TypeScript","Vite","Tailwind CSS","Google Generative AI SDK","Supabase client"]',
    stats_deploys: 0,
    stats_demos: 3,
    stats_projects: 0,
    stats_rating: null,
    demo_video: "",
  },
  {
    id: "NXS-002",
    name: "PromptEval",
    family: "nexus",
    solution: "Common Infrastructure",
    desc: "Shared prompt evaluation framework for testing, scoring, and iterating on prompts across all platform families and LLM providers.",
    long_desc: "PromptEval is a cross-platform prompt quality evaluation framework that provides a structured methodology for testing, scoring, and iterating on prompts before they are deployed in production accelerators. As a Nexus shared utility, it serves all platform families.\n\nCore capabilities include: multi-prompt variant testing against the same input dataset, response scoring across dimensions (accuracy, relevance, completeness, tone adherence), side-by-side comparison of prompt outputs, regression detection when prompts are modified, and exportable evaluation reports.\n\nKey value for Nexus: prompt quality is the single most variable factor in LLM output quality across all accelerators.",
    maturity: "experimental",
    effort: "low",
    demoReady: 1,
    clouds: '["azure","gcp"]',
    tags: '["Prompt Engineering","Evaluation","Benchmarking","Quality","LLM Testing","Regression","Prompt Management"]',
    quickStart: "Console / Chat interface / GUI based",
    repoUrl: "Request for Repo",
    demoUrl: "Not Available Yet",
    owner: "Kishore Bodelu",
    ownerInitials: "KB",
    ownerEmail: "Kishore.Bodelu@infovision.com",
    status: "draft",
    prerequisites: '["Python 3.x","LangChain","Azure OpenAI"]',
    stats_deploys: 1,
    stats_demos: 2,
    stats_projects: 1,
    stats_rating: 80,
    demo_video: "",
  },
  {
    id: "NXS-003",
    name: "LIE - LLM Insight Engine",
    family: "nexus",
    solution: "Model & Agent Operations",
    desc: "Unified multi-LLM benchmarking platform that runs concurrent queries across GPT, Mistral, Llama, Gemini and compares responses side by side.",
    long_desc: "The LLM Insight Engine (LIE) is a single unified platform that enables development teams to benchmark any combination of LLMs and embedding models against the same training document and query set - delivering fair, reproducible, apples-to-apples comparisons.\n\nUsers upload a source document, select from an extensive list of LLMs (GPT-3.5/4, PaLM 2, Stable LM 3B, Mistral 7B, Llama, Claude, Cohere, Falcon 40B and more) and embedding models, and the engine computes all viable LLM-embedding combinations. Queries are executed concurrently across all combinations with response times tracked. Results are displayed side by side and exportable as Excel or via email.\n\nKey technical achievement: moving model execution from CPU to GPU layers (CUDA) reduced concurrent execution times significantly.\n\nClassification: Accelerator (100%) | Owner: Noumika | Contributors: Abhiram, Pravallika, Veerashekar, Blesson, Hebin",
    maturity: "battle-tested",
    effort: "high",
    demoReady: 1,
    clouds: '["azure","gcp"]',
    tags: '["LLM Benchmarking","Multi-LLM","GPT","Mistral","Llama","Gemini","Embeddings","Model Comparison","FAISS","LangChain","LlamaIndex"]',
    quickStart: "GUI based",
    repoUrl: "Request for Repo",
    demoUrl: "Not Available Yet",
    owner: "Noumika Balaji",
    ownerInitials: "NB",
    ownerEmail: "Noumika.Balaji@infovision.com",
    status: "active",
    prerequisites: '["Python 3.x","React","LangChain","LlamaIndex","PyTorch","CUDA","FAISS"]',
    stats_deploys: 1,
    stats_demos: 7,
    stats_projects: 1,
    stats_rating: 70,
    demo_video: "LLMInsightEngine.mp4",
  },
  {
    id: "NXS-004",
    name: "Video Intelligence Platform (VIP)",
    family: "nexus",
    solution: "Multi-Agent Orchestration",
    desc: "Video Intelligence Platform for multi-agent orchestration and analysis",
    long_desc: "Video Intelligence Platform (VIP) - details to be updated.",
    maturity: "experimental",
    effort: "medium",
    demoReady: 1,
    clouds: '[]',
    tags: '["Video Intelligence","Multi-Agent","VIP"]',
    quickStart: "",
    repoUrl: "",
    demoUrl: "",
    owner: "Abhiram Kalidindi",
    ownerInitials: "AK",
    ownerEmail: "Abhiram.Kalidindi@infovision.com",
    status: "active",
    prerequisites: '[]',
    stats_deploys: 0,
    stats_demos: 0,
    stats_projects: 0,
    stats_rating: null,
    demo_video: "VIPDemo.mp4",
  },
];

// ── Families (unchanged) ────────────────────────────────────────────────────────────────────
const FAMILIES = [
  ["atlas",  "Atlas",    "Data & Context Platform",           "Accelerators that make data AI-ready across lakehouse and operational stores.",  '["Lakehouse","Governance","Lineage"]',        '["Foundation sprints"]',        '["Cloud landing zones"]',  '["All agent families"]'],
  ["forge",  "Forge",    "AI-Native Engineering Platform",     "Prompts, scaffolds, and quality loops for accelerated delivery.",                '["Shipping velocity","Reuse"]',              '["Software factory programs"]', '["Git providers"]',        '["Relay & Nexus"]'],
  ["relay",  "Relay",    "Workflow & Agent Platform",          "Agents and workflows for operations, docs, service, and document AI.",           '["Operational efficiency"]',                 '["CS programmes"]',             '["CRM & ITSM"]',           '["Governed execution"]'],
  ["sentinel","Sentinel","Governed Runtime & Managed AI Ops", "Safety, telemetry, compliance, and cost guardrails.",                            '["Responsible AI"]',                         '["GRC workflows"]',             '["IAM & KMS"]',            '["Production AI"]'],
  ["nexus",  "Nexus",    "Shared Platform Infrastructure",     "Shared networking, orchestration, and infra glue.",                              '["Platforms"]',                              '["Landing zones"]',             '["Identity"]',             '["Atlas & Forge workloads"]'],
];

async function columnExists(table, col) {
  const r = await db.execute(`PRAGMA table_info(${table})`);
  return r.rows.some((row) => row.name === col);
}

async function seed() {
  // ── 1. Delete non-essential tables ─────────────────────────────────────────────────────────────
  console.log("🗑  Clearing non-asset data...");
  await db.execute("DELETE FROM activities").catch(() => console.log("   ⏩ activities — skipped (table may not exist)"));
  await db.execute("DELETE FROM registrations").catch(() => console.log("   ⏩ registrations — skipped"));
  await db.execute("DELETE FROM assets").catch(() => console.log("   ⏩ assets pre-clear — skipped"));
  await db.execute("DELETE FROM notices").catch(() => console.log("   ⏩ notices — skipped"));
  await db.execute("DELETE FROM app_meta").catch(() => console.log("   ⏩ app_meta — skipped"));
  console.log("✅ Cleared activities, registrations, notices, app_meta");

  // ── 2. Clear existing assets ───────────────────────────────────────────────────────────────────
  console.log("\n🗑  Clearing existing assets...");
  await db.execute("DELETE FROM assets");
  console.log("✅ Assets cleared");

  // ── 3. Ensure schema columns exist ────────────────────────────────────────────────────────────
  console.log("\n🔄 Ensuring schema columns...");
  const addCol = async (col, def) => {
    if (!(await columnExists("assets", col))) {
      await db.execute(`ALTER TABLE assets ADD COLUMN ${col} ${def}`);
      console.log(`   Added assets.${col}`);
    }
  };
  await addCol("long_desc",       "TEXT DEFAULT ''");
  await addCol("repo_url",        "TEXT DEFAULT ''");
  await addCol("demo_url",        "TEXT DEFAULT ''");
  await addCol("owner_email",     "TEXT DEFAULT ''");
  await addCol("stats_demos",     "INTEGER NOT NULL DEFAULT 0");
  await addCol("stats_projects",  "INTEGER NOT NULL DEFAULT 0");
  await addCol("stats_rating",    "INTEGER");
  await addCol("attachments",     "TEXT DEFAULT '[]'");
  await addCol("related_asset_ids","TEXT DEFAULT '[]'");
  await addCol("demo_video_relpath","TEXT DEFAULT ''");
  await addCol("submission_status","TEXT DEFAULT NULL");
  await addCol("submission_id",   "TEXT DEFAULT NULL");
  await addCol("maturity_master_id","INTEGER");
  await addCol("effort_master_id", "INTEGER");
  await addCol("changelog",       "TEXT DEFAULT '[]'");
  console.log("✅ Schema columns OK");

  // ── 4. Seed families ──────────────────────────────────────────────────────────────────────
  console.log("\n🌱 Seeding families...");
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
  console.log(`✅ ${FAMILIES.length} families seeded`);

  // ── 5. Seed assets ───────────────────────────────────────────────────────────────────────
  console.log("\n🌱 Seeding assets...");
  for (const a of ASSETS) {
    await db.execute({
      sql: `INSERT INTO assets (
               id, name, desc, long_desc, family, clouds, maturity, effort, demoReady,
               solution, owner, ownerInitials, owner_email, quickStart,
               repo_url, demo_url, prerequisites, tags, changelog,
               attachments, related_asset_ids, demo_video_relpath,
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
               tags=excluded.tags, changelog=excluded.changelog,
               demo_video_relpath=excluded.demo_video_relpath,
               stats_deploys=excluded.stats_deploys, stats_demos=excluded.stats_demos,
               stats_projects=excluded.stats_projects, stats_rating=excluded.stats_rating,
               submission_status=excluded.submission_status`,
      args: [
        a.id, a.name, a.desc, a.long_desc, a.family,
        a.clouds, a.maturity, a.effort, a.demoReady,
        a.solution, a.owner, a.ownerInitials, a.ownerEmail, a.quickStart,
        a.repoUrl, a.demoUrl, a.prerequisites, a.tags, "[]",
        "[]", "[]", a.demo_video,
        a.stats_deploys, a.stats_demos, a.stats_projects, a.stats_rating ?? null,
        a.status, null,
      ],
    });
    console.log(`   ✅ ${a.id.padEnd(8)} — ${a.name}`);
  }

  // ── 6. Refresh family stats ───────────────────────────────────────────────────────────────────
  console.log("\n🔄 Refreshing family stats...");
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
  console.log("✅ Family stats refreshed");

  // ── 7. Seed sample registrations with demo video/screenshot links ─────────────────────────────
  console.log("\n🌱 Seeding sample registrations...");

  // Ensure registrations table has demo_video_relpath column
  const addRegCol = async (col, def) => {
    const r = await db.execute("PRAGMA table_info(registrations)");
    if (!r.rows.some((row) => row.name === col)) {
      await db.execute(`ALTER TABLE registrations ADD COLUMN ${col} ${def}`);
      console.log(`   Added registrations.${col}`);
    }
  };
  await addRegCol("demo_video_relpath", "TEXT DEFAULT ''").catch(() => {});

  const SAMPLE_REGISTRATIONS = [
    {
      registrationId: "REG-001",
      name: "Voice of Customer Analyzer",
      family: "sentinel",
      description: "Gemini-powered sentiment and tone classifier for live call recordings and post-call surveys. Detects sentiment intensity, flags compliance violations, and generates trend reports.",
      submitedBy: "Pratyoosh Patel",
      status: "ai-review",
      aiScore: null,
      govReviewer: "",
      govNotes: "",
      demo_video_relpath: "SentimentAnalysisDemo.mp4",
    },
    {
      registrationId: "REG-002",
      name: "Agentic Workflow Orchestrator",
      family: "relay",
      description: "LangGraph-based multi-agent orchestration framework for automating end-to-end enterprise workflows including ticketing, CRM sync, and intelligent routing across 6 specialised agents.",
      submitedBy: "Noumika Balaji",
      status: "remediation",
      aiScore: 62,
      govReviewer: "",
      govNotes: "Needs clearer data-residency documentation before governance sign-off.",
      demo_video_relpath: "MultiagentDemo.mp4",
    },
    {
      registrationId: "REG-003",
      name: "Code Quality Accelerator v2",
      family: "forge",
      description: "Webhook-triggered AI code review bot with enhanced security scanning, dependency analysis, and auto-generated remediation suggestions delivered via Slack.",
      submitedBy: "Pratyoosh Patel",
      status: "governance",
      aiScore: 84,
      govReviewer: "Hasham Ul Haq",
      govNotes: "Security controls verified. Pending final IP sign-off.",
      demo_video_relpath: "AutomatedCodeReviews.mp4",
    },
    {
      registrationId: "REG-004",
      name: "ADLC Framework – IDE Plugin",
      family: "forge",
      description: "IDE-embedded AI enabler for full SDLC coverage — BA analysis, front-end and back-end code generation, reverse engineering, DBA scripting, and QA test generation in a single plugin.",
      submitedBy: "Priyanka Fulewale",
      status: "approved",
      aiScore: 91,
      govReviewer: "Hasham Ul Haq",
      govNotes: "Approved. Promoted to catalogue as FRG-004.",
      demo_video_relpath: "ADLCUnifiedFramework-Screenshot.png",
    },
    {
      registrationId: "REG-005",
      name: "Real-Time Speech Intelligence",
      family: "relay",
      description: "Live speech diarization accelerator that attributes utterances per speaker, extracts intent signals, and surfaces real-time product recommendations for CSR-assisted sales.",
      submitedBy: "Veerasekhar",
      status: "approved",
      aiScore: 88,
      govReviewer: "Hasham Ul Haq",
      govNotes: "Approved. Promoted to catalogue as RLY-003.",
      demo_video_relpath: "SpeechDiarization.mp4",
    },
    {
      registrationId: "REG-006",
      name: "Responsible AI Governance Engine",
      family: "sentinel",
      description: "Agentic platform that automates Responsible AI approval workflows — enriching submissions with risk, compliance, and budget data, auto-approving low-risk cases and routing complex ones for human review.",
      submitedBy: "Hasham Ul Haq",
      status: "ai-review",
      aiScore: null,
      govReviewer: "",
      govNotes: "",
      demo_video_relpath: "ResponsibleAIAgentic.mp4",
    },
  ];

  for (const reg of SAMPLE_REGISTRATIONS) {
    await db.execute({
      sql: `INSERT INTO registrations (
               registrationId, name, family, description, submitedBy, status,
               aiScore, govReviewer, govNotes, demo_video_relpath
             ) VALUES (?,?,?,?,?,?,?,?,?,?)
             ON CONFLICT(registrationId) DO UPDATE SET
               name=excluded.name, family=excluded.family,
               description=excluded.description, submitedBy=excluded.submitedBy,
               status=excluded.status, aiScore=excluded.aiScore,
               govReviewer=excluded.govReviewer, govNotes=excluded.govNotes,
               demo_video_relpath=excluded.demo_video_relpath`,
      args: [
        reg.registrationId, reg.name, reg.family, reg.description,
        reg.submitedBy, reg.status, reg.aiScore ?? null,
        reg.govReviewer, reg.govNotes, reg.demo_video_relpath,
      ],
    });
    console.log(`   ✅ ${reg.registrationId} — ${reg.name} [${reg.demo_video_relpath || 'no video'}]`);
  }
  console.log(`✅ ${SAMPLE_REGISTRATIONS.length} sample registrations seeded`);

  console.log(`\n🎉 Done! ${ASSETS.length} assets + ${SAMPLE_REGISTRATIONS.length} registrations seeded.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});

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
