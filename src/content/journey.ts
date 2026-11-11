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

/** Skills, grouped by where they've been used. */
export const skills: { area: string; items: string[] }[] = [
  { area: "AI & data", items: ["Python", "FastAPI", "XGBoost", "SHAP", "Gemini", "Groq / Ollama", "MCP"] },
  { area: "Mobile", items: ["React Native", "Expo", "C++ (PDFium)", "Kotlin"] },
  { area: "Desktop", items: ["Rust", "Tauri"] },
  { area: "Web", items: ["TypeScript", "React", "Next.js", "WebGL", "Supabase", "Postgres"] },
];
