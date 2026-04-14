import type { Metadata } from "next";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "Mentions légales | MatCraft",
  description: "Mentions légales et informations sur l'éditeur du site MatCraft.",
};

export default function MentionsPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background pt-24 pb-20">
        <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Mentions légales</h1>
          <p className="text-sm text-muted-foreground mb-8">Dernière mise à jour : 14 avril 2026</p>

          <section className="text-foreground/90 space-y-4 text-sm leading-relaxed">
            <h2 className="text-2xl font-semibold mt-8">Éditeur du site</h2>
            <p>
              <strong>MatCraft</strong><br />
              Plateforme de découverte de matériaux assistée par IA<br />
              Siège social : Marseille, France<br />
              Forme juridique : à déterminer<br />
              SIRET : à venir<br />
              TVA intracommunautaire : à venir<br />
              Contact : <a href="mailto:contact@matcraft.ai" className="text-primary">contact@matcraft.ai</a>
            </p>

            <h2 className="text-2xl font-semibold mt-8">Directeur de la publication</h2>
            <p>Gauthier Bros</p>

            <h2 className="text-2xl font-semibold mt-8">Hébergement</h2>
            <p>
              <strong>Google Cloud Platform (Google Ireland Ltd)</strong><br />
              Gordon House, Barrow Street<br />
              Dublin 4, Irlande<br />
              Site : <a href="https://cloud.google.com" className="text-primary" target="_blank" rel="noopener noreferrer">cloud.google.com</a>
            </p>

            <h2 className="text-2xl font-semibold mt-8">Propriété intellectuelle</h2>
            <p>
              L&apos;ensemble du contenu du site matcraft.ai (textes, graphismes, logos, icônes, images, ainsi que leur mise en forme) est la propriété exclusive de MatCraft, à l&apos;exception des données de Materials Project, AFLOW et JARVIS-DFT qui sont distribuées sous licence CC-BY-4.0 et restent la propriété de leurs organismes respectifs (LBNL, Duke University, NIST).
            </p>
            <p>
              Toute reproduction, représentation, modification, publication ou adaptation de tout ou partie des éléments du site est interdite sans autorisation écrite préalable.
            </p>

            <h2 className="text-2xl font-semibold mt-8">Données personnelles</h2>
            <p>
              Pour toute information sur le traitement de vos données personnelles, consultez notre <a href="/legal/privacy" className="text-primary">Politique de confidentialité</a>.
            </p>

            <h2 className="text-2xl font-semibold mt-8">Cookies</h2>
            <p>
              Consultez notre <a href="/legal/cookies" className="text-primary">Politique de cookies</a>.
            </p>

            <h2 className="text-2xl font-semibold mt-8">Signalement de contenu illicite</h2>
            <p>
              Tout contenu illicite peut être signalé à <a href="mailto:legal@matcraft.ai" className="text-primary">legal@matcraft.ai</a>. Conformément à la LCEN, nous donnerons suite aux demandes dans les meilleurs délais.
            </p>
          </section>
        </article>
      </main>
      <Footer />
    </>
  );
}
