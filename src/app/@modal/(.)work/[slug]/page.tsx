import { notFound } from "next/navigation";
import { CaseStudy } from "@/components/CaseStudy";
import { Window } from "@/components/Window";
import { getProject, projects } from "@/content/projects";

/**
 * Intercepts /work/[slug] when it is opened from inside the site, showing the case study
 * in a window over the current page. Direct visits and refreshes get the full page.
 */
export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export default async function CaseStudyWindow({ params }: { params: Promise<{ slug: string }> }) {
  const p = getProject((await params).slug);
  if (!p) notFound();
  return (
    <Window title={p.name} slug={p.slug}>
      <CaseStudy p={p} inWindow />
    </Window>
  );
}
