/**
 * Case-study content. Every statement here comes from the project's own README or repo.
 * `pending` lists what still needs real numbers or media from Sahaj; it is never rendered.
 */

export type Highlight = { value: string; label: string };
export type Decision = { title: string; body: string };
export type Link = { label: string; href: string };

export type Project = {
  slug: string;
  name: string;
  /** Expansion of an acronym name, shown small under the title. */
  fullName?: string;
  tagline: string;
  /** One line for cards on the home page. */
  summary: string;
  /** Internship and hackathon work are listed in their own groups below the main work. */
  group?: "internship" | "hackathon";
  /** For hackathon builds where the event leads the card: the event, then its track. */
  event?: { name: string; detail: string };
  /** Shown with a live dot while the project is still being built. */
  status?: "building";
  year: string;
  context?: string;
  stack: string[];
  highlights: Highlight[];
  problem: string;
  approach: string[];
  architecture: string[];
  decisions: Decision[];
  role: string;
  links: Link[];
  pending: string[];
};

export const projects: Project[] = [
  {
    slug: "float",
    name: "FLOAT",
    tagline: "The Dynamic Island, now on Windows.",
    summary: "A lightweight notch that hangs from the top of the screen and turns media, notifications and quick settings into one living surface.",
    year: "2026",
    stack: ["Tauri", "Rust", "React", "TypeScript", "Vite"],
    highlights: [
      { value: "v2.3", label: "shipped releases, with a changelog" },
      { value: "4", label: "island states: pill, orb, banner, expanded" },
      { value: "Ctrl+Alt+V", label: "clipboard history anywhere" },
    ],
    problem:
      "Windows has no equivalent of the Dynamic Island. Media controls, notifications, volume and quick settings live in different corners of the screen and interrupt whatever you are doing.",
    approach: [
      "A compact pill hangs from the top edge. Left untouched for about three seconds it shrinks into a 48×48 ambient orb; hover or double-tap brings it back.",
      "When media plays, the pill shows album art, a marquee title and an equaliser driven by a live audio visualiser.",
      "When a Windows toast arrives, a preview banner shows for about 3.5 seconds — media keeps playing in a split bubble beside it — then the island restores its exact previous state and keeps the notification in its history.",
      "Clicking opens an expanded surface with media, notifications and settings. Scrolling on the island changes volume; sideways scroll skips tracks.",
    ],
    architecture: [
      "Tauri shell with a Rust backend for Windows system integration.",
      "React + TypeScript front end built with Vite, rendering the island and its state machine.",
      "Later releases added focus sessions, quick notes, mic mute, earbud battery and clipboard superpowers with pinned snippets.",
    ],
    decisions: [
      {
        title: "Restore the exact previous state after a notification",
        body: "Notifications interrupt, but never reset. The island remembers whether it was showing media, the pill or the orb and returns there, so a toast never costs the user their context.",
      },
      {
        title: "An ambient orb instead of hiding",
        body: "Rather than disappearing when idle, the island morphs into a small orb — still reachable, never in the way.",
      },
    ],
    role: "Solo — design, Rust/Tauri backend and React front end.",
    links: [{ label: "Source on GitHub", href: "https://github.com/Sahaj1207/FLOAT" }],
    pending: ["RAM/CPU footprint, binary size, startup time", "download or user count", "30–90 s screen recording"],
  },
  {
    slug: "pie",
    group: "internship",
    context: "Intern at Antmark",
    name: "PIE",
    tagline: "Edit the text inside PDFs and photos. Entirely on your phone.",
    summary: "An offline PDF and image editor for Android and iOS that edits existing text while matching the original font and layout.",
    year: "2026",
    stack: ["React Native", "TypeScript", "C++", "Kotlin", "PDFium", "Skia"],
    highlights: [
      { value: "1,026", label: "Jest tests" },
      { value: "0", label: "uploads — all processing on device" },
      { value: "1", label: "C++ PDF engine shared by Android and iOS" },
    ],
    problem:
      "Fixing a typo in a PDF or a screenshot usually means uploading a private document to a cloud service, or re-typing it in a tool that never quite matches the original font.",
    approach: [
      "Edits the text that is already in the document, matching the original font and layout as closely as possible.",
      "Images get their text replaced and the background rebuilt deterministically, with texture- and grain-preserving reconstruction — no generative AI.",
      "No account, no cloud OCR, nothing uploaded.",
    ],
    architecture: [
      "React Native 0.87 (New Architecture, Hermes), React 19 and strict TypeScript.",
      "PDFium behind a platform-neutral C++ bridge, shared by Android (JNI) and iOS.",
      "On-device OCR with Google ML Kit on Android and Apple Vision on iOS.",
      "Kotlin native modules on Android; Objective-C/C native modules on iOS; Reanimated, Gesture Handler and Skia for the UI.",
    ],
    decisions: [
      {
        title: "One C++ engine for both platforms",
        body: "Instead of two PDF implementations, a single PDFium bridge in C++ is shared through JNI on Android and a native pod on iOS, so behaviour stays identical across platforms.",
      },
      {
        title: "Deterministic reconstruction over generative fill",
        body: "Rebuilding image backgrounds without AI keeps results predictable, private and fully offline.",
      },
    ],
    role: "Built as an intern at Antmark: the app, native modules and the C++ engine.",
    links: [{ label: "Source on GitHub", href: "https://github.com/Sahaj1207/PIE" }],
    pending: ["phone screen recording", "performance numbers (open/edit/save times, app size)"],
  },
  {
    slug: "verity",
    name: "VERITY",
    tagline: "Financial truth, reconstructed.",
    summary: "A multimodal reconciliation engine that turns messy WhatsApp messages, PDFs, screenshots and bank exports into verified financial conclusions.",
    year: "2026",
    context: "Razorpay AI Buildathon 2026 · AI Finance Controller track",
    group: "hackathon",
    stack: ["Python", "FastAPI", "Gemini", "pytest"],
    highlights: [
      { value: "96", label: "ground-truth benchmark cases" },
      { value: "4", label: "evidence types: CSV, text, PDF, images" },
      { value: "SHA-256", label: "provenance graph for every conclusion" },
    ],
    problem:
      "Financial evidence for Indian SMBs, agencies and freelancers is duplicated, incomplete, multilingual, partially paid or contradictory. Existing reconciliation tools only work with clean, structured records.",
    approach: [
      "A strict domain rule: evidence ≠ claim ≠ conclusion. A WhatsApp message saying “₹20,000 sent on GPay” is evidence of a claim — not a transaction.",
      "Claims are verified against bank and gateway ledger movements, and the result is a conclusion such as PARTIAL — ₹18,500 reconciled, ₹1,500 outstanding.",
      "Every conclusion keeps an unbroken audit trail back to the raw evidence.",
    ],
    architecture: [
      "Modular monolith with explicit subsystems: ingestion, extraction, entity resolution, transaction matching, deduplication, contradiction detection, provenance and reconciliation.",
      "Entity resolution across GSTIN, PAN, UPI VPAs and aliases; 1:1, 1:N (bulk) and N:1 (milestone) transaction matching.",
      "Immutable SHA-256 directed acyclic graph for evidence lineage.",
      "FastAPI REST API and a Finance Controller dashboard.",
    ],
    decisions: [
      {
        title: "Never trust a screenshot",
        body: "Text claims and images are always checked against verified ledger transactions, and uncertainty is handled explicitly rather than guessed away.",
      },
      {
        title: "Benchmark before features",
        body: "A 96-case ground-truth benchmark anchors every change to measurable correctness.",
      },
    ],
    role: "Built for the Razorpay AI Buildathon 2026.",
    links: [
      { label: "Live demo", href: "https://verity-4rky.onrender.com" },
      { label: "Source on GitHub", href: "https://github.com/Sahaj1207/VERITY" },
    ],
    pending: ["benchmark accuracy results", "real vs synthetic data statement", "team/role detail"],
  },
  {
    slug: "mothertongue-books",
    name: "MotherTongue Books",
    tagline: "Picture books written in a child's own language — not translated.",
    summary: "A team of AI agents plans, writes, checks, illustrates and reads aloud original children's books in eight languages.",
    year: "2026",
    context: "Meta Global AI Developer Hackathon · Indie Dev track · Oct 27 – Nov 4, 2026",
    group: "hackathon",
    event: { name: "Meta Global AI Developer Hackathon", detail: "Indie Dev track · Oct 27 – Nov 4, 2026" },
    stack: ["React", "Vite", "Supabase", "Python", "Meta Model API", "Modal"],
    highlights: [
      { value: "8", label: "languages, from Telugu to Basque" },
      { value: "≈ $0.35", label: "per illustrated 8-page book" },
      { value: "Tap", label: "any object in a picture to learn its word" },
    ],
    problem:
      "Children learn to read best in their mother tongue, but most of the world's languages have very few children's books.",
    approach: [
      "A parent or teacher describes a story or picks a folk tale. A topic check runs first and explains clearly when something is blocked.",
      "A planner fixes characters' looks and gives each page one event; a writer composes directly in the target language, using native speakers' saved corrections.",
      "Reading-level and safety reviewers can send pages back; an illustrator draws each page and a picture checker rejects flawed images.",
      "A word finder makes objects tappable for vocabulary, and pages are read aloud with checked text-to-speech.",
    ],
    architecture: [
      "Muse Spark for planning, writing, reading level and vision checks; Muse Spark Open on Baseten as the safety gate.",
      "Muse Image for illustrations with FLUX.1 schnell as fallback; SAM 3.1 to locate tappable objects.",
      "Meta MMS text-to-speech on Modal, each page verified by speech-to-text.",
      "Every model call recorded, which is how the per-book cost is measured.",
    ],
    decisions: [
      {
        title: "Write natively, never translate",
        body: "Stories are composed in the language itself, so idiom and rhythm belong to that language rather than to English.",
      },
      {
        title: "Adults stay in the loop",
        body: "Every book starts as a private draft that an adult reviews, fixes, redraws and only then publishes.",
      },
    ],
    role: "Built during the hackathon; all code written in the event window.",
    links: [
      { label: "Live", href: "https://mothertongue-books.vercel.app" },
      { label: "3-minute demo", href: "https://youtu.be/VkYc4fTJgp0" },
      { label: "Source on GitHub", href: "https://github.com/Sahaj1207/mothertongue-books" },
    ],
    pending: ["placement (if any)", "Devpost link", "confirm solo vs team"],
  },
  {
    slug: "harika",
    name: "HARIKA",
    fullName: "Human-Aware Responsive Intelligent Kernel Anima",
    tagline: "An AI that lives on your Windows desktop: it remembers you, plans, and acts.",
    summary: "A desktop assistant in the system tray that remembers you, plans multi-step tasks and acts through permissioned tools.",
    year: "2026",
    context: "Now building · Windows desktop app",
    status: "building",
    stack: ["Python", "FastAPI", "Tauri", "React", "TypeScript", "Groq / Ollama"],
    highlights: [
      { value: "Ctrl+Shift+Space", label: "ask from anywhere; it lives in the tray" },
      { value: "Memory", label: "short-term, episodic, facts and patterns" },
      { value: "Your yes", label: "before anything is sent on your behalf" },
    ],
    problem:
      "Assistants forget you between sessions and stop at answering. HARIKA remembers who you are, works out what you mean, plans the steps and does them on your computer, with you in control.",
    approach: [
      "It lives in the Windows tray. Ctrl + Shift + Space asks it anything from any app; a short first-run setup covers your name, which brain to use, and optional extras.",
      "Memory in layers: short-term context, episodic memory of what happened, extracted facts about you, and patterns over time, all retrieved when relevant.",
      "A planner turns a request into steps, validates the plan, reflects on results and recovers from failed steps.",
      "It acts through permissioned tools: opening apps and websites, files, clipboard, reminders, notifications, screen help, and Gmail, Google Calendar and Spotify.",
      "“Continue this chat” reads the visible conversation in WhatsApp, Telegram or Teams and drafts a reply. Nothing is sent without an explicit yes.",
    ],
    architecture: [
      "Tauri desktop app bundling the React interface with a standalone build of the Python backend, so installing it needs no Python or Node.",
      "FastAPI backend with versioned v1 routes for chat, memory, planning, agents, tools, voice, vision and privacy.",
      "Agents with an orchestrator, scheduler, state machine and recovery; a tool registry with permissions and a process verifier.",
      "Thinks with Groq in the cloud (fast and free) or a local model through Ollama (private and offline). Keys are stored in Windows Credential Manager.",
    ],
    decisions: [
      {
        title: "Nothing leaves without a yes",
        body: "Drafting is automatic; sending is not. Anything that speaks for you waits for an explicit confirmation.",
      },
      {
        title: "Choose your brain",
        body: "Cloud models for speed or a local model for privacy, picked at setup and changeable any time.",
      },
    ],
    role: "Solo — architecture, Python backend, agents and desktop app.",
    links: [{ label: "Source on GitHub", href: "https://github.com/Sahaj1207/HARIKA-Human-Aware-Responsive-Intelligent-Kernel-Anima" }],
    pending: ["demo video", "public release"],
  },
  {
    slug: "vayucast",
    name: "VayuCast",
    tagline: "Tomorrow's air, forecast for nine Indian cities.",
    summary: "An end-to-end machine-learning system that forecasts India's AQI one to three days ahead, with ranges and reasons.",
    year: "2026",
    stack: ["Python", "XGBoost", "SHAP", "FastAPI", "Streamlit", "MLflow", "GitHub Actions"],
    highlights: [
      { value: "±15.8", label: "AQI average error, one day ahead" },
      { value: "78%", label: "of days in the right AQI category" },
      { value: "16–28%", label: "better than “same as today”, days 1–3" },
    ],
    problem:
      "Air pollution is one of India's largest health risks, yet AQI is usually reported after the air is already bad. A reliable forecast lets people plan outdoor time and lets schools and hospitals prepare.",
    approach: [
      "Four years of hourly pollution and weather for Belagavi, Kolhapur, Pune, Mumbai, Bengaluru, Hyderabad, Kurnool, Lucknow and Delhi, combined into daily rows with the official CPCB AQI method.",
      "Data checks first: it detects and repairs a nationwide sensor glitch where every city reads near zero on the same days.",
      "54 engineered features: lags, rolling statistics, the target day's forecast weather, a cyclical calendar and Diwali proximity.",
      "Honest evaluation: time-based cross-validation, a locked test year (Nov 2025 – Oct 2026) and baselines. A built-in demo shows how a shuffled split would overstate accuracy (12.1 vs the true 15.8).",
      "Every forecast comes with a likely range (quantile XGBoost) and its reasons (SHAP): wind, rain, today's level, Diwali.",
    ],
    architecture: [
      "fetch → features → train (cross-validation, test, SHAP, MLflow) → saved models, used by one forecast function.",
      "FastAPI service (/forecast/{city}, /metrics) and a Streamlit dashboard, both on the same forecast code; Docker for deployment.",
      "Monitoring logs every forecast, scores it once the day has passed and detects seasonal drift per city.",
      "GitHub Actions: daily forecasts, weekly retraining and 33 tests on every push.",
    ],
    decisions: [
      {
        title: "Prove there is no leakage",
        body: "An automated test scrambles all future data and checks that no feature changes, so the model can't quietly peek at tomorrow.",
      },
      {
        title: "Say how wrong it is",
        body: "The 80% ranges actually cover 73–76% of days. That's stated openly, with conformal calibration as the planned fix.",
      },
    ],
    role: "Solo — data, modelling, API, dashboard and automation.",
    links: [
      { label: "Live dashboard", href: "https://vayucast.streamlit.app" },
      { label: "Source on GitHub", href: "https://github.com/Sahaj1207/vayucast" },
    ],
    pending: [],
  },
  {
    slug: "crumb",
    name: "Crumb",
    tagline: "Tonight's surplus food, paid only on handover.",
    summary: "Shops photograph what didn't sell, AI lists it, and buyers or their AI assistants reserve with a PayPal hold charged only for what's in the bag.",
    year: "2026",
    context: "PayPal AI Hackathon 2026",
    group: "hackathon",
    stack: ["Next.js", "TypeScript", "PayPal Orders v2 & Vault v3", "Gemini", "MCP", "Postgres"],
    highlights: [
      { value: "Hold", label: "not charge: PayPal authorise, then partial capture" },
      { value: "MCP", label: "AI buyer agents with spending mandates" },
    ],
    problem:
      "Small bakeries and cafés don't have time to list leftovers item by item at closing, so most of it is binned. Surplus-food apps lose trust when bags come up short and buyers chase refunds.",
    approach: [
      "Snap to list: the owner photographs the counter; Gemini counts items, flags allergens, groups rescue bags and suggests a price, clamped in code to the shop's floor. Nothing goes live until the owner publishes.",
      "Reserving places a PayPal hold (Orders v2, intent AUTHORIZE). At pickup, staff photograph the open bag, AI proposes a partial capture for what's actually there, a person confirms, and the rest is released.",
      "If a shop runs out, one tap voids every hold, so there's nothing to refund.",
      "Buyers can let an AI assistant shop for them within a mandate (per-bag cap, weekly budget, distance, diet), through an MCP server or the built-in agent.",
    ],
    architecture: [
      "Next.js 16 with a JSON API, an MCP server and a verified PayPal webhook.",
      "PayPal Orders v2, Payments v2 (capture, void), Vault v3 and the JS SDK, with idempotency keys on every write.",
      "Gemini vision with JSON schemas and a deterministic mock, so the whole app runs offline.",
      "Postgres with Drizzle; a public audit trail of every hold, charge, release and agent refusal.",
    ],
    decisions: [
      {
        title: "AI counts, code decides money",
        body: "The model only counts what's in a photo; amounts are computed in code from the listing and confirmed by a person before PayPal is called.",
      },
      {
        title: "Refusals are logged too",
        body: "When an agent won't buy (“Not vegan — contains dairy”, “weekly budget used”), the reason lands in the audit trail.",
      },
    ],
    role: "Built for the PayPal AI Hackathon 2026. PayPal sandbox only; no real money moves.",
    links: [
      { label: "Live demo", href: "https://crumb-lyart.vercel.app" },
      { label: "Source on GitHub", href: "https://github.com/Sahaj1207/crumb" },
    ],
    pending: ["demo video", "placement (if any)"],
  },
  {
    slug: "photoproof",
    name: "PhotoProof",
    tagline: "Offline photo reports for inspections, move-ins and damage surveys.",
    summary: "A mobile app for timestamped, GPS-tagged photos, organised into reports, annotated, and exported as a PDF, all on the device.",
    year: "2026",
    context: "Intern at Antmark",
    group: "internship",
    stack: ["Expo", "React Native", "TypeScript", "expo-camera", "expo-print"],
    highlights: [
      { value: "Offline", label: "no account and no internet needed" },
      { value: "Untouched", label: "original photos; edits live in metadata" },
    ],
    problem:
      "Inspectors, landlords and tenants need dated, located photo evidence and a clean report, often somewhere with no signal.",
    approach: [
      "Fast capture: flash, front and back cameras, pinch or slider zoom, and rapid shooting, with every photo numbered in shutter order.",
      "Each photo records its time, GPS position and street address. Location is tracked only while the camera is open.",
      "Reports start from templates (Move-in, Move-out, Inspection, Damage); each photo gets a category and notes, saved as you go.",
      "Crop and rotate without touching the original: the editor, the in-app preview and the exported PDF share the same geometry.",
      "An A4 PDF with a cover page and one evidence card per photo, shared through the phone's share sheet.",
    ],
    architecture: [
      "Expo SDK 57, React Native 0.86, React 19 and TypeScript, with React Navigation.",
      "Photos are copied into the app's private storage; report data is JSON in AsyncStorage, written through a single ordered queue.",
      "PDFs are rendered from an HTML template with expo-print and shared with expo-sharing.",
    ],
    decisions: [
      {
        title: "Evidence stays untouched",
        body: "Photos are saved exactly as the camera produced them. Crops, rotation and notes are metadata, applied only when the PDF is made.",
      },
      {
        title: "One ordered write queue",
        body: "Every save goes through the same queue, so a newer save can never be overwritten by an older one.",
      },
    ],
    role: "Built as an intern at Antmark.",
    links: [{ label: "Source on GitHub", href: "https://github.com/Sahaj1207/PhotoProof" }],
    pending: [],
  },
];

