/**
 * Experience, education and recognition, as shown in "Where I've been".
 * Everything here is confirmed by Sahaj; the internship is shown without dates on purpose.
 */

export type Entry = { kicker: string; title: string; place: string; detail?: string; href?: string };

export const experience: Entry[] = [
  {
    kicker: "Internship",
    title: "Intern",
    place: "Antmark",
    detail: "Built PIE, an offline PDF and photo editor on a shared C++ engine, and PhotoProof, an offline inspection-report app.",
    href: "#work",
  },
];

export const education: Entry[] = [
  {
    kicker: "2025 – 2029 · 2nd year",
    title: "B.Tech, Artificial Intelligence & Data Science",
    place: "Sanjay Ghodawat University, Kolhapur",
    detail: "CGPA 8.42",
  },
];

export const recognition: Entry[] = [
  {
    kicker: "Finalist · team of 3",
    title: "Makers Conclave 2026",
    place: "NIAT",
    detail: "Presented a low-cost water monitoring and management system, with Wi-Fi sensors that gather every reading in one place.",
  },
  { kicker: "Built", title: "Meta Global AI Developer Hackathon", place: "MotherTongue Books", href: "/work/mothertongue-books" },
  { kicker: "Built", title: "Razorpay AI Buildathon 2026", place: "VERITY", href: "/work/verity" },
  { kicker: "Building now", title: "PayPal AI Hackathon 2026", place: "Crumb", href: "/work/crumb" },
  { kicker: "Participant", title: "Smart India Hackathon 2025", place: "University round, SGU" },
];

/**
 * Skills by area, each with where it's been used: project slugs (linked to their case
 * studies), or "this site" / "coursework" where that's the honest answer.
 */
export type Skill = { name: string; used: string[] };
export type SkillArea = { id: string; area: string; mark: string; tint: [string, string]; items: Skill[] };

const SITE = "this site";
const COURSE = "coursework";

export const skillAreas: SkillArea[] = [
  {
    id: "ai",
    area: "Generative AI",
    mark: "AI",
    tint: ["#7c5cff", "#c56bff"],
    items: [
      { name: "LLM applications", used: ["harika", "crumb", "mothertongue-books"] },
      { name: "Multi-agent pipelines", used: ["mothertongue-books"] },
      { name: "Prompt engineering", used: ["mothertongue-books", "crumb", "harika"] },
      { name: "Tool calling & MCP", used: ["crumb", "harika"] },
      { name: "Embeddings & semantic search", used: ["harika"] },
      { name: "Vision models", used: ["crumb", "mothertongue-books"] },
      { name: "Gemini", used: ["crumb", "verity"] },
      { name: "Groq / Ollama", used: ["harika"] },
      { name: "Speech (TTS, STT)", used: ["mothertongue-books", "harika"] },
    ],
  },
  {
    id: "ml",
    area: "Machine learning",
    mark: "ML",
    tint: ["#00b4e0", "#3a7bff"],
    items: ["scikit-learn", "XGBoost", "SHAP", "pandas", "NumPy", "MLflow", "Time-series forecasting", "Streamlit"].map((name) => ({
      name,
      used: ["vayucast"],
    })),
  },
  {
    id: "backend",
    area: "Backend & data",
    mark: "API",
    tint: ["#17a36b", "#00c2a8"],
    items: [
      { name: "Python", used: ["harika", "vayucast", "verity", "mothertongue-books"] },
      { name: "FastAPI", used: ["harika", "vayucast", "verity"] },
      { name: "Pydantic", used: ["harika"] },
      { name: "SQL & PostgreSQL", used: ["crumb"] },
      { name: "Supabase", used: ["mothertongue-books"] },
      { name: "REST APIs", used: ["harika", "vayucast", "verity", "crumb"] },
      { name: "Webhooks", used: ["crumb"] },
    ],
  },
  {
    id: "mobile",
    area: "Mobile",
    mark: "APP",
    tint: ["#ff7a59", "#ff4f8b"],
    items: [
      { name: "React Native", used: ["pie", "photoproof"] },
      { name: "Expo", used: ["photoproof"] },
      { name: "C++ (PDFium)", used: ["pie"] },
      { name: "Kotlin", used: ["pie"] },
    ],
  },
  {
    id: "desktop",
    area: "Desktop",
    mark: "OS",
    tint: ["#3b4a6b", "#1f2a44"],
    items: [
      { name: "Rust", used: ["float"] },
      { name: "Tauri", used: ["float", "harika"] },
      { name: "ONNX Runtime", used: ["harika"] },
      { name: "Windows UI Automation", used: ["harika"] },
    ],
  },
  {
    id: "web",
    area: "Web & graphics",
    mark: "WEB",
    tint: ["#f2a93b", "#ff6b3d"],
    items: [
      { name: "TypeScript", used: ["float", "crumb", "pie", SITE] },
      { name: "React", used: ["float", "harika", "mothertongue-books"] },
      { name: "Next.js", used: ["crumb", SITE] },
      { name: "WebGL / GLSL", used: [SITE] },
      { name: "Web Audio", used: [SITE] },
    ],
  },
  {
    id: "tools",
    area: "Tools",
    mark: "CLI",
    tint: ["#5b6475", "#2e3442"],
    items: [
      { name: "Git & GitHub", used: [SITE] },
      { name: "GitHub Actions", used: ["vayucast"] },
      { name: "Docker", used: ["vayucast"] },
      { name: "Vercel", used: ["crumb", SITE] },
      { name: "pytest", used: ["verity", "vayucast"] },
      { name: "Jest", used: ["pie"] },
    ],
  },
  {
    id: "cs",
    area: "Foundations",
    mark: "CS",
    tint: ["#9aa3b5", "#5d6577"],
    items: [
      { name: "Data structures", used: [COURSE] },
      { name: "Database systems", used: [COURSE] },
      { name: "Mathematics for computer science", used: [COURSE] },
    ],
  },
];
