/**
 * Site-wide identity and links.
 * Fields set to null are not shown anywhere until filled in (see docs/BLUEPRINT.md §6).
 */
export const site = {
  name: "Sahaj Alatage",
  role: "Software engineer",
  positioning: "I build AI-native apps, desktop tools and mobile software — and the interfaces that make them feel effortless.",
  url: "https://sahaj-portfolio.vercel.app",
  links: {
    github: "https://github.com/Sahaj1207",
    linkedin: "https://www.linkedin.com/in/sahaj-alatage-63715737b/",
    x: "https://x.com/sahaj0712",
    /** Public contact email — not published until Sahaj chooses one. */
    email: null as string | null,
  },
  stack: ["TypeScript", "Python", "Rust", "React", "React Native", "Tauri", "FastAPI", "Supabase"],
} as const;
