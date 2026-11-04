import type { Metadata } from "next";
import { CaseStudy } from "@/components/CaseStudy";
import { notFound } from "next/navigation";
import { getProject, projects } from "@/content/projects";

export const dynamicParams = false;

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = getProject((await params).slug);
  if (!p) return {};
  return {
    title: p.name,
    description: `${p.tagline} ${p.summary}`,
    alternates: { canonical: `/work/${p.slug}` },
  };
}

export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = getProject((await params).slug);
  if (!p) notFound();
  return <CaseStudy p={p} />;
}
