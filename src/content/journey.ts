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
    kicker: "Finalist",
    title: "Makers Conclave 2026",
    place: "NIAT",
    detail: "Presented a low-cost water monitoring and management system, with Wi-Fi sensors that gather every reading in one place.",
  },
  { kicker: "Built", title: "Meta Global AI Developer Hackathon", place: "MotherTongue Books", href: "/work/mothertongue-books" },
  { kicker: "Built", title: "Razorpay AI Buildathon 2026", place: "VERITY", href: "/work/verity" },
  { kicker: "Building now", title: "PayPal AI Hackathon 2026", place: "Crumb", href: "/work/crumb" },
  { kicker: "Participant", title: "Smart India Hackathon 2025", place: "University round, SGU" },
];

/** Skills, grouped by area. Each one is used in a project above or in coursework. */
export const skills: { area: string; items: string[] }[] = [
  {
    area: "Generative AI",
    items: ["LLM applications", "Multi-agent pipelines", "Prompt engineering", "Tool calling & MCP", "Embeddings & semantic search", "Vision models", "Gemini", "Groq / Ollama", "Speech (TTS, STT)"],
  },
  { area: "Machine learning", items: ["scikit-learn", "XGBoost", "SHAP", "pandas", "NumPy", "MLflow", "Time-series forecasting", "Streamlit"] },
  { area: "Backend & data", items: ["Python", "FastAPI", "Pydantic", "SQL", "PostgreSQL", "Supabase", "REST APIs", "Webhooks"] },
  { area: "Mobile", items: ["React Native", "Expo", "C++ (PDFium)", "Kotlin"] },
  { area: "Desktop", items: ["Rust", "Tauri", "ONNX Runtime", "Windows UI Automation"] },
  { area: "Web & graphics", items: ["TypeScript", "React", "Next.js", "WebGL / GLSL", "Web Audio"] },
  { area: "Tools", items: ["Git", "GitHub Actions", "Docker", "Vercel", "pytest", "Jest"] },
  { area: "Foundations", items: ["Data structures", "Database systems", "Mathematics for computer science"] },
];
