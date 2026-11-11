"use client";

import { useRouter } from "next/navigation";
import { DEMOS, enterDesktop } from "@/lib/desktop";

/** On a case study, opens the project's live demo on the desktop (if it has one). */
export function TryDemo({ slug }: { slug: string }) {
  const router = useRouter();
  const app = DEMOS[slug];
  if (!app) return null;
  const open = () => {
    // Inside a case-study window, close the window first so the desktop isn't behind it.
    if (document.querySelector(".window-backdrop")) {
      router.back();
      setTimeout(() => enterDesktop(app), 320);
    } else enterDesktop(app);
  };
  return (
    <button type="button" className="pill-link primary try-demo" onClick={open}>
      Try it live <span aria-hidden="true">→</span>
    </button>
  );
}
