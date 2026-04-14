import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PersonaPage } from "@/components/personas/PersonaPage";
import { PERSONAS, getPersona } from "@/lib/personas";

interface PageProps {
  params: Promise<{ persona: string }>;
}

export async function generateStaticParams() {
  return PERSONAS.map((p) => ({ persona: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { persona: slug } = await params;
  const persona = getPersona(slug);

  if (!persona) {
    return { title: "Not Found" };
  }

  return {
    title: `MatCraft ${persona.tagline} — AI Materials Discovery`,
    description: persona.subheadline,
    openGraph: {
      title: `MatCraft ${persona.tagline}`,
      description: persona.subheadline,
      url: `https://matcraft.ai/for/${slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `MatCraft ${persona.tagline}`,
      description: persona.subheadline,
    },
  };
}

export default async function PersonaRoute({ params }: PageProps) {
  const { persona: slug } = await params;
  const persona = getPersona(slug);

  if (!persona) {
    notFound();
  }

  return <PersonaPage persona={persona!} />;
}