/** Main work, then internship work, then hackathon builds (the Meta hackathon first). */
export const mainWork = projects.filter((p) => !p.group);
export const internshipWork = projects.filter((p) => p.group === "internship");
export const hackathonBuilds = projects
  .filter((p) => p.group === "hackathon")
  .sort((a, b) => Number(!!b.event) - Number(!!a.event));

export const alsoBuilt: { name: string; what: string; href: string; live?: string }[] = [
  { name: "ReconIQ", what: "Cybersecurity investigation platform with ATT&CK mapping", href: "https://github.com/Sahaj1207/ReconIQ", live: "https://reconiq.vercel.app" },
  { name: "Aurelis Estates", what: "Luxury real-estate site with GSAP and Lenis motion", href: "https://github.com/Sahaj1207/aurelis-estates", live: "https://aurelis-estates.vercel.app" },
  { name: "ResumePilot AI", what: "ATS resume analyser and career assistant on Gemini", href: "https://github.com/Sahaj1207/ResumePilot-AI", live: "https://resumepilot-ai-f6qrpmmgnz9tqqgtdgdeq5.streamlit.app/" },
];

/** Milestones, dated from each repository's creation. */
export const timeline: { date: string; title: string; detail: string }[] = [
  { date: "Jul 2026", title: "ResumePilot AI & ReconIQ", detail: "First AI and security products." },
  { date: "Aug 2026", title: "HARIKA, FLOAT & VERITY", detail: "Desktop AI, a Windows Dynamic Island, and the Razorpay AI Buildathon." },
  { date: "Sep 2026", title: "Aurelis Estates", detail: "A luxury real-estate site with GSAP and Lenis motion." },
  { date: "Oct–Nov 2026", title: "MotherTongue Books", detail: "Meta Global AI Developer Hackathon." },
  { date: "Nov 2026", title: "VayuCast & Crumb", detail: "An ML forecasting system, and the PayPal AI Hackathon." },
];

export const getProject = (slug: string) => projects.find((p) => p.slug === slug);
