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
    role: "Solo — app, native modules and C++ engine.",
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
    tagline: "An open-source AI layer for your desktop.",
    summary: "An assistant that remembers you, understands context, plans tasks and acts on your behalf.",
    year: "2026",
    context: "In active development",
    stack: ["Python", "FastAPI", "React", "TypeScript", "Zustand"],
    highlights: [
      { value: "Open source", label: "MIT licensed" },
      { value: "v1 API", label: "versioned FastAPI backend" },
      { value: "Desktop", label: "installer build for Windows" },
    ],
    problem:
      "Assistants forget you between sessions and stop at answering questions. HARIKA aims to remember, understand context, plan and take actions.",
    approach: [
      "A cinematic 3D AI Core as the face of the system, with a modular app ecosystem around it.",
      "Memory, context and planning live in backend services; the desktop front end presents them.",
    ],
    architecture: [
      "FastAPI backend with versioned routes, Pydantic schemas and service modules.",
      "React + TypeScript + Vite front end organised by feature, with Zustand state and an Axios API client.",
      "Desktop packaging and a Windows installer build documented in the repo.",
    ],
    decisions: [
      {
        title: "Clear service boundaries from day one",
        body: "API, schemas and services are separated so memory, planning and actions can grow independently.",
      },
    ],
    role: "Solo — architecture, backend and front end.",
    links: [{ label: "Source on GitHub", href: "https://github.com/Sahaj1207/HARIKA-Human-Aware-Responsive-Intelligent-Kernel-Anima" }],
    pending: ["precise scope of what works today", "architecture diagram", "demo video"],
  },
];

export const alsoBuilt: { name: string; what: string; href: string; live?: string }[] = [
  { name: "ReconIQ", what: "Cybersecurity investigation platform with ATT&CK mapping", href: "https://github.com/Sahaj1207/ReconIQ", live: "https://reconiq.vercel.app" },
  { name: "Meridian Hospital", what: "Hospital platform with booking engine and staff console", href: "https://github.com/Sahaj1207/meridian-hospital" },
  { name: "Aurelis Estates", what: "Luxury real-estate site with GSAP and Lenis motion", href: "https://github.com/Sahaj1207/aurelis-estates", live: "https://aurelis-estates.vercel.app" },
  { name: "ResumePilot AI", what: "ATS resume analyser and career assistant on Gemini", href: "https://github.com/Sahaj1207/ResumePilot-AI" },
];

/** Milestones, dated from each repository's creation. */
export const timeline: { date: string; title: string; detail: string }[] = [
  { date: "Jul 2026", title: "ResumePilot AI & ReconIQ", detail: "First AI and security products." },
  { date: "Aug 2026", title: "HARIKA, FLOAT & VERITY", detail: "Desktop AI, a Windows Dynamic Island, and the Razorpay AI Buildathon." },
  { date: "Sep 2026", title: "Aurelis Estates & Meridian Hospital", detail: "Production-grade web platforms with real backends." },
  { date: "Oct 2026", title: "PIE", detail: "Offline PDF and image editing with a shared C++ engine." },
  { date: "Oct–Nov 2026", title: "MotherTongue Books", detail: "Meta Global AI Developer Hackathon." },
];

export const getProject = (slug: string) => projects.find((p) => p.slug === slug);
